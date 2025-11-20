/**
 * Integration Tests for Workout and Activity Tracking Flow
 * Tests workout logging, storage, and event propagation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../src/assets/js/services/authService.js';
import { storage } from '../../src/assets/js/services/storage.js';
import { eventBus, EventNames } from '../../src/assets/js/services/eventBus.js';

describe('Workout Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    eventBus.events = {};

    // Set up authenticated user for workout tests
    authService.register({
      email: 'workout@example.com',
      password: 'WorkoutPass123',
      nickname: 'WorkoutTester'
    });
  });

  describe('Workout logging flow', () => {
    it('should log workout and trigger appropriate events', () => {
      const workoutCallback = vi.fn();
      eventBus.on(EventNames.WORKOUT_COMPLETED, workoutCallback);

      // Create workout data
      const workout = {
        id: Date.now(),
        muscle: '胸部',
        duration: 45,
        calories: 350,
        exercises: [
          { name: '卧推', sets: 4, reps: 10, weight: 60 },
          { name: '飞鸟', sets: 3, reps: 12, weight: 15 }
        ],
        date: new Date().toISOString(),
        userId: authService.currentUser().id
      };

      // Save workout
      const workouts = storage.get('workouts', []);
      workouts.push(workout);
      storage.save('workouts', workouts);

      // Emit workout completed event
      eventBus.emit(EventNames.WORKOUT_COMPLETED, { workout });

      // Verify event triggered
      expect(workoutCallback).toHaveBeenCalledTimes(1);
      expect(workoutCallback).toHaveBeenCalledWith({ workout });

      // Verify workout stored
      const storedWorkouts = storage.get('workouts', []);
      expect(storedWorkouts.length).toBe(1);
      expect(storedWorkouts[0]).toEqual(workout);
    });

    it('should track multiple workouts for a user', () => {
      const workouts = [
        { id: 1, muscle: '胸部', duration: 45, calories: 350, date: '2025-01-01' },
        { id: 2, muscle: '背部', duration: 50, calories: 400, date: '2025-01-02' },
        { id: 3, muscle: '腿部', duration: 60, calories: 500, date: '2025-01-03' }
      ];

      // Log multiple workouts
      workouts.forEach(workout => {
        const existing = storage.get('workouts', []);
        existing.push({ ...workout, userId: authService.currentUser().id });
        storage.save('workouts', existing);
      });

      // Verify all workouts stored
      const storedWorkouts = storage.get('workouts', []);
      expect(storedWorkouts.length).toBe(3);

      // Verify workout data integrity
      expect(storedWorkouts[0].muscle).toBe('胸部');
      expect(storedWorkouts[1].muscle).toBe('背部');
      expect(storedWorkouts[2].muscle).toBe('腿部');
    });

    it('should calculate total workout statistics', () => {
      const workouts = [
        { duration: 45, calories: 350 },
        { duration: 50, calories: 400 },
        { duration: 60, calories: 500 }
      ];

      workouts.forEach(workout => {
        const existing = storage.get('workouts', []);
        existing.push({ ...workout, userId: authService.currentUser().id });
        storage.save('workouts', existing);
      });

      const storedWorkouts = storage.get('workouts', []);

      // Calculate totals
      const totalDuration = storedWorkouts.reduce((sum, w) => sum + w.duration, 0);
      const totalCalories = storedWorkouts.reduce((sum, w) => sum + w.calories, 0);

      expect(totalDuration).toBe(155);
      expect(totalCalories).toBe(1250);
      expect(storedWorkouts.length).toBe(3);
    });
  });

  describe('Nutrition logging flow', () => {
    it('should log nutrition and trigger appropriate events', () => {
      const nutritionCallback = vi.fn();
      eventBus.on(EventNames.NUTRITION_LOGGED, nutritionCallback);

      // Create nutrition entry
      const nutritionEntry = {
        id: Date.now(),
        meal: 'breakfast',
        foods: [
          { name: '鸡蛋', calories: 155, protein: 13 },
          { name: '面包', calories: 265, carbs: 49 }
        ],
        totalCalories: 420,
        date: new Date().toISOString(),
        userId: authService.currentUser().id
      };

      // Save nutrition log
      const nutritionLog = storage.get('nutrition_log', []);
      nutritionLog.push(nutritionEntry);
      storage.save('nutrition_log', nutritionLog);

      // Emit nutrition logged event
      eventBus.emit(EventNames.NUTRITION_LOGGED, { entry: nutritionEntry });

      // Verify event triggered
      expect(nutritionCallback).toHaveBeenCalledTimes(1);

      // Verify nutrition stored
      const storedNutrition = storage.get('nutrition_log', []);
      expect(storedNutrition.length).toBe(1);
      expect(storedNutrition[0].totalCalories).toBe(420);
    });

    it('should track daily nutrition intake', () => {
      const today = new Date().toISOString().split('T')[0];

      const meals = [
        { meal: 'breakfast', calories: 450, date: today },
        { meal: 'lunch', calories: 650, date: today },
        { meal: 'dinner', calories: 700, date: today },
        { meal: 'snack', calories: 200, date: today }
      ];

      meals.forEach(meal => {
        const log = storage.get('nutrition_log', []);
        log.push({ ...meal, userId: authService.currentUser().id });
        storage.save('nutrition_log', log);
      });

      const nutritionLog = storage.get('nutrition_log', []);
      const todayEntries = nutritionLog.filter(entry => entry.date === today);
      const totalDailyCalories = todayEntries.reduce((sum, entry) => sum + entry.calories, 0);

      expect(todayEntries.length).toBe(4);
      expect(totalDailyCalories).toBe(2000);
    });
  });

  describe('Check-in and streak tracking', () => {
    it('should track daily check-ins and update streak', () => {
      const checkinData = storage.get('checkin_data', {
        streak: 0,
        lastCheckin: null,
        badges: []
      });

      // First check-in
      const today = new Date().toISOString().split('T')[0];
      checkinData.streak = 1;
      checkinData.lastCheckin = today;
      storage.save('checkin_data', checkinData);

      let storedCheckin = storage.get('checkin_data');
      expect(storedCheckin.streak).toBe(1);
      expect(storedCheckin.lastCheckin).toBe(today);

      // Consecutive check-in (next day)
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      storedCheckin.streak = 2;
      storedCheckin.lastCheckin = tomorrow;
      storage.save('checkin_data', storedCheckin);

      const updatedCheckin = storage.get('checkin_data');
      expect(updatedCheckin.streak).toBe(2);
    });

    it('should award badges for milestones', () => {
      const checkinData = {
        streak: 7,
        lastCheckin: new Date().toISOString(),
        badges: []
      };

      // Award 7-day streak badge
      checkinData.badges.push({
        id: 'week_warrior',
        name: '周战士',
        earnedAt: new Date().toISOString()
      });

      storage.save('checkin_data', checkinData);

      const storedCheckin = storage.get('checkin_data');
      expect(storedCheckin.badges.length).toBe(1);
      expect(storedCheckin.badges[0].id).toBe('week_warrior');
    });
  });

  describe('Metrics tracking flow', () => {
    it('should track body metrics over time', () => {
      const metricsHistory = storage.get('metrics_history', []);

      const metrics = [
        { date: '2025-01-01', weight: 75, bodyFat: 18 },
        { date: '2025-01-08', weight: 74.5, bodyFat: 17.5 },
        { date: '2025-01-15', weight: 74, bodyFat: 17 },
        { date: '2025-01-22', weight: 73.5, bodyFat: 16.5 }
      ];

      metrics.forEach(metric => {
        metricsHistory.push({ ...metric, userId: authService.currentUser().id });
      });

      storage.save('metrics_history', metricsHistory);

      const storedMetrics = storage.get('metrics_history', []);
      expect(storedMetrics.length).toBe(4);

      // Calculate progress
      const startWeight = storedMetrics[0].weight;
      const currentWeight = storedMetrics[storedMetrics.length - 1].weight;
      const weightLoss = startWeight - currentWeight;

      expect(weightLoss).toBe(1.5);
    });

    it('should calculate BMI from metrics', () => {
      const height = 180; // cm
      const weight = 75; // kg

      // BMI = weight (kg) / (height (m))^2
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);

      expect(bmi).toBeCloseTo(23.15, 2);

      // Store metrics with BMI
      const metrics = {
        height,
        weight,
        bmi: parseFloat(bmi.toFixed(2)),
        date: new Date().toISOString(),
        userId: authService.currentUser().id
      };

      const metricsHistory = storage.get('metrics_history', []);
      metricsHistory.push(metrics);
      storage.save('metrics_history', metricsHistory);

      const storedMetrics = storage.get('metrics_history', []);
      expect(storedMetrics[0].bmi).toBeCloseTo(23.15, 2);
    });
  });

  describe('Activity feed integration', () => {
    it('should aggregate workout and nutrition activities', () => {
      const userId = authService.currentUser().id;
      const today = new Date().toISOString();

      // Log workout
      const workout = {
        id: 1,
        type: 'workout',
        muscle: '胸部',
        duration: 45,
        calories: 350,
        date: today,
        userId
      };

      const workouts = storage.get('workouts', []);
      workouts.push(workout);
      storage.save('workouts', workouts);

      // Log nutrition
      const nutrition = {
        id: 1,
        type: 'nutrition',
        meal: 'breakfast',
        calories: 420,
        date: today,
        userId
      };

      const nutritionLog = storage.get('nutrition_log', []);
      nutritionLog.push(nutrition);
      storage.save('nutrition_log', nutritionLog);

      // Check-in
      const checkin = {
        streak: 5,
        lastCheckin: today,
        badges: [{ id: 'streak_5', name: '5日连续' }]
      };
      storage.save('checkin_data', checkin);

      // Aggregate activities
      const activities = [
        ...storage.get('workouts', []).map(w => ({ ...w, activityType: 'workout' })),
        ...storage.get('nutrition_log', []).map(n => ({ ...n, activityType: 'nutrition' }))
      ];

      expect(activities.length).toBe(2);
      expect(activities.filter(a => a.activityType === 'workout').length).toBe(1);
      expect(activities.filter(a => a.activityType === 'nutrition').length).toBe(1);
    });
  });

  describe('Event-driven updates', () => {
    it('should trigger multiple listeners when workout completed', () => {
      const activityFeedUpdate = vi.fn();
      const analyticsUpdate = vi.fn();
      const achievementCheck = vi.fn();

      eventBus.on(EventNames.WORKOUT_COMPLETED, activityFeedUpdate);
      eventBus.on(EventNames.WORKOUT_COMPLETED, analyticsUpdate);
      eventBus.on(EventNames.WORKOUT_COMPLETED, achievementCheck);

      const workout = {
        id: 1,
        muscle: '胸部',
        duration: 45,
        calories: 350
      };

      eventBus.emit(EventNames.WORKOUT_COMPLETED, { workout });

      expect(activityFeedUpdate).toHaveBeenCalledTimes(1);
      expect(analyticsUpdate).toHaveBeenCalledTimes(1);
      expect(achievementCheck).toHaveBeenCalledTimes(1);
    });

    it('should propagate events through wildcard listener', () => {
      const allActivities = [];

      eventBus.on('*', (eventName, data) => {
        allActivities.push({ event: eventName, data });
      });

      // Trigger various events
      eventBus.emit(EventNames.WORKOUT_COMPLETED, { workout: { id: 1 } });
      eventBus.emit(EventNames.NUTRITION_LOGGED, { entry: { id: 1 } });
      eventBus.emit(EventNames.PROFILE_UPDATED, { profile: { age: 25 } });

      expect(allActivities.length).toBe(3);
      expect(allActivities[0].event).toBe(EventNames.WORKOUT_COMPLETED);
      expect(allActivities[1].event).toBe(EventNames.NUTRITION_LOGGED);
      expect(allActivities[2].event).toBe(EventNames.PROFILE_UPDATED);
    });
  });

  describe('Multi-user workout isolation', () => {
    it('should isolate workout data between users', () => {
      const user1Id = authService.currentUser().id;

      // Log workout for user1
      const user1Workout = {
        id: 1,
        muscle: '胸部',
        userId: user1Id
      };

      const workouts = storage.get('workouts', []);
      workouts.push(user1Workout);
      storage.save('workouts', workouts);

      // Switch to user2
      authService.logout();
      authService.register({
        email: 'user2@example.com',
        password: 'Pass2',
        nickname: 'User2'
      });

      const user2Id = authService.currentUser().id;

      // Log workout for user2
      const user2Workout = {
        id: 2,
        muscle: '背部',
        userId: user2Id
      };

      const allWorkouts = storage.get('workouts', []);
      allWorkouts.push(user2Workout);
      storage.save('workouts', allWorkouts);

      // Verify both workouts stored
      const storedWorkouts = storage.get('workouts', []);
      expect(storedWorkouts.length).toBe(2);

      // Verify user isolation
      const user1Workouts = storedWorkouts.filter(w => w.userId === user1Id);
      const user2Workouts = storedWorkouts.filter(w => w.userId === user2Id);

      expect(user1Workouts.length).toBe(1);
      expect(user2Workouts.length).toBe(1);
      expect(user1Workouts[0].muscle).toBe('胸部');
      expect(user2Workouts[0].muscle).toBe('背部');
    });
  });

  describe('Data consistency', () => {
    it('should maintain data integrity across operations', () => {
      const userId = authService.currentUser().id;

      // Perform multiple operations
      // 1. Log workout
      const workout = { id: 1, muscle: '胸部', duration: 45, userId };
      const workouts = storage.get('workouts', []);
      workouts.push(workout);
      storage.save('workouts', workouts);

      // 2. Update profile
      authService.updateProfile({ age: 28, height: 180, weight: 75 });

      // 3. Log nutrition
      const nutrition = { id: 1, meal: 'breakfast', calories: 420, userId };
      const nutritionLog = storage.get('nutrition_log', []);
      nutritionLog.push(nutrition);
      storage.save('nutrition_log', nutritionLog);

      // 4. Check-in
      storage.save('checkin_data', { streak: 1, lastCheckin: new Date().toISOString() });

      // Verify all data stored correctly
      expect(storage.get('workouts', []).length).toBe(1);
      expect(storage.get('nutrition_log', []).length).toBe(1);
      expect(authService.currentUser().profile.age).toBe(28);
      expect(storage.get('checkin_data').streak).toBe(1);

      // Verify data relationships
      const currentUser = authService.currentUser();
      const userWorkouts = storage.get('workouts', []).filter(w => w.userId === currentUser.id);
      const userNutrition = storage.get('nutrition_log', []).filter(n => n.userId === currentUser.id);

      expect(userWorkouts.length).toBe(1);
      expect(userNutrition.length).toBe(1);
    });
  });
});
