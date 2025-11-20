/**
 * 健康评估服务测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fitnessAssessmentService } from '../../src/assets/js/services/fitnessAssessmentService.js';
import { storage } from '../../src/assets/js/services/storage.js';
import { authService } from '../../src/assets/js/services/authService.js';

describe('fitnessAssessmentService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // 模拟登录用户
    const mockUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      nickname: 'Test User',
      profile: {
        preference: 'hiit'
      }
    };

    storage.save('fitspark:session', mockUser);
  });

  describe('generateAssessment - 无数据场景', () => {
    it('应该返回默认分数当没有训练数据时', () => {
      const assessment = fitnessAssessmentService.generateAssessment();

      expect(assessment.hasData).toBe(false);
      expect(assessment.strength).toBe(50);
      expect(assessment.endurance).toBe(50);
      expect(assessment.flexibility).toBe(50);
      expect(assessment.balance).toBe(50);
      expect(assessment.speed).toBe(50);
      expect(assessment.coordination).toBe(50);
      expect(assessment.overall).toBe(50);
    });
  });

  describe('generateAssessment - 有数据场景', () => {
    beforeEach(() => {
      // 创建一些模拟训练数据
      const mockWorkouts = [
        // 力量训练
        { userId: 'test-user-123', muscle: '上肢', caloriesBurned: 300, duration: 30, completedAt: new Date().toISOString() },
        { userId: 'test-user-123', muscle: '下肢', caloriesBurned: 350, duration: 35, completedAt: new Date().toISOString() },
        { userId: 'test-user-123', muscle: '核心', caloriesBurned: 250, duration: 25, completedAt: new Date().toISOString() },

        // 耐力训练
        { userId: 'test-user-123', muscle: '心肺', caloriesBurned: 400, duration: 40, completedAt: new Date().toISOString() },
        { userId: 'test-user-123', muscle: '全身', caloriesBurned: 450, duration: 45, completedAt: new Date().toISOString() },

        // 柔韧性训练
        { userId: 'test-user-123', muscle: '灵活性', caloriesBurned: 150, duration: 30, type: 'flexibility', completedAt: new Date().toISOString() },

        // HIIT训练
        { userId: 'test-user-123', muscle: 'HIIT', type: 'hiit', caloriesBurned: 500, duration: 30, completedAt: new Date().toISOString() },
      ];

      storage.save('workouts', mockWorkouts);
    });

    it('应该基于真实数据计算力量分数', () => {
      const score = fitnessAssessmentService.calculateStrengthScore();
      expect(score).toBeGreaterThan(50); // 有力量训练数据，分数应该高于默认值
    });

    it('应该基于真实数据计算耐力分数', () => {
      const score = fitnessAssessmentService.calculateEnduranceScore();
      expect(score).toBeGreaterThan(50); // 有耐力训练数据
    });

    it('应该基于真实数据计算柔韧性分数', () => {
      const score = fitnessAssessmentService.calculateFlexibilityScore();
      expect(score).toBeGreaterThan(50); // 有柔韧性训练数据
    });

    it('应该基于真实数据计算速度分数', () => {
      const score = fitnessAssessmentService.calculateSpeedScore();
      expect(score).toBeGreaterThan(50); // 有HIIT训练数据
    });

    it('应该生成完整的评估报告', () => {
      const assessment = fitnessAssessmentService.generateAssessment();

      expect(assessment.hasData).toBe(true);
      expect(assessment.totalWorkouts).toBe(7);
      expect(assessment.recentWorkouts).toBe(7);
      expect(assessment.overall).toBeGreaterThan(50);
    });

    it('综合评分应该是各维度分数的平均值', () => {
      const assessment = fitnessAssessmentService.generateAssessment();

      const expectedOverall = Math.round(
        (assessment.strength +
          assessment.endurance +
          assessment.flexibility +
          assessment.balance +
          assessment.speed +
          assessment.coordination) / 6
      );

      expect(assessment.overall).toBe(expectedOverall);
    });
  });

  describe('getRecommendations', () => {
    it('应该为低分维度提供建议', () => {
      const mockAssessment = {
        strength: 40,
        endurance: 50,
        flexibility: 45,
        balance: 70,
        speed: 80,
        coordination: 75
      };

      const recommendations = fitnessAssessmentService.getRecommendations(mockAssessment);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.dimension === '力量')).toBe(true);
      expect(recommendations.some(r => r.dimension === '柔韧性')).toBe(true);
    });

    it('应该为高分（80+）不提供改进建议', () => {
      const mockAssessment = {
        strength: 85,
        endurance: 90,
        flexibility: 85,
        balance: 88,
        speed: 92,
        coordination: 87
      };

      const recommendations = fitnessAssessmentService.getRecommendations(mockAssessment);

      // 只应该有"保持当前状态"的建议
      expect(recommendations.length).toBe(1);
      expect(recommendations[0].dimension).toBeUndefined(); // 总体建议
    });
  });

  describe('平衡分数计算', () => {
    it('应该奖励训练多样性', () => {
      const diverseWorkouts = [
        { userId: 'test-user-123', muscle: '上肢', completedAt: new Date().toISOString() },
        { userId: 'test-user-123', muscle: '下肢', completedAt: new Date().toISOString() },
        { userId: 'test-user-123', muscle: '核心', completedAt: new Date().toISOString() },
        { userId: 'test-user-123', muscle: '心肺', completedAt: new Date().toISOString() },
        { userId: 'test-user-123', muscle: '灵活性', completedAt: new Date().toISOString() },
      ];

      const singleTypeWorkouts = [
        { userId: 'test-user-123', muscle: '上肢', completedAt: new Date().toISOString() },
        { userId: 'test-user-123', muscle: '上肢', completedAt: new Date().toISOString() },
        { userId: 'test-user-123', muscle: '上肢', completedAt: new Date().toISOString() },
        { userId: 'test-user-123', muscle: '上肢', completedAt: new Date().toISOString() },
        { userId: 'test-user-123', muscle: '上肢', completedAt: new Date().toISOString() },
      ];

      storage.save('workouts', diverseWorkouts);
      const diverseScore = fitnessAssessmentService.calculateBalanceScore();

      storage.save('workouts', singleTypeWorkouts);
      const singleScore = fitnessAssessmentService.calculateBalanceScore();

      expect(diverseScore).toBeGreaterThan(singleScore);
    });
  });

  describe('只统计最近30天的数据', () => {
    it('应该只考虑最近30天的训练', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40天前

      const oldWorkouts = [
        { userId: 'test-user-123', muscle: '上肢', caloriesBurned: 300, completedAt: oldDate.toISOString() },
        { userId: 'test-user-123', muscle: '下肢', caloriesBurned: 350, completedAt: oldDate.toISOString() },
      ];

      const recentWorkouts = [
        { userId: 'test-user-123', muscle: '上肢', caloriesBurned: 300, completedAt: new Date().toISOString() },
      ];

      storage.save('workouts', [...oldWorkouts, ...recentWorkouts]);

      const assessment = fitnessAssessmentService.generateAssessment();

      // recentWorkouts应该只包含1个训练
      expect(assessment.recentWorkouts).toBe(1);
    });
  });
});
