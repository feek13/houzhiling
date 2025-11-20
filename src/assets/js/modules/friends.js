/**
 * 好友系统模块
 * 功能：添加/删除好友、好友列表、好友搜索、好友主页
 * 安全说明：所有用户生成的内容都经过HTML转义处理
 */

import { storage } from '../services/storage.js';
import { authService } from '../services/authService.js';
import { mockUsers, getUserById, searchUsers, getRecommendedFriends } from '../data/mockUsers.js';
import { modal } from './modal.js';
import { notificationService } from '../services/notificationService.js';

const FRIENDS_KEY = 'user_friends';
const FRIEND_REQUESTS_KEY = 'friend_requests';

/**
 * HTML转义函数 - 防止XSS攻击
 */
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
};

export const friendsModule = (() => {
  let currentView = 'my-friends'; // 'my-friends', 'discover', 'requests'

  const container = document.getElementById('friends-container');
  const tabBtns = document.querySelectorAll('[data-friend-tab]');
  const searchInput = document.getElementById('friend-search');

  /**
   * 获取当前用户的好友列表
   */
  const getMyFriends = () => {
    const user = authService.currentUser();
    if (!user) return [];
    return storage.get(FRIENDS_KEY, []);
  };

  /**
   * 获取好友请求列表
   */
  const getFriendRequests = () => {
    const user = authService.currentUser();
    if (!user) return [];
    return storage.get(FRIEND_REQUESTS_KEY, []);
  };

  /**
   * 添加好友
   */
  const addFriend = (friendId) => {
    const user = authService.currentUser();
    if (!user) {
      notificationService.warning('请先登录');
      return;
    }

    const friends = getMyFriends();
    if (friends.includes(friendId)) {
      notificationService.info('已经是好友了');
      return;
    }

    friends.push(friendId);
    storage.set(FRIENDS_KEY, friends);

    createNotification(`成功添加好友`);
    render();
  };

  /**
   * 删除好友
   */
  const removeFriend = async (friendId) => {
    const confirmed = await notificationService.confirm({
      title: '确认删除',
      message: '确定要删除这个好友吗？',
      confirmText: '确定',
      cancelText: '取消'
    });

    if (!confirmed) return;

    const friends = getMyFriends();
    const index = friends.indexOf(friendId);
    if (index > -1) {
      friends.splice(index, 1);
      storage.set(FRIENDS_KEY, friends);
      createNotification('已删除好友');
      render();
    }
  };

  /**
   * 发送好友请求（简化版，直接添加）
   */
  const sendFriendRequest = (friendId) => {
    addFriend(friendId);
  };

  /**
   * 创建通知
   */
  const createNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'friend-notification';
    notification.textContent = message; // 使用textContent而不是innerHTML
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(67, 233, 123, 0.9);
      color: #0F1B2A;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 500;
      z-index: 10000;
      animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  /**
   * 显示好友详情
   */
  const showFriendProfile = (friendId) => {
    const friend = getUserById(friendId);
    if (!friend) return;

    const isFriend = getMyFriends().includes(friendId);

    // 所有用户数据都经过转义
    const modalContent = `
      <div class="friend-profile-modal">
        <div class="friend-profile-header">
          <img src="${escapeHtml(friend.avatar)}" alt="${escapeHtml(friend.nickname)}" class="friend-avatar-large">
          <div class="friend-profile-info">
            <h2>${escapeHtml(friend.nickname)}</h2>
            <p class="friend-level-badge">${escapeHtml(friend.level)}</p>
            <p class="friend-bio">${escapeHtml(friend.bio)}</p>
          </div>
        </div>

        <div class="friend-stats-grid">
          <div class="friend-stat-card">
            <span class="stat-value">${friend.totalWorkouts}</span>
            <span class="stat-label">训练次数</span>
          </div>
          <div class="friend-stat-card">
            <span class="stat-value">${friend.streakDays}</span>
            <span class="stat-label">连续天数</span>
          </div>
          <div class="friend-stat-card">
            <span class="stat-value">${(friend.totalCaloriesBurned / 1000).toFixed(1)}k</span>
            <span class="stat-label">消耗卡路里</span>
          </div>
        </div>

        <div class="friend-badges">
          <h3>获得徽章</h3>
          <div class="badge-list">
            ${friend.badges.map(badge => `
              <span class="badge-item">${escapeHtml(badge)}</span>
            `).join('')}
          </div>
        </div>

        <div class="friend-actions">
          ${isFriend
            ? `<button class="btn ghost" onclick="window.friendsModule.removeFriend('${escapeHtml(friendId)}')">删除好友</button>`
            : `<button class="btn primary" onclick="window.friendsModule.sendFriendRequest('${escapeHtml(friendId)}')">添加好友</button>`
          }
          <button class="btn ghost" onclick="window.friendsModule.sendEncouragement('${escapeHtml(friendId)}')">发送鼓励</button>
        </div>
      </div>
    `;

    modal.open(modalContent);
  };

  /**
   * 发送鼓励
   */
  const sendEncouragement = (friendId) => {
    const friend = getUserById(friendId);
    createNotification(`已向 ${friend.nickname} 发送鼓励！`);
    modal.close();
  };

  /**
   * 渲染好友列表
   */
  const renderMyFriends = () => {
    const friends = getMyFriends();
    if (friends.length === 0) {
      return `
        <div class="empty-state">
          <p>还没有添加好友</p>
          <p class="muted">去"发现好友"添加志同道合的健身伙伴吧！</p>
        </div>
      `;
    }

    return `
      <div class="friends-grid">
        ${friends.map(friendId => {
          const friend = getUserById(friendId);
          if (!friend) return '';
          return `
            <div class="friend-card glass" data-friend-id="${escapeHtml(friend.id)}">
              <img src="${escapeHtml(friend.avatar)}" alt="${escapeHtml(friend.nickname)}" class="friend-avatar">
              <div class="friend-info">
                <h3>${escapeHtml(friend.nickname)}</h3>
                <p class="friend-level">${escapeHtml(friend.level)}</p>
                <p class="friend-stats">
                  <span>训练 ${friend.totalWorkouts} 次</span>
                  <span>连续 ${friend.streakDays} 天</span>
                </p>
              </div>
              <div class="friend-actions-mini">
                <button class="btn-icon" onclick="window.friendsModule.showFriendProfile('${escapeHtml(friend.id)}')" title="查看主页">
                  👤
                </button>
                <button class="btn-icon" onclick="window.friendsModule.sendEncouragement('${escapeHtml(friend.id)}')" title="发送鼓励">
                  ⚡
                </button>
                <button class="btn-icon danger" onclick="window.friendsModule.removeFriend('${escapeHtml(friend.id)}')" title="删除好友">
                  ✕
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  /**
   * 渲染发现好友
   */
  const renderDiscoverFriends = () => {
    const user = authService.currentUser();
    const keyword = searchInput ? searchInput.value : '';
    const friends = getMyFriends();

    let users = keyword ? searchUsers(keyword) : mockUsers;

    // 过滤掉自己和已经是好友的
    users = users.filter(u =>
      u.id !== (user ? user.email : '') &&
      !friends.includes(u.id)
    );

    if (users.length === 0) {
      return `
        <div class="empty-state">
          <p>没有找到用户</p>
          <p class="muted">试试其他关键词</p>
        </div>
      `;
    }

    return `
      <div class="friends-grid">
        ${users.map(user => `
          <div class="friend-card glass" data-friend-id="${escapeHtml(user.id)}">
            <img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.nickname)}" class="friend-avatar">
            <div class="friend-info">
              <h3>${escapeHtml(user.nickname)}</h3>
              <p class="friend-level">${escapeHtml(user.level)}</p>
              <p class="friend-stats">
                <span>训练 ${user.totalWorkouts} 次</span>
                <span>连续 ${user.streakDays} 天</span>
              </p>
            </div>
            <div class="friend-actions-mini">
              <button class="btn-icon" onclick="window.friendsModule.showFriendProfile('${escapeHtml(user.id)}')" title="查看主页">
                👤
              </button>
              <button class="btn primary small" onclick="window.friendsModule.sendFriendRequest('${escapeHtml(user.id)}')">
                添加好友
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  /**
   * 渲染推荐好友
   */
  const renderRecommendedFriends = () => {
    const user = authService.currentUser();
    if (!user) return '<div class="empty-state"><p>请先登录</p></div>';

    const friends = getMyFriends();
    const recommended = getRecommendedFriends(user, friends);

    if (recommended.length === 0) {
      return '<div class="empty-state"><p>暂无推荐</p></div>';
    }

    return `
      <div class="recommended-section">
        <h3>推荐好友</h3>
        <div class="friends-grid">
          ${recommended.slice(0, 3).map(user => `
            <div class="friend-card glass" data-friend-id="${escapeHtml(user.id)}">
              <img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.nickname)}" class="friend-avatar">
              <div class="friend-info">
                <h3>${escapeHtml(user.nickname)}</h3>
                <p class="friend-level">${escapeHtml(user.level)}</p>
                <p class="friend-bio-short">${escapeHtml(user.bio)}</p>
              </div>
              <button class="btn primary small" onclick="window.friendsModule.sendFriendRequest('${escapeHtml(user.id)}')">
                添加好友
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  /**
   * 主渲染函数
   */
  const render = () => {
    if (!container) return;

    const user = authService.currentUser();
    if (!user) {
      container.innerHTML = `
        <div class="empty-state">
          <p>请先登录以使用好友功能</p>
        </div>
      `;
      return;
    }

    let content = '';
    switch (currentView) {
      case 'my-friends':
        content = renderMyFriends();
        break;
      case 'discover':
        content = renderDiscoverFriends();
        break;
      case 'recommended':
        content = renderRecommendedFriends();
        break;
      default:
        content = renderMyFriends();
    }

    container.innerHTML = content;
  };

  /**
   * 切换标签页
   */
  const switchTab = (tab) => {
    currentView = tab;

    tabBtns.forEach(btn => {
      if (btn.dataset.friendTab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    render();
  };

  /**
   * 初始化
   */
  const init = () => {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.friendTab);
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (currentView === 'discover') {
          render();
        }
      });
    }

    render();
  };

  // 暴露到全局以便HTML调用
  window.friendsModule = {
    showFriendProfile,
    sendFriendRequest,
    removeFriend,
    sendEncouragement,
  };

  return {
    init,
    render,
    addFriend,
    removeFriend,
    getMyFriends,
  };
})();
