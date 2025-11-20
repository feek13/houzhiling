/**
 * 社交媒体分享服务
 * 功能：将内容分享到各大社交平台
 */

import { storage } from './storage.js';
import { authService } from './authService.js';
import { eventBus, EventNames } from './eventBus.js';

// 社交平台配置
const SOCIAL_PLATFORMS = {
  twitter: {
    name: 'Twitter/X',
    icon: '🐦',
    color: '#1da1f2',
    shareUrl: 'https://twitter.com/intent/tweet'
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: '#1877f2',
    shareUrl: 'https://www.facebook.com/sharer/sharer.php'
  },
  weibo: {
    name: '微博',
    icon: '🔴',
    color: '#e6162d',
    shareUrl: 'https://service.weibo.com/share/share.php'
  },
  wechat: {
    name: '微信',
    icon: '💬',
    color: '#07c160',
    shareUrl: null // 需要显示二维码
  },
  qq: {
    name: 'QQ',
    icon: '🐧',
    color: '#12b7f5',
    shareUrl: 'https://connect.qq.com/widget/shareqq/index.html'
  },
  email: {
    name: '邮件',
    icon: '📧',
    color: '#ea4335',
    shareUrl: 'mailto:'
  },
  copylink: {
    name: '复制链接',
    icon: '🔗',
    color: '#6c757d',
    shareUrl: null // 复制到剪贴板
  }
};

export const socialShareService = (() => {
  /**
   * 分享到 Twitter
   * @param {Object} content - 分享内容
   */
  const shareToTwitter = (content) => {
    const params = new URLSearchParams({
      text: content.text || '',
      url: content.url || window.location.href,
      hashtags: content.hashtags?.join(',') || 'FitSpark,健身'
    });

    const shareUrl = `${SOCIAL_PLATFORMS.twitter.shareUrl}?${params.toString()}`;
    window.open(shareUrl, '_blank', 'width=550,height=420');

    logShare('twitter', content);
  };

  /**
   * 分享到 Facebook
   * @param {Object} content - 分享内容
   */
  const shareToFacebook = (content) => {
    const params = new URLSearchParams({
      u: content.url || window.location.href,
      quote: content.text || ''
    });

    const shareUrl = `${SOCIAL_PLATFORMS.facebook.shareUrl}?${params.toString()}`;
    window.open(shareUrl, '_blank', 'width=550,height=420');

    logShare('facebook', content);
  };

  /**
   * 分享到微博
   * @param {Object} content - 分享内容
   */
  const shareToWeibo = (content) => {
    const params = new URLSearchParams({
      title: content.title || 'FitSpark 健身',
      url: content.url || window.location.href,
      pic: content.image || '',
      appkey: '' // 需要微博开放平台 appkey
    });

    const shareUrl = `${SOCIAL_PLATFORMS.weibo.shareUrl}?${params.toString()}`;
    window.open(shareUrl, '_blank', 'width=550,height=420');

    logShare('weibo', content);
  };

  /**
   * 分享到微信（显示二维码）
   * @param {Object} content - 分享内容
   */
  const shareToWechat = (content) => {
    const shareUrl = content.url || window.location.href;

    // 显示二维码提示
    const message = `
      <div class="wechat-share-modal">
        <h3>💬 分享到微信</h3>
        <p class="muted">扫描下方二维码分享到微信</p>
        <div class="qrcode-placeholder">
          <div class="qr-icon">📱</div>
          <p>二维码功能需要服务端支持</p>
          <p class="muted">请复制链接手动分享：</p>
          <input type="text" value="${shareUrl}" readonly onclick="this.select()" />
        </div>
        <button class="btn ghost" onclick="window.socialShareActions.closeModal()">关闭</button>
      </div>
    `;

    // 这里应该生成真实的二维码，需要 QRCode.js 库
    // 暂时显示占位符
    showShareModal(message);

    logShare('wechat', content);
  };

  /**
   * 分享到 QQ
   * @param {Object} content - 分享内容
   */
  const shareToQQ = (content) => {
    const params = new URLSearchParams({
      url: content.url || window.location.href,
      title: content.title || 'FitSpark 健身',
      desc: content.text || '',
      summary: content.summary || '',
      pics: content.image || ''
    });

    const shareUrl = `${SOCIAL_PLATFORMS.qq.shareUrl}?${params.toString()}`;
    window.open(shareUrl, '_blank', 'width=550,height=420');

    logShare('qq', content);
  };

  /**
   * 分享到邮件
   * @param {Object} content - 分享内容
   */
  const shareToEmail = (content) => {
    const subject = encodeURIComponent(content.title || 'FitSpark 健身分享');
    const body = encodeURIComponent(`
${content.text || ''}

${content.url || window.location.href}

来自 FitSpark 健身平台
    `.trim());

    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;

    logShare('email', content);
  };

  /**
   * 复制分享链接
   * @param {Object} content - 分享内容
   */
  const copyShareLink = async (content) => {
    const shareUrl = content.url || window.location.href;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showNotification('✅ 链接已复制到剪贴板', 'success');
      } else {
        // 降级方案
        fallbackCopyToClipboard(shareUrl);
      }

      logShare('copylink', content);
    } catch (error) {
      console.error('[SocialShare] 复制失败:', error);
      showNotification('❌ 复制失败', 'error');
    }
  };

  /**
   * 降级复制方法
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
      showNotification('✅ 链接已复制到剪贴板', 'success');
    } catch (error) {
      console.error('[SocialShare] 降级复制失败:', error);
      showNotification('❌ 复制失败', 'error');
    }

    document.body.removeChild(textarea);
  };

  /**
   * 使用 Web Share API（移动端）
   * @param {Object} content - 分享内容
   */
  const nativeShare = async (content) => {
    if (!navigator.share) {
      console.warn('[SocialShare] Web Share API 不支持');
      return false;
    }

    try {
      await navigator.share({
        title: content.title || 'FitSpark 健身',
        text: content.text || '',
        url: content.url || window.location.href
      });

      logShare('native', content);
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[SocialShare] 原生分享失败:', error);
      }
      return false;
    }
  };

  /**
   * 智能分享（优先使用原生分享）
   * @param {Object} content - 分享内容
   */
  const smartShare = async (content) => {
    // 移动端优先使用原生分享
    if (isMobile() && await nativeShare(content)) {
      return;
    }

    // 否则显示分享菜单
    showShareMenu(content);
  };

  /**
   * 显示分享菜单
   * @param {Object} content - 分享内容
   */
  const showShareMenu = (content) => {
    const platforms = Object.keys(SOCIAL_PLATFORMS);

    const menuHTML = `
      <div class="social-share-menu">
        <h3>📤 分享到</h3>
        <div class="share-platforms">
          ${platforms.map(key => {
            const platform = SOCIAL_PLATFORMS[key];
            return `
              <button class="share-platform-btn"
                      data-platform="${key}"
                      style="--platform-color: ${platform.color}">
                <span class="platform-icon">${platform.icon}</span>
                <span class="platform-name">${platform.name}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    showShareModal(menuHTML);

    // 绑定点击事件
    const buttons = document.querySelectorAll('.share-platform-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const platform = btn.dataset.platform;
        shareToPlatform(platform, content);
      });
    });
  };

  /**
   * 分享到指定平台
   * @param {string} platform - 平台名称
   * @param {Object} content - 分享内容
   */
  const shareToPlatform = (platform, content) => {
    const shareActions = {
      twitter: shareToTwitter,
      facebook: shareToFacebook,
      weibo: shareToWeibo,
      wechat: shareToWechat,
      qq: shareToQQ,
      email: shareToEmail,
      copylink: copyShareLink
    };

    const action = shareActions[platform];
    if (action) {
      action(content);
    } else {
      console.error(`[SocialShare] 未知的分享平台: ${platform}`);
    }
  };

  /**
   * 生成训练成果分享内容
   * @param {Object} workout - 训练数据
   * @returns {Object} 分享内容
   */
  const generateWorkoutShareContent = (workout) => {
    const user = authService.currentUser();
    const nickname = user?.nickname || '健身爱好者';

    return {
      title: `${nickname}的健身成果 - FitSpark`,
      text: `💪 刚完成了${workout.muscle || ''}训练！
⏱ 用时 ${workout.duration || 0} 分钟
🔥 消耗 ${workout.calories || 0} 卡路里

和我一起健身吧！`,
      url: window.location.href,
      hashtags: ['FitSpark', '健身', workout.muscle || '训练'],
      image: workout.image || ''
    };
  };

  /**
   * 生成健康报告分享内容
   * @param {Object} report - 报告数据
   * @returns {Object} 分享内容
   */
  const generateReportShareContent = (report) => {
    const user = authService.currentUser();
    const nickname = user?.nickname || '健身爱好者';

    return {
      title: `${nickname}的健康报告 - FitSpark`,
      text: `📊 我的健康评分: ${report.scores.overall}/100

✅ 已完成 ${report.stats.totalWorkouts} 次训练
🔥 累计消耗 ${Math.round(report.stats.totalCalories)} 卡路里
💪 BMI指数: ${report.stats.bmi} (${report.stats.bmiCategory.text})

一起来健身吧！`,
      url: window.location.href,
      hashtags: ['FitSpark', '健康报告', '健身成果']
    };
  };

  /**
   * 记录分享事件
   */
  const logShare = (platform, content) => {
    const shareLog = storage.get('share_log', []);
    shareLog.push({
      platform,
      content,
      timestamp: new Date().toISOString(),
      userId: authService.currentUser()?.id
    });

    // 只保留最近100条记录
    if (shareLog.length > 100) {
      shareLog.shift();
    }

    storage.save('share_log', shareLog);

    // 发布分享事件
    eventBus.emit(EventNames.NOTIFICATION_SHOW, {
      type: 'info',
      message: `已分享到 ${SOCIAL_PLATFORMS[platform]?.name || platform}`
    });

    console.log(`[SocialShare] 分享到 ${platform}:`, content);
  };

  /**
   * 显示分享模态框
   */
  const showShareModal = (content) => {
    // 使用现有的 modal 模块
    if (window.modal) {
      window.modal.open(content);
    }
  };

  /**
   * 显示通知
   */
  const showNotification = (message, type = 'info') => {
    eventBus.emit(EventNames.NOTIFICATION_SHOW, { message, type });
  };

  /**
   * 判断是否为移动设备
   */
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  /**
   * 获取分享统计
   */
  const getShareStats = () => {
    const shareLog = storage.get('share_log', []);

    const stats = {
      total: shareLog.length,
      byPlatform: {},
      recent: shareLog.slice(-10)
    };

    shareLog.forEach(log => {
      stats.byPlatform[log.platform] = (stats.byPlatform[log.platform] || 0) + 1;
    });

    return stats;
  };

  /**
   * 获取支持的平台列表
   */
  const getPlatforms = () => {
    return Object.keys(SOCIAL_PLATFORMS).map(key => ({
      id: key,
      ...SOCIAL_PLATFORMS[key]
    }));
  };

  // 全局操作方法
  window.socialShareActions = {
    closeModal: () => {
      if (window.modal) {
        window.modal.close();
      }
    }
  };

  return {
    shareToTwitter,
    shareToFacebook,
    shareToWeibo,
    shareToWechat,
    shareToQQ,
    shareToEmail,
    copyShareLink,
    nativeShare,
    smartShare,
    showShareMenu,
    shareToPlatform,
    generateWorkoutShareContent,
    generateReportShareContent,
    getShareStats,
    getPlatforms,
    isMobile
  };
})();
