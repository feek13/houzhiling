/**
 * Data Migration Utility
 *
 * 用于将旧的Forum Topic数据迁移到新的Community Post格式
 */

import { storage } from '../services/storage.js';
import { PostModel, CommentModel } from '../data/postModel.js';
import { CATEGORIES } from '../data/mockTopics.js';

const OLD_TOPICS_KEY = 'forum_topics';
const NEW_POSTS_KEY = 'community_posts';
const NEW_COMMENTS_KEY = 'community_comments';
const MIGRATION_STATUS_KEY = 'data_migration_status';

export const dataMigration = (() => {
  /**
   * 检查是否已经迁移过
   * @returns {boolean}
   */
  const isMigrated = () => {
    const status = storage.get(MIGRATION_STATUS_KEY, {});
    return status.topicToPost === true;
  };

  /**
   * 标记迁移完成
   */
  const markAsMigrated = () => {
    const status = storage.get(MIGRATION_STATUS_KEY, {});
    status.topicToPost = true;
    status.migratedAt = new Date().toISOString();
    storage.set(MIGRATION_STATUS_KEY, status);
  };

  /**
   * 将Topic转换为Post
   * @param {Object} topic - 旧的Topic对象
   * @returns {Object} 新的Post对象
   */
  const convertTopicToPost = (topic) => {
    // 找到对应的分类
    const category = CATEGORIES.find(c => c.id === topic.category);
    const categoryTag = category ? `#${category.name}` : '';

    // 合并标题和内容
    const content = topic.title && topic.content
      ? `${topic.title}\n\n${topic.content}`
      : topic.content || topic.title || '';

    // 截取到280字
    const truncatedContent = content.length > 280
      ? content.substring(0, 277) + '...'
      : content;

    // 创建新的Post对象
    const post = PostModel.create({
      id: topic.id, // 保留原ID
      type: 'original',
      userId: topic.author?.id || 'unknown',
      content: truncatedContent,
      tags: categoryTag ? [categoryTag] : [],
      stats: {
        likes: topic.likes || 0,
        comments: topic.replies?.length || 0,
        reposts: 0,
        views: topic.views || 0,
        bookmarks: 0
      },
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt || topic.createdAt,
      isPinned: topic.isPinned || false,
      legacy: true  // 标记为历史数据
    });

    return post;
  };

  /**
   * 将Topic的Reply转换为Comment
   * @param {Object} reply - 旧的Reply对象
   * @param {string} postId - 关联的帖子ID
   * @returns {Object} 新的Comment对象
   */
  const convertReplyToComment = (reply, postId) => {
    const comment = CommentModel.create({
      id: reply.id,  // 保留原ID
      postId,
      userId: reply.author?.id || 'unknown',
      content: reply.content || '',
      likes: reply.likes || 0,
      createdAt: reply.createdAt
    });

    return comment;
  };

  /**
   * 执行完整的数据迁移
   * @returns {Object} { success: boolean, migratedPosts: number, migratedComments: number, errors: string[] }
   */
  const migrate = () => {
    try {
      // 检查是否已经迁移
      if (isMigrated()) {
        console.log('[Migration] 数据已经迁移过，跳过迁移');
        return {
          success: true,
          migratedPosts: 0,
          migratedComments: 0,
          message: '数据已经迁移过'
        };
      }

      // 获取旧数据
      const oldTopics = storage.get(OLD_TOPICS_KEY, []);

      if (oldTopics.length === 0) {
        console.log('[Migration] 没有旧数据需要迁移');
        markAsMigrated();
        return {
          success: true,
          migratedPosts: 0,
          migratedComments: 0,
          message: '没有旧数据需要迁移'
        };
      }

      const newPosts = [];
      const newComments = [];

      // 转换每个Topic
      oldTopics.forEach(topic => {
        // 转换Topic为Post
        const post = convertTopicToPost(topic);
        newPosts.push(post);

        // 转换Replies为Comments
        if (topic.replies && Array.isArray(topic.replies)) {
          topic.replies.forEach(reply => {
            const comment = convertReplyToComment(reply, topic.id);
            newComments.push(comment);
          });
        }
      });

      // 保存新数据
      storage.set(NEW_POSTS_KEY, newPosts);
      storage.set(NEW_COMMENTS_KEY, newComments);

      // 标记迁移完成
      markAsMigrated();

      console.log(`[Migration] 迁移完成: ${newPosts.length} 个帖子, ${newComments.length} 条评论`);

      return {
        success: true,
        migratedPosts: newPosts.length,
        migratedComments: newComments.length,
        message: `成功迁移 ${newPosts.length} 个帖子和 ${newComments.length} 条评论`
      };
    } catch (error) {
      console.error('[Migration] 迁移失败:', error);
      return {
        success: false,
        migratedPosts: 0,
        migratedComments: 0,
        errors: [error.message]
      };
    }
  };

  /**
   * 重置迁移状态（仅用于开发测试）
   */
  const resetMigration = () => {
    const status = storage.get(MIGRATION_STATUS_KEY, {});
    status.topicToPost = false;
    storage.set(MIGRATION_STATUS_KEY, status);
    console.log('[Migration] 迁移状态已重置');
  };

  /**
   * 获取迁移报告
   * @returns {Object} 迁移状态和统计信息
   */
  const getMigrationReport = () => {
    const status = storage.get(MIGRATION_STATUS_KEY, {});
    const oldTopics = storage.get(OLD_TOPICS_KEY, []);
    const newPosts = storage.get(NEW_POSTS_KEY, []);
    const newComments = storage.get(NEW_COMMENTS_KEY, []);

    return {
      migrated: status.topicToPost || false,
      migratedAt: status.migratedAt || null,
      oldTopicsCount: oldTopics.length,
      newPostsCount: newPosts.length,
      newCommentsCount: newComments.length,
      legacyPostsCount: newPosts.filter(p => p.legacy).length
    };
  };

  return {
    isMigrated,
    migrate,
    resetMigration,
    getMigrationReport
  };
})();

/**
 * 自动执行迁移（在应用启动时调用）
 */
export const autoMigrate = () => {
  if (!dataMigration.isMigrated()) {
    console.log('[Migration] 检测到旧数据，开始自动迁移...');
    const result = dataMigration.migrate();
    if (result.success) {
      console.log(`[Migration] ${result.message}`);
    } else {
      console.error('[Migration] 迁移失败:', result.errors);
    }
  }
};
