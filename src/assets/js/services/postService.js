/**
 * PostService - Post业务逻辑服务
 *
 * 负责帖子的CRUD操作、点赞、转发、收藏等功能
 */

import { storage } from './storage.js';
import { authService } from './authService.js';
import { eventBus, EventNames } from './eventBus.js';
import { PostModel, CommentModel, PostType } from '../data/postModel.js';
import { socialGraphService } from './socialGraphService.js';
import { mockPosts } from '../data/mockPosts.js';

const POSTS_KEY = 'community_posts';
const COMMENTS_KEY = 'community_comments';
const LIKES_KEY = 'community_likes';
const BOOKMARKS_KEY = 'community_bookmarks';
const REPOSTS_KEY = 'community_reposts';

export const postService = (() => {
  /**
   * 获取所有帖子
   * @returns {Array} 帖子数组
   */
  const getAllPosts = () => {
    let posts = storage.get(POSTS_KEY, []);
    if (posts.length === 0) {
      posts = mockPosts;
      storage.set(POSTS_KEY, posts);
    }
    return posts;
  };

  /**
   * 获取单个帖子
   * @param {string} postId - 帖子ID
   * @returns {Object|null} 帖子对象
   */
  const getPostById = (postId) => {
    const posts = getAllPosts();
    return posts.find(p => p.id === postId) || null;
  };

  /**
   * 创建新帖子
   * @param {Object} postData - 帖子数据
   * @returns {Object} { success: boolean, post?: Object, errors?: string[] }
   */
  const createPost = (postData) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    // 创建Post对象
    const post = PostModel.create({
      ...postData,
      userId: currentUser.id || currentUser.email
    });

    // 验证数据
    const validation = PostModel.validate(post);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // 保存到storage
    const posts = getAllPosts();
    posts.unshift(post);  // 新帖子放在最前面
    storage.set(POSTS_KEY, posts);

    // 触发事件
    eventBus.emit(EventNames.POST_CREATED, { post });

    return { success: true, post };
  };

  /**
   * 更新帖子
   * @param {string} postId - 帖子ID
   * @param {Object} updates - 更新的字段
   * @returns {Object} { success: boolean, post?: Object, errors?: string[] }
   */
  const updatePost = (postId, updates) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const posts = getAllPosts();
    const index = posts.findIndex(p => p.id === postId);

    if (index === -1) {
      return { success: false, errors: ['帖子不存在'] };
    }

    // 检查权限
    if (posts[index].userId !== (currentUser.id || currentUser.email)) {
      return { success: false, errors: ['无权编辑此帖子'] };
    }

    // 更新帖子
    posts[index] = {
      ...posts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      isEdited: true
    };

    // 重新验证
    const validation = PostModel.validate(posts[index]);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    storage.set(POSTS_KEY, posts);
    eventBus.emit(EventNames.POST_UPDATED, { post: posts[index] });

    return { success: true, post: posts[index] };
  };

  /**
   * 删除帖子
   * @param {string} postId - 帖子ID
   * @returns {Object} { success: boolean, errors?: string[] }
   */
  const deletePost = (postId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const posts = getAllPosts();
    const index = posts.findIndex(p => p.id === postId);

    if (index === -1) {
      return { success: false, errors: ['帖子不存在'] };
    }

    // 检查权限
    if (posts[index].userId !== (currentUser.id || currentUser.email)) {
      return { success: false, errors: ['无权删除此帖子'] };
    }

    // 删除帖子
    const deletedPost = posts.splice(index, 1)[0];
    storage.set(POSTS_KEY, posts);

    // 删除相关评论
    const comments = storage.get(COMMENTS_KEY, []);
    const filteredComments = comments.filter(c => c.postId !== postId);
    storage.set(COMMENTS_KEY, filteredComments);

    eventBus.emit(EventNames.POST_DELETED, { postId });

    return { success: true };
  };

  /**
   * 点赞/取消点赞帖子
   * @param {string} postId - 帖子ID
   * @returns {Object} { success: boolean, liked: boolean, likeCount: number }
   */
  const toggleLike = (postId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const userId = currentUser.id || currentUser.email;
    const likes = storage.get(LIKES_KEY, {});

    // 用户点赞记录: { userId: [postId1, postId2, ...] }
    if (!likes[userId]) {
      likes[userId] = [];
    }

    const likedIndex = likes[userId].indexOf(postId);
    const isLiked = likedIndex !== -1;

    // 切换点赞状态
    if (isLiked) {
      likes[userId].splice(likedIndex, 1);
    } else {
      likes[userId].push(postId);
    }

    storage.set(LIKES_KEY, likes);

    // 更新帖子的点赞数
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.stats.likes = isLiked ? post.stats.likes - 1 : post.stats.likes + 1;
      storage.set(POSTS_KEY, posts);
    }

    eventBus.emit(EventNames.POST_LIKED, { postId, liked: !isLiked });

    return {
      success: true,
      liked: !isLiked,
      likeCount: post ? post.stats.likes : 0
    };
  };

  /**
   * 检查用户是否点赞了某个帖子
   * @param {string} postId - 帖子ID
   * @returns {boolean}
   */
  const isLikedByCurrentUser = (postId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) return false;

    const userId = currentUser.id || currentUser.email;
    const likes = storage.get(LIKES_KEY, {});

    return likes[userId]?.includes(postId) || false;
  };

  /**
   * 转发帖子
   * @param {string} originalPostId - 原帖ID
   * @param {string} comment - 转发评论（可选，用于引用转发）
   * @returns {Object} { success: boolean, post?: Object, errors?: string[] }
   */
  const repostPost = (originalPostId, comment = '') => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const originalPost = getPostById(originalPostId);
    if (!originalPost) {
      return { success: false, errors: ['原帖不存在'] };
    }

    // 创建转发帖子
    const type = comment ? PostType.QUOTE : PostType.REPOST;
    const repost = PostModel.create({
      type,
      userId: currentUser.id || currentUser.email,
      content: comment,
      originalPostId,
      visibility: 'public'
    });

    const posts = getAllPosts();
    posts.unshift(repost);
    storage.set(POSTS_KEY, posts);

    // 更新原帖的转发数
    originalPost.stats.reposts = (originalPost.stats.reposts || 0) + 1;
    storage.set(POSTS_KEY, posts);

    // 记录用户的转发
    const reposts = storage.get(REPOSTS_KEY, {});
    const userId = currentUser.id || currentUser.email;
    if (!reposts[userId]) {
      reposts[userId] = [];
    }
    reposts[userId].push(originalPostId);
    storage.set(REPOSTS_KEY, reposts);

    eventBus.emit(EventNames.POST_REPOSTED, { post: repost, originalPost });

    return { success: true, post: repost };
  };

  /**
   * 收藏/取消收藏帖子
   * @param {string} postId - 帖子ID
   * @returns {Object} { success: boolean, bookmarked: boolean }
   */
  const toggleBookmark = (postId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const userId = currentUser.id || currentUser.email;
    const bookmarks = storage.get(BOOKMARKS_KEY, {});

    if (!bookmarks[userId]) {
      bookmarks[userId] = [];
    }

    const bookmarkedIndex = bookmarks[userId].indexOf(postId);
    const isBookmarked = bookmarkedIndex !== -1;

    if (isBookmarked) {
      bookmarks[userId].splice(bookmarkedIndex, 1);
    } else {
      bookmarks[userId].push(postId);
    }

    storage.set(BOOKMARKS_KEY, bookmarks);

    // 更新帖子的收藏数
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.stats.bookmarks = isBookmarked ? post.stats.bookmarks - 1 : post.stats.bookmarks + 1;
      storage.set(POSTS_KEY, posts);
    }

    return { success: true, bookmarked: !isBookmarked };
  };

  /**
   * 检查用户是否收藏了某个帖子
   * @param {string} postId - 帖子ID
   * @returns {boolean}
   */
  const isBookmarkedByCurrentUser = (postId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) return false;

    const userId = currentUser.id || currentUser.email;
    const bookmarks = storage.get(BOOKMARKS_KEY, {});

    return bookmarks[userId]?.includes(postId) || false;
  };

  /**
   * 增加浏览量
   * @param {string} postId - 帖子ID
   */
  const incrementViews = (postId) => {
    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.stats.views = (post.stats.views || 0) + 1;
      storage.set(POSTS_KEY, posts);
    }
  };

  /**
   * 获取用户的帖子
   * @param {string} userId - 用户ID
   * @returns {Array} 帖子数组
   */
  const getUserPosts = (userId) => {
    const posts = getAllPosts();
    return posts.filter(p => p.userId === userId);
  };

  /**
   * 获取带有特定标签的帖子
   * @param {string} tag - 标签
   * @returns {Array} 帖子数组
   */
  const getPostsByTag = (tag) => {
    const posts = getAllPosts();
    return posts.filter(p => p.tags && p.tags.includes(tag));
  };

  /**
   * 搜索帖子
   * @param {string} query - 搜索关键词
   * @returns {Array} 帖子数组
   */
  const searchPosts = (query) => {
    if (!query || query.trim().length === 0) {
      return getAllPosts();
    }

    const posts = getAllPosts();
    const lowerQuery = query.toLowerCase();

    return posts.filter(post =>
      post.content.toLowerCase().includes(lowerQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  /**
   * 获取推荐帖子
   * @returns {Array} 帖子数组
   */
  const getRecommendedPosts = () => {
    const posts = getAllPosts();
    // 简单按时间倒序，实际可能有更复杂的算法
    return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  /**
   * 获取关注用户的帖子
   * @param {string} userId - 当前用户ID
   * @returns {Array} 帖子数组
   */
  const getFollowingPosts = (userId) => {
    const following = socialGraphService.getFollowing(userId);
    const posts = getAllPosts();
    // 包括自己和关注的人的帖子
    return posts.filter(p => following.includes(p.userId) || p.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  /**
   * 获取热门帖子
   * @returns {Array} 帖子数组
   */
  const getTrendingPosts = () => {
    const posts = getAllPosts();
    // 按互动量排序 (点赞 + 评论*2 + 转发*3)
    return posts.sort((a, b) => {
      const scoreA = (a.stats.likes || 0) + (a.stats.comments || 0) * 2 + (a.stats.reposts || 0) * 3;
      const scoreB = (b.stats.likes || 0) + (b.stats.comments || 0) * 2 + (b.stats.reposts || 0) * 3;
      return scoreB - scoreA;
    });
  };

  // ===== 评论相关方法 =====

  /**
   * 添加评论
   * @param {Object} commentData - 评论数据
   * @returns {Object} { success: boolean, comment?: Object, errors?: string[] }
   */
  const addComment = (commentData) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const comment = CommentModel.create({
      ...commentData,
      userId: currentUser.id || currentUser.email
    });

    const validation = CommentModel.validate(comment);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const comments = storage.get(COMMENTS_KEY, []);
    comments.unshift(comment);
    storage.set(COMMENTS_KEY, comments);

    // 更新帖子的评论数
    const posts = getAllPosts();
    const post = posts.find(p => p.id === comment.postId);
    if (post) {
      post.stats.comments = (post.stats.comments || 0) + 1;
      storage.set(POSTS_KEY, posts);
    }

    eventBus.emit(EventNames.COMMENT_ADDED, { comment });

    return { success: true, comment };
  };

  /**
   * 获取帖子的评论
   * @param {string} postId - 帖子ID
   * @returns {Array} 评论数组
   */
  const getCommentsByPostId = (postId) => {
    const comments = storage.get(COMMENTS_KEY, []);
    return comments.filter(c => c.postId === postId);
  };

  /**
   * 删除评论
   * @param {string} commentId - 评论ID
   * @returns {Object} { success: boolean, errors?: string[] }
   */
  const deleteComment = (commentId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const comments = storage.get(COMMENTS_KEY, []);
    const index = comments.findIndex(c => c.id === commentId);

    if (index === -1) {
      return { success: false, errors: ['评论不存在'] };
    }

    if (comments[index].userId !== (currentUser.id || currentUser.email)) {
      return { success: false, errors: ['无权删除此评论'] };
    }

    const deletedComment = comments.splice(index, 1)[0];
    storage.set(COMMENTS_KEY, comments);

    // 更新帖子的评论数
    const posts = getAllPosts();
    const post = posts.find(p => p.id === deletedComment.postId);
    if (post) {
      post.stats.comments = Math.max(0, (post.stats.comments || 0) - 1);
      storage.set(POSTS_KEY, posts);
    }

    eventBus.emit(EventNames.COMMENT_DELETED, { commentId });

    return { success: true };
  };

  return {
    // Post CRUD
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,

    // 互动功能
    toggleLike,
    hasLiked: isLikedByCurrentUser,
    repostPost,
    toggleBookmark,
    hasBookmarked: isBookmarkedByCurrentUser,
    incrementViews,

    // 查询功能
    getUserPosts,
    getPostsByTag,
    searchPosts,
    getRecommendedPosts,
    getFollowingPosts,
    getTrendingPosts,

    // 评论功能
    addComment,
    getCommentsByPostId,
    deleteComment
  };
})();
