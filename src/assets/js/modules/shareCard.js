/**
 * 社交分享卡片模块
 * 功能：生成训练成果分享文案和卡片
 */

import { storage } from '../services/storage.js';
import { authService } from '../services/authService.js';
import { socialShareService } from '../services/socialShareService.js';
import { modal } from './modal.js';
import { notificationService } from '../services/notificationService.js';

export const shareCardModule = (() => {
  /**
   * 获取用户统计数据
   */
  const getUserStats = () => {
    const user = authService.currentUser();
    if (!user) return null;

    const workouts = storage.get('workouts', []);
    const nutritionLog = storage.get('nutrition_log', []);
    const metricsHistory = storage.get('metrics_history', []);
    const checkin = storage.get('checkin_data', { streak: 0, lastCheckin: null, badges: [] });

    // 计算总训练次数
    const totalWorkouts = workouts.length;

    // 计算总消耗卡路里
    const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);

    // 计算连续天数
    const streakDays = checkin.streak || 0;

    // 获取体重变化
    let weightChange = 0;
    if (metricsHistory.length >= 2) {
      const latest = metricsHistory[metricsHistory.length - 1];
      const earliest = metricsHistory[0];
      weightChange = (earliest.weight - latest.weight).toFixed(1);
    }

    // 获取徽章数量
    const badgeCount = checkin.badges ? checkin.badges.length : 0;

    // 获取最常训练的部位
    const muscleCounts = {};
    workouts.forEach(w => {
      muscleCounts[w.muscle] = (muscleCounts[w.muscle] || 0) + 1;
    });
    const favoriteMuscle = Object.keys(muscleCounts).reduce((a, b) =>
      muscleCounts[a] > muscleCounts[b] ? a : b, '全身'
    );

    return {
      nickname: user.nickname || user.email,
      totalWorkouts,
      totalCalories,
      streakDays,
      weightChange,
      badgeCount,
      favoriteMuscle,
      totalDays: Math.ceil((Date.now() - new Date(user.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  /**
   * 生成分享文案
   */
  const generateShareText = () => {
    const stats = getUserStats();
    if (!stats) return '请先登录后再分享';

    const templates = [
      `💪 我在 FitSpark 已经坚持 ${stats.streakDays} 天了！
📊 完成 ${stats.totalWorkouts} 次训练
🔥 燃烧 ${(stats.totalCalories / 1000).toFixed(1)}k 卡路里
${stats.weightChange > 0 ? `⬇️ 减重 ${stats.weightChange} kg` : ''}
${stats.badgeCount > 0 ? `🏆 获得 ${stats.badgeCount} 个徽章` : ''}

坚持就是胜利！一起来健身吧 💪
#FitSpark #健身打卡 #${stats.favoriteMuscle}训练`,

      `🎯 我的健身成绩单 📈
✅ 训练天数：${stats.streakDays} 天
✅ 训练次数：${stats.totalWorkouts} 次
✅ 消耗热量：${(stats.totalCalories / 1000).toFixed(1)}k 卡
${stats.weightChange > 0 ? `✅ 体重变化：-${stats.weightChange} kg` : ''}
✅ 最爱训练：${stats.favoriteMuscle}

健身改变生活！🔥
#FitSpark #健身记录`,

      `📣 分享一下我的健身进展！

在 FitSpark 坚持了 ${stats.streakDays} 天
累计完成 ${stats.totalWorkouts} 次训练
燃烧了 ${(stats.totalCalories / 1000).toFixed(1)}k 卡路里
${stats.badgeCount > 0 ? `解锁了 ${stats.badgeCount} 个成就徽章` : ''}

每一滴汗水都不会白费 💧
每一次坚持都值得骄傲 ✨

#健身打卡 #FitSpark #坚持`
    ];

    // 随机选择一个模板
    return templates[Math.floor(Math.random() * templates.length)];
  };

  /**
   * 生成分享卡片（HTML版本）
   */
  const generateShareCard = () => {
    const stats = getUserStats();
    if (!stats) return '<p>暂无数据</p>';

    return `
      <div class="share-card" id="share-card-content">
        <div class="share-card-header">
          <h2>💪 我的健身成果</h2>
          <p class="share-card-subtitle">FitSpark 健身记录</p>
        </div>

        <div class="share-card-stats">
          <div class="share-stat-item">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">${stats.streakDays}</div>
            <div class="stat-label">连续天数</div>
          </div>
          <div class="share-stat-item">
            <div class="stat-icon">💪</div>
            <div class="stat-value">${stats.totalWorkouts}</div>
            <div class="stat-label">训练次数</div>
          </div>
          <div class="share-stat-item">
            <div class="stat-icon">⚡</div>
            <div class="stat-value">${(stats.totalCalories / 1000).toFixed(1)}k</div>
            <div class="stat-label">消耗卡路里</div>
          </div>
          ${stats.weightChange > 0 ? `
            <div class="share-stat-item">
              <div class="stat-icon">📉</div>
              <div class="stat-value">-${stats.weightChange}kg</div>
              <div class="stat-label">体重变化</div>
            </div>
          ` : ''}
        </div>

        ${stats.badgeCount > 0 ? `
          <div class="share-card-achievements">
            <p>🏆 解锁 ${stats.badgeCount} 个成就徽章</p>
          </div>
        ` : ''}

        <div class="share-card-footer">
          <p class="share-card-motto">坚持就是胜利 ✨</p>
          <p class="share-card-app">使用 FitSpark 记录你的健身旅程</p>
        </div>
      </div>
    `;
  };

  /**
   * 复制文本到剪贴板
   */
  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showNotification('✅ 文案已复制到剪贴板');
      }).catch(() => {
        fallbackCopyToClipboard(text);
      });
    } else {
      fallbackCopyToClipboard(text);
    }
  };

  /**
   * 降级复制方案
   */
  const fallbackCopyToClipboard = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showNotification('✅ 文案已复制到剪贴板');
    } catch (err) {
      showNotification('❌ 复制失败，请手动复制');
    }
    document.body.removeChild(textarea);
  };

  /**
   * 显示通知
   */
  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.textContent = message;
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
    setTimeout(() => notification.remove(), 3000);
  };

  /**
   * 打开分享模态框
   */
  const openShareModal = () => {
    const user = authService.currentUser();
    if (!user) {
      notificationService.warning('请先登录后再分享');
      return;
    }

    const shareText = generateShareText();
    const shareCard = generateShareCard();
    const stats = getUserStats();

    const modalContent = `
      <div class="share-modal">
        <h2>分享你的健身成果 🎉</h2>

        <div class="share-tabs">
          <button class="tab-btn active" data-share-tab="card">分享卡片</button>
          <button class="tab-btn" data-share-tab="text">分享文案</button>
          <button class="tab-btn" data-share-tab="social">社交分享</button>
        </div>

        <div class="share-content">
          <div class="share-tab-content active" data-share-content="card">
            ${shareCard}
            <div class="share-actions">
              <button class="btn primary" onclick="window.shareCardActions.copyCard()">📋 复制卡片文案</button>
              <button class="btn ghost" onclick="window.shareCardActions.downloadCard()">💾 下载图片（开发中）</button>
            </div>
          </div>

          <div class="share-tab-content" data-share-content="text">
            <textarea class="share-text-area" id="share-text-area" readonly>${shareText}</textarea>
            <div class="share-actions">
              <button class="btn primary" onclick="window.shareCardActions.copyText()">📋 复制文案</button>
              <button class="btn ghost" onclick="window.shareCardActions.regenerate()">🔄 换一个</button>
            </div>
          </div>

          <div class="share-tab-content" data-share-content="social">
            <div style="text-align: center; margin-bottom: 20px;">
              <p class="muted">选择平台分享你的健身成果</p>
            </div>
            <div class="quick-share-buttons" id="social-share-buttons">
              ${generateSocialShareButtons()}
            </div>
            <div class="share-actions" style="margin-top: 20px;">
              <button class="btn ghost" onclick="window.shareCardActions.shareAll()">📤 更多分享选项</button>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.open(modalContent);

    // 绑定标签切换
    document.querySelectorAll('[data-share-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.shareTab;
        document.querySelectorAll('[data-share-tab]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('[data-share-content]').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.querySelector(`[data-share-content="${tab}"]`).classList.add('active');
      });
    });

    // 绑定社交分享按钮
    bindSocialShareButtons(stats);
  };

  /**
   * 生成社交分享按钮
   */
  const generateSocialShareButtons = () => {
    const platforms = socialShareService.getPlatforms();
    return platforms.map(platform => `
      <button class="quick-share-btn"
              data-platform="${platform.id}"
              data-tooltip="${platform.name}"
              style="--platform-color: ${platform.color}">
        <span style="font-size: 24px;">${platform.icon}</span>
      </button>
    `).join('');
  };

  /**
   * 绑定社交分享按钮事件
   */
  const bindSocialShareButtons = (stats) => {
    document.querySelectorAll('.quick-share-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const platform = btn.dataset.platform;
        const shareContent = {
          title: `${stats.nickname}的健身成果 - FitSpark`,
          text: `💪 我在 FitSpark 已经坚持 ${stats.streakDays} 天了！
📊 完成 ${stats.totalWorkouts} 次训练
🔥 燃烧 ${(stats.totalCalories / 1000).toFixed(1)}k 卡路里
${stats.weightChange > 0 ? `⬇️ 减重 ${stats.weightChange} kg` : ''}
${stats.badgeCount > 0 ? `🏆 获得 ${stats.badgeCount} 个徽章` : ''}

坚持就是胜利！一起来健身吧 💪`,
          url: window.location.href,
          hashtags: ['FitSpark', '健身打卡', stats.favoriteMuscle + '训练']
        };

        socialShareService.shareToPlatform(platform, shareContent);
      });
    });
  };

  // 暴露到全局
  window.shareCardActions = {
    copyCard: () => {
      const cardText = document.getElementById('share-card-content').innerText;
      copyToClipboard(cardText);
    },
    copyText: () => {
      const text = document.getElementById('share-text-area').value;
      copyToClipboard(text);
    },
    regenerate: () => {
      const newText = generateShareText();
      document.getElementById('share-text-area').value = newText;
      showNotification('🔄 已生成新文案');
    },
    downloadCard: () => {
      showNotification('📸 图片下载功能开发中...');
    },
    shareAll: () => {
      const stats = getUserStats();
      if (!stats) {
        showNotification('❌ 无法获取统计数据');
        return;
      }
      const shareContent = {
        title: `${stats.nickname}的健身成果 - FitSpark`,
        text: `💪 我在 FitSpark 已经坚持 ${stats.streakDays} 天了！
📊 完成 ${stats.totalWorkouts} 次训练
🔥 燃烧 ${(stats.totalCalories / 1000).toFixed(1)}k 卡路里
${stats.weightChange > 0 ? `⬇️ 减重 ${stats.weightChange} kg` : ''}
${stats.badgeCount > 0 ? `🏆 获得 ${stats.badgeCount} 个徽章` : ''}

坚持就是胜利！一起来健身吧 💪`,
        url: window.location.href,
        hashtags: ['FitSpark', '健身打卡', stats.favoriteMuscle + '训练']
      };
      socialShareService.showShareMenu(shareContent);
    }
  };

  return {
    openShareModal,
    generateShareText,
    getUserStats
  };
})();
