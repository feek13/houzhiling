# 事件总线系统使用指南

## 概述

事件总线（EventBus）是 FitSpark 应用的核心通信机制，用于实现模块间的解耦通信。

## 架构

- **位置**: `/src/assets/js/services/eventBus.js`
- **模式**: 发布-订阅（Pub-Sub）模式
- **特性**:
  - 优先级队列
  - 一次性监听器
  - 通配符监听
  - 事件历史记录
  - 调试模式

## 核心API

### 订阅事件

```javascript
import { eventBus, EventNames } from './services/eventBus.js';

// 基本订阅
eventBus.on(EventNames.WORKOUT_COMPLETED, (data) => {
  console.log('训练完成:', data);
});

// 带优先级订阅（数字越大优先级越高）
eventBus.on(EventNames.AUTH_LOGIN, handleLogin, {
  priority: 10
});

// 带上下文订阅
eventBus.on(EventNames.NUTRITION_LOGGED, function(data) {
  this.updateUI(data); // this 指向 context
}, { context: myModule });

// 返回取消订阅函数
const unsubscribe = eventBus.on(EventNames.MODAL_OPEN, handler);
// 稍后取消订阅
unsubscribe();
```

### 一次性订阅

```javascript
// 只触发一次，之后自动取消订阅
eventBus.once(EventNames.AUTH_REGISTER, (data) => {
  console.log('首次注册:', data);
});
```

### 发布事件

```javascript
// 同步发布
eventBus.emit(EventNames.WORKOUT_COMPLETED, {
  workoutId: 123,
  calories: 500,
  duration: 45
});

// 异步发布
await eventBus.emitAsync(EventNames.DATA_SYNCED, {
  timestamp: Date.now()
});
```

### 取消订阅

```javascript
// 取消特定处理函数
eventBus.off(EventNames.WORKOUT_COMPLETED, handler);

// 取消事件的所有订阅
eventBus.off(EventNames.WORKOUT_COMPLETED);
```

### 通配符监听

```javascript
// 监听所有事件
eventBus.on('*', (eventName, data) => {
  console.log(`事件: ${eventName}`, data);
});
```

## 预定义事件

### 认证事件
- `AUTH_LOGIN` - 用户登录
- `AUTH_LOGOUT` - 用户登出
- `AUTH_REGISTER` - 用户注册

### 训练事件
- `WORKOUT_STARTED` - 训练开始
- `WORKOUT_COMPLETED` - 训练完成
- `WORKOUT_DELETED` - 训练删除

### 营养事件
- `NUTRITION_LOGGED` - 营养记录
- `NUTRITION_UPDATED` - 营养更新
- `NUTRITION_DELETED` - 营养删除

### 身体数据事件
- `METRICS_UPDATED` - 身体数据更新
- `WEIGHT_CHANGED` - 体重变化

### 社交事件
- `FRIEND_ADDED` - 好友添加
- `FRIEND_REMOVED` - 好友移除
- `ACTIVITY_LIKED` - 动态点赞
- `ACTIVITY_COMMENTED` - 动态评论

### 论坛事件
- `TOPIC_CREATED` - 话题创建
- `TOPIC_REPLIED` - 话题回复
- `TOPIC_LIKED` - 话题点赞
- `TOPIC_DELETED` - 话题删除

### 打卡事件
- `CHECKIN_COMPLETED` - 打卡完成
- `BADGE_EARNED` - 徽章获得
- `STREAK_UPDATED` - 连续天数更新

### 系统事件
- `NOTIFICATION_SHOW` - 显示通知
- `MODAL_OPEN` - 模态框打开
- `MODAL_CLOSE` - 模态框关闭
- `DATA_SYNCED` - 数据同步
- `ERROR_OCCURRED` - 错误发生

## 使用示例

### 示例 1: 训练完成后更新多个模块

```javascript
// workouts.js - 发布事件
function completeWorkout(workoutData) {
  // 保存训练数据
  storage.save('workouts', workoutData);

  // 发布事件
  eventBus.emit(EventNames.WORKOUT_COMPLETED, workoutData);
}

// activityFeed.js - 订阅并更新动态流
eventBus.on(EventNames.WORKOUT_COMPLETED, (data) => {
  activityFeedModule.init(); // 刷新动态
});

// analytics.js - 订阅并更新统计
eventBus.on(EventNames.WORKOUT_COMPLETED, (data) => {
  analyticsModule.updateCharts(); // 更新图表
});

// engagement.js - 订阅并检查徽章
eventBus.on(EventNames.WORKOUT_COMPLETED, (data) => {
  checkBadges(); // 检查是否获得新徽章
});
```

### 示例 2: 用户登录后初始化模块

```javascript
// app.js
eventBus.on(EventNames.AUTH_LOGIN, (data) => {
  console.log('用户登录:', data.user.email);

  // 刷新依赖用户数据的模块
  activityFeedModule.init();
  friendsModule.init();
  leaderboardModule.init();
});

// authService.js - 登录时发布事件
function login(email, password) {
  const user = authenticateUser(email, password);
  if (user) {
    eventBus.emit(EventNames.AUTH_LOGIN, { user });
    return user;
  }
  return null;
}
```

### 示例 3: 模态框状态管理

```javascript
// modal.js - 发布模态框事件
function openModal(content) {
  // 打开模态框逻辑
  modalEl.setAttribute('aria-hidden', 'false');

  // 发布事件
  eventBus.emit(EventNames.MODAL_OPEN, { type: 'generic' });
}

// 其他模块可以响应模态框事件
eventBus.on(EventNames.MODAL_OPEN, () => {
  // 暂停后台任务
  pauseBackgroundTasks();
});

eventBus.on(EventNames.MODAL_CLOSE, () => {
  // 恢复后台任务
  resumeBackgroundTasks();
});
```

## 调试

### 启用/禁用调试模式

```javascript
// 启用调试（默认已启用）
eventBus.setDebug(true);

// 禁用调试
eventBus.setDebug(false);
```

### 查看事件历史

```javascript
// 获取所有事件历史
const allHistory = eventBus.getHistory();

// 获取特定事件历史
const workoutHistory = eventBus.getHistory(EventNames.WORKOUT_COMPLETED);

console.log('历史记录:', workoutHistory);
```

### 查看已注册事件

```javascript
const events = eventBus.getRegisteredEvents();
console.log('已注册事件:', events);
```

### 查看监听器数量

```javascript
const count = eventBus.getListenerCount(EventNames.WORKOUT_COMPLETED);
console.log(`WORKOUT_COMPLETED 有 ${count} 个监听器`);
```

## 最佳实践

### 1. 使用预定义事件名称

❌ **错误**:
```javascript
eventBus.emit('workout-done', data);
```

✅ **正确**:
```javascript
eventBus.emit(EventNames.WORKOUT_COMPLETED, data);
```

### 2. 避免循环事件

❌ **错误**:
```javascript
eventBus.on(EventNames.DATA_SYNCED, () => {
  // 这会导致无限循环！
  eventBus.emit(EventNames.DATA_SYNCED);
});
```

✅ **正确**:
```javascript
eventBus.on(EventNames.DATA_SYNCED, () => {
  // 处理数据，不要再次触发相同事件
  updateUI();
});
```

### 3. 错误处理

```javascript
eventBus.on(EventNames.WORKOUT_COMPLETED, (data) => {
  try {
    // 业务逻辑
    processWorkout(data);
  } catch (error) {
    // 事件处理器内的错误会被 EventBus 捕获并记录
    console.error('处理训练时出错:', error);

    // 可以发布错误事件
    eventBus.emit(EventNames.ERROR_OCCURRED, {
      source: 'workout-handler',
      error: error.message
    });
  }
});
```

### 4. 清理订阅

```javascript
// 在模块销毁时清理订阅
const myModule = {
  unsubscribers: [],

  init() {
    const unsub1 = eventBus.on(EventNames.WORKOUT_COMPLETED, this.handleWorkout);
    const unsub2 = eventBus.on(EventNames.NUTRITION_LOGGED, this.handleNutrition);

    this.unsubscribers.push(unsub1, unsub2);
  },

  destroy() {
    // 清理所有订阅
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
};
```

### 5. 使用优先级控制执行顺序

```javascript
// 高优先级：先执行数据验证
eventBus.on(EventNames.WORKOUT_COMPLETED, validateData, {
  priority: 10
});

// 中优先级：保存数据
eventBus.on(EventNames.WORKOUT_COMPLETED, saveData, {
  priority: 5
});

// 低优先级：更新UI
eventBus.on(EventNames.WORKOUT_COMPLETED, updateUI, {
  priority: 1
});
```

## 性能考虑

1. **避免频繁事件**: 高频事件（如滚动、鼠标移动）应使用防抖或节流
2. **限制监听器数量**: 每个事件不应超过10个监听器
3. **使用 `once`**: 对于一次性操作，使用 `once` 而不是 `on` + `off`
4. **异步处理**: 对于耗时操作，使用 `emitAsync` 避免阻塞主线程

## 故障排查

### 问题: 事件未触发

**检查清单**:
1. 确认事件名称拼写正确
2. 检查是否在发布前已订阅
3. 查看控制台是否有错误
4. 使用调试模式查看事件历史

```javascript
// 启用调试模式
eventBus.setDebug(true);

// 使用通配符监听所有事件
eventBus.on('*', (eventName, data) => {
  console.log('事件触发:', eventName, data);
});
```

### 问题: 监听器被多次调用

**原因**: 可能多次调用了 `on()` 订阅同一个事件

**解决**:
```javascript
// 在订阅前先取消订阅
eventBus.off(EventNames.WORKOUT_COMPLETED, myHandler);
eventBus.on(EventNames.WORKOUT_COMPLETED, myHandler);
```

## 未来扩展

计划中的功能：
- [ ] 命名空间支持 (e.g., `user:login`, `user:logout`)
- [ ] 事件过滤器
- [ ] 事件持久化
- [ ] 跨标签页通信（使用 BroadcastChannel）
- [ ] 事件回放功能

## 总结

事件总线是 FitSpark 实现模块间通信的核心机制。通过使用事件总线，我们实现了：

✅ 模块解耦：各模块独立开发和测试
✅ 灵活扩展：新增功能无需修改现有代码
✅ 易于调试：完整的事件历史和日志
✅ 统一通信：所有模块使用相同的通信方式

记住：**发布事件时要慎重，订阅事件时要谨慎**。合理使用事件总线能让代码更加清晰和可维护。
