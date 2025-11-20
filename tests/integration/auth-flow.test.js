/**
 * Integration Tests for Authentication Flow
 * Tests the complete authentication workflow including storage and event bus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../src/assets/js/services/authService.js';
import { storage } from '../../src/assets/js/services/storage.js';
import { eventBus, EventNames } from '../../src/assets/js/services/eventBus.js';

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    eventBus.events = {};
  });

  describe('Complete registration flow', () => {
    it('should handle full user registration workflow', () => {
      // Set up event listeners to track flow
      const registerCallback = vi.fn();
      const loginCallback = vi.fn();

      eventBus.on(EventNames.AUTH_REGISTER, registerCallback);
      eventBus.on(EventNames.AUTH_LOGIN, loginCallback);

      // Step 1: Register new user
      const userData = {
        email: 'integration@example.com',
        password: 'TestPass123',
        nickname: 'IntegrationTest'
      };

      const registerResult = authService.register(userData);

      // Verify registration
      expect(registerResult.success).toBe(true);
      expect(registerCallback).toHaveBeenCalledTimes(1);
      expect(loginCallback).toHaveBeenCalledTimes(1); // Auto-login after register

      // Step 2: Verify user is stored
      const users = storage.get('users', []);
      expect(users.length).toBe(1);
      expect(users[0].email).toBe(userData.email);

      // Step 3: Verify current user is set
      const currentUser = authService.currentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser.email).toBe(userData.email);

      // Step 4: Verify authentication state
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should prevent duplicate registration and maintain data integrity', () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'TestPass123',
        nickname: 'User1'
      };

      // First registration
      authService.register(userData);
      const usersAfterFirst = storage.get('users', []);
      expect(usersAfterFirst.length).toBe(1);

      // Attempt duplicate registration
      authService.logout();
      const duplicateResult = authService.register(userData);

      // Verify duplicate is rejected
      expect(duplicateResult.success).toBe(false);

      // Verify no additional user was created
      const usersAfterSecond = storage.get('users', []);
      expect(usersAfterSecond.length).toBe(1);
    });
  });

  describe('Complete login/logout flow', () => {
    beforeEach(() => {
      // Pre-register a user for login tests
      authService.register({
        email: 'loginflow@example.com',
        password: 'LoginPass123',
        nickname: 'LoginFlow'
      });
      authService.logout();
    });

    it('should handle complete login workflow', () => {
      const loginCallback = vi.fn();
      eventBus.on(EventNames.AUTH_LOGIN, loginCallback);

      // Verify not authenticated before login
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.currentUser()).toBeNull();

      // Perform login
      const loginResult = authService.login('loginflow@example.com', 'LoginPass123');

      // Verify login success
      expect(loginResult.success).toBe(true);
      expect(loginCallback).toHaveBeenCalledTimes(1);

      // Verify authentication state
      expect(authService.isAuthenticated()).toBe(true);
      const currentUser = authService.currentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser.email).toBe('loginflow@example.com');

      // Verify storage
      const storedUser = storage.get('currentUser');
      expect(storedUser).toEqual(currentUser);
    });

    it('should handle complete logout workflow', () => {
      const logoutCallback = vi.fn();

      // Login first
      authService.login('loginflow@example.com', 'LoginPass123');
      expect(authService.isAuthenticated()).toBe(true);

      // Set up logout listener
      eventBus.on(EventNames.AUTH_LOGOUT, logoutCallback);

      // Perform logout
      authService.logout();

      // Verify logout
      expect(logoutCallback).toHaveBeenCalledTimes(1);
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.currentUser()).toBeNull();

      // Verify storage cleared
      const storedUser = storage.get('currentUser');
      expect(storedUser).toBeNull();
    });

    it('should handle failed login attempts without affecting state', () => {
      const loginCallback = vi.fn();
      eventBus.on(EventNames.AUTH_LOGIN, loginCallback);

      // Attempt login with wrong password
      const failedResult = authService.login('loginflow@example.com', 'WrongPassword');

      // Verify login failed
      expect(failedResult.success).toBe(false);
      expect(loginCallback).not.toHaveBeenCalled();

      // Verify authentication state unchanged
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.currentUser()).toBeNull();

      // Verify no user in storage
      const storedUser = storage.get('currentUser');
      expect(storedUser).toBeNull();
    });
  });

  describe('Profile management flow', () => {
    beforeEach(() => {
      authService.register({
        email: 'profile@example.com',
        password: 'ProfilePass123',
        nickname: 'ProfileTest'
      });
    });

    it('should handle profile update workflow', () => {
      const profileCallback = vi.fn();
      eventBus.on(EventNames.PROFILE_UPDATED, profileCallback);

      const currentUser = authService.currentUser();
      expect(currentUser.profile).toBeUndefined();

      // Update profile
      const profileData = {
        age: 28,
        height: 175,
        weight: 70,
        gender: 'male',
        fitnessGoal: 'muscle_gain'
      };

      const updateResult = authService.updateProfile(profileData);

      // Verify update
      expect(updateResult.success).toBe(true);
      expect(profileCallback).toHaveBeenCalledTimes(1);
      expect(updateResult.user.profile).toEqual(profileData);

      // Verify persistence
      const updatedUser = authService.currentUser();
      expect(updatedUser.profile).toEqual(profileData);

      // Verify storage
      const storedUser = storage.get('currentUser');
      expect(storedUser.profile).toEqual(profileData);

      // Verify in users array
      const users = storage.get('users', []);
      const user = users.find(u => u.email === 'profile@example.com');
      expect(user.profile).toEqual(profileData);
    });

    it('should handle incremental profile updates', () => {
      // First update
      authService.updateProfile({ age: 25, height: 180 });

      // Second update
      authService.updateProfile({ weight: 75 });

      // Third update
      authService.updateProfile({ gender: 'male' });

      // Verify all data merged
      const currentUser = authService.currentUser();
      expect(currentUser.profile).toEqual({
        age: 25,
        height: 180,
        weight: 75,
        gender: 'male'
      });
    });
  });

  describe('Password change flow', () => {
    beforeEach(() => {
      authService.register({
        email: 'pwdchange@example.com',
        password: 'OldPassword123',
        nickname: 'PwdChange'
      });
    });

    it('should handle password change and re-authentication', () => {
      // Change password
      const changeResult = authService.changePassword('OldPassword123', 'NewPassword456');
      expect(changeResult.success).toBe(true);

      // Verify old password no longer works
      authService.logout();
      const oldLoginResult = authService.login('pwdchange@example.com', 'OldPassword123');
      expect(oldLoginResult.success).toBe(false);

      // Verify new password works
      const newLoginResult = authService.login('pwdchange@example.com', 'NewPassword456');
      expect(newLoginResult.success).toBe(true);
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('Multi-user scenario', () => {
    it('should handle multiple user registrations and switching', () => {
      // Register multiple users
      const user1 = { email: 'user1@example.com', password: 'Pass1', nickname: 'User1' };
      const user2 = { email: 'user2@example.com', password: 'Pass2', nickname: 'User2' };
      const user3 = { email: 'user3@example.com', password: 'Pass3', nickname: 'User3' };

      authService.register(user1);
      authService.logout();
      authService.register(user2);
      authService.logout();
      authService.register(user3);
      authService.logout();

      // Verify all users stored
      const users = storage.get('users', []);
      expect(users.length).toBe(3);

      // Login as user1
      authService.login('user1@example.com', 'Pass1');
      expect(authService.currentUser().email).toBe('user1@example.com');

      // Switch to user2
      authService.logout();
      authService.login('user2@example.com', 'Pass2');
      expect(authService.currentUser().email).toBe('user2@example.com');

      // Switch to user3
      authService.logout();
      authService.login('user3@example.com', 'Pass3');
      expect(authService.currentUser().email).toBe('user3@example.com');
    });
  });

  describe('Event propagation in authentication flow', () => {
    it('should trigger events in correct order during registration', () => {
      const eventOrder = [];

      eventBus.on(EventNames.AUTH_REGISTER, () => eventOrder.push('register'));
      eventBus.on(EventNames.AUTH_LOGIN, () => eventOrder.push('login'));

      authService.register({
        email: 'eventorder@example.com',
        password: 'EventPass123',
        nickname: 'EventOrder'
      });

      expect(eventOrder).toEqual(['register', 'login']);
    });

    it('should trigger wildcard listener for all auth events', () => {
      const allEvents = [];
      eventBus.on('*', (eventName) => allEvents.push(eventName));

      // Register (triggers REGISTER + LOGIN)
      authService.register({
        email: 'wildcard@example.com',
        password: 'WildPass123',
        nickname: 'Wildcard'
      });

      // Update profile
      authService.updateProfile({ age: 25 });

      // Logout
      authService.logout();

      expect(allEvents).toContain(EventNames.AUTH_REGISTER);
      expect(allEvents).toContain(EventNames.AUTH_LOGIN);
      expect(allEvents).toContain(EventNames.PROFILE_UPDATED);
      expect(allEvents).toContain(EventNames.AUTH_LOGOUT);
    });
  });

  describe('Persistence and recovery', () => {
    it('should persist authentication state across page reloads', () => {
      // Register and login
      authService.register({
        email: 'persist@example.com',
        password: 'PersistPass123',
        nickname: 'Persist'
      });

      const userBeforeReload = authService.currentUser();

      // Simulate page reload by clearing in-memory state but keeping localStorage
      // (In real scenario, the app would re-initialize from storage)
      const storedUser = storage.get('currentUser');
      const storedUsers = storage.get('users');

      expect(storedUser).toEqual(userBeforeReload);
      expect(storedUsers.length).toBeGreaterThan(0);

      // Verify data is retrievable
      const recoveredUser = storage.get('currentUser');
      expect(recoveredUser.email).toBe('persist@example.com');
    });

    it('should handle corrupted storage data gracefully', () => {
      // Corrupt the users data
      localStorage.setItem('users', 'invalid json');

      // Should not throw error
      expect(() => {
        const users = storage.get('users', []);
        expect(users).toEqual([]);
      }).not.toThrow();
    });
  });

  describe('Security integration', () => {
    it('should never expose passwords in any part of the flow', () => {
      const plainPassword = 'SecurePassword123';

      // Register
      const registerResult = authService.register({
        email: 'security@example.com',
        password: plainPassword,
        nickname: 'Security'
      });

      // Check registration result
      expect(registerResult.user.password).toBeUndefined();
      expect(JSON.stringify(registerResult)).not.toContain(plainPassword);

      // Check current user
      const currentUser = authService.currentUser();
      expect(currentUser.password).toBeUndefined();
      expect(JSON.stringify(currentUser)).not.toContain(plainPassword);

      // Check storage
      const storedUser = storage.get('currentUser');
      expect(storedUser.password).toBeUndefined();
      expect(JSON.stringify(storedUser)).not.toContain(plainPassword);

      // Check users array (contains hashed password)
      const users = storage.get('users', []);
      const user = users[0];
      expect(user.password).not.toBe(plainPassword);
      expect(user.password.length).toBeGreaterThan(plainPassword.length);
    });
  });
});
