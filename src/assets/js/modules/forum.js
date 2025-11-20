/**
 * 论坛模块 - 核心功能版
 */

import { storage } from '../services/storage.js';
import { authService } from '../services/authService.js';
import { mockTopics, CATEGORIES } from '../data/mockTopics.js';
import { modal } from './modal.js';
import { notificationService } from '../services/notificationService.js';

const TOPICS_KEY = 'forum_topics';
const USER_POINTS_KEY = 'user_points';

const escapeHtml = (text) => {
  const map = {'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#039;'};
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
};

const formatTime = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 7) return date.toLocaleDateString('zh-CN');
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
};

export const forumModule = (() => {
  let currentCategory = 'all';
  let currentSort = 'latest';
  let allTopics = [];

  const container = document.getElementById('forum-container');
  const categoryBtns = document.querySelectorAll('[data-forum-category]');
  const sortBtns = document.querySelectorAll('[data-forum-sort]');
  const searchInput = document.getElementById('forum-search');
  const newTopicBtn = document.getElementById('new-topic-btn');

  const initData = () => {
    const saved = storage.get(TOPICS_KEY);
    allTopics = (saved && saved.length > 0) ? saved : [...mockTopics];
    storage.set(TOPICS_KEY, allTopics);
  };

  const getCurrentUserInfo = () => {
    const user = authService.currentUser();
    if (!user) return null;
    return {
      id: user.email,
      nickname: user.nickname || user.email,
      avatar: user.profile?.avatar || `https://i.pravatar.cc/150?u=${user.email}`,
      level: user.profile?.level || '入门'
    };
  };

  const createTopic = (categoryId, title, content) => {
    const user = getCurrentUserInfo();
    if (!user) { notificationService.warning('请先登录'); return; }

    const newTopic = {
      id: `topic_${Date.now()}`,
      category: categoryId,
      title,
      content,
      author: user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      replies: [],
      isPinned: false,
      isHighlighted: false
    };

    allTopics.unshift(newTopic);
    storage.set(TOPICS_KEY, allTopics);
    awardPoints(user.id, 10, '发布主题');
    return newTopic;
  };

  const addReply = (topicId, content) => {
    const user = getCurrentUserInfo();
    if (!user) { notificationService.warning('请先登录'); return; }

    const topic = allTopics.find(t => t.id === topicId);
    if (!topic) return;

    const newReply = {
      id: `reply_${topicId}_${Date.now()}`,
      author: user,
      content,
      createdAt: new Date().toISOString(),
      likes: 0
    };

    topic.replies.push(newReply);
    topic.updatedAt = new Date().toISOString();
    storage.set(TOPICS_KEY, allTopics);
    awardPoints(user.id, 5, '发表回复');
    return newReply;
  };

  const likeTopic = (topicId) => {
    const topic = allTopics.find(t => t.id === topicId);
    if (topic) {
      topic.likes = (topic.likes || 0) + 1;
      storage.set(TOPICS_KEY, allTopics);
      return topic.likes;
    }
  };

  const likeReply = (topicId, replyId) => {
    const topic = allTopics.find(t => t.id === topicId);
    if (topic) {
      const reply = topic.replies.find(r => r.id === replyId);
      if (reply) {
        reply.likes = (reply.likes || 0) + 1;
        storage.set(TOPICS_KEY, allTopics);
        return reply.likes;
      }
    }
  };

  const increaseViews = (topicId) => {
    const topic = allTopics.find(t => t.id === topicId);
    if (topic) {
      topic.views = (topic.views || 0) + 1;
      storage.set(TOPICS_KEY, allTopics);
    }
  };

  const deleteTopic = async (topicId) => {
    const user = getCurrentUserInfo();
    if (!user) return false;

    const index = allTopics.findIndex(t => t.id === topicId);
    if (index === -1) return false;

    if (allTopics[index].author.id !== user.id) {
      notificationService.warning('只能删除自己的帖子');
      return false;
    }

    const confirmed = await notificationService.confirm({
      title: '确认删除',
      message: '确定要删除这个主题吗？',
      confirmText: '确定',
      cancelText: '取消'
    });

    if (confirmed) {
      allTopics.splice(index, 1);
      storage.set(TOPICS_KEY, allTopics);
      notificationService.success('主题已删除');
      return true;
    }
    return false;
  };

  const deleteReply = async (topicId, replyId) => {
    const user = getCurrentUserInfo();
    if (!user) return false;

    const topic = allTopics.find(t => t.id === topicId);
    if (!topic) return false;

    const index = topic.replies.findIndex(r => r.id === replyId);
    if (index === -1) return false;

    if (topic.replies[index].author.id !== user.id) {
      notificationService.warning('只能删除自己的回复');
      return false;
    }

    const confirmed = await notificationService.confirm({
      title: '确认删除',
      message: '确定要删除这条回复吗？',
      confirmText: '确定',
      cancelText: '取消'
    });

    if (confirmed) {
      topic.replies.splice(index, 1);
      storage.set(TOPICS_KEY, allTopics);
      notificationService.success('回复已删除');
      return true;
    }
    return false;
  };

  const awardPoints = (userId, points, reason) => {
    const userPoints = storage.get(USER_POINTS_KEY, {});
    if (!userPoints[userId]) {
      userPoints[userId] = { total: 0, history: [] };
    }
    userPoints[userId].total += points;
    userPoints[userId].history.unshift({
      points,
      reason,
      timestamp: new Date().toISOString()
    });
    storage.set(USER_POINTS_KEY, userPoints);
  };

  const openNewTopicModal = () => {
    const user = getCurrentUserInfo();
    if (!user) { notificationService.warning('请先登录'); return; }

    const modalContent = `
      <div class="forum-modal">
        <h2>发布新主题</h2>
        <form id="new-topic-form">
          <label>选择分类
            <select name="category" required>
              ${CATEGORIES.map(cat => `<option value="${cat.id}">${cat.icon} ${escapeHtml(cat.name)}</option>`).join('')}
            </select>
          </label>
          <label>标题
            <input type="text" name="title" placeholder="简洁明了的标题..." maxlength="100" required />
          </label>
          <label>内容
            <textarea name="content" rows="8" placeholder="详细描述你的问题或想法..." required></textarea>
          </label>
          <div class="form-actions">
            <button type="submit" class="btn primary">发布</button>
            <button type="button" class="btn ghost" onclick="window.forumModule.closeModal()">取消</button>
          </div>
        </form>
      </div>
    `;

    modal.open(modalContent);

    document.getElementById('new-topic-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      createTopic(fd.get('category'), fd.get('title'), fd.get('content'));
      modal.close();
      render();
      createNotification('主题发布成功！获得 10 积分');
    });
  };

  const openTopicDetail = (topicId) => {
    const topic = allTopics.find(t => t.id === topicId);
    if (!topic) return;

    increaseViews(topicId);

    const user = getCurrentUserInfo();
    const canDelete = user && topic.author.id === user.id;

    const modalContent = `
      <div class="topic-detail">
        <div class="topic-header">
          <div class="topic-category">
            ${CATEGORIES.find(c => c.id === topic.category)?.icon || ''}
            ${escapeHtml(CATEGORIES.find(c => c.id === topic.category)?.name || '')}
          </div>
          <h2>${escapeHtml(topic.title)}</h2>
          <div class="topic-meta">
            <img src="${escapeHtml(topic.author.avatar)}" alt="${escapeHtml(topic.author.nickname)}" class="user-avatar-small">
            <span class="author-name">${escapeHtml(topic.author.nickname)}</span>
            <span class="user-level">${escapeHtml(topic.author.level)}</span>
            <span class="topic-time">${formatTime(topic.createdAt)}</span>
            <span class="topic-views">👁️ ${topic.views}</span>
          </div>
        </div>

        <div class="topic-content">
          <p>${escapeHtml(topic.content)}</p>
        </div>

        <div class="topic-actions">
          <button class="btn-icon-text" onclick="window.forumModule.likeTopic('${escapeHtml(topic.id)}')">
            ❤️ ${topic.likes}
          </button>
          ${canDelete ? `<button class="btn-icon-text danger" onclick="window.forumModule.deleteTopic('${escapeHtml(topic.id)}')">🗑️ 删除</button>` : ''}
        </div>

        <div class="topic-replies">
          <h3>回复 (${topic.replies.length})</h3>
          <div class="replies-list">
            ${topic.replies.map(reply => {
              const canDeleteReply = user && reply.author.id === user.id;
              return `
                <div class="reply-item">
                  <img src="${escapeHtml(reply.author.avatar)}" alt="${escapeHtml(reply.author.nickname)}" class="user-avatar-small">
                  <div class="reply-content">
                    <div class="reply-header">
                      <span class="author-name">${escapeHtml(reply.author.nickname)}</span>
                      <span class="user-level">${escapeHtml(reply.author.level)}</span>
                      <span class="reply-time">${formatTime(reply.createdAt)}</span>
                    </div>
                    <p>${escapeHtml(reply.content)}</p>
                    <div class="reply-actions">
                      <button class="btn-text-small" onclick="window.forumModule.likeReply('${escapeHtml(topic.id)}', '${escapeHtml(reply.id)}')">
                        ❤️ ${reply.likes}
                      </button>
                      ${canDeleteReply ? `<button class="btn-text-small danger" onclick="window.forumModule.deleteReply('${escapeHtml(topic.id)}', '${escapeHtml(reply.id)}')">删除</button>` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          ${user ? `
            <form class="reply-form" id="reply-form">
              <textarea name="content" rows="4" placeholder="写下你的回复..." required></textarea>
              <button type="submit" class="btn primary">发表回复</button>
            </form>
          ` : '<div class="login-prompt"><p>登录后才能回复</p></div>'}
        </div>
      </div>
    `;

    modal.open(modalContent);

    if (user) {
      document.getElementById('reply-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        addReply(topicId, fd.get('content'));
        openTopicDetail(topicId);
        createNotification('回复成功！获得 5 积分');
      });
    }
  };

  const createNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'forum-notification';
    notification.textContent = message;
    notification.style.cssText = 'position:fixed;top:80px;right:20px;background:rgba(67,233,123,0.9);color:#0F1B2A;padding:12px 20px;border-radius:8px;font-weight:500;z-index:10000;animation:slideInRight 0.3s ease;';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const getFilteredTopics = () => {
    let topics = [...allTopics];
    if (currentCategory !== 'all') topics = topics.filter(t => t.category === currentCategory);
    if (searchInput && searchInput.value) {
      const kw = searchInput.value.toLowerCase();
      topics = topics.filter(t => t.title.toLowerCase().includes(kw) || t.content.toLowerCase().includes(kw));
    }

    switch (currentSort) {
      case 'latest': topics.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'hot': topics.sort((a, b) => b.views - a.views); break;
      case 'replies': topics.sort((a, b) => b.replies.length - a.replies.length); break;
    }

    topics.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    return topics;
  };

  const render = () => {
    if (!container) return;
    const topics = getFilteredTopics();

    if (topics.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无主题</p><p class="muted">成为第一个发帖的人吧！</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="topics-list">
        ${topics.map(topic => {
          const category = CATEGORIES.find(c => c.id === topic.category);
          return `
            <div class="topic-item ${topic.isPinned ? 'pinned' : ''} ${topic.isHighlighted ? 'highlighted' : ''}" onclick="window.forumModule.openTopicDetail('${escapeHtml(topic.id)}')">
              <div class="topic-item-header">
                <span class="topic-category-tag">${category?.icon || ''} ${escapeHtml(category?.name || '')}</span>
                ${topic.isPinned ? '<span class="topic-pin-tag">📌 置顶</span>' : ''}
                ${topic.isHighlighted ? '<span class="topic-highlight-tag">⭐ 精华</span>' : ''}
              </div>
              <h3 class="topic-title">${escapeHtml(topic.title)}</h3>
              <p class="topic-excerpt">${escapeHtml(topic.content.slice(0, 100))}${topic.content.length > 100 ? '...' : ''}</p>
              <div class="topic-footer">
                <div class="topic-author">
                  <img src="${escapeHtml(topic.author.avatar)}" alt="${escapeHtml(topic.author.nickname)}" class="user-avatar-tiny">
                  <span>${escapeHtml(topic.author.nickname)}</span>
                </div>
                <div class="topic-stats">
                  <span>💬 ${topic.replies.length}</span>
                  <span>❤️ ${topic.likes}</span>
                  <span>👁️ ${topic.views}</span>
                  <span class="topic-time">${formatTime(topic.createdAt)}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  const switchCategory = (cat) => {
    currentCategory = cat;
    categoryBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.forumCategory === cat));
    render();
  };

  const switchSort = (sort) => {
    currentSort = sort;
    sortBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.forumSort === sort));
    render();
  };

  const init = () => {
    initData();
    categoryBtns.forEach(btn => btn.addEventListener('click', () => switchCategory(btn.dataset.forumCategory)));
    sortBtns.forEach(btn => btn.addEventListener('click', () => switchSort(btn.dataset.forumSort)));
    searchInput?.addEventListener('input', () => render());
    newTopicBtn?.addEventListener('click', () => openNewTopicModal());
    render();
  };

  window.forumModule = {
    openTopicDetail,
    likeTopic: (id) => { likeTopic(id); openTopicDetail(id); },
    likeReply: (tid, rid) => { likeReply(tid, rid); openTopicDetail(tid); },
    deleteTopic: (id) => { if (deleteTopic(id)) { modal.close(); render(); createNotification('主题已删除'); } },
    deleteReply: (tid, rid) => { if (deleteReply(tid, rid)) { openTopicDetail(tid); createNotification('回复已删除'); } },
    closeModal: () => modal.close()
  };

  return { init, render };
})();
