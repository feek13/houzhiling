/**
 * Post数据模型 - 社区帖子
 *
 * 用于类X平台的帖子数据结构定义
 */

/**
 * Post类型枚举
 */
export const PostType = {
  ORIGINAL: 'original',    // 原创帖子
  REPOST: 'repost',        // 直接转发
  QUOTE: 'quote'           // 引用转发
};

/**
 * 可见性枚举
 */
export const Visibility = {
  PUBLIC: 'public',        // 公开
  FOLLOWERS: 'followers',  // 仅关注者
  PRIVATE: 'private'       // 私密
};

/**
 * 媒体类型枚举
 */
export const MediaType = {
  IMAGE: 'image',
  VIDEO: 'video'
};

/**
 * Post数据模型
 */
export const PostModel = {
  /**
   * 创建新的Post对象
   * @param {Object} data - Post数据
   * @returns {Object} 完整的Post对象
   */
  create: (data) => {
    const now = new Date().toISOString();

    return {
      // 基础信息
      id: data.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type || PostType.ORIGINAL,
      userId: data.userId,

      // 内容
      content: data.content || '',
      media: data.media || [],        // [{ type: 'image', url: '...', thumbnail: '...' }]
      tags: data.tags || [],          // ['#健身', '#减脂']

      // 可选关联
      workoutRef: data.workoutRef || null,    // { id, type, duration, calories }
      originalPostId: data.originalPostId || null,  // 转发时的原帖ID

      // 统计数据
      stats: {
        likes: data.stats?.likes || 0,
        comments: data.stats?.comments || 0,
        reposts: data.stats?.reposts || 0,
        views: data.stats?.views || 0,
        bookmarks: data.stats?.bookmarks || 0
      },

      // 当前用户的互动状态（运行时计算，不存储）
      interactions: {
        liked: false,
        reposted: false,
        bookmarked: false
      },

      // 时间戳
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,

      // 可见性
      visibility: data.visibility || Visibility.PUBLIC,

      // 其他标记
      isPinned: data.isPinned || false,
      isEdited: data.isEdited || false,
      legacy: data.legacy || false  // 是否为从旧论坛迁移的数据
    };
  },

  /**
   * 验证Post数据
   * @param {Object} post - Post对象
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate: (post) => {
    const errors = [];

    if (!post.userId) {
      errors.push('用户ID不能为空');
    }

    if (!post.content || post.content.trim().length === 0) {
      errors.push('内容不能为空');
    }

    if (post.content && post.content.length > 280) {
      errors.push('内容不能超过280个字符');
    }

    if (!Object.values(PostType).includes(post.type)) {
      errors.push('无效的帖子类型');
    }

    if (!Object.values(Visibility).includes(post.visibility)) {
      errors.push('无效的可见性设置');
    }

    if (post.media && post.media.length > 4) {
      errors.push('最多只能上传4张图片');
    }

    if (post.type === PostType.REPOST && !post.originalPostId) {
      errors.push('转发帖子必须指定原帖ID');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * Comment数据模型
 */
export const CommentModel = {
  /**
   * 创建新的Comment对象
   * @param {Object} data - Comment数据
   * @returns {Object} 完整的Comment对象
   */
  create: (data) => {
    const now = new Date().toISOString();

    return {
      id: data.id || `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId: data.postId,
      userId: data.userId,
      content: data.content || '',
      replyToId: data.replyToId || null,  // 回复的评论ID（支持一层嵌套）
      likes: data.likes || 0,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
  },

  /**
   * 验证Comment数据
   * @param {Object} comment - Comment对象
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate: (comment) => {
    const errors = [];

    if (!comment.postId) {
      errors.push('帖子ID不能为空');
    }

    if (!comment.userId) {
      errors.push('用户ID不能为空');
    }

    if (!comment.content || comment.content.trim().length === 0) {
      errors.push('评论内容不能为空');
    }

    if (comment.content && comment.content.length > 500) {
      errors.push('评论内容不能超过500个字符');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * 用户信息模型（用于显示）
 */
export const UserInfoModel = {
  create: (data) => ({
    id: data.id,
    nickname: data.nickname || data.email,
    avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.id}`,
    bio: data.bio || '',
    level: data.level || '入门',
    verified: data.verified || false
  })
};
