/**
 * workoutService.js - 训练课程服务
 * 功能：管理官方课程和用户创建的课程
 */

import { storage } from './storage.js';
import { authService } from './authService.js';
import { eventBus, EventNames } from './eventBus.js';

export const workoutService = (() => {
  // 存储键（storage.js会自动添加'fitspark:'前缀）
  const KEYS = {
    OFFICIAL: 'workouts:official',
    USER: 'workouts:user',
    FAVORITES: 'workouts:favorites',
    MY_COURSES: 'workouts:my_courses'
  };

  /**
   * 初始化官方课程数据
   * 首次运行时将 data/workouts.js 的数据迁移到 localStorage
   */
  const initOfficialWorkouts = async () => {
    const existing = storage.get(KEYS.OFFICIAL);
    if (!existing || existing.length === 0) {
      // 动态导入官方课程数据
      const { workouts } = await import('../data/workouts.js');
      const official = workouts.map(w => ({
        ...w,
        isOfficial: true,
        userId: 'system',
        authorName: 'FitSpark官方',
        authorAvatar: '',
        likes: 0,
        likedBy: [],
        favorites: 0,
        favoritedBy: [],
        views: 0,
        completions: 0,
        comments: [],
        status: 'published',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      storage.set(KEYS.OFFICIAL, official);
      console.log('[WorkoutService] 官方课程已初始化:', official.length);
    }
  };

  /**
   * 获取所有课程（官方 + 用户创建）
   * @param {Object} filters - 筛选条件
   * @returns {Array} 课程列表
   */
  const getAllWorkouts = (filters = {}) => {
    const official = storage.get(KEYS.OFFICIAL, []);
    const userCreated = storage.get(KEYS.USER, []);

    let allWorkouts = [...official, ...userCreated];

    // 应用筛选
    if (filters.source) {
      if (filters.source === 'official') {
        allWorkouts = allWorkouts.filter(w => w.isOfficial);
      } else if (filters.source === 'user') {
        allWorkouts = allWorkouts.filter(w => !w.isOfficial);
      } else if (filters.source === 'mine') {
        const currentUser = authService.currentUser();
        if (currentUser) {
          allWorkouts = allWorkouts.filter(w => w.userId === currentUser.id);
        } else {
          allWorkouts = [];
        }
      }
    }

    // 只返回已发布的课程（草稿只对作者可见）
    const currentUser = authService.currentUser();
    allWorkouts = allWorkouts.filter(w => {
      if (w.status === 'published') return true;
      if (currentUser && w.userId === currentUser.id) return true;
      return false;
    });

    return allWorkouts;
  };

  /**
   * 根据ID获取课程
   * @param {string} id - 课程ID
   * @returns {Object|null} 课程对象
   */
  const getWorkoutById = (id) => {
    const allWorkouts = getAllWorkouts();
    return allWorkouts.find(w => w.id === id) || null;
  };

  /**
   * 创建新课程
   * @param {Object} data - 课程数据
   * @returns {Object} 创建的课程对象
   */
  const createWorkout = (data) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      throw new Error('需要登录才能创建课程');
    }

    // 验证数据
    const errors = validateWorkout(data);
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    // 清理用户输入
    const workout = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: sanitizeHTML(data.title),
      description: sanitizeHTML(data.description),
      muscleKey: data.muscleKey,
      muscle: data.muscle,
      levelKey: data.levelKey,
      level: data.level,
      equipmentKey: data.equipmentKey,
      equipment: data.equipment,
      durationKey: data.durationKey,
      duration: data.duration,
      goalFocus: data.goalFocus,
      steps: data.steps.map(step => sanitizeHTML(step)),
      risks: data.risks ? sanitizeHTML(data.risks) : '',
      video: data.video || '',
      status: data.status || 'published',
      tags: data.tags || [],
      isOfficial: false,
      userId: currentUser.id,
      authorName: sanitizeHTML(currentUser.name || currentUser.username),
      authorAvatar: currentUser.avatar || '',
      likes: 0,
      likedBy: [],
      favorites: 0,
      favoritedBy: [],
      views: 0,
      completions: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存到用户课程列表
    const userWorkouts = storage.get(KEYS.USER, []);
    userWorkouts.push(workout);
    storage.set(KEYS.USER, userWorkouts);

    // 发送事件
    eventBus.emit(EventNames.COURSE_CREATED, { workout });

    console.log('[WorkoutService] 课程已创建:', workout.id);
    return workout;
  };

  /**
   * 更新课程
   * @param {string} id - 课程ID
   * @param {Object} updates - 更新的数据
   * @returns {Object} 更新后的课程对象
   */
  const updateWorkout = (id, updates) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      throw new Error('需要登录才能更新课程');
    }

    const userWorkouts = storage.get(KEYS.USER, []);
    const index = userWorkouts.findIndex(w => w.id === id);

    if (index === -1) {
      throw new Error('课程不存在');
    }

    const workout = userWorkouts[index];

    // 权限检查：只有作者可以编辑
    if (workout.userId !== currentUser.id) {
      throw new Error('您没有权限编辑此课程');
    }

    // 验证数据
    const mergedData = { ...workout, ...updates };
    const errors = validateWorkout(mergedData);
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    // 清理并更新数据
    const sanitizedUpdates = {};
    if (updates.title) sanitizedUpdates.title = sanitizeHTML(updates.title);
    if (updates.description) sanitizedUpdates.description = sanitizeHTML(updates.description);
    if (updates.risks) sanitizedUpdates.risks = sanitizeHTML(updates.risks);
    if (updates.steps) sanitizedUpdates.steps = updates.steps.map(step => sanitizeHTML(step));

    // 其他字段直接复制（非用户文本输入）
    const safeFields = ['muscleKey', 'muscle', 'levelKey', 'level', 'equipmentKey', 'equipment',
                        'durationKey', 'duration', 'goalFocus', 'video', 'status', 'tags'];
    safeFields.forEach(field => {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    });

    // 更新数据
    userWorkouts[index] = {
      ...workout,
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString()
    };

    storage.set(KEYS.USER, userWorkouts);

    // 发送事件
    eventBus.emit(EventNames.COURSE_UPDATED, { workout: userWorkouts[index] });

    console.log('[WorkoutService] 课程已更新:', id);
    return userWorkouts[index];
  };

  /**
   * 删除课程
   * @param {string} id - 课程ID
   * @returns {boolean} 是否删除成功
   */
  const deleteWorkout = (id) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      throw new Error('需要登录才能删除课程');
    }

    const userWorkouts = storage.get(KEYS.USER, []);
    const index = userWorkouts.findIndex(w => w.id === id);

    if (index === -1) {
      throw new Error('课程不存在');
    }

    const workout = userWorkouts[index];

    // 权限检查：只有作者可以删除
    if (workout.userId !== currentUser.id) {
      throw new Error('您没有权限删除此课程');
    }

    // 删除课程
    userWorkouts.splice(index, 1);
    storage.set(KEYS.USER, userWorkouts);

    // 发送事件
    eventBus.emit(EventNames.COURSE_DELETED, { workoutId: id });

    console.log('[WorkoutService] 课程已删除:', id);
    return true;
  };

  /**
   * 点赞/取消点赞课程
   * @param {string} id - 课程ID
   * @returns {Object} 更新后的点赞状态
   */
  const toggleLike = (id) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      throw new Error('需要登录才能点赞');
    }

    const workout = getWorkoutById(id);
    if (!workout) {
      throw new Error('课程不存在');
    }

    const hasLiked = workout.likedBy.includes(currentUser.id);

    if (hasLiked) {
      // 取消点赞
      workout.likes = Math.max(0, workout.likes - 1);
      workout.likedBy = workout.likedBy.filter(userId => userId !== currentUser.id);
    } else {
      // 点赞
      workout.likes++;
      workout.likedBy.push(currentUser.id);
    }

    // 保存更新
    saveWorkoutUpdate(workout);

    // 发送事件
    eventBus.emit(EventNames.COURSE_LIKED, {
      workoutId: id,
      userId: currentUser.id,
      liked: !hasLiked
    });

    return { liked: !hasLiked, likes: workout.likes };
  };

  /**
   * 收藏/取消收藏课程
   * @param {string} id - 课程ID
   * @returns {Object} 更新后的收藏状态
   */
  const toggleFavorite = (id) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      throw new Error('需要登录才能收藏');
    }

    const workout = getWorkoutById(id);
    if (!workout) {
      throw new Error('课程不存在');
    }

    const hasFavorited = workout.favoritedBy.includes(currentUser.id);

    if (hasFavorited) {
      // 取消收藏
      workout.favorites = Math.max(0, workout.favorites - 1);
      workout.favoritedBy = workout.favoritedBy.filter(userId => userId !== currentUser.id);
    } else {
      // 收藏
      workout.favorites++;
      workout.favoritedBy.push(currentUser.id);
    }

    // 保存更新
    saveWorkoutUpdate(workout);

    // 发送事件
    eventBus.emit(EventNames.COURSE_FAVORITED, {
      workoutId: id,
      userId: currentUser.id,
      favorited: !hasFavorited
    });

    return { favorited: !hasFavorited, favorites: workout.favorites };
  };

  /**
   * 添加评论
   * @param {string} workoutId - 课程ID
   * @param {string} content - 评论内容
   * @returns {Object} 新增的评论对象
   */
  const addComment = (workoutId, content) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      throw new Error('需要登录才能评论');
    }

    if (!content || content.trim().length < 1) {
      throw new Error('评论内容不能为空');
    }

    if (content.length > 500) {
      throw new Error('评论内容不能超过500字');
    }

    const workout = getWorkoutById(workoutId);
    if (!workout) {
      throw new Error('课程不存在');
    }

    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      userName: currentUser.name || currentUser.username,
      userAvatar: currentUser.avatar || '',
      content: sanitizeHTML(content.trim()),
      createdAt: new Date().toISOString(),
      likes: 0
    };

    workout.comments.push(comment);

    // 保存更新
    saveWorkoutUpdate(workout);

    // 发送事件
    eventBus.emit(EventNames.COURSE_COMMENTED, {
      workoutId,
      comment
    });

    console.log('[WorkoutService] 评论已添加:', comment.id);
    return comment;
  };

  /**
   * 删除评论
   * @param {string} workoutId - 课程ID
   * @param {string} commentId - 评论ID
   * @returns {boolean} 是否删除成功
   */
  const deleteComment = (workoutId, commentId) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      throw new Error('需要登录才能删除评论');
    }

    const workout = getWorkoutById(workoutId);
    if (!workout) {
      throw new Error('课程不存在');
    }

    const commentIndex = workout.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      throw new Error('评论不存在');
    }

    const comment = workout.comments[commentIndex];

    // 权限检查：只有评论作者或课程作者可以删除
    if (comment.userId !== currentUser.id && workout.userId !== currentUser.id) {
      throw new Error('您没有权限删除此评论');
    }

    workout.comments.splice(commentIndex, 1);

    // 保存更新
    saveWorkoutUpdate(workout);

    console.log('[WorkoutService] 评论已删除:', commentId);
    return true;
  };

  /**
   * 增加浏览量
   * @param {string} id - 课程ID
   */
  const incrementViews = (id) => {
    const workout = getWorkoutById(id);
    if (!workout) return;

    workout.views++;
    saveWorkoutUpdate(workout);
  };

  /**
   * 增加完成次数
   * @param {string} id - 课程ID
   */
  const incrementCompletions = (id) => {
    const workout = getWorkoutById(id);
    if (!workout) return;

    workout.completions++;
    saveWorkoutUpdate(workout);

    // 发送事件
    eventBus.emit(EventNames.COURSE_COMPLETED, { workoutId: id });
  };

  /**
   * 获取用户创建的课程
   * @param {string} userId - 用户ID
   * @returns {Array} 课程列表
   */
  const getUserWorkouts = (userId) => {
    const userWorkouts = storage.get(KEYS.USER, []);
    return userWorkouts.filter(w => w.userId === userId);
  };

  /**
   * 获取用户收藏的课程
   * @param {string} userId - 用户ID
   * @returns {Array} 课程列表
   */
  const getFavorites = (userId) => {
    const allWorkouts = getAllWorkouts();
    return allWorkouts.filter(w => w.favoritedBy.includes(userId));
  };

  /**
   * 保存课程更新（内部辅助函数）
   * @param {Object} workout - 课程对象
   */
  const saveWorkoutUpdate = (workout) => {
    if (workout.isOfficial) {
      // 更新官方课程
      const official = storage.get(KEYS.OFFICIAL, []);
      const index = official.findIndex(w => w.id === workout.id);
      if (index !== -1) {
        official[index] = workout;
        storage.set(KEYS.OFFICIAL, official);
      }
    } else {
      // 更新用户课程
      const userWorkouts = storage.get(KEYS.USER, []);
      const index = userWorkouts.findIndex(w => w.id === workout.id);
      if (index !== -1) {
        userWorkouts[index] = workout;
        storage.set(KEYS.USER, userWorkouts);
      }
    }
  };

  /**
   * 验证课程数据
   * @param {Object} data - 课程数据
   * @returns {Array} 错误信息数组
   */
  const validateWorkout = (data) => {
    const errors = [];

    if (!data.title || data.title.trim().length < 3) {
      errors.push('标题至少需要3个字符');
    }

    if (data.title && data.title.length > 50) {
      errors.push('标题不能超过50个字符');
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push('描述至少需要10个字符');
    }

    if (data.description && data.description.length > 500) {
      errors.push('描述不能超过500个字符');
    }

    if (!data.steps || !Array.isArray(data.steps) || data.steps.length < 2) {
      errors.push('至少需要2个训练步骤');
    }

    if (data.steps && data.steps.length > 20) {
      errors.push('训练步骤不能超过20个');
    }

    if (!data.muscleKey) {
      errors.push('请选择训练部位');
    }

    if (!data.levelKey) {
      errors.push('请选择难度等级');
    }

    if (!data.equipmentKey) {
      errors.push('请选择器械类型');
    }

    if (!data.durationKey) {
      errors.push('请选择训练时长');
    }

    return errors;
  };

  /**
   * HTML清理函数（防XSS）
   * @param {string} str - 输入字符串
   * @returns {string} 清理后的字符串
   */
  const sanitizeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  /**
   * 检查用户是否可以编辑课程
   * @param {Object} workout - 课程对象
   * @returns {boolean}
   */
  const canEdit = (workout) => {
    const currentUser = authService.currentUser();
    return currentUser && workout.userId === currentUser.id;
  };

  /**
   * 检查用户是否已点赞
   * @param {Object} workout - 课程对象
   * @returns {boolean}
   */
  const hasLiked = (workout) => {
    const currentUser = authService.currentUser();
    return currentUser && workout.likedBy.includes(currentUser.id);
  };

  /**
   * 检查用户是否已收藏
   * @param {Object} workout - 课程对象
   * @returns {boolean}
   */
  const hasFavorited = (workout) => {
    const currentUser = authService.currentUser();
    return currentUser && workout.favoritedBy.includes(currentUser.id);
  };

  // 公开API
  return {
    initOfficialWorkouts,
    getAllWorkouts,
    getWorkoutById,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    toggleLike,
    toggleFavorite,
    addComment,
    deleteComment,
    incrementViews,
    incrementCompletions,
    getUserWorkouts,
    getFavorites,
    canEdit,
    hasLiked,
    hasFavorited
  };
})();
