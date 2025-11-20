/**
 * SocialGraphService - 社交关系服务
 *
 * 负责用户之间的关注/粉丝关系管理
 */

import { storage } from './storage.js';
import { authService } from './authService.js';
import { eventBus, EventNames } from './eventBus.js';

const SOCIAL_GRAPH_KEY = 'social_graph';
const BLOCKED_USERS_KEY = 'blocked_users';
const MUTED_TAGS_KEY = 'muted_tags';

export const socialGraphService = (() => {
  /**
   * 获取社交关系图
   * @returns {Object} 社交关系数据
   */
  const getSocialGraph = () => {
    return storage.get(SOCIAL_GRAPH_KEY, {});
  };

  /**
   * 获取用户的社交关系
   * @param {string} userId - 用户ID
   * @returns {Object} { following: [], followers: [] }
   */
  const getUserRelations = (userId) => {
    const graph = getSocialGraph();
    return graph[userId] || { following: [], followers: [] };
  };

  /**
   * 关注用户
   * @param {string} targetUserId - 目标用户ID
   * @returns {Object} { success: boolean, errors?: string[] }
   */
  const followUser = (targetUserId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const currentUserId = currentUser.id || currentUser.email;

    // 不能关注自己
    if (currentUserId === targetUserId) {
      return { success: false, errors: ['不能关注自己'] };
    }

    const graph = getSocialGraph();

    // 初始化用户关系
    if (!graph[currentUserId]) {
      graph[currentUserId] = { following: [], followers: [] };
    }
    if (!graph[targetUserId]) {
      graph[targetUserId] = { following: [], followers: [] };
    }

    // 检查是否已经关注
    if (graph[currentUserId].following.includes(targetUserId)) {
      return { success: false, errors: ['已经关注过该用户'] };
    }

    // 添加关注关系
    graph[currentUserId].following.push(targetUserId);
    graph[targetUserId].followers.push(currentUserId);

    storage.set(SOCIAL_GRAPH_KEY, graph);

    // 触发事件
    eventBus.emit(EventNames.USER_FOLLOWED, {
      followerId: currentUserId,
      followingId: targetUserId
    });

    return { success: true };
  };

  /**
   * 取消关注用户
   * @param {string} targetUserId - 目标用户ID
   * @returns {Object} { success: boolean, errors?: string[] }
   */
  const unfollowUser = (targetUserId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const currentUserId = currentUser.id || currentUser.email;
    const graph = getSocialGraph();

    if (!graph[currentUserId] || !graph[targetUserId]) {
      return { success: false, errors: ['关注关系不存在'] };
    }

    // 移除关注关系
    const followingIndex = graph[currentUserId].following.indexOf(targetUserId);
    const followerIndex = graph[targetUserId].followers.indexOf(currentUserId);

    if (followingIndex === -1) {
      return { success: false, errors: ['未关注该用户'] };
    }

    graph[currentUserId].following.splice(followingIndex, 1);
    if (followerIndex !== -1) {
      graph[targetUserId].followers.splice(followerIndex, 1);
    }

    storage.set(SOCIAL_GRAPH_KEY, graph);

    // 触发事件
    eventBus.emit(EventNames.USER_UNFOLLOWED, {
      followerId: currentUserId,
      followingId: targetUserId
    });

    return { success: true };
  };

  /**
   * 检查是否关注了某个用户
   * @param {string} targetUserId - 目标用户ID
   * @returns {boolean}
   */
  const isFollowing = (targetUserId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) return false;

    const currentUserId = currentUser.id || currentUser.email;
    const relations = getUserRelations(currentUserId);

    return relations.following.includes(targetUserId);
  };

  /**
   * 获取关注列表
   * @param {string} userId - 用户ID（可选，默认为当前用户）
   * @returns {Array} 关注的用户ID列表
   */
  const getFollowing = (userId = null) => {
    if (!userId) {
      const currentUser = authService.currentUser();
      if (!currentUser) return [];
      userId = currentUser.id || currentUser.email;
    }

    const relations = getUserRelations(userId);
    return relations.following || [];
  };

  /**
   * 获取粉丝列表
   * @param {string} userId - 用户ID（可选，默认为当前用户）
   * @returns {Array} 粉丝的用户ID列表
   */
  const getFollowers = (userId = null) => {
    if (!userId) {
      const currentUser = authService.currentUser();
      if (!currentUser) return [];
      userId = currentUser.id || currentUser.email;
    }

    const relations = getUserRelations(userId);
    return relations.followers || [];
  };

  /**
   * 获取关注数量
   * @param {string} userId - 用户ID
   * @returns {number}
   */
  const getFollowingCount = (userId) => {
    return getFollowing(userId).length;
  };

  /**
   * 获取粉丝数量
   * @param {string} userId - 用户ID
   * @returns {number}
   */
  const getFollowersCount = (userId) => {
    return getFollowers(userId).length;
  };

  /**
   * 获取互相关注的用户（好友）
   * @param {string} userId - 用户ID（可选，默认为当前用户）
   * @returns {Array} 互相关注的用户ID列表
   */
  const getMutualFollows = (userId = null) => {
    if (!userId) {
      const currentUser = authService.currentUser();
      if (!currentUser) return [];
      userId = currentUser.id || currentUser.email;
    }

    const following = getFollowing(userId);
    const followers = getFollowers(userId);

    // 找出交集
    return following.filter(id => followers.includes(id));
  };

  /**
   * 推荐关注的用户
   * @param {number} limit - 推荐数量
   * @returns {Array} 推荐的用户ID列表
   */
  const getRecommendedUsers = (limit = 10) => {
    const currentUser = authService.currentUser();
    if (!currentUser) return [];

    const currentUserId = currentUser.id || currentUser.email;
    const graph = getSocialGraph();
    const currentFollowing = getFollowing(currentUserId);

    // 找出关注用户的关注（二度关系）
    const secondDegreeUsers = new Map(); // userId -> count

    currentFollowing.forEach(userId => {
      const theirFollowing = getFollowing(userId);
      theirFollowing.forEach(secondUserId => {
        // 排除自己和已关注的用户
        if (secondUserId !== currentUserId && !currentFollowing.includes(secondUserId)) {
          secondDegreeUsers.set(
            secondUserId,
            (secondDegreeUsers.get(secondUserId) || 0) + 1
          );
        }
      });
    });

    // 按推荐度（被多少个我关注的人关注）排序
    const recommended = Array.from(secondDegreeUsers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId]) => userId);

    return recommended;
  };

  // ===== 屏蔽功能 =====

  /**
   * 屏蔽用户
   * @param {string} targetUserId - 目标用户ID
   * @returns {Object} { success: boolean, errors?: string[] }
   */
  const blockUser = (targetUserId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const currentUserId = currentUser.id || currentUser.email;
    const blocked = storage.get(BLOCKED_USERS_KEY, {});

    if (!blocked[currentUserId]) {
      blocked[currentUserId] = [];
    }

    if (blocked[currentUserId].includes(targetUserId)) {
      return { success: false, errors: ['已经屏蔽过该用户'] };
    }

    blocked[currentUserId].push(targetUserId);
    storage.set(BLOCKED_USERS_KEY, blocked);

    // 自动取消关注关系
    unfollowUser(targetUserId);

    eventBus.emit(EventNames.USER_BLOCKED, { targetUserId });

    return { success: true };
  };

  /**
   * 取消屏蔽用户
   * @param {string} targetUserId - 目标用户ID
   * @returns {Object} { success: boolean, errors?: string[] }
   */
  const unblockUser = (targetUserId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const currentUserId = currentUser.id || currentUser.email;
    const blocked = storage.get(BLOCKED_USERS_KEY, {});

    if (!blocked[currentUserId]) {
      return { success: false, errors: ['未屏蔽该用户'] };
    }

    const index = blocked[currentUserId].indexOf(targetUserId);
    if (index === -1) {
      return { success: false, errors: ['未屏蔽该用户'] };
    }

    blocked[currentUserId].splice(index, 1);
    storage.set(BLOCKED_USERS_KEY, blocked);

    eventBus.emit(EventNames.USER_UNBLOCKED, { targetUserId });

    return { success: true };
  };

  /**
   * 检查是否屏蔽了某个用户
   * @param {string} targetUserId - 目标用户ID
   * @returns {boolean}
   */
  const isBlocked = (targetUserId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) return false;

    const currentUserId = currentUser.id || currentUser.email;
    const blocked = storage.get(BLOCKED_USERS_KEY, {});

    return blocked[currentUserId]?.includes(targetUserId) || false;
  };

  /**
   * 获取屏蔽列表
   * @returns {Array} 屏蔽的用户ID列表
   */
  const getBlockedUsers = () => {
    const currentUser = authService.currentUser();
    if (!currentUser) return [];

    const currentUserId = currentUser.id || currentUser.email;
    const blocked = storage.get(BLOCKED_USERS_KEY, {});

    return blocked[currentUserId] || [];
  };

  // ===== 话题屏蔽 =====

  /**
   * 屏蔽话题标签
   * @param {string} tag - 话题标签
   * @returns {Object} { success: boolean, errors?: string[] }
   */
  const muteTag = (tag) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const currentUserId = currentUser.id || currentUser.email;
    const mutedTags = storage.get(MUTED_TAGS_KEY, {});

    if (!mutedTags[currentUserId]) {
      mutedTags[currentUserId] = [];
    }

    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;

    if (mutedTags[currentUserId].includes(normalizedTag)) {
      return { success: false, errors: ['已经屏蔽过该话题'] };
    }

    mutedTags[currentUserId].push(normalizedTag);
    storage.set(MUTED_TAGS_KEY, mutedTags);

    return { success: true };
  };

  /**
   * 取消屏蔽话题标签
   * @param {string} tag - 话题标签
   * @returns {Object} { success: boolean, errors?: string[] }
   */
  const unmuteTag = (tag) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      return { success: false, errors: ['请先登录'] };
    }

    const currentUserId = currentUser.id || currentUser.email;
    const mutedTags = storage.get(MUTED_TAGS_KEY, {});

    if (!mutedTags[currentUserId]) {
      return { success: false, errors: ['未屏蔽该话题'] };
    }

    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
    const index = mutedTags[currentUserId].indexOf(normalizedTag);

    if (index === -1) {
      return { success: false, errors: ['未屏蔽该话题'] };
    }

    mutedTags[currentUserId].splice(index, 1);
    storage.set(MUTED_TAGS_KEY, mutedTags);

    return { success: true };
  };

  /**
   * 获取屏蔽的话题标签列表
   * @returns {Array} 屏蔽的话题标签列表
   */
  const getMutedTags = () => {
    const currentUser = authService.currentUser();
    if (!currentUser) return [];

    const currentUserId = currentUser.id || currentUser.email;
    const mutedTags = storage.get(MUTED_TAGS_KEY, {});

    return mutedTags[currentUserId] || [];
  };

  /**
   * 检查话题是否被屏蔽
   * @param {string} tag - 话题标签
   * @returns {boolean}
   */
  const isTagMuted = (tag) => {
    const mutedTags = getMutedTags();
    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
    return mutedTags.includes(normalizedTag);
  };

  return {
    // 关注功能
    followUser,
    unfollowUser,
    isFollowing,
    getFollowing,
    getFollowers,
    getFollowingCount,
    getFollowersCount,
    getMutualFollows,
    getRecommendedUsers,

    // 屏蔽功能
    blockUser,
    unblockUser,
    isBlocked,
    getBlockedUsers,

    // 话题屏蔽
    muteTag,
    unmuteTag,
    getMutedTags,
    isTagMuted
  };
})();
