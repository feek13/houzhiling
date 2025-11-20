/**
 * 数据分析模块 - 简化版
 */

import { storage } from '../services/storage.js';
import { fitnessAssessmentService } from '../services/fitnessAssessmentService.js';

export const analyticsModule = (() => {
  const charts = {};

  const createWeightChart = () => {
    const canvas = document.getElementById('weight-trend-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    // 从当前用户的数据中读取体重历史
    const users = storage.get('users', []);
    const session = storage.get('session');

    if (!session || !session.userId) {
      canvas.parentElement.innerHTML = '<div class="chart-empty-state"><p>暂无体重数据</p><p class="muted">请先登录</p></div>';
      return;
    }

    const currentUser = users.find(u => u.id === session.userId);
    const metricsHistory = currentUser?.metricsHistory || [];

    // 获取最近30条记录
    const data = metricsHistory.slice(-30);

    if (data.length === 0) {
      canvas.style.display = 'none';
      const emptyState = document.createElement('div');
      emptyState.className = 'chart-empty-state';

      const message = document.createElement('p');
      message.textContent = '暂无体重数据';

      const hint = document.createElement('p');
      hint.className = 'muted';
      hint.textContent = '在"身体数据"页面记录体重';

      emptyState.appendChild(message);
      emptyState.appendChild(hint);

      canvas.parentElement.appendChild(emptyState);
      return;
    }

    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    charts.weightChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => new Date(d.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: '体重 (kg)',
          data: data.map(d => d.weight),
          borderColor: '#43e97b',
          backgroundColor: 'rgba(67, 233, 123, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#43e97b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `体重: ${context.parsed.y.toFixed(1)} kg`;
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: 'rgba(255,255,255,0.7)',
              callback: function(value) {
                return value + ' kg';
              }
            },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          x: {
            ticks: { color: 'rgba(255,255,255,0.7)' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });
  };

  const createWorkoutChart = () => {
    const canvas = document.getElementById('workout-distribution-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const workouts = storage.get('workouts', []);
    if (workouts.length === 0) {
      canvas.parentElement.innerHTML = '<div class="chart-empty-state"><p>暂无训练数据</p></div>';
      return;
    }

    const distribution = {};
    workouts.forEach(w => {
      distribution[w.muscle] = (distribution[w.muscle] || 0) + 1;
    });

    const ctx = canvas.getContext('2d');
    charts.workoutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(distribution),
        datasets: [{
          data: Object.values(distribution),
          backgroundColor: ['#43e97b', '#38d2a0', '#2dbbc4', '#22a4e8', '#178dff']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: 'rgba(255,255,255,0.8)' } } }
      }
    });
  };

  const createNutritionChart = () => {
    const canvas = document.getElementById('nutrition-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    // 获取当前用户的营养记录
    const session = storage.get('session');
    if (!session || !session.userId) {
      canvas.style.display = 'none';
      const emptyState = document.createElement('div');
      emptyState.className = 'chart-empty-state';
      const message = document.createElement('p');
      message.textContent = '暂无营养数据';
      emptyState.appendChild(message);
      canvas.parentElement.appendChild(emptyState);
      return;
    }

    // 尝试从两个可能的键名读取营养数据
    let allLogs = storage.get('nutrition', []);
    if (allLogs.length === 0) {
      allLogs = storage.get('nutrition_log', []);
    }

    // 过滤当前用户的记录并取最近7天
    const userLogs = allLogs
      .filter(l => l.userId === session.userId)
      .slice(-7);

    if (userLogs.length === 0) {
      canvas.style.display = 'none';
      const emptyState = document.createElement('div');
      emptyState.className = 'chart-empty-state';

      const message = document.createElement('p');
      message.textContent = '暂无营养数据';

      const hint = document.createElement('p');
      hint.className = 'muted';
      hint.textContent = '在"营养追踪"页面记录你的饮食';

      emptyState.appendChild(message);
      emptyState.appendChild(hint);

      canvas.parentElement.appendChild(emptyState);
      return;
    }

    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    charts.nutritionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: userLogs.map(l => new Date(l.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })),
        datasets: [
          {
            label: '蛋白质(g)',
            data: userLogs.map(l => l.protein || 0),
            backgroundColor: '#43e97b'
          },
          {
            label: '碳水(g)',
            data: userLogs.map(l => l.carbs || 0),
            backgroundColor: '#38d2a0'
          },
          {
            label: '脂肪(g)',
            data: userLogs.map(l => l.fat || 0),
            backgroundColor: '#2dbbc4'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: 'rgba(255,255,255,0.8)' }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}g`;
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: 'rgba(255,255,255,0.7)',
              callback: function(value) {
                return value + 'g';
              }
            },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          x: {
            ticks: { color: 'rgba(255,255,255,0.7)' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });
  };

  const createRadarChart = () => {
    const canvas = document.getElementById('fitness-radar-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    // 获取真实的健康评估数据
    const assessment = fitnessAssessmentService.generateAssessment();

    // 如果没有数据，显示提示信息
    if (!assessment.hasData) {
      const container = canvas.parentElement;
      container.innerHTML = '';

      const emptyState = document.createElement('div');
      emptyState.className = 'chart-empty-state';

      const title = document.createElement('h3');
      title.textContent = '健康评估';

      const subtitle = document.createElement('p');
      subtitle.className = 'muted';
      subtitle.textContent = '力量、耐力、柔韧性等多维度评估';

      const message = document.createElement('p');
      message.textContent = '暂无训练数据';

      const hint = document.createElement('p');
      hint.className = 'muted';
      hint.textContent = '完成一些训练后，系统将基于你的真实数据生成健康评估';

      emptyState.appendChild(title);
      emptyState.appendChild(subtitle);
      emptyState.appendChild(message);
      emptyState.appendChild(hint);
      container.appendChild(emptyState);
      return;
    }

    const ctx = canvas.getContext('2d');

    // 使用真实数据
    const radarData = [
      assessment.strength,
      assessment.endurance,
      assessment.flexibility,
      assessment.balance,
      assessment.speed,
      assessment.coordination
    ];

    charts.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['力量', '耐力', '柔韧性', '平衡', '速度', '协调'],
        datasets: [{
          label: '当前水平',
          data: radarData,
          borderColor: '#43e97b',
          backgroundColor: 'rgba(67, 233, 123, 0.2)',
          pointBackgroundColor: '#43e97b',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#43e97b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: 'rgba(255,255,255,0.8)' } },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.r}/100`;
              }
            }
          }
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              color: 'rgba(255,255,255,0.7)',
              backdropColor: 'transparent'
            },
            grid: { color: 'rgba(255,255,255,0.1)' },
            pointLabels: { color: 'rgba(255,255,255,0.8)' }
          }
        }
      }
    });

    // 在图表下方添加改进建议
    const recommendations = fitnessAssessmentService.getRecommendations(assessment);
    if (recommendations.length > 0) {
      const container = canvas.parentElement;

      const recommendationsDiv = document.createElement('div');
      recommendationsDiv.className = 'fitness-recommendations';
      recommendationsDiv.style.cssText = 'margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;';

      const recTitle = document.createElement('h4');
      recTitle.style.cssText = 'margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #43e97b;';
      recTitle.textContent = '改进建议';
      recommendationsDiv.appendChild(recTitle);

      recommendations.forEach(rec => {
        const recItem = document.createElement('div');
        recItem.style.marginBottom = '0.5rem';

        const recDimension = document.createElement('strong');
        recDimension.style.color = '#ffa62b';
        recDimension.textContent = `${rec.dimension} (${rec.score}分): `;

        const recTip = document.createElement('span');
        recTip.style.cssText = 'color: rgba(255,255,255,0.8); font-size: 0.85rem;';
        recTip.textContent = rec.tip;

        recItem.appendChild(recDimension);
        recItem.appendChild(recTip);
        recommendationsDiv.appendChild(recItem);
      });

      container.appendChild(recommendationsDiv);
    }
  };

  const createHeatmap = () => {
    const container = document.getElementById('activity-heatmap');
    if (!container) return;
    container.innerHTML = '<div class="chart-empty-state"><p>活动热力图</p><p class="muted">需要更多训练数据</p></div>';
  };

  const init = () => {
    setTimeout(() => {
      createWeightChart();
      createWorkoutChart();
      createNutritionChart();
      createRadarChart();
      createHeatmap();
    }, 100);
  };

  return { init };
})();
