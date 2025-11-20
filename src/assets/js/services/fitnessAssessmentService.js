/**
 * 健康评估服务 - 基于真实训练数据计算多维度健康分数
 */

import { storage } from './storage.js';
import { authService } from './authService.js';

export const fitnessAssessmentService = (() => {
  /**
   * 获取用户的训练记录
   */
  const getUserWorkouts = () => {
    const user = authService.currentUser();
    if (!user) {
      console.log('[FitnessAssessment] No current user');
      return [];
    }

    const workouts = storage.get('workouts', []);
    console.log('[FitnessAssessment] Total workouts:', workouts.length);
    console.log('[FitnessAssessment] Current user ID:', user.id);

    const userWorkouts = workouts.filter(w => w.userId === user.id);
    console.log('[FitnessAssessment] User workouts:', userWorkouts.length);

    return userWorkouts;
  };

  /**
   * 获取最近30天的训练记录
   */
  const getRecentWorkouts = (days = 30) => {
    const workouts = getUserWorkouts();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return workouts.filter(w => {
      const workoutDate = new Date(w.completedAt || w.createdAt);
      return workoutDate >= cutoffDate;
    });
  };

  /**
   * 计算力量分数
   * 基于：力量训练次数、训练频率、肌肉群多样性
   */
  const calculateStrengthScore = () => {
    const recentWorkouts = getRecentWorkouts();

    // 力量相关的肌肉群
    const strengthMuscles = ['上肢', '下肢', '核心', '背部', '胸部', '腿部'];

    const strengthWorkouts = recentWorkouts.filter(w =>
      strengthMuscles.includes(w.muscle)
    );

    // 基础分数：训练次数（最多50分）
    const frequencyScore = Math.min(strengthWorkouts.length * 2.5, 50);

    // 多样性分数：覆盖的肌肉群种类（最多30分）
    const uniqueMuscles = new Set(strengthWorkouts.map(w => w.muscle));
    const diversityScore = Math.min(uniqueMuscles.size * 5, 30);

    // 强度分数：基于消耗的卡路里（最多20分）
    const avgCalories = strengthWorkouts.length > 0
      ? strengthWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0) / strengthWorkouts.length
      : 0;
    const intensityScore = Math.min(avgCalories / 20, 20);

    return Math.round(frequencyScore + diversityScore + intensityScore);
  };

  /**
   * 计算耐力分数
   * 基于：有氧训练次数、训练时长、消耗卡路里
   */
  const calculateEnduranceScore = () => {
    const recentWorkouts = getRecentWorkouts();

    // 耐力相关的训练类型
    const enduranceMuscles = ['心肺', '全身'];

    const enduranceWorkouts = recentWorkouts.filter(w =>
      enduranceMuscles.includes(w.muscle)
    );

    // 基础分数：训练次数（最多40分）
    const frequencyScore = Math.min(enduranceWorkouts.length * 3, 40);

    // 时长分数：平均训练时长（最多30分，假设30分钟以上为满分）
    const avgDuration = enduranceWorkouts.length > 0
      ? enduranceWorkouts.reduce((sum, w) => sum + (w.duration || 30), 0) / enduranceWorkouts.length
      : 0;
    const durationScore = Math.min(avgDuration, 30);

    // 强度分数：平均消耗卡路里（最多30分）
    const avgCalories = enduranceWorkouts.length > 0
      ? enduranceWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0) / enduranceWorkouts.length
      : 0;
    const intensityScore = Math.min(avgCalories / 15, 30);

    return Math.round(frequencyScore + durationScore + intensityScore);
  };

  /**
   * 计算柔韧性分数
   * 基于：灵活性训练次数、训练频率
   */
  const calculateFlexibilityScore = () => {
    const recentWorkouts = getRecentWorkouts();
    const user = authService.currentUser();

    // 柔韧性训练
    const flexibilityWorkouts = recentWorkouts.filter(w =>
      w.muscle === '灵活性' || w.type === 'flexibility' || w.type === 'yoga'
    );

    // 基础分数：训练次数（最多60分）
    const frequencyScore = Math.min(flexibilityWorkouts.length * 4, 60);

    // 训练偏好加分：如果用户设置了灵活性为偏好（最多20分）
    const preferenceBonus = user?.profile?.preference === 'mobility' ? 20 : 0;

    // 一致性分数：最近7天是否有训练（最多20分）
    const last7Days = getRecentWorkouts(7).filter(w =>
      w.muscle === '灵活性' || w.type === 'flexibility'
    );
    const consistencyScore = last7Days.length > 0 ? 20 : 0;

    return Math.round(frequencyScore + preferenceBonus + consistencyScore);
  };

  /**
   * 计算平衡分数
   * 基于：各肌肉群训练的均衡程度、训练多样性
   */
  const calculateBalanceScore = () => {
    const recentWorkouts = getRecentWorkouts();

    if (recentWorkouts.length === 0) return 50; // 默认分数

    // 统计各肌肉群的训练次数
    const muscleDistribution = {};
    recentWorkouts.forEach(w => {
      muscleDistribution[w.muscle] = (muscleDistribution[w.muscle] || 0) + 1;
    });

    const muscles = Object.keys(muscleDistribution);
    const counts = Object.values(muscleDistribution);

    // 多样性分数：训练的肌肉群种类（最多40分）
    const diversityScore = Math.min(muscles.length * 6, 40);

    // 均衡度分数：计算标准差，越小越均衡（最多40分）
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    const balanceScore = Math.max(40 - stdDev * 2, 0);

    // 一致性分数：每周是否保持训练（最多20分）
    const weeklyConsistency = recentWorkouts.length >= 12 ? 20 : Math.round(recentWorkouts.length / 12 * 20);

    return Math.round(diversityScore + balanceScore + weeklyConsistency);
  };

  /**
   * 计算速度分数
   * 基于：HIIT训练次数、高强度训练比例
   */
  const calculateSpeedScore = () => {
    const recentWorkouts = getRecentWorkouts();
    const user = authService.currentUser();

    // HIIT和高强度训练
    const hiitWorkouts = recentWorkouts.filter(w =>
      w.type === 'hiit' || w.muscle === 'HIIT' || (w.caloriesBurned && w.caloriesBurned > 400)
    );

    // 基础分数：HIIT训练次数（最多50分）
    const frequencyScore = Math.min(hiitWorkouts.length * 3.5, 50);

    // 训练偏好加分（最多20分）
    const preferenceBonus = user?.profile?.preference === 'hiit' ? 20 : 0;

    // 强度分数：高强度训练占比（最多30分）
    const hiitRatio = recentWorkouts.length > 0
      ? hiitWorkouts.length / recentWorkouts.length
      : 0;
    const intensityScore = Math.round(hiitRatio * 30);

    return Math.round(frequencyScore + preferenceBonus + intensityScore);
  };

  /**
   * 计算协调分数
   * 基于：训练类型多样性、全身性训练比例
   */
  const calculateCoordinationScore = () => {
    const recentWorkouts = getRecentWorkouts();

    if (recentWorkouts.length === 0) return 50; // 默认分数

    // 全身性训练
    const fullBodyWorkouts = recentWorkouts.filter(w =>
      w.muscle === '全身' || w.type === 'fullbody'
    );

    // 统计训练类型多样性
    const muscleTypes = new Set(recentWorkouts.map(w => w.muscle));
    const workoutTypes = new Set(recentWorkouts.map(w => w.type || 'general'));

    // 多样性分数（最多40分）
    const diversityScore = Math.min(muscleTypes.size * 4 + workoutTypes.size * 2, 40);

    // 全身训练分数（最多30分）
    const fullBodyScore = Math.min(fullBodyWorkouts.length * 3, 30);

    // 综合性分数：是否涵盖力量+耐力+柔韧（最多30分）
    const hasStrength = recentWorkouts.some(w => ['上肢', '下肢', '核心'].includes(w.muscle));
    const hasEndurance = recentWorkouts.some(w => w.muscle === '心肺');
    const hasFlexibility = recentWorkouts.some(w => w.muscle === '灵活性');
    const comprehensiveScore = (hasStrength ? 10 : 0) + (hasEndurance ? 10 : 0) + (hasFlexibility ? 10 : 0);

    return Math.round(diversityScore + fullBodyScore + comprehensiveScore);
  };

  /**
   * 生成完整的健康评估报告
   */
  const generateAssessment = () => {
    const user = authService.currentUser();
    if (!user) {
      return {
        strength: 50,
        endurance: 50,
        flexibility: 50,
        balance: 50,
        speed: 50,
        coordination: 50,
        overall: 50,
        hasData: false
      };
    }

    const workouts = getUserWorkouts();
    const hasData = workouts.length > 0;

    const strength = calculateStrengthScore();
    const endurance = calculateEnduranceScore();
    const flexibility = calculateFlexibilityScore();
    const balance = calculateBalanceScore();
    const speed = calculateSpeedScore();
    const coordination = calculateCoordinationScore();

    const overall = Math.round((strength + endurance + flexibility + balance + speed + coordination) / 6);

    return {
      strength,
      endurance,
      flexibility,
      balance,
      speed,
      coordination,
      overall,
      hasData,
      totalWorkouts: workouts.length,
      recentWorkouts: getRecentWorkouts().length
    };
  };

  /**
   * 获取建议
   */
  const getRecommendations = (assessment) => {
    const recommendations = [];

    // 找出最弱的维度
    const scores = {
      '力量': assessment.strength,
      '耐力': assessment.endurance,
      '柔韧性': assessment.flexibility,
      '平衡': assessment.balance,
      '速度': assessment.speed,
      '协调': assessment.coordination
    };

    const sortedScores = Object.entries(scores).sort((a, b) => a[1] - b[1]);
    const weakest = sortedScores.slice(0, 2);

    weakest.forEach(([dimension, score]) => {
      if (score < 60) {
        const tips = {
          '力量': '增加力量训练频率，尝试上肢、下肢、核心等不同部位的训练',
          '耐力': '增加有氧运动，如跑步、游泳、骑行等，提高心肺功能',
          '柔韧性': '每天进行拉伸运动，可以尝试瑜伽或普拉提',
          '平衡': '尝试更多样化的训练，均衡锻炼各个肌肉群',
          '速度': '加入HIIT训练，提高爆发力和反应速度',
          '协调': '进行全身性训练，如功能性训练、CrossFit等'
        };
        recommendations.push({
          dimension,
          score,
          tip: tips[dimension]
        });
      }
    });

    return recommendations;
  };

  return {
    generateAssessment,
    getRecommendations,
    calculateStrengthScore,
    calculateEnduranceScore,
    calculateFlexibilityScore,
    calculateBalanceScore,
    calculateSpeedScore,
    calculateCoordinationScore
  };
})();
