/**
 * Community Module - 社区Feed流
 *
 * 替代原有的Forum模块，实现类似X/Twitter的社交媒体功能
 */

import { postService } from '../services/postService.js';
import { socialGraphService } from '../services/socialGraphService.js';
import { authService } from '../services/authService.js';
import { eventBus, EventNames } from '../services/eventBus.js';
import { hashtagParser } from '../utils/hashtagParser.js';
import { markdownParser } from '../utils/markdownParser.js';
import { mockUsers } from '../data/mockPosts.js';
import { getUserById } from '../data/mockUsers.js';
import { mediaUploader } from '../utils/mediaUploader.js';

export const community = (() => {
  let container = null;
  let currentTab = 'recommend'; // 'recommend', 'following', 'trending'
  let currentFilter = null; // hashtag filter

  /**
   * HTML转义函数 - 防止XSS
   */
  const escapeHtml = (str) => {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  /**
   * 初始化模块
   */
  const init = (containerElement) => {
    container = containerElement;

    // 订阅事件
    eventBus.on(EventNames.POST_CREATED, handlePostCreated);
    eventBus.on(EventNames.POST_DELETED, handlePostDeleted);
    eventBus.on(EventNames.POST_LIKED, handlePostLiked);
    eventBus.on(EventNames.COMMENT_ADDED, handleCommentAdded);

    render();
  };

  /**
   * 渲染主界面
   */
  const render = () => {
    if (!container) return;

    const currentUser = authService.currentUser();

    container.innerHTML = `
      <div class="community-container">
        <!-- Header -->
        <div class="community-header">
          <h1>社区</h1>
          ${currentUser ? `
            <button class="btn-new-post" id="btnNewPost">
              <i class="fas fa-plus"></i> 发布动态
            </button>
          ` : ''}
        </div>

        <!-- Tabs -->
        <div class="community-tabs">
          <button class="tab-btn ${currentTab === 'recommend' ? 'active' : ''}" data-tab="recommend">
            <i class="fas fa-fire"></i> 推荐
          </button>
          ${currentUser ? `
            <button class="tab-btn ${currentTab === 'following' ? 'active' : ''}" data-tab="following">
              <i class="fas fa-user-friends"></i> 关注
            </button>
          ` : ''}
          <button class="tab-btn ${currentTab === 'trending' ? 'active' : ''}" data-tab="trending">
            <i class="fas fa-hashtag"></i> 热门话题
          </button>
        </div>

        <!-- Filter indicator -->
        ${currentFilter ? `
          <div class="filter-indicator">
            <span>当前话题: ${escapeHtml(currentFilter)}</span>
            <button class="btn-clear-filter" id="btnClearFilter">
              <i class="fas fa-times"></i>
            </button>
          </div>
        ` : ''}

        <!-- Feed -->
        <div class="community-feed" id="communityFeed">
          <div class="loading">加载中...</div>
        </div>
      </div>
    `;

    // 绑定事件
    bindEvents();

    // 加载Feed
    loadFeed();
  };

  /**
   * 绑定事件
   */
  const bindEvents = () => {
    // 新建帖子按钮
    const btnNewPost = container.querySelector('#btnNewPost');
    console.log('[Community] btnNewPost found:', !!btnNewPost);
    if (btnNewPost) {
      btnNewPost.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        console.log('[Community] New post button clicked');
        showNewPostDialog();
      });
    }

    // Tab切换
    const tabBtns = container.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentTab = e.currentTarget.dataset.tab;
        render();
      });
    });

    // 清除过滤
    const btnClearFilter = container.querySelector('#btnClearFilter');
    if (btnClearFilter) {
      btnClearFilter.addEventListener('click', () => {
        currentFilter = null;
        render();
      });
    }
  };

  /**
   * 加载Feed
   */
  const loadFeed = () => {
    const feedContainer = container.querySelector('#communityFeed');
    if (!feedContainer) return;

    let posts = [];

    if (currentTab === 'recommend') {
      posts = postService.getRecommendedPosts();
    } else if (currentTab === 'following') {
      const currentUser = authService.currentUser();
      if (currentUser) {
        const userId = currentUser.id || currentUser.email;
        posts = postService.getFollowingPosts(userId);
      }
    } else if (currentTab === 'trending') {
      posts = postService.getTrendingPosts();
    }

    // 应用话题过滤
    if (currentFilter) {
      posts = posts.filter(post => post.tags.includes(currentFilter));
    }

    if (posts.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-comment-slash"></i>
          <p>暂无内容</p>
        </div>
      `;
      return;
    }

    // 渲染帖子卡片
    feedContainer.innerHTML = posts.map(post => renderPostCard(post)).join('');

    // 绑定帖子事件
    bindPostEvents();
  };

  /**
   * 渲染帖子卡片
   */
  const renderPostCard = (post) => {
    const author = getUserById(post.userId) || {
      nickname: '未知用户',
      avatar: 'https://i.pravatar.cc/150?img=1',
      verified: false
    };

    const currentUser = authService.currentUser();
    const currentUserId = currentUser ? (currentUser.id || currentUser.email) : null;
    const isOwner = currentUserId === post.userId;
    const isLiked = currentUserId ? postService.hasLiked(post.id, currentUserId) : false;
    const isBookmarked = currentUserId ? postService.hasBookmarked(post.id, currentUserId) : false;

    // 解析Markdown和hashtag
    const contentHtml = markdownParser.parseWithHashtags(
      post.content,
      hashtagParser.convertHashtagsToLinks
    );

    // 处理转发
    let repostContent = '';
    if (post.type === 'repost' || post.type === 'quote') {
      const originalPost = postService.getPostById(post.originalPostId);
      if (originalPost) {
        const originalAuthor = getUserById(originalPost.userId) || { nickname: '未知用户' };
        const originalContentHtml = markdownParser.parseWithHashtags(
          originalPost.content,
          hashtagParser.convertHashtagsToLinks
        );
        repostContent = `
          <div class="repost-indicator">
            <i class="fas fa-retweet"></i>
            ${post.type === 'repost' ? '转发了' : '引用转发'}
          </div>
          <div class="original-post">
            <div class="original-author">@${escapeHtml(originalAuthor.nickname)}</div>
            <div class="original-content">${originalContentHtml}</div>
          </div>
        `;
      }
    }

    // 图片画廊
    let imageGallery = '';
    if (post.media && post.media.length > 0) {
      const images = post.media.filter(m => m.type === 'image');
      if (images.length > 0) {
        const gridClass = images.length === 1 ? 'single' :
          images.length === 2 ? 'double' :
            images.length === 3 ? 'triple' : 'quad';

        imageGallery = `
          <div class="post-images ${gridClass}">
            ${images.map((img, index) => `
              <div class="post-image-item" data-index="${index}">
                <img src="${img.url}" alt="图片${index + 1}">
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // 训练记录卡片
    let workoutCard = '';
    if (post.workoutRef) {
      workoutCard = `
        <div class="workout-card">
          <i class="fas fa-dumbbell"></i>
          <div class="workout-info">
            <div class="workout-type">${escapeHtml(post.workoutRef.title || post.workoutRef.type)}</div>
            <div class="workout-stats">
              ${post.workoutRef.duration} · ${post.workoutRef.calories || 0} 卡路里 · ${escapeHtml(post.workoutRef.level || '')}
            </div>
          </div>
        </div>
      `;
    }

    return `
      <article class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <img src="${author.avatar}" alt="${escapeHtml(author.nickname)}" class="avatar user-avatar" data-user-id="${post.userId}">
          <div class="author-info">
            <div class="author-name user-profile-link" data-user-id="${post.userId}">
              ${escapeHtml(author.nickname)}
              ${author.verified ? '<i class="fas fa-check-circle verified"></i>' : ''}
            </div>
            <div class="post-time">${formatTime(post.createdAt)}</div>
          </div>
          ${isOwner ? `
            <button class="btn-delete-post" data-post-id="${post.id}">
              <i class="fas fa-trash"></i>
            </button>
          ` : ''}
        </div>

        ${repostContent}

        <div class="post-content">${contentHtml}</div>

        ${imageGallery}

        ${workoutCard}

        <div class="post-stats">
          <span><i class="fas fa-comment"></i> ${post.stats.comments}</span>
          <span><i class="fas fa-retweet"></i> ${post.stats.reposts}</span>
          <span><i class="fas fa-heart"></i> ${post.stats.likes}</span>
          <span><i class="fas fa-eye"></i> ${post.stats.views}</span>
        </div>

        <div class="post-actions">
          <button class="btn-comment" data-post-id="${post.id}">
            <i class="far fa-comment"></i> 评论
          </button>
          <button class="btn-repost" data-post-id="${post.id}">
            <i class="fas fa-retweet"></i> 转发
          </button>
          <button class="btn-like ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
            <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
            ${isLiked ? '已赞' : '点赞'}
          </button>
          <button class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-post-id="${post.id}">
            <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
          </button>
        </div>
      </article>
    `;
  };

  /**
   * 绑定帖子事件
   */
  const bindPostEvents = () => {
    // 点赞
    container.querySelectorAll('.btn-like').forEach(btn => {
      btn.addEventListener('click', handleLike);
    });

    // 收藏
    container.querySelectorAll('.btn-bookmark').forEach(btn => {
      btn.addEventListener('click', handleBookmark);
    });

    // 评论
    container.querySelectorAll('.btn-comment').forEach(btn => {
      btn.addEventListener('click', handleComment);
    });

    // 转发
    container.querySelectorAll('.btn-repost').forEach(btn => {
      btn.addEventListener('click', handleRepost);
    });

    // 删除
    container.querySelectorAll('.btn-delete-post').forEach(btn => {
      btn.addEventListener('click', handleDelete);
    });

    // Hashtag点击
    container.querySelectorAll('.hashtag').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tag = e.target.textContent;
        currentFilter = tag;
        render();
      });
    });

    // 用户主页点击
    container.querySelectorAll('.user-avatar, .user-profile-link').forEach(elem => {
      elem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const userId = e.currentTarget.dataset.userId;
        showUserProfile(userId);
      });
      elem.style.cursor = 'pointer';
    });

    // 图片画廊点击
    container.querySelectorAll('.post-image-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const postCard = e.currentTarget.closest('.post-card');
        const postId = postCard.dataset.postId;
        const index = parseInt(e.currentTarget.dataset.index);
        showImageGallery(postId, index);
      });
    });
  };

  /**
   * 显示新建帖子对话框
   */
  const showNewPostDialog = () => {
    console.log('[Community] showNewPostDialog called');
    let uploadedImages = []; // 存储上传的图片
    let selectedWorkout = null; // 存储选择的训练记录

    const currentUser = authService.currentUser();
    const userAvatar = currentUser?.avatar || 'https://i.pravatar.cc/150?img=1';
    console.log('[Community] Current user:', currentUser);

    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="community-modal new-post-modal x-style">
        <div class="modal-header">
          <button class="btn-close-modal">
            <i class="fas fa-times"></i>
          </button>
          <button class="btn btn-primary btn-sm btn-publish">发布</button>
        </div>
        <div class="modal-body">
          <div class="post-composer">
            <div class="composer-avatar">
              <img src="${userAvatar}" alt="Avatar">
            </div>
            <div class="composer-content">
              <textarea
                id="postContent"
                placeholder="有什么新鲜事？"
                maxlength="280"
              ></textarea>
              
              <!-- 图片预览区域 -->
              <div class="image-preview-grid" id="imagePreviewGrid" style="display: none;"></div>
              
              <!-- 训练记录预览 -->
              <div class="workout-preview-container" id="workoutPreviewContainer" style="display: none;"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <div class="upload-toolbar">
            <button class="btn-icon-tool btn-upload-image" id="btnUploadImage" title="上传图片">
              <i class="far fa-image"></i>
            </button>
            <button class="btn-icon-tool btn-attach-workout" id="btnAttachWorkout" title="关联训练记录">
              <i class="fas fa-dumbbell"></i>
            </button>
            <span class="upload-status" id="uploadStatus"></span>
          </div>
          <div class="char-counter-wrapper">
             <span id="charCount">0</span>/280
          </div>
        </div>
      </div>
    `;

    console.log('[Community] Dialog HTML set, about to append to body');
    document.body.appendChild(dialog);
    console.log('[Community] Dialog appended to body');
    console.log('[Community] Total modal-overlays in DOM:', document.querySelectorAll('.modal-overlay').length);

    // 强制设置样式确保可见
    dialog.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: rgba(0, 0, 0, 0.7) !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 10001 !important; padding: 1rem !important; opacity: 1 !important; visibility: visible !important;';
    console.log('[Community] Modal overlay styles forced');

    const textarea = dialog.querySelector('#postContent');
    console.log('[Community] Textarea found:', !!textarea);
    const charCount = dialog.querySelector('#charCount');
    const btnPublish = dialog.querySelector('.btn-publish');
    const btnClose = dialog.querySelector('.btn-close-modal');
    const btnUploadImage = dialog.querySelector('#btnUploadImage');
    const btnAttachWorkout = dialog.querySelector('#btnAttachWorkout');
    const imagePreviewGrid = dialog.querySelector('#imagePreviewGrid');
    const workoutPreviewContainer = dialog.querySelector('#workoutPreviewContainer');
    const uploadStatus = dialog.querySelector('#uploadStatus');

    // 字符计数
    textarea.addEventListener('input', () => {
      charCount.textContent = textarea.value.length;
      updatePublishButton();
    });

    // 更新发布按钮状态
    const updatePublishButton = () => {
      const hasContent = textarea.value.trim().length > 0;
      const hasImages = uploadedImages.length > 0;
      const hasWorkout = selectedWorkout !== null;
      btnPublish.disabled = !hasContent && !hasImages && !hasWorkout;
    };

    // 渲染图片预览
    const renderImagePreviews = () => {
      if (uploadedImages.length === 0) {
        imagePreviewGrid.style.display = 'none';
        uploadStatus.textContent = '';
        return;
      }

      imagePreviewGrid.style.display = 'grid';
      uploadStatus.textContent = `已上传 ${uploadedImages.length}/4 张图片`;

      imagePreviewGrid.innerHTML = uploadedImages.map((img, index) => `
        <div class="image-preview-item" data-index="${index}">
          <img src="${img.data}" alt="预览图">
          <button class="btn-remove-image" data-index="${index}">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `).join('');

      // 绑定删除按钮
      imagePreviewGrid.querySelectorAll('.btn-remove-image').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.currentTarget.dataset.index);
          uploadedImages.splice(index, 1);
          renderImagePreviews();
          updatePublishButton();
        });
      });
    };

    // 处理图片上传
    const handleImageUpload = async (files) => {
      if (uploadedImages.length >= 4) {
        alert('最多只能上传4张图片');
        return;
      }

      const remainingSlots = 4 - uploadedImages.length;
      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      uploadStatus.textContent = '正在上传...';
      btnUploadImage.disabled = true;

      try {
        const result = await mediaUploader.uploadImages(filesToUpload);

        if (result.success && result.images.length > 0) {
          uploadedImages.push(...result.images);
          renderImagePreviews();
          updatePublishButton();
        }

        if (result.errors.length > 0) {
          alert(result.errors.join('\n'));
        }
      } catch (error) {
        alert('图片上传失败: ' + error.message);
        uploadStatus.textContent = '';
      } finally {
        btnUploadImage.disabled = false;
      }
    };

    // 上传图片按钮
    btnUploadImage.addEventListener('click', async (e) => {
      e.stopPropagation();
      console.log('[Community] Upload image button clicked');
      const files = await mediaUploader.selectFiles({
        accept: 'image/*',
        multiple: true
      });
      if (files && files.length > 0) {
        await handleImageUpload(files);
      }
    });

    // 训练记录预览渲染
    const renderWorkoutPreview = () => {
      if (!selectedWorkout) {
        workoutPreviewContainer.style.display = 'none';
        workoutPreviewContainer.innerHTML = '';
        return;
      }

      workoutPreviewContainer.style.display = 'block';
      workoutPreviewContainer.innerHTML = `
        <div class="workout-preview-card">
          <div class="workout-preview-header">
            <i class="fas fa-dumbbell"></i>
            <span>训练记录</span>
            <button class="btn-remove-workout" title="移除">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="workout-preview-body">
            <div class="workout-preview-title">${escapeHtml(selectedWorkout.title)}</div>
            <div class="workout-preview-stats">
              <span><i class="fas fa-clock"></i> ${selectedWorkout.duration}</span>
              <span><i class="fas fa-fire"></i> ${selectedWorkout.calories || 0} 卡路里</span>
              <span><i class="fas fa-dumbbell"></i> ${escapeHtml(selectedWorkout.muscle)}</span>
            </div>
          </div>
        </div>
      `;

      // 绑定移除按钮
      const btnRemove = workoutPreviewContainer.querySelector('.btn-remove-workout');
      btnRemove.addEventListener('click', () => {
        selectedWorkout = null;
        renderWorkoutPreview();
        updatePublishButton();
      });
    };

    // 选择训练记录
    const showWorkoutSelector = async () => {
      const currentUser = authService.currentUser();
      if (!currentUser) {
        alert('请先登录');
        return;
      }

      // 动态导入 workoutService
      const { workoutService } = await import('../services/workoutService.js');

      // 获取所有课程
      const allWorkouts = workoutService.getAllWorkouts();

      if (allWorkouts.length === 0) {
        alert('暂无训练课程可选择');
        return;
      }

      // 创建选择器对话框
      const selector = document.createElement('div');
      selector.className = 'modal-overlay';
      selector.innerHTML = `
        <div class="community-modal workout-selector-modal">
          <div class="modal-header">
            <h3>选择训练记录</h3>
            <button class="btn-close-modal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="workout-list">
              ${allWorkouts.map(workout => `
                <div class="workout-item" data-workout-id="${workout.id}">
                  <div class="workout-item-icon">
                    <i class="fas fa-dumbbell"></i>
                  </div>
                  <div class="workout-item-info">
                    <div class="workout-item-title">${escapeHtml(workout.title)}</div>
                    <div class="workout-item-meta">
                      ${workout.duration} · ${escapeHtml(workout.muscle)} · ${escapeHtml(workout.level)}
                    </div>
                  </div>
                  <button class="btn btn-sm btn-select-workout" data-workout-id="${workout.id}">
                    选择
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(selector);

      // 强制设置选择器样式确保可见
      selector.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: rgba(0, 0, 0, 0.7) !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 10002 !important; padding: 1rem !important; opacity: 1 !important; visibility: visible !important;';
      console.log('[Community] Workout selector displayed');

      // 绑定选择按钮
      selector.querySelectorAll('.btn-select-workout').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation(); // 阻止事件冒泡
          const workoutId = btn.dataset.workoutId;
          console.log('[Community] Workout selected:', workoutId);
          selectedWorkout = allWorkouts.find(w => w.id === workoutId);
          renderWorkoutPreview();
          updatePublishButton();
          selector.remove();
        });
      });

      // 关闭按钮
      const btnCloseSelector = selector.querySelector('.btn-close-modal');
      btnCloseSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        selector.remove();
      });

      // 延迟添加背景点击关闭，避免事件冲突
      setTimeout(() => {
        selector.addEventListener('click', (e) => {
          if (e.target === selector) selector.remove();
        });
      }, 100);
    };

    // 关联训练记录按钮
    btnAttachWorkout.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[Community] Attach workout button clicked');
      showWorkoutSelector();
    });

    // 发布
    btnPublish.addEventListener('click', async () => {
      const content = textarea.value.trim();
      if (!content && uploadedImages.length === 0 && !selectedWorkout) return;

      btnPublish.disabled = true;
      btnPublish.textContent = '发布中...';

      const postData = {
        type: 'original',
        content,
        media: uploadedImages.map(img => ({
          type: 'image',
          url: img.data,
          thumbnail: img.data,
          width: img.width,
          height: img.height
        }))
      };

      // 添加训练记录引用
      if (selectedWorkout) {
        postData.workoutRef = {
          id: selectedWorkout.id,
          title: selectedWorkout.title,
          type: selectedWorkout.muscle,
          duration: selectedWorkout.duration,
          calories: 0, // TODO: 从实际训练记录中获取
          level: selectedWorkout.level
        };
      }

      const result = postService.createPost(postData);

      if (result.success) {
        dialog.remove();
        render();
      } else {
        alert(result.errors.join('\n'));
        btnPublish.disabled = false;
        btnPublish.textContent = '发布';
      }
    });

    // 取消
    const closeDialog = () => {
      console.log('[Community] closeDialog called - removing dialog');
      console.trace('[Community] Dialog removal stack trace');
      dialog.remove();
    };
    btnClose.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      console.log('[Community] Close button clicked');
      closeDialog();
    });

    // 延迟添加点击关闭监听器，避免与打开按钮的点击冲突
    setTimeout(() => {
      dialog.addEventListener('click', (e) => {
        console.log('[Community] Dialog overlay clicked, target:', e.target.className);
        if (e.target === dialog) {
          console.log('[Community] Click was on overlay background, closing...');
          closeDialog();
        }
      });
    }, 100);

    // 初始化
    renderImagePreviews();
    updatePublishButton();

    // 使用 setTimeout 延迟 focus，避免触发意外事件
    setTimeout(() => {
      textarea.focus();
      console.log('[Community] Textarea focused');
    }, 100);
  };

  /**
   * 处理点赞
   */
  const handleLike = (e) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    const postId = e.currentTarget.dataset.postId;
    const result = postService.toggleLike(postId);

    if (result.success) {
      // 更新UI
      const btn = e.currentTarget;
      const icon = btn.querySelector('i');

      if (result.liked) {
        btn.classList.add('liked');
        icon.classList.remove('far');
        icon.classList.add('fas');
        btn.innerHTML = '<i class="fas fa-heart"></i> 已赞';
      } else {
        btn.classList.remove('liked');
        icon.classList.remove('fas');
        icon.classList.add('far');
        btn.innerHTML = '<i class="far fa-heart"></i> 点赞';
      }

      // 更新统计数字
      const postCard = btn.closest('.post-card');
      const statsSpan = postCard.querySelector('.post-stats span:nth-child(3)');
      const post = postService.getPostById(postId);
      statsSpan.innerHTML = `<i class="fas fa-heart"></i> ${post.stats.likes}`;
    }
  };

  /**
   * 处理收藏
   */
  const handleBookmark = (e) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    const postId = e.currentTarget.dataset.postId;
    const result = postService.toggleBookmark(postId);

    if (result.success) {
      const btn = e.currentTarget;
      const icon = btn.querySelector('i');

      if (result.bookmarked) {
        btn.classList.add('bookmarked');
        icon.classList.remove('far');
        icon.classList.add('fas');
      } else {
        btn.classList.remove('bookmarked');
        icon.classList.remove('fas');
        icon.classList.add('far');
      }
    }
  };

  /**
   * 处理评论
   */
  const handleComment = (e) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    const postId = e.currentTarget.dataset.postId;
    showCommentsModal(postId);
  };

  /**
   * 显示评论弹窗
   */
  const showCommentsModal = (postId) => {
    const post = postService.getPost(postId);
    if (!post) return;

    const comments = postService.getComments(postId);

    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="community-modal comments-modal">
        <div class="modal-header">
          <h3>评论 (${comments.length})</h3>
          <button class="btn-close-modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="comments-list" id="commentsList">
            ${comments.length > 0
        ? comments.map(renderComment).join('')
        : '<p class="empty-comments">暂无评论</p>'
      }
          </div>
          <div class="comment-input">
            <textarea
              id="commentContent"
              placeholder="写下你的评论..."
              rows="3"
            ></textarea>
            <button class="btn btn-primary btn-submit-comment" data-post-id="${postId}">
              发表评论
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const btnClose = dialog.querySelector('.btn-close-modal');
    const btnSubmit = dialog.querySelector('.btn-submit-comment');
    const textarea = dialog.querySelector('#commentContent');

    // 提交评论
    btnSubmit.addEventListener('click', () => {
      const content = textarea.value.trim();
      if (!content) return;

      const result = postService.addComment({
        postId,
        content
      });

      if (result.success) {
        dialog.remove();
        render(); // 刷新Feed
      } else {
        alert(result.errors.join('\n'));
      }
    });

    // 关闭
    btnClose.addEventListener('click', () => dialog.remove());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.remove();
    });
  };

  /**
   * 渲染评论
   */
  const renderComment = (comment) => {
    const author = getUserById(comment.userId) || {
      nickname: '未知用户',
      avatar: 'https://i.pravatar.cc/150?img=1'
    };

    const currentUser = authService.currentUser();
    const currentUserId = currentUser ? (currentUser.id || currentUser.email) : null;
    const isOwner = currentUserId === comment.userId;

    // 解析Markdown和hashtag
    const commentContentHtml = markdownParser.parseWithHashtags(
      comment.content,
      hashtagParser.convertHashtagsToLinks
    );

    return `
      <div class="comment" data-comment-id="${comment.id}">
        <img src="${author.avatar}" alt="${escapeHtml(author.nickname)}" class="avatar">
        <div class="comment-content">
          <div class="comment-author">${escapeHtml(author.nickname)}</div>
          <div class="comment-text">${commentContentHtml}</div>
          <div class="comment-footer">
            <span class="comment-time">${formatTime(comment.createdAt)}</span>
            <span class="comment-likes">
              <i class="far fa-heart"></i> ${comment.likes}
            </span>
            ${isOwner ? `
              <button class="btn-delete-comment" data-comment-id="${comment.id}" data-post-id="${comment.postId}">
                删除
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  };

  /**
   * 处理转发
   */
  const handleRepost = (e) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    const postId = e.currentTarget.dataset.postId;

    // 显示转发菜单
    const menu = document.createElement('div');
    menu.className = 'repost-menu';
    menu.innerHTML = `
      <button class="repost-option" data-type="direct">
        <i class="fas fa-retweet"></i> 直接转发
      </button>
      <button class="repost-option" data-type="quote">
        <i class="fas fa-quote-left"></i> 引用转发
      </button>
    `;

    // 定位菜单
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;

    document.body.appendChild(menu);

    // 处理选项
    menu.querySelectorAll('.repost-option').forEach(option => {
      option.addEventListener('click', () => {
        const type = option.dataset.type;
        menu.remove();

        if (type === 'direct') {
          // 直接转发
          const result = postService.repostPost(postId);
          if (result.success) {
            render();
          } else {
            alert(result.errors.join('\n'));
          }
        } else {
          // 引用转发
          showQuoteRepostDialog(postId);
        }
      });
    });

    // 点击外部关闭
    setTimeout(() => {
      document.addEventListener('click', function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      });
    }, 100);
  };

  /**
   * 显示引用转发对话框
   */
  const showQuoteRepostDialog = (postId) => {
    const originalPost = postService.getPost(postId);
    if (!originalPost) return;

    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="community-modal quote-repost-modal">
        <div class="modal-header">
          <h3>引用转发</h3>
          <button class="btn-close-modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <textarea
            id="quoteContent"
            placeholder="添加你的评论..."
            maxlength="280"
          ></textarea>
          <div class="original-post-preview">
            ${renderPostCard(originalPost)}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-cancel">取消</button>
          <button class="btn btn-primary btn-quote">转发</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const textarea = dialog.querySelector('#quoteContent');
    const btnQuote = dialog.querySelector('.btn-quote');
    const btnCancel = dialog.querySelector('.btn-cancel');
    const btnClose = dialog.querySelector('.btn-close-modal');

    // 转发
    btnQuote.addEventListener('click', () => {
      const comment = textarea.value.trim();
      const result = postService.repostPost(postId, comment);

      if (result.success) {
        dialog.remove();
        render();
      } else {
        alert(result.errors.join('\n'));
      }
    });

    // 取消
    const closeDialog = () => dialog.remove();
    btnCancel.addEventListener('click', closeDialog);
    btnClose.addEventListener('click', closeDialog);
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeDialog();
    });
  };

  /**
   * 处理删除帖子
   */
  const handleDelete = (e) => {
    const postId = e.currentTarget.dataset.postId;

    if (!confirm('确定要删除这条动态吗？')) {
      return;
    }

    const result = postService.deletePost(postId);
    if (result.success) {
      render();
    } else {
      alert(result.errors.join('\n'));
    }
  };

  /**
   * 格式化时间
   */
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * 事件处理函数
   */
  const handlePostCreated = (data) => {
    console.log('[Community] Post created:', data);
    render();
  };

  const handlePostDeleted = (data) => {
    console.log('[Community] Post deleted:', data);
    render();
  };

  const handlePostLiked = (data) => {
    console.log('[Community] Post liked:', data);
  };

  const handleCommentAdded = (data) => {
    console.log('[Community] Comment added:', data);
  };

  /**
   * 显示用户主页
   */
  const showUserProfile = (userId) => {
    const user = getUserById(userId) || {
      id: userId,
      nickname: '未知用户',
      avatar: 'https://i.pravatar.cc/150?img=1',
      bio: '',
      level: '',
      verified: false
    };

    const currentUser = authService.currentUser();
    const currentUserId = currentUser ? (currentUser.id || currentUser.email) : null;
    const isOwnProfile = currentUserId === userId;

    // 获取用户的帖子
    const userPosts = postService.getPostsByUser(userId);

    // 获取关注信息
    const isFollowing = currentUserId ? socialGraphService.isFollowing(userId) : false;
    const followingCount = socialGraphService.getFollowingCount(userId);
    const followersCount = socialGraphService.getFollowersCount(userId);

    // 统计信息
    const totalLikes = userPosts.reduce((sum, post) => sum + post.stats.likes, 0);

    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="community-modal user-profile-modal">
        <div class="modal-header">
          <h3>用户主页</h3>
          <button class="btn-close-modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="user-profile-header">
            <img src="${user.avatar}" alt="${escapeHtml(user.nickname)}" class="user-profile-avatar">
            <div class="user-profile-info">
              <div class="user-profile-name">
                ${escapeHtml(user.nickname)}
                ${user.verified ? '<i class="fas fa-check-circle verified"></i>' : ''}
              </div>
              ${user.level ? `<div class="user-level">${escapeHtml(user.level)}</div>` : ''}
              ${user.bio ? `<div class="user-bio">${escapeHtml(user.bio)}</div>` : ''}
            </div>
          </div>

          <div class="user-stats">
            <div class="stat-item">
              <div class="stat-value">${userPosts.length}</div>
              <div class="stat-label">帖子</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${followingCount}</div>
              <div class="stat-label">关注</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${followersCount}</div>
              <div class="stat-label">粉丝</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${totalLikes}</div>
              <div class="stat-label">获赞</div>
            </div>
          </div>

          ${!isOwnProfile && currentUser ? `
            <div class="user-actions">
              <button class="btn btn-primary ${isFollowing ? 'btn-unfollow' : 'btn-follow'}"
                      id="btnFollowToggle"
                      data-user-id="${userId}">
                ${isFollowing ? '取消关注' : '关注'}
              </button>
            </div>
          ` : ''}

          <div class="user-posts-section">
            <h4>帖子 (${userPosts.length})</h4>
            <div class="user-posts-list">
              ${userPosts.length > 0
        ? userPosts.map(post => renderPostCard(post)).join('')
        : '<p class="empty-posts">该用户还没有发布帖子</p>'
      }
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // 关闭按钮
    const btnClose = dialog.querySelector('.btn-close-modal');
    btnClose.addEventListener('click', () => dialog.remove());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.remove();
    });

    // 关注/取消关注按钮
    const btnFollowToggle = dialog.querySelector('#btnFollowToggle');
    if (btnFollowToggle) {
      btnFollowToggle.addEventListener('click', () => {
        const result = isFollowing
          ? socialGraphService.unfollowUser(userId)
          : socialGraphService.followUser(userId);

        if (result.success) {
          dialog.remove();
          // 重新打开主页以显示更新后的状态
          setTimeout(() => showUserProfile(userId), 100);
        } else {
          alert(result.errors.join('\n'));
        }
      });
    }

    // 绑定帖子卡片事件
    const postsList = dialog.querySelector('.user-posts-list');
    if (postsList) {
      // 复制bindPostEvents的逻辑到这里
      postsList.querySelectorAll('.btn-like').forEach(btn => {
        btn.addEventListener('click', handleLike);
      });
      postsList.querySelectorAll('.btn-bookmark').forEach(btn => {
        btn.addEventListener('click', handleBookmark);
      });
      postsList.querySelectorAll('.btn-comment').forEach(btn => {
        btn.addEventListener('click', handleComment);
      });
      postsList.querySelectorAll('.btn-repost').forEach(btn => {
        btn.addEventListener('click', handleRepost);
      });
      postsList.querySelectorAll('.hashtag').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const tag = e.target.textContent;
          dialog.remove();
          currentFilter = tag;
          render();
        });
      });
    }
  };

  /**
   * 显示图片画廊（Lightbox）
   */
  const showImageGallery = (postId, startIndex = 0) => {
    const post = postService.getPost(postId);
    if (!post || !post.media || post.media.length === 0) return;

    const images = post.media.filter(m => m.type === 'image');
    if (images.length === 0) return;

    let currentIndex = startIndex;

    const gallery = document.createElement('div');
    gallery.className = 'image-gallery-lightbox';
    gallery.innerHTML = `
      <div class="gallery-overlay"></div>
      <div class="gallery-content">
        <button class="gallery-close">
          <i class="fas fa-times"></i>
        </button>
        ${images.length > 1 ? `
          <button class="gallery-nav gallery-prev">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="gallery-nav gallery-next">
            <i class="fas fa-chevron-right"></i>
          </button>
        ` : ''}
        <div class="gallery-image-container">
          <img src="${images[currentIndex].url}" alt="图片 ${currentIndex + 1}">
        </div>
        <div class="gallery-counter">${currentIndex + 1} / ${images.length}</div>
      </div>
    `;

    document.body.appendChild(gallery);
    document.body.style.overflow = 'hidden';

    const img = gallery.querySelector('.gallery-image-container img');
    const counter = gallery.querySelector('.gallery-counter');
    const btnClose = gallery.querySelector('.gallery-close');
    const btnPrev = gallery.querySelector('.gallery-prev');
    const btnNext = gallery.querySelector('.gallery-next');

    // 更新图片
    const updateImage = () => {
      img.src = images[currentIndex].url;
      counter.textContent = `${currentIndex + 1} / ${images.length}`;
    };

    // 上一张
    if (btnPrev) {
      btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateImage();
      });
    }

    // 下一张
    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        updateImage();
      });
    }

    // 键盘导航
    const handleKeyboard = (e) => {
      if (e.key === 'Escape') {
        closeGallery();
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateImage();
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        currentIndex = (currentIndex + 1) % images.length;
        updateImage();
      }
    };

    // 关闭画廊
    const closeGallery = () => {
      document.removeEventListener('keydown', handleKeyboard);
      document.body.style.overflow = '';
      gallery.remove();
    };

    // 绑定关闭事件
    btnClose.addEventListener('click', closeGallery);
    gallery.querySelector('.gallery-overlay').addEventListener('click', closeGallery);

    // 绑定键盘事件
    document.addEventListener('keydown', handleKeyboard);
  };

  /**
   * 销毁模块
   */
  const destroy = () => {
    eventBus.off(EventNames.POST_CREATED, handlePostCreated);
    eventBus.off(EventNames.POST_DELETED, handlePostDeleted);
    eventBus.off(EventNames.POST_LIKED, handlePostLiked);
    eventBus.off(EventNames.COMMENT_ADDED, handleCommentAdded);

    if (container) {
      container.innerHTML = '';
    }

    container = null;
  };

  return {
    init,
    render,
    destroy
  };
})();
