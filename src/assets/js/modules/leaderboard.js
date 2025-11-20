/**
 * 排行榜模块
 */

import { mockUsers } from '../data/mockUsers.js';
import { authService } from '../services/authService.js';

const escapeHtml = (text) => {
  const map = {'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#039;'};
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
};

export const leaderboardModule = (() => {
  let currentMetric = 'workouts';
  let currentPeriod = 'week';

  const container = document.getElementById('leaderboard-container');
  const metricBtns = document.querySelectorAll('[data-leaderboard-tab]');
  const periodBtns = document.querySelectorAll('[data-period]');

  const getRankingData = (metric) => {
    let sorted = [...mockUsers];
    switch (metric) {
      case 'workouts': sorted.sort((a, b) => b.totalWorkouts - a.totalWorkouts); break;
      case 'streak': sorted.sort((a, b) => b.streakDays - a.streakDays); break;
      case 'calories': sorted.sort((a, b) => b.totalCaloriesBurned - a.totalCaloriesBurned); break;
      case 'completion': sorted.sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0)); break;
    }
    return sorted.slice(0, 10);
  };

  const render = () => {
    if (!container) return;
    const data = getRankingData(currentMetric);
    const user = authService.currentUser();
    const currentUserId = user ? user.email : '';

    let metricLabel = { workouts: '训练次数', streak: '连续天数', calories: '消耗卡路里', completion: '完成率' }[currentMetric];

    container.innerHTML = `
      <div class="leaderboard-list">
        ${data.map((u, index) => {
          const rank = index + 1;
          const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
          const isCurrentUser = u.id === currentUserId;

          let scoreValue;
          switch (currentMetric) {
            case 'workouts': scoreValue = u.totalWorkouts; break;
            case 'streak': scoreValue = u.streakDays + ' 天'; break;
            case 'calories': scoreValue = (u.totalCaloriesBurned / 1000).toFixed(1) + 'k'; break;
            case 'completion': scoreValue = (u.completionRate || 85) + '%'; break;
          }

          return `
            <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
              <div class="rank-number ${rankClass}">${rank}</div>
              <div class="leaderboard-user">
                <img src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.nickname)}" class="leaderboard-avatar">
                <div class="leaderboard-user-info">
                  <h4>${escapeHtml(u.nickname)}</h4>
                  <span class="leaderboard-user-level">${escapeHtml(u.level)}</span>
                </div>
              </div>
              <div class="leaderboard-score">
                ${scoreValue}
                <span class="leaderboard-score-label">${metricLabel}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  const switchMetric = (metric) => {
    currentMetric = metric;
    metricBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.leaderboardTab === metric));
    render();
  };

  const switchPeriod = (period) => {
    currentPeriod = period;
    periodBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.period === period));
    render();
  };

  const init = () => {
    metricBtns.forEach(btn => btn.addEventListener('click', () => switchMetric(btn.dataset.leaderboardTab)));
    periodBtns.forEach(btn => btn.addEventListener('click', () => switchPeriod(btn.dataset.period)));
    render();
  };

  return { init, render };
})();
