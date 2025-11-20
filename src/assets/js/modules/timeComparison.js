/**
 * 时间对比分析模块
 * 功能：对比不同时间段的训练数据，了解进步趋势
 */

import { storage } from '../services/storage.js';
import { authService } from '../services/authService.js';
import { eventBus, EventNames } from '../services/eventBus.js';

export const timeComparisonModule = (() => {
  let currentPeriod = 'week';
  let chart = null;

  const statsContainer = document.getElementById('comparison-stats');
  const chartCanvas = document.getElementById('comparison-chart');
  const periodBtns = document.querySelectorAll('[data-comparison-period]');

  const getWorkouts = () => {
    const user = authService.currentUser();
    if (!user) return [];
    return storage.get('workouts', []).filter(w => w.userId === user.id);
  };

  const getDateRange = (period) => {
    const now = new Date();
    const current = { start: new Date(), end: now };
    const previous = { start: new Date(), end: new Date() };
    switch (period) {
      case 'week':
        current.start.setDate(now.getDate() - 7);
        previous.start.setDate(now.getDate() - 14);
        previous.end.setDate(now.getDate() - 7);
        break;
      case 'month':
        current.start.setMonth(now.getMonth() - 1);
        previous.start.setMonth(now.getMonth() - 2);
        previous.end.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        current.start.setFullYear(now.getFullYear() - 1);
        previous.start.setFullYear(now.getFullYear() - 2);
        previous.end.setFullYear(now.getFullYear() - 1);
        break;
    }
    return { current, previous };
  };

  const filterWorkoutsByDateRange = (workouts, start, end) => {
    return workouts.filter(w => {
      const date = new Date(w.date);
      return date >= start && date <= end;
    });
  };

  const calculateStats = (workouts) => {
    if (workouts.length === 0) {
      return { count: 0, totalDuration: 0, totalCalories: 0, avgDuration: 0, avgCalories: 0 };
    }
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    return { count: workouts.length, totalDuration, totalCalories, avgDuration: Math.round(totalDuration / workouts.length), avgCalories: Math.round(totalCalories / workouts.length) };
  };

  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const renderStats = () => {
    if (!statsContainer) return;
    const workouts = getWorkouts();
    const ranges = getDateRange(currentPeriod);
    const currentWorkouts = filterWorkoutsByDateRange(workouts, ranges.current.start, ranges.current.end);
    const previousWorkouts = filterWorkoutsByDateRange(workouts, ranges.previous.start, ranges.previous.end);
    const currentStats = calculateStats(currentWorkouts);
    const previousStats = calculateStats(previousWorkouts);
    const changes = { count: calculateChange(currentStats.count, previousStats.count), duration: calculateChange(currentStats.totalDuration, previousStats.totalDuration), calories: calculateChange(currentStats.totalCalories, previousStats.totalCalories) };
    const periodLabels = { week: '本周', month: '本月', year: '今年' };
    const previousLabels = { week: '上周', month: '上月', year: '去年' };
    statsContainer.innerHTML = `<div class="stats-grid"><div class="stat-card"><div class="stat-label">训练次数</div><div class="stat-value">${currentStats.count}</div><div class="stat-change ${changes.count>=0?'positive':'negative'}">${changes.count>=0?'↑':'↓'} ${Math.abs(changes.count)}% vs ${previousLabels[currentPeriod]}</div></div><div class="stat-card"><div class="stat-label">总时长（分钟）</div><div class="stat-value">${currentStats.totalDuration}</div><div class="stat-change ${changes.duration>=0?'positive':'negative'}">${changes.duration>=0?'↑':'↓'} ${Math.abs(changes.duration)}% vs ${previousLabels[currentPeriod]}</div></div><div class="stat-card"><div class="stat-label">总卡路里</div><div class="stat-value">${currentStats.totalCalories}</div><div class="stat-change ${changes.calories>=0?'positive':'negative'}">${changes.calories>=0?'↑':'↓'} ${Math.abs(changes.calories)}% vs ${previousLabels[currentPeriod]}</div></div></div>`;
  };

  const renderChart = () => {
    if (!chartCanvas) return;
    const workouts = getWorkouts();
    const ranges = getDateRange(currentPeriod);
    const currentWorkouts = filterWorkoutsByDateRange(workouts, ranges.current.start, ranges.current.end);
    const previousWorkouts = filterWorkoutsByDateRange(workouts, ranges.previous.start, ranges.previous.end);
    const currentStats = calculateStats(currentWorkouts);
    const previousStats = calculateStats(previousWorkouts);
    const ctx = chartCanvas.getContext('2d');
    if (chart) chart.destroy();
    const periodLabels = { week: '本周', month: '本月', year: '今年' };
    const previousLabels = { week: '上周', month: '上月', year: '去年' };
    if (typeof Chart !== 'undefined') {
      chart = new Chart(ctx, { type: 'bar', data: { labels: ['训练次数', '总时长', '总卡路里'], datasets: [{ label: previousLabels[currentPeriod], data: [previousStats.count, previousStats.totalDuration/10, previousStats.totalCalories/100], backgroundColor: 'rgba(150,150,150,0.5)', borderColor: 'rgba(150,150,150,1)', borderWidth: 1 }, { label: periodLabels[currentPeriod], data: [currentStats.count, currentStats.totalDuration/10, currentStats.totalCalories/100], backgroundColor: 'rgba(75,192,192,0.5)', borderColor: 'rgba(75,192,192,1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true } } } });
    } else {
      ctx.font = '16px Arial'; ctx.fillStyle = '#666'; ctx.textAlign = 'center';
      ctx.fillText('图表功能需要 Chart.js 库', chartCanvas.width/2, chartCanvas.height/2);
    }
  };

  const handlePeriodChange = (e) => {
    currentPeriod = e.currentTarget.dataset.comparisonPeriod;
    periodBtns.forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    render();
  };

  const initEventListeners = () => {
    periodBtns.forEach(btn => btn.addEventListener('click', handlePeriodChange));
    eventBus.on(EventNames.WORKOUT_COMPLETED, () => render());
  };

  const render = () => { renderStats(); renderChart(); };
  const init = () => { render(); initEventListeners(); };

  return { init, render };
})();
