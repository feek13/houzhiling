/**
 * HomeView.js - 欢迎页视图
 */

import { authService } from '../services/authService.js';

import { storage } from '../services/storage.js';

export const HomeView = {
  template: () => {
    const currentUser = authService.currentUser();
    const ctaButton = currentUser
      ? `<a href="/training" data-link class="btn primary">开始训练</a>`
      : `<a href="/auth" data-link class="btn primary">立即注册</a>`;

    return `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <p class="eyebrow">健身爱好者教学网站</p>
          <h1>用数据与教学驱动每一步训练</h1>
          <p>
            BMI 计算、训练与营养跟踪于一体的 Web 平台，帮助你构建完整的健身计划。
          </p>
          <div class="hero-cta">
            ${ctaButton}
            <a href="/roadmap" data-link class="btn ghost">查看规划</a>
          </div>
          <ul class="hero-stats">
            <li>
              <span>4</span>
              核心模块
            </li>
            <li>
              <span>12+</span>
              计划模板
            </li>
            <li>
              <span>24/7</span>
              训练指导
            </li>
          </ul>
        </div>
        <div class="hero-visual">
          <div class="glass-card">
            <h3>今日进度</h3>
            <p>燃脂组 · 45min</p>
            <div class="progress">
              <div class="progress-bar" style="width: 68%"></div>
            </div>
            <ul>
              <li><strong>BMI</strong><span id="home-bmi">--</span></li>
              <li><strong>热量</strong><span id="home-calories">--</span></li>
              <li><strong>连续签到</strong><span id="home-streak">--</span></li>
            </ul>
          </div>
          <div class="glass-card secondary">
            <h4>接下来</h4>
            <p>胸背力量 · 30 min</p>
            <p class="muted">包含 6 个动作 · 中等强度</p>
          </div>
        </div>
      </div>
    </section>
  `;
  },

  mount: async () => {
    console.log('HomeView mounted');
    const currentUser = authService.currentUser();

    const bmiEl = document.getElementById('home-bmi');
    const caloriesEl = document.getElementById('home-calories');
    const streakEl = document.getElementById('home-streak');

    if (!bmiEl || !caloriesEl || !streakEl) return;

    if (currentUser) {
      // 1. 计算 BMI
      if (currentUser.height && currentUser.weight) {
        const h = currentUser.height / 100;
        const bmi = (currentUser.weight / (h * h)).toFixed(1);
        bmiEl.textContent = bmi;
      } else {
        bmiEl.textContent = '--';
      }

      // 2. 获取今日热量消耗
      const workouts = storage.get('workouts', []);
      const today = new Date().toDateString();
      const todayCalories = workouts
        .filter(w => w.userId === currentUser.id && new Date(w.date).toDateString() === today)
        .reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      caloriesEl.textContent = `${Math.round(todayCalories)} kcal`;

      // 3. 获取连续签到
      const checkinData = storage.get('checkins', { streak: 0 });
      // 注意：这里假设 checkins 是全局对象，如果按用户隔离需要调整，但目前 userProfile.js 也是直接读取
      const streak = checkinData.streak || 0;
      streakEl.textContent = `${streak} 天`;

    } else {
      // 未登录显示演示数据
      bmiEl.textContent = '21.5';
      caloriesEl.textContent = '1280 kcal';
      streakEl.textContent = '5 天';
    }
  },

  unmount: () => {
    console.log('HomeView unmounted');
  }
};

export default HomeView;
