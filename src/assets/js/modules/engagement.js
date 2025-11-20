import { storage } from '../services/storage.js';
import { notificationService } from '../services/notificationService.js';

const GOAL_KEY = 'goal_progress';
const CHECKIN_KEY = 'checkins';

const badgeRules = [
  { label: '3 日火花', threshold: 3 },
  { label: '7 日连胜', threshold: 7 },
  { label: '21 日铁粉', threshold: 21 },
];

export const engagementModule = (() => {
  const goalForm = document.getElementById('goal-form');
  const goalCircle = document.getElementById('goal-circle');
  const goalPercent = document.getElementById('goal-percent');
  const goalText = document.getElementById('goal-text');
  const checkinBtn = document.getElementById('checkin-btn');
  const streakText = document.getElementById('streak-text');
  const badgeList = document.getElementById('badge-list');
  const socialFeed = document.getElementById('social-feed');
  const shareBtn = document.getElementById('share-progress');

  const renderGoal = () => {
    const goal = storage.get(GOAL_KEY, { monthlyTarget: 0, completed: 0 });
    if (!goal.monthlyTarget) {
      goalCircle.style.setProperty('--percent', 0);
      goalPercent.textContent = '0%';
      goalText.textContent = '设置目标后查看进度';
      return;
    }
    const percent = Math.min(100, Math.round((goal.completed / goal.monthlyTarget) * 100));
    goalCircle.style.setProperty('--percent', percent);
    goalPercent.textContent = `${percent}%`;
    goalText.textContent = `本月目标 ${goal.monthlyTarget} 次，已完成 ${goal.completed} 次`;
  };

  const renderStreak = () => {
    const record = storage.get(CHECKIN_KEY, { streak: 0, lastDate: null });
    streakText.textContent = `已连续 ${record.streak} 天`;
    badgeList.innerHTML = badgeRules
      .map(
        (badge) => `
        <li class="badge-item ${record.streak >= badge.threshold ? 'active' : ''}">
          ${badge.label}
        </li>
      `
      )
      .join('');
    if (record.lastDate === new Date().toDateString()) {
      checkinBtn.disabled = true;
      checkinBtn.textContent = '已签到';
    } else {
      checkinBtn.disabled = false;
      checkinBtn.textContent = '今日签到';
    }
  };

  const renderSocial = () => {
    if (!socialFeed) return;
    const demo = [
      { name: 'Lina', text: '完成 HIIT 训练，出汗好开心！', likes: 24 },
      { name: 'Ken', text: '今日步数 11000，继续冲刺减脂。', likes: 18 },
      { name: '阿哲', text: '硬拉 PB +5kg，感谢伙伴鼓励。', likes: 33 },
    ];
    socialFeed.innerHTML = demo
      .map(
        (item) => `
        <li>
          <strong>${item.name}</strong>
          <p>${item.text}</p>
          <span>❤ ${item.likes}</span>
        </li>
      `
      )
      .join('');
  };

  const shareProgress = () => {
    const goal = storage.get(GOAL_KEY, { monthlyTarget: 0, completed: 0 });
    const record = storage.get(CHECKIN_KEY, { streak: 0 });
    const text = `#FitSpark# ${record.streak} 天连续训练，完成 ${goal.completed}/${goal.monthlyTarget} 次，快加入我的计划！`;
    navigator.clipboard?.writeText(text).catch(() => {});
    notificationService.alert({
      title: '分享成功',
      message: '已生成分享文案，可直接粘贴到朋友圈：\n' + text,
      type: 'success'
    });
  };

  const init = () => {
    renderGoal();
    renderStreak();
    renderSocial();

    goalForm?.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const data = Object.fromEntries(new FormData(goalForm));
      const payload = {
        monthlyTarget: Number(data.monthlyTarget) || 0,
        completed: Number(data.completed) || 0,
      };
      storage.set(GOAL_KEY, payload);
      renderGoal();
    });

    checkinBtn?.addEventListener('click', () => {
      const record = storage.get(CHECKIN_KEY, { streak: 0, lastDate: null });
      const today = new Date().toDateString();
      if (record.lastDate === today) return;
      const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toDateString();
      record.streak = record.lastDate === yesterday ? record.streak + 1 : 1;
      record.lastDate = today;
      storage.set(CHECKIN_KEY, record);
      renderStreak();
    });

    shareBtn?.addEventListener('click', shareProgress);
  };

  return { init };
})();
