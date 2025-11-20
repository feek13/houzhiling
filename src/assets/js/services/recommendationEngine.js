/**
 * 智能推荐引擎
 * 基于用户资料、训练历史、营养数据提供个性化推荐
 * 算法：协同过滤 + 内容推荐 + 规则引擎
 */

import { authService } from './authService.js';
import { storage } from './storage.js';
import { workouts } from '../data/workouts.js';

export const recommendationEngine = (() => {
  /**
   * 计算BMI
   */
  const calculateBMI = (weight, height) => {
    if (!weight || !height) return 0;
    const heightM = height / 100;
    return (weight / (heightM * heightM)).toFixed(1);
  };

  /**
   * 获取BMI分类
   */
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return 'underweight'; // 偏瘦
    if (bmi < 24) return 'normal'; // 正常
    if (bmi < 28) return 'overweight'; // 超重
    return 'obese'; // 肥胖
  };

  /**
   * 获取用户目标类型
   */
  const getUserGoal = (profile) => {
    if (!profile) return 'general';

    // 如果用户明确设置了目标
    if (profile.goal) return profile.goal;

    // 根据BMI推断目标
    const bmi = calculateBMI(profile.weight, profile.height);
    const category = getBMICategory(bmi);

    if (category === 'underweight') return 'muscle_gain'; // 增肌
    if (category === 'overweight' || category === 'obese') return 'fat_loss'; // 减脂
    return 'keep_fit'; // 综合提升
  };

  /**
   * 基于规则的课程推荐
   * 根据用户BMI、目标、健康状况推荐课程
   */
  const getRecommendationsByRules = (profile, limit = 6) => {
    if (!profile) return [];

    const bmi = calculateBMI(profile.weight, profile.height);
    const goal = getUserGoal(profile);
    const age = profile.age || 25;
    const gender = profile.gender || 'male';
    const hasInjury = profile.medicalHistory && profile.medicalHistory.includes('injury');

    let recommendedWorkouts = [];
    let scores = {};

    // 为每个课程计算推荐分数
    workouts.forEach(workout => {
      let score = 50; // 基础分

      // 根据目标调整分数
      if (goal === 'fat_loss') {
        // 减脂：有氧为主
        if (workout.muscleKey === 'cardio' || workout.muscleKey === 'full') score += 30;
        if (workout.levelKey === 'medium' || workout.levelKey === 'hard') score += 10;
        if (workout.durationKey === 'medium' || workout.durationKey === 'long') score += 15;
      } else if (goal === 'muscle_gain') {
        // 增肌：力量训练为主
        if (workout.equipmentKey === 'barbell' || workout.equipmentKey === 'dumbbell') score += 25;
        if (workout.muscleKey !== 'cardio') score += 20;
        if (workout.levelKey === 'medium' || workout.levelKey === 'hard') score += 15;
      } else {
        // 综合提升：平衡训练
        if (workout.levelKey === 'medium') score += 20;
        if (workout.muscleKey === 'full') score += 15;
      }

      // 根据BMI调整
      if (bmi > 28) {
        // 肥胖：低冲击、有氧
        if (workout.equipmentKey === 'bodyweight') score += 15;
        if (workout.muscleKey === 'cardio') score += 20;
        if (workout.levelKey === 'easy') score += 10;
      } else if (bmi < 18.5) {
        // 偏瘦：力量训练
        if (workout.equipmentKey !== 'bodyweight') score += 20;
        if (workout.levelKey === 'easy' || workout.levelKey === 'medium') score += 10;
      }

      // 根据年龄调整
      if (age > 50) {
        // 中老年：低强度、关节友好
        if (workout.levelKey === 'easy') score += 20;
        if (workout.equipmentKey === 'bodyweight') score += 10;
      } else if (age < 30) {
        // 年轻人：可以高强度
        if (workout.levelKey === 'hard') score += 10;
      }

      // 有伤病史：避免高冲击
      if (hasInjury) {
        if (workout.levelKey === 'hard') score -= 30;
        if (workout.muscleKey === 'legs') score -= 15;
      }

      // 性别偏好（统计学倾向，非绝对）
      if (gender === 'female') {
        if (workout.muscleKey === 'core' || workout.muscleKey === 'legs') score += 5;
      } else {
        if (workout.muscleKey === 'chest' || workout.muscleKey === 'back') score += 5;
      }

      scores[workout.id] = score;
    });

    // 按分数排序并返回top N
    recommendedWorkouts = workouts
      .map(w => ({ ...w, score: scores[w.id] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return recommendedWorkouts;
  };

  /**
   * 基于训练历史的协同过滤推荐
   * 找到做过类似训练的用户，推荐他们喜欢的课程
   */
  const getRecommendationsByHistory = (limit = 3) => {
    const user = authService.currentUser();
    if (!user || !user.workoutHistory) return [];

    // 简化版协同过滤：基于用户最近训练的部位
    const recentMuscles = user.workoutHistory
      .slice(-10)
      .map(h => h.muscleKey);

    const muscleCount = {};
    recentMuscles.forEach(m => {
      muscleCount[m] = (muscleCount[m] || 0) + 1;
    });

    // 找出训练较少的部位（需要平衡）
    const allMuscles = ['chest', 'back', 'legs', 'core', 'full'];
    const undertrainedMuscles = allMuscles.filter(m => !muscleCount[m] || muscleCount[m] < 2);

    // 推荐训练较少的部位课程
    const recommendations = workouts
      .filter(w => undertrainedMuscles.includes(w.muscleKey))
      .slice(0, limit);

    return recommendations;
  };

  /**
   * 获取完整推荐（组合多种算法）
   */
  const getRecommendations = (type = 'all') => {
    const user = authService.currentUser();
    const profile = user?.profile || {};

    let recommendations = [];

    switch (type) {
      case 'goal-based':
        recommendations = getRecommendationsByRules(profile, 6);
        break;
      case 'history-based':
        recommendations = getRecommendationsByHistory(6);
        break;
      case 'all':
      default:
        // 组合推荐：60%基于目标，40%基于历史
        const rulesBased = getRecommendationsByRules(profile, 4);
        const historyBased = getRecommendationsByHistory(2);
        recommendations = [...rulesBased, ...historyBased];
        break;
    }

    // 去重
    const seen = new Set();
    recommendations = recommendations.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    return recommendations;
  };

  /**
   * 生成个性化健身建议文案
   */
  const getPersonalizedAdvice = () => {
    const user = authService.currentUser();
    if (!user || !user.profile) {
      return {
        title: '欢迎开始健身之旅！',
        advice: '建议先完善个人资料，我们将为你提供更精准的训练建议。',
        tips: [
          '填写身高体重，计算BMI指数',
          '设置健身目标（减脂/增肌/塑形）',
          '记录第一次训练，开启进步之路'
        ]
      };
    }

    const profile = user.profile;
    const bmi = calculateBMI(profile.weight, profile.height);
    const category = getBMICategory(bmi);
    const goal = getUserGoal(profile);
    const age = profile.age || 25;

    let title = '';
    let advice = '';
    let tips = [];

    // 根据BMI分类给建议
    if (category === 'underweight') {
      title = '增重增肌计划';
      advice = `你的BMI为${bmi}，属于偏瘦体型。建议通过力量训练增加肌肉量，配合高蛋白饮食。`;
      tips = [
        '每周进行3-5次力量训练',
        '每日蛋白质摄入：体重(kg) × 1.6-2.2g',
        '优先复合动作：深蹲、硬拉、卧推',
        '保证充足睡眠（7-9小时）促进肌肉恢复'
      ];
    } else if (category === 'overweight' || category === 'obese') {
      title = '健康减脂计划';
      advice = `你的BMI为${bmi}，建议通过有氧运动和饮食控制健康减重。循序渐进，每周减重0.5-1kg为宜。`;
      tips = [
        '每周进行4-6次有氧运动（快走、慢跑、游泳）',
        '控制每日热量摄入，制造300-500卡热量赤字',
        '多吃蔬菜水果，减少精制碳水和糖分',
        '记录饮食和运动，追踪进度',
        age > 40 ? '关注关节健康，选择低冲击运动' : '可尝试HIIT提高减脂效率'
      ];
    } else {
      title = '维持健康体态';
      advice = `你的BMI为${bmi}，属于正常范围。建议保持规律运动，均衡饮食，提升体能素质。`;
      tips = [
        '每周3-5次训练，力量+有氧结合',
        '尝试多样化训练方式（跑步、游泳、瑜伽、器械）',
        '保持蛋白质摄入，每日体重(kg) × 1.2-1.6g',
        '设定新的健身目标（如5公里跑进25分钟、深蹲体重1.5倍）'
      ];
    }

    // 根据年龄补充建议
    if (age > 50) {
      tips.push('加强柔韧性和平衡性训练，预防跌倒');
      tips.push('关注骨密度，补充钙质和维生素D');
    } else if (age < 25) {
      tips.push('年轻是资本，但也要注意训练安全，避免过度训练');
    }

    return { title, advice, tips };
  };

  /**
   * 营养建议生成器
   */
  const getNutritionAdvice = () => {
    const user = authService.currentUser();
    if (!user || !user.profile) return null;

    const profile = user.profile;
    const weight = profile.weight || 70;
    const height = profile.height || 170;
    const age = profile.age || 25;
    const gender = profile.gender || 'male';
    const goal = getUserGoal(profile);

    // 计算基础代谢率 (BMR) - Mifflin-St Jeor公式
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // 计算每日总消耗 (TDEE) - 假设中等活动水平
    const activityMultiplier = 1.55; // 中等活动（每周3-5次运动）
    const tdee = Math.round(bmr * activityMultiplier);

    // 根据目标调整热量
    let targetCalories;
    let protein, carbs, fat;

    if (goal === 'fat_loss') {
      // 减脂：热量赤字 15-20%
      targetCalories = Math.round(tdee * 0.85);
      protein = Math.round(weight * 2.0); // 高蛋白
      fat = Math.round(weight * 0.8);
      carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4);
    } else if (goal === 'muscle_gain') {
      // 增肌：热量盈余 10-15%
      targetCalories = Math.round(tdee * 1.15);
      protein = Math.round(weight * 2.2); // 高蛋白
      fat = Math.round(weight * 1.0);
      carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4);
    } else {
      // 维持：热量平衡
      targetCalories = tdee;
      protein = Math.round(weight * 1.6);
      fat = Math.round(weight * 0.9);
      carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4);
    }

    return {
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      macros: {
        protein: { grams: protein, calories: protein * 4, percentage: Math.round((protein * 4 / targetCalories) * 100) },
        carbs: { grams: carbs, calories: carbs * 4, percentage: Math.round((carbs * 4 / targetCalories) * 100) },
        fat: { grams: fat, calories: fat * 9, percentage: Math.round((fat * 9 / targetCalories) * 100) }
      },
      mealSuggestions: getMealSuggestions(goal, targetCalories)
    };
  };

  /**
   * 餐饮建议
   */
  const getMealSuggestions = (goal, targetCalories) => {
    const breakfast = Math.round(targetCalories * 0.25);
    const lunch = Math.round(targetCalories * 0.35);
    const dinner = Math.round(targetCalories * 0.30);
    const snacks = Math.round(targetCalories * 0.10);

    const suggestions = {
      breakfast: { calories: breakfast, examples: [] },
      lunch: { calories: lunch, examples: [] },
      dinner: { calories: dinner, examples: [] },
      snacks: { calories: snacks, examples: [] }
    };

    if (goal === 'fat_loss') {
      suggestions.breakfast.examples = ['燕麦粥+水煮蛋+苹果', '全麦面包+鸡胸肉+牛奶', '希腊酸奶+坚果+蓝莓'];
      suggestions.lunch.examples = ['糙米饭+清蒸鱼+西兰花', '鸡胸沙拉+橄榄油', '紫薯+牛肉+蔬菜'];
      suggestions.dinner.examples = ['豆腐+青菜+少量米饭', '虾仁+芦笋+藜麦', '瘦肉汤+蔬菜'];
      suggestions.snacks.examples = ['苹果', '无糖酸奶', '少量坚果'];
    } else if (goal === 'muscle_gain') {
      suggestions.breakfast.examples = ['燕麦+香蕉+蛋白粉', '全麦吐司+花生酱+鸡蛋', '牛奶+麦片+坚果'];
      suggestions.lunch.examples = ['白米饭+鸡胸肉+红薯', '意面+牛肉+蔬菜', '三文鱼+糙米+牛油果'];
      suggestions.dinner.examples = ['牛排+土豆+沙拉', '鸡腿+米饭+西兰花', '鱼肉+面条+蔬菜'];
      suggestions.snacks.examples = ['蛋白棒', '坚果', '香蕉+花生酱'];
    } else {
      suggestions.breakfast.examples = ['鸡蛋+全麦面包+牛奶', '豆浆+包子+水果', '粥+鸡蛋+小菜'];
      suggestions.lunch.examples = ['米饭+肉类+蔬菜', '面条+牛肉+青菜', '盖饭+沙拉'];
      suggestions.dinner.examples = ['鱼肉+米饭+蔬菜', '鸡肉+藜麦+沙拉', '豆腐+杂粮饭+青菜'];
      suggestions.snacks.examples = ['水果', '酸奶', '坚果'];
    }

    return suggestions;
  };

  /**
   * 生成周训练计划推荐
   */
  const generateWeeklyPlan = (daysPerWeek = 4) => {
    const user = authService.currentUser();
    const profile = user?.profile || {};
    const goal = getUserGoal(profile);

    const plans = {
      3: [],
      4: [],
      5: []
    };

    // 3天计划（全身分化）
    plans[3] = [
      { day: 1, focus: '上肢推', workouts: workouts.filter(w => w.muscleKey === 'chest').slice(0, 2) },
      { day: 2, focus: '下肢', workouts: workouts.filter(w => w.muscleKey === 'legs').slice(0, 2) },
      { day: 3, focus: '上肢拉+核心', workouts: workouts.filter(w => w.muscleKey === 'back' || w.muscleKey === 'core').slice(0, 2) }
    ];

    // 4天计划（上下分化）
    plans[4] = [
      { day: 1, focus: '上肢', workouts: workouts.filter(w => w.muscleKey === 'chest' || w.muscleKey === 'back').slice(0, 2) },
      { day: 2, focus: '下肢', workouts: workouts.filter(w => w.muscleKey === 'legs').slice(0, 2) },
      { day: 3, focus: '有氧+核心', workouts: workouts.filter(w => w.muscleKey === 'core' || w.muscleKey === 'full').slice(0, 2) },
      { day: 4, focus: '全身力量', workouts: workouts.filter(w => w.muscleKey === 'full').slice(0, 2) }
    ];

    // 5天计划（部位分化）
    plans[5] = [
      { day: 1, focus: '胸部', workouts: workouts.filter(w => w.muscleKey === 'chest').slice(0, 2) },
      { day: 2, focus: '背部', workouts: workouts.filter(w => w.muscleKey === 'back').slice(0, 2) },
      { day: 3, focus: '腿部', workouts: workouts.filter(w => w.muscleKey === 'legs').slice(0, 2) },
      { day: 4, focus: '核心', workouts: workouts.filter(w => w.muscleKey === 'core').slice(0, 2) },
      { day: 5, focus: '全身综合', workouts: workouts.filter(w => w.muscleKey === 'full').slice(0, 2) }
    ];

    return plans[daysPerWeek] || plans[4];
  };

  return {
    getRecommendations,
    getPersonalizedAdvice,
    getNutritionAdvice,
    generateWeeklyPlan,
    getUserGoal,
    calculateBMI,
    getBMICategory
  };
})();
