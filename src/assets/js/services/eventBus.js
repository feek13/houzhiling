/**
 * 事件总线系统
 * 功能：模块间的解耦通信
 *
 * 使用示例:
 * // 订阅事件
 * eventBus.on('workout:completed', (data) => {
 *   console.log('训练完成:', data);
 * });
 *
 * // 发布事件
 * eventBus.emit('workout:completed', { workoutId: 123, calories: 500 });
 *
 * // 取消订阅
 * eventBus.off('workout:completed', handler);
 */

class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();

    // 开发模式下启用日志
    this.debug = true;
    this.eventHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * 订阅事件
   * @param {string} eventName - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {Object} options - 可选配置
   */
  on(eventName, handler, options = {}) {
    if (typeof handler !== 'function') {
      console.error('[EventBus] Handler must be a function');
      return;
    }

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listeners = this.events.get(eventName);
    const listener = {
      handler,
      priority: options.priority || 0,
      context: options.context || null
    };

    // 按优先级插入
    const insertIndex = listeners.findIndex(l => l.priority < listener.priority);
    if (insertIndex === -1) {
      listeners.push(listener);
    } else {
      listeners.splice(insertIndex, 0, listener);
    }

    if (this.debug) {
      console.log(`[EventBus] Subscribed to "${eventName}"`);
    }

    // 返回取消订阅函数
    return () => this.off(eventName, handler);
  }

  /**
   * 订阅一次性事件
   * @param {string} eventName - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  once(eventName, handler) {
    if (typeof handler !== 'function') {
      console.error('[EventBus] Handler must be a function');
      return;
    }

    if (!this.onceEvents.has(eventName)) {
      this.onceEvents.set(eventName, []);
    }

    this.onceEvents.get(eventName).push(handler);

    if (this.debug) {
      console.log(`[EventBus] Subscribed once to "${eventName}"`);
    }

    return () => {
      const handlers = this.onceEvents.get(eventName);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * 取消订阅事件
   * @param {string} eventName - 事件名称
   * @param {Function} handler - 事件处理函数（可选，不传则取消所有）
   */
  off(eventName, handler) {
    if (!handler) {
      // 取消该事件的所有订阅
      this.events.delete(eventName);
      this.onceEvents.delete(eventName);
      if (this.debug) {
        console.log(`[EventBus] Unsubscribed all from "${eventName}"`);
      }
      return;
    }

    // 取消指定处理函数
    const listeners = this.events.get(eventName);
    if (listeners) {
      const index = listeners.findIndex(l => l.handler === handler);
      if (index > -1) {
        listeners.splice(index, 1);
        if (this.debug) {
          console.log(`[EventBus] Unsubscribed from "${eventName}"`);
        }
      }
    }

    // 取消一次性监听器
    const onceHandlers = this.onceEvents.get(eventName);
    if (onceHandlers) {
      const index = onceHandlers.indexOf(handler);
      if (index > -1) {
        onceHandlers.splice(index, 1);
      }
    }
  }

  /**
   * 发布事件
   * @param {string} eventName - 事件名称
   * @param {*} data - 事件数据
   */
  emit(eventName, data) {
    const timestamp = Date.now();

    if (this.debug) {
      console.log(`[EventBus] Emitting "${eventName}"`, data);

      // 记录事件历史
      this.eventHistory.push({
        eventName,
        data,
        timestamp: new Date().toISOString()
      });

      // 限制历史记录大小
      if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory.shift();
      }
    }

    // 触发普通监听器
    const listeners = this.events.get(eventName);
    if (listeners && listeners.length > 0) {
      listeners.forEach(({ handler, context }) => {
        try {
          if (context) {
            handler.call(context, data);
          } else {
            handler(data);
          }
        } catch (error) {
          console.error(`[EventBus] Error in "${eventName}" handler:`, error);
        }
      });
    }

    // 触发一次性监听器
    const onceHandlers = this.onceEvents.get(eventName);
    if (onceHandlers && onceHandlers.length > 0) {
      // 复制数组，因为处理器执行后会被移除
      const handlers = [...onceHandlers];
      this.onceEvents.delete(eventName);

      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] Error in "${eventName}" once handler:`, error);
        }
      });
    }

    // 触发通配符监听器 (*)
    const wildcardListeners = this.events.get('*');
    if (wildcardListeners && wildcardListeners.length > 0) {
      wildcardListeners.forEach(({ handler, context }) => {
        try {
          if (context) {
            handler.call(context, eventName, data);
          } else {
            handler(eventName, data);
          }
        } catch (error) {
          console.error('[EventBus] Error in wildcard handler:', error);
        }
      });
    }
  }

  /**
   * 异步发布事件
   * @param {string} eventName - 事件名称
   * @param {*} data - 事件数据
   */
  async emitAsync(eventName, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.emit(eventName, data);
        resolve();
      }, 0);
    });
  }

  /**
   * 清空所有订阅
   */
  clear() {
    this.events.clear();
    this.onceEvents.clear();
    if (this.debug) {
      console.log('[EventBus] Cleared all subscriptions');
    }
  }

  /**
   * 获取事件历史
   */
  getHistory(eventName) {
    if (eventName) {
      return this.eventHistory.filter(e => e.eventName === eventName);
    }
    return this.eventHistory;
  }

  /**
   * 获取所有已注册的事件
   */
  getRegisteredEvents() {
    return Array.from(this.events.keys());
  }

  /**
   * 获取事件的监听器数量
   */
  getListenerCount(eventName) {
    const listeners = this.events.get(eventName) || [];
    const onceListeners = this.onceEvents.get(eventName) || [];
    return listeners.length + onceListeners.length;
  }

  /**
   * 启用/禁用调试模式
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
}

// 导出单例
export const eventBus = new EventBus();

// 全局事件名称常量
export const EventNames = {
  // 认证事件
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_REGISTER: 'auth:register',

  // 训练事件
  WORKOUT_STARTED: 'workout:started',
  WORKOUT_COMPLETED: 'workout:completed',
  WORKOUT_DELETED: 'workout:deleted',
  TRAINING_PLAN_UPDATED: 'training:plan_updated',

  // 营养事件
  NUTRITION_LOGGED: 'nutrition:logged',
  NUTRITION_UPDATED: 'nutrition:updated',
  NUTRITION_DELETED: 'nutrition:deleted',

  // 身体数据事件
  METRICS_UPDATED: 'metrics:updated',
  WEIGHT_CHANGED: 'weight:changed',

  // 社交事件
  FRIEND_ADDED: 'friend:added',
  FRIEND_REMOVED: 'friend:removed',
  ACTIVITY_LIKED: 'activity:liked',
  ACTIVITY_COMMENTED: 'activity:commented',

  // 论坛事件 (legacy)
  TOPIC_CREATED: 'topic:created',
  TOPIC_REPLIED: 'topic:replied',
  TOPIC_LIKED: 'topic:liked',
  TOPIC_DELETED: 'topic:deleted',

  // 社区帖子事件 (new)
  POST_CREATED: 'post:created',
  POST_UPDATED: 'post:updated',
  POST_DELETED: 'post:deleted',
  POST_LIKED: 'post:liked',
  POST_REPOSTED: 'post:reposted',
  COMMENT_ADDED: 'comment:added',
  COMMENT_DELETED: 'comment:deleted',

  // 关注事件
  USER_FOLLOWED: 'user:followed',
  USER_UNFOLLOWED: 'user:unfollowed',
  USER_BLOCKED: 'user:blocked',
  USER_UNBLOCKED: 'user:unblocked',

  // 打卡事件
  CHECKIN_COMPLETED: 'checkin:completed',
  BADGE_EARNED: 'badge:earned',
  STREAK_UPDATED: 'streak:updated',

  // 课程事件
  COURSE_CREATED: 'course:created',
  COURSE_UPDATED: 'course:updated',
  COURSE_DELETED: 'course:deleted',
  COURSE_LIKED: 'course:liked',
  COURSE_FAVORITED: 'course:favorited',
  COURSE_COMMENTED: 'course:commented',
  COURSE_COMPLETED: 'course:completed',

  // 系统事件
  NOTIFICATION_SHOW: 'notification:show',
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  DATA_SYNCED: 'data:synced',
  ERROR_OCCURRED: 'error:occurred'
};
