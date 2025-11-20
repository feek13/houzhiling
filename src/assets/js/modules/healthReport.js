/**
 * 健康评估报告模块
 * 功能：生成综合健康评估报告
 */

import { storage } from '../services/storage.js';
import { authService } from '../services/authService.js';
import { modal } from './modal.js';
import { notificationService } from '../services/notificationService.js';

export const healthReportModule = (() => {
  /**
   * 计算BMI
   */
  const calculateBMI = (weight, height) => {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  /**
   * 获取BMI等级
   */
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { text: '偏瘦', color: '#ffd93d', score: 60 };
    if (bmi < 24) return { text: '正常', color: '#43e97b', score: 100 };
    if (bmi < 28) return { text: '偏重', color: '#ffa62b', score: 70 };
    return { text: '肥胖', color: '#ff6b6b', score: 40 };
  };

  /**
   * 计算训练一致性分数
   */
  const calculateConsistencyScore = () => {
    const workouts = storage.get('workouts', []);
    const last30Days = workouts.filter(w => {
      const date = new Date(w.completedAt || w.createdAt);
      const now = new Date();
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    });

    const checkin = storage.get('checkin_data', { streak: 0 });
    const streak = checkin.streak || 0;

    // 基于30天内训练次数和连续天数计算
    const frequencyScore = Math.min(last30Days.length * 5, 50);
    const streakScore = Math.min(streak * 3, 50);

    return Math.round(frequencyScore + streakScore);
  };

  /**
   * 计算营养质量分数
   */
  const calculateNutritionScore = () => {
    const nutritionLog = storage.get('nutrition_log', []);
    if (nutritionLog.length === 0) return 50;

    const last7Days = nutritionLog.slice(-7);
    let balanceScore = 0;

    last7Days.forEach(log => {
      const { protein, carbs, fat, calories } = log;
      // 理想比例: 蛋白质30%, 碳水40%, 脂肪30%
      const proteinRatio = (protein * 4) / calories;
      const carbsRatio = (carbs * 4) / calories;
      const fatRatio = (fat * 9) / calories;

      const idealProtein = 0.3;
      const idealCarbs = 0.4;
      const idealFat = 0.3;

      const deviation = Math.abs(proteinRatio - idealProtein) +
                       Math.abs(carbsRatio - idealCarbs) +
                       Math.abs(fatRatio - idealFat);

      balanceScore += Math.max(100 - deviation * 100, 0);
    });

    return Math.round(balanceScore / last7Days.length);
  };

  /**
   * 计算体重管理分数
   */
  const calculateWeightScore = () => {
    const metrics = storage.get('metrics_history', []);
    if (metrics.length < 2) return 50;

    const recent = metrics.slice(-4);
    const firstWeight = recent[0].weight;
    const lastWeight = recent[recent.length - 1].weight;
    const change = firstWeight - lastWeight;

    const bmi = calculateBMI(lastWeight, recent[recent.length - 1].height || 170);
    const category = getBMICategory(bmi);

    // 如果BMI正常，维持体重得分高
    if (category.text === '正常') {
      return Math.abs(change) < 2 ? 95 : 80;
    }

    // 如果需要减重
    if (category.text === '偏重' || category.text === '肥胖') {
      return change > 0 ? Math.min(90, 50 + change * 10) : 40;
    }

    // 如果偏瘦，增重得分
    return change < 0 ? Math.min(90, 50 + Math.abs(change) * 10) : 40;
  };

  /**
   * 生成改进建议
   */
  const generateRecommendations = (scores) => {
    const recommendations = [];

    if (scores.consistency < 70) {
      recommendations.push({
        title: '提高训练频率',
        desc: '建议每周至少训练3-4次，保持规律的训练习惯有助于达成健身目标。',
        priority: 'high'
      });
    }

    if (scores.nutrition < 70) {
      recommendations.push({
        title: '优化营养摄入',
        desc: '注意三大营养素的平衡，建议蛋白质30%、碳水40%、脂肪30%的比例。',
        priority: 'high'
      });
    }

    if (scores.weight < 70) {
      recommendations.push({
        title: '调整体重管理策略',
        desc: '根据你的BMI指数，建议调整饮食和训练计划，以达到健康体重。',
        priority: 'medium'
      });
    }

    if (scores.overall >= 80) {
      recommendations.push({
        title: '保持当前状态',
        desc: '你的整体健康状况良好，继续保持当前的训练和饮食习惯！',
        priority: 'low'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: '继续努力',
        desc: '你正在朝着目标稳步前进，坚持下去会看到更好的效果！',
        priority: 'low'
      });
    }

    return recommendations;
  };

  /**
   * 生成完整报告数据
   */
  const generateReportData = () => {
    const user = authService.currentUser();
    if (!user) return null;

    const profile = user.profile || {};
    const workouts = storage.get('workouts', []);
    const nutritionLog = storage.get('nutrition_log', []);
    const metrics = storage.get('metrics_history', []);

    // 计算各项分数
    const consistencyScore = calculateConsistencyScore();
    const nutritionScore = calculateNutritionScore();
    const weightScore = calculateWeightScore();
    const overallScore = Math.round((consistencyScore + nutritionScore + weightScore) / 3);

    // BMI数据
    let bmi = 0;
    let bmiCategory = { text: '未知', color: '#666', score: 0 };
    if (metrics.length > 0) {
      const latest = metrics[metrics.length - 1];
      bmi = calculateBMI(latest.weight, latest.height || 170);
      bmiCategory = getBMICategory(parseFloat(bmi));
    }

    const scores = {
      overall: overallScore,
      consistency: consistencyScore,
      nutrition: nutritionScore,
      weight: weightScore
    };

    // 生成建议
    const recommendations = generateRecommendations(scores);

    // 统计数据
    const stats = {
      totalWorkouts: workouts.length,
      totalCalories: workouts.reduce((sum, w) => sum + (w.calories || 0), 0),
      avgCaloriesPerWorkout: workouts.length > 0 ?
        Math.round(workouts.reduce((sum, w) => sum + (w.calories || 0), 0) / workouts.length) : 0,
      nutritionLogs: nutritionLog.length,
      bmi,
      bmiCategory
    };

    return {
      user: {
        nickname: user.nickname || user.email,
        email: user.email
      },
      scores,
      stats,
      recommendations,
      generatedAt: new Date().toLocaleString('zh-CN')
    };
  };

  /**
   * 获取分数颜色
   */
  const getScoreColor = (score) => {
    if (score >= 80) return '#43e97b';
    if (score >= 60) return '#ffa62b';
    return '#ff6b6b';
  };

  /**
   * 获取优先级颜色
   */
  const getPriorityColor = (priority) => {
    if (priority === 'high') return '#ff6b6b';
    if (priority === 'medium') return '#ffa62b';
    return '#43e97b';
  };

  /**
   * 打开报告模态框
   */
  const openReportModal = () => {
    const user = authService.currentUser();
    if (!user) {
      notificationService.warning('请先登录后再查看健康报告');
      return;
    }

    const report = generateReportData();
    if (!report) {
      notificationService.error('无法生成报告，请确保已登录');
      return;
    }

    const modalContent = `
      <div class="health-report">
        <div class="report-header">
          <h2>健康评估报告</h2>
          <p class="report-user">用户：${report.user.nickname}</p>
          <p class="report-date">生成时间：${report.generatedAt}</p>
        </div>

        <div class="report-overall-score">
          <div class="score-circle" style="--score: ${report.scores.overall}; --color: ${getScoreColor(report.scores.overall)}">
            <div class="score-value">${report.scores.overall}</div>
            <div class="score-label">综合评分</div>
          </div>
          <p class="score-desc">
            ${report.scores.overall >= 80 ? '优秀！你的健康状况非常好' :
              report.scores.overall >= 60 ? '良好，继续保持' :
              '需要改进，加油！'}
          </p>
        </div>

        <div class="report-scores">
          <div class="score-item">
            <h4>训练一致性</h4>
            <div class="score-bar">
              <div class="score-fill" style="width: ${report.scores.consistency}%; background: ${getScoreColor(report.scores.consistency)}"></div>
            </div>
            <span class="score-number">${report.scores.consistency}/100</span>
          </div>

          <div class="score-item">
            <h4>营养质量</h4>
            <div class="score-bar">
              <div class="score-fill" style="width: ${report.scores.nutrition}%; background: ${getScoreColor(report.scores.nutrition)}"></div>
            </div>
            <span class="score-number">${report.scores.nutrition}/100</span>
          </div>

          <div class="score-item">
            <h4>体重管理</h4>
            <div class="score-bar">
              <div class="score-fill" style="width: ${report.scores.weight}%; background: ${getScoreColor(report.scores.weight)}"></div>
            </div>
            <span class="score-number">${report.scores.weight}/100</span>
          </div>
        </div>

        <div class="report-stats">
          <h3>数据总览</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-icon">💪</span>
              <span class="stat-value">${report.stats.totalWorkouts}</span>
              <span class="stat-label">总训练次数</span>
            </div>
            <div class="stat-card">
              <span class="stat-icon">🔥</span>
              <span class="stat-value">${Math.round(report.stats.totalCalories)}</span>
              <span class="stat-label">总消耗卡路里</span>
            </div>
            <div class="stat-card">
              <span class="stat-icon">📊</span>
              <span class="stat-value">${report.stats.avgCaloriesPerWorkout}</span>
              <span class="stat-label">平均每次消耗</span>
            </div>
            <div class="stat-card">
              <span class="stat-icon">🥗</span>
              <span class="stat-value">${report.stats.nutritionLogs}</span>
              <span class="stat-label">营养记录</span>
            </div>
            <div class="stat-card">
              <span class="stat-icon">⚖️</span>
              <span class="stat-value">${report.stats.bmi}</span>
              <span class="stat-label">BMI指数</span>
            </div>
            <div class="stat-card">
              <span class="stat-icon">📈</span>
              <span class="stat-value" style="color: ${report.stats.bmiCategory.color}">${report.stats.bmiCategory.text}</span>
              <span class="stat-label">BMI状态</span>
            </div>
          </div>
        </div>

        <div class="report-recommendations">
          <h3>改进建议</h3>
          <div class="recommendations-list">
            ${report.recommendations.map(rec => `
              <div class="recommendation-item" data-priority="${rec.priority}">
                <div class="rec-header">
                  <span class="rec-priority" style="background: ${getPriorityColor(rec.priority)}"></span>
                  <h4>${rec.title}</h4>
                </div>
                <p>${rec.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="report-actions">
          <button class="btn primary" onclick="window.healthReportActions.downloadReport()">下载报告 (开发中)</button>
          <button class="btn ghost" onclick="window.healthReportActions.closeReport()">关闭</button>
        </div>
      </div>
    `;

    modal.open(modalContent);
  };

  // 全局操作方法
  window.healthReportActions = {
    downloadReport: () => {
      notificationService.info('下载功能开发中...\n\n未来将支持导出为 PDF 格式');
    },
    closeReport: () => {
      modal.close();
    }
  };

  return {
    openReportModal,
    generateReportData
  };
})();
