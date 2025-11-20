/**
 * 活动动态流模块
 * 功能：显示好友的训练动态、营养日志、打卡记录等活动
 * 安全说明：所有用户生成的内容都经过HTML转义处理
 */

import { storage } from '../services/storage.js';
import { authService } from '../services/authService.js';
import { eventBus, EventNames } from '../services/eventBus.js';
import { getUserById } from '../data/mockUsers.js';
import { notificationService } from '../services/notificationService.js';

const ACTIVITIES_KEY = 'user_activities';

const escapeHtml = (text) => {
  const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
};

export const activityFeedModule = (() => {
  let currentFilter = 'all';
  const container = document.getElementById('activity-feed-container');
  const filterBtns = document.querySelectorAll('[data-activity-filter]');

  const getActivities = () => storage.get(ACTIVITIES_KEY, []);

  const addActivity = (activity) => {
    const activities = getActivities();
    activities.unshift({id: Date.now(), timestamp: new Date().toISOString(), ...activity});
    if (activities.length > 100) activities.length = 100;
    storage.set(ACTIVITIES_KEY, activities);
  };

  const filterActivities = (activities, filter) => {
    return filter === 'all' ? activities : activities.filter(a => a.type === filter);
  };

  const formatTime = (timestamp) => {
    const diff = new Date() - new Date(timestamp);
    const sec = Math.floor(diff / 1000), min = Math.floor(sec / 60);
    const hrs = Math.floor(min / 60), days = Math.floor(hrs / 24);
    if (sec < 60) return '刚刚';
    if (min < 60) return `${min}分钟前`;
    if (hrs < 24) return `${hrs}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  const getActivityIcon = (type) => {
    const icons = {workout:'💪',nutrition:'🥗',checkin:'✅',forum:'💬',achievement:'🏆',post:'✍️'};
    return icons[type] || '📋';
  };

  const renderActivityContent = (activity) => {
    const user = getUserById(activity.userId);
    const userName = escapeHtml(user?.nickname || user?.email || '未知用户');
    switch (activity.type) {
      case 'workout': return `<strong>${userName}</strong> 完成了 <span class="highlight">${escapeHtml(activity.data.type)}</span> 训练，消耗 ${activity.data.calories} 卡路里`;
      case 'nutrition': return `<strong>${userName}</strong> 记录了营养摄入：${escapeHtml(activity.data.meal)} - ${activity.data.calories} 卡路里`;
      case 'checkin': return `<strong>${userName}</strong> 打卡签到，连续 ${activity.data.streak} 天！`;
      case 'forum': return `<strong>${userName}</strong> 发布了新主题：${escapeHtml(activity.data.title)}`;
      case 'achievement': return `<strong>${userName}</strong> 解锁成就：${escapeHtml(activity.data.achievement)}`;
      case 'post': return `<strong>${userName}</strong><br><span class="post-content">${escapeHtml(activity.data.content)}</span>`;
      default: return `<strong>${userName}</strong> 有了新动态`;
    }
  };

  const renderActivities = () => {
    if (!container) return;
    const user = authService.currentUser();
    const filtered = filterActivities(getActivities(), currentFilter);

    if (filtered.length === 0) {
      container.innerHTML = `<div class="empty-state"><p class="muted">暂无活动记录</p></div>`;
      return;
    }

    container.innerHTML = filtered.map(activity => {
      const activityUser = getUserById(activity.userId);
      const avatar = activityUser?.avatar || 'https://i.pravatar.cc/150?img=1';
      const likes = activity.likes || 0;
      const isLiked = activity.likedBy?.includes(user?.id);
      return `<div class="activity-item" data-activity-id="${activity.id}">
        <img src="${avatar}" alt="${escapeHtml(activityUser?.nickname || '用户')}" class="activity-avatar">
        <div class="activity-content">
          <p>${renderActivityContent(activity)}</p>
          <div class="activity-footer">
            <span class="activity-time">${formatTime(activity.timestamp)}</span>
            <button class="like-btn ${isLiked?'liked':''}" data-activity-id="${activity.id}">
              ${isLiked?'❤️':'🤍'} ${likes>0?likes:''}
            </button>
          </div>
        </div>
      </div>`;
    }).join('');

    container.querySelectorAll('.like-btn').forEach(btn => btn.addEventListener('click', handleLike));
  };

  const handleLike = (e) => {
    const user = authService.currentUser();
    if (!user) { notificationService.warning('请先登录'); return; }
    const id = parseInt(e.currentTarget.dataset.activityId);
    const activities = getActivities();
    const activity = activities.find(a => a.id === id);
    if (!activity) return;
    if (!activity.likedBy) activity.likedBy = [];
    if (!activity.likes) activity.likes = 0;
    const idx = activity.likedBy.indexOf(user.id);
    if (idx > -1) { activity.likedBy.splice(idx, 1); activity.likes--; }
    else { activity.likedBy.push(user.id); activity.likes++; }
    storage.set(ACTIVITIES_KEY, activities);
    renderActivities();
  };

  const handleFilterChange = (e) => {
    currentFilter = e.currentTarget.dataset.activityFilter;
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    renderActivities();
  };

  const handlePostActivity = () => {
    const user = authService.currentUser();
    if (!user) {
      notificationService.warning('请先登录');
      return;
    }

    const input = document.getElementById('activity-post-input');
    const content = input.value.trim();

    if (!content) {
      notificationService.warning('请输入动态内容');
      return;
    }

    if (content.length > 500) {
      notificationService.warning('动态内容不能超过500字');
      return;
    }

    addActivity({
      userId: user.id,
      type: 'post',
      data: { content }
    });

    input.value = '';
    renderActivities();
    notificationService.success('动态发布成功');
  };

  const initEventListeners = () => {
    filterBtns.forEach(btn => btn.addEventListener('click', handleFilterChange));

    const postBtn = document.getElementById('post-activity-btn');
    if (postBtn) {
      postBtn.addEventListener('click', handlePostActivity);
    }

    eventBus.on(EventNames.WORKOUT_COMPLETED, (data) => {
      const user = authService.currentUser();
      if (user && data.workout) {
        addActivity({userId:user.id,type:'workout',data:{type:data.workout.type,duration:data.workout.duration,calories:data.workout.calories}});
        renderActivities();
      }
    });
    eventBus.on(EventNames.NUTRITION_LOGGED, (data) => {
      const user = authService.currentUser();
      if (user && data.nutrition) {
        addActivity({userId:user.id,type:'nutrition',data:{meal:data.nutrition.meal,calories:data.nutrition.calories}});
        renderActivities();
      }
    });
  };

  const init = () => { renderActivities(); initEventListeners(); };

  return { init, addActivity, getActivities };
})();
