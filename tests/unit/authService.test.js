/**
 * Unit Tests for Authentication Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../src/assets/js/services/authService.js';
import { storage } from '../../src/assets/js/services/storage.js';
import { eventBus, EventNames } from '../../src/assets/js/services/eventBus.js';

describe('Auth Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    eventBus.events = {};
  });

  describe('register()', () => {
    it('should successfully register a new user', () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        nickname: 'NewUser'
      };

      const result = authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.nickname).toBe(userData.nickname);
      expect(result.user.id).toBeDefined();
      expect(result.user.password).toBeUndefined(); // Password should not be in returned user
    });

    it('should not allow duplicate email registration', () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password123',
        nickname: 'User1'
      };

      authService.register(userData);
      const result = authService.register(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('已存在');
    });

    it('should hash password before storing', () => {
      const userData = {
        email: 'hashtest@example.com',
        password: 'PlainPassword123',
        nickname: 'HashTest'
      };

      authService.register(userData);
      const users = storage.get('users', []);
      const savedUser = users.find(u => u.email === userData.email);

      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password).toBeTruthy();
    });

    it('should validate email format', () => {
      const invalidEmails = [
        { email: 'notanemail', password: 'Pass123', nickname: 'Test' },
        { email: 'missing@domain', password: 'Pass123', nickname: 'Test' },
        { email: '@nodomain.com', password: 'Pass123', nickname: 'Test' },
        { email: '', password: 'Pass123', nickname: 'Test' }
      ];

      invalidEmails.forEach(userData => {
        const result = authService.register(userData);
        expect(result.success).toBe(false);
      });
    });

    it('should validate password strength', () => {
      const weakPasswords = [
        { email: 'test@example.com', password: '123', nickname: 'Test' },
        { email: 'test@example.com', password: 'short', nickname: 'Test' },
        { email: 'test@example.com', password: '', nickname: 'Test' }
      ];

      weakPasswords.forEach(userData => {
        localStorage.clear(); // Clear between tests
        const result = authService.register(userData);
        expect(result.success).toBe(false);
        expect(result.error).toContain('密码');
      });
    });

    it('should emit AUTH_REGISTER event on success', () => {
      const callback = vi.fn();
      eventBus.on(EventNames.AUTH_REGISTER, callback);

      const userData = {
        email: 'eventtest@example.com',
        password: 'Password123',
        nickname: 'EventTest'
      };

      authService.register(userData);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({
          email: userData.email
        })
      }));
    });
  });

  describe('login()', () => {
    beforeEach(() => {
      // Register a test user before each login test
      authService.register({
        email: 'logintest@example.com',
        password: 'TestPass123',
        nickname: 'LoginTest'
      });
      // Logout to clear current user
      authService.logout();
    });

    it('should successfully login with correct credentials', () => {
      const result = authService.login('logintest@example.com', 'TestPass123');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('logintest@example.com');
    });

    it('should fail login with incorrect password', () => {
      const result = authService.login('logintest@example.com', 'WrongPassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('密码错误');
    });

    it('should fail login with non-existent email', () => {
      const result = authService.login('nonexistent@example.com', 'Password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('未找到');
    });

    it('should set currentUser after successful login', () => {
      authService.login('logintest@example.com', 'TestPass123');
      const currentUser = authService.currentUser();

      expect(currentUser).toBeDefined();
      expect(currentUser.email).toBe('logintest@example.com');
    });

    it('should emit AUTH_LOGIN event on success', () => {
      const callback = vi.fn();
      eventBus.on(EventNames.AUTH_LOGIN, callback);

      authService.login('logintest@example.com', 'TestPass123');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({
          email: 'logintest@example.com'
        })
      }));
    });

    it('should not store password in currentUser', () => {
      authService.login('logintest@example.com', 'TestPass123');
      const currentUser = authService.currentUser();

      expect(currentUser.password).toBeUndefined();
    });
  });

  describe('logout()', () => {
    beforeEach(() => {
      authService.register({
        email: 'logouttest@example.com',
        password: 'TestPass123',
        nickname: 'LogoutTest'
      });
    });

    it('should clear current user', () => {
      authService.logout();
      const currentUser = authService.currentUser();

      expect(currentUser).toBeNull();
    });

    it('should emit AUTH_LOGOUT event', () => {
      const callback = vi.fn();
      const user = authService.currentUser();

      eventBus.on(EventNames.AUTH_LOGOUT, callback);
      authService.logout();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({
          email: user.email
        })
      }));
    });

    it('should be idempotent (can call multiple times)', () => {
      authService.logout();
      expect(() => authService.logout()).not.toThrow();
      expect(authService.currentUser()).toBeNull();
    });
  });

  describe('currentUser()', () => {
    it('should return null when no user is logged in', () => {
      const currentUser = authService.currentUser();
      expect(currentUser).toBeNull();
    });

    it('should return current user after login', () => {
      authService.register({
        email: 'current@example.com',
        password: 'TestPass123',
        nickname: 'Current'
      });

      const currentUser = authService.currentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser.email).toBe('current@example.com');
    });

    it('should persist current user across page reloads (via localStorage)', () => {
      authService.register({
        email: 'persist@example.com',
        password: 'TestPass123',
        nickname: 'Persist'
      });

      const userBeforeReload = authService.currentUser();

      // Simulate page reload by getting from storage
      const userAfterReload = storage.get('currentUser');

      expect(userAfterReload).toEqual(userBeforeReload);
    });
  });

  describe('updateProfile()', () => {
    beforeEach(() => {
      authService.register({
        email: 'updatetest@example.com',
        password: 'TestPass123',
        nickname: 'UpdateTest'
      });
    });

    it('should update user profile data', () => {
      const profileData = {
        age: 25,
        height: 180,
        weight: 75,
        gender: 'male'
      };

      const result = authService.updateProfile(profileData);

      expect(result.success).toBe(true);
      expect(result.user.profile).toEqual(profileData);
    });

    it('should merge profile data with existing data', () => {
      authService.updateProfile({ age: 25, height: 180 });
      const result = authService.updateProfile({ weight: 75 });

      expect(result.user.profile.age).toBe(25);
      expect(result.user.profile.height).toBe(180);
      expect(result.user.profile.weight).toBe(75);
    });

    it('should fail if no user is logged in', () => {
      authService.logout();
      const result = authService.updateProfile({ age: 25 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('未登录');
    });

    it('should emit PROFILE_UPDATED event', () => {
      const callback = vi.fn();
      eventBus.on(EventNames.PROFILE_UPDATED, callback);

      authService.updateProfile({ age: 30 });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('changePassword()', () => {
    beforeEach(() => {
      authService.register({
        email: 'pwdtest@example.com',
        password: 'OldPass123',
        nickname: 'PwdTest'
      });
    });

    it('should change password with correct old password', () => {
      const result = authService.changePassword('OldPass123', 'NewPass123');

      expect(result.success).toBe(true);

      // Verify new password works
      authService.logout();
      const loginResult = authService.login('pwdtest@example.com', 'NewPass123');
      expect(loginResult.success).toBe(true);
    });

    it('should fail with incorrect old password', () => {
      const result = authService.changePassword('WrongOldPass', 'NewPass123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('原密码错误');
    });

    it('should validate new password strength', () => {
      const result = authService.changePassword('OldPass123', '123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('密码');
    });

    it('should fail if no user is logged in', () => {
      authService.logout();
      const result = authService.changePassword('OldPass123', 'NewPass123');

      expect(result.success).toBe(false);
    });
  });

  describe('isAuthenticated()', () => {
    it('should return false when no user is logged in', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when user is logged in', () => {
      authService.register({
        email: 'authcheck@example.com',
        password: 'TestPass123',
        nickname: 'AuthCheck'
      });

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false after logout', () => {
      authService.register({
        email: 'authcheck2@example.com',
        password: 'TestPass123',
        nickname: 'AuthCheck2'
      });

      expect(authService.isAuthenticated()).toBe(true);
      authService.logout();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('Security', () => {
    it('should not expose password in any returned user object', () => {
      const registerResult = authService.register({
        email: 'security@example.com',
        password: 'SecurePass123',
        nickname: 'Security'
      });

      expect(registerResult.user.password).toBeUndefined();

      const loginResult = authService.login('security@example.com', 'SecurePass123');
      expect(loginResult.user.password).toBeUndefined();

      const currentUser = authService.currentUser();
      expect(currentUser.password).toBeUndefined();
    });

    it('should store hashed passwords only', () => {
      authService.register({
        email: 'hash@example.com',
        password: 'PlainPassword123',
        nickname: 'Hash'
      });

      const users = storage.get('users', []);
      const user = users.find(u => u.email === 'hash@example.com');

      expect(user.password).not.toBe('PlainPassword123');
      expect(user.password.length).toBeGreaterThan(20); // Hashes are longer
    });
  });
});
