/**
 * Unit Tests for Event Bus Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventBus, EventNames } from '../../src/assets/js/services/eventBus.js';

describe('Event Bus Service', () => {
  beforeEach(() => {
    // Clear all event listeners before each test
    eventBus.events = {};
  });

  describe('on() - Event registration', () => {
    it('should register an event listener', () => {
      const callback = vi.fn();
      eventBus.on('test-event', callback);

      eventBus.emit('test-event', { data: 'test' });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should allow multiple listeners for the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('multi-event', callback1);
      eventBus.on('multi-event', callback2);

      eventBus.emit('multi-event', { value: 42 });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback1).toHaveBeenCalledWith({ value: 42 });
      expect(callback2).toHaveBeenCalledWith({ value: 42 });
    });

    it('should support priority ordering', () => {
      const executionOrder = [];

      eventBus.on('priority-event', () => executionOrder.push('low'), 1);
      eventBus.on('priority-event', () => executionOrder.push('high'), 10);
      eventBus.on('priority-event', () => executionOrder.push('medium'), 5);

      eventBus.emit('priority-event');

      expect(executionOrder).toEqual(['high', 'medium', 'low']);
    });
  });

  describe('once() - One-time event listener', () => {
    it('should execute listener only once', () => {
      const callback = vi.fn();
      eventBus.once('once-event', callback);

      eventBus.emit('once-event', { first: true });
      eventBus.emit('once-event', { second: true });
      eventBus.emit('once-event', { third: true });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ first: true });
    });

    it('should support priority in once listeners', () => {
      const executionOrder = [];

      eventBus.once('once-priority', () => executionOrder.push('high'), 10);
      eventBus.once('once-priority', () => executionOrder.push('low'), 1);

      eventBus.emit('once-priority');

      expect(executionOrder).toEqual(['high', 'low']);
    });
  });

  describe('off() - Event unregistration', () => {
    it('should remove a specific event listener', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('remove-event', callback1);
      eventBus.on('remove-event', callback2);

      eventBus.emit('remove-event');
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      eventBus.off('remove-event', callback1);
      eventBus.emit('remove-event');

      expect(callback1).toHaveBeenCalledTimes(1); // Still 1
      expect(callback2).toHaveBeenCalledTimes(2); // Incremented
    });

    it('should remove all listeners if no callback provided', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('remove-all', callback1);
      eventBus.on('remove-all', callback2);

      eventBus.off('remove-all');
      eventBus.emit('remove-all');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('emit() - Event triggering', () => {
    it('should pass data to event listeners', () => {
      const callback = vi.fn();
      const testData = { user: 'John', age: 30 };

      eventBus.on('data-event', callback);
      eventBus.emit('data-event', testData);

      expect(callback).toHaveBeenCalledWith(testData);
    });

    it('should not throw error when emitting unregistered event', () => {
      expect(() => eventBus.emit('non-existent-event')).not.toThrow();
    });

    it('should handle errors in event listeners gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = vi.fn();

      eventBus.on('error-event', errorCallback);
      eventBus.on('error-event', normalCallback);

      expect(() => eventBus.emit('error-event')).not.toThrow();
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('emitAsync() - Asynchronous event triggering', () => {
    it('should handle async event listeners', async () => {
      const results = [];
      const asyncCallback = vi.fn(async (data) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push(data.value);
      });

      eventBus.on('async-event', asyncCallback);
      await eventBus.emitAsync('async-event', { value: 42 });

      expect(asyncCallback).toHaveBeenCalled();
      expect(results).toContain(42);
    });

    it('should wait for all async listeners to complete', async () => {
      const executionOrder = [];

      eventBus.on('async-multi', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        executionOrder.push('slow');
      });

      eventBus.on('async-multi', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push('fast');
      });

      await eventBus.emitAsync('async-multi');

      expect(executionOrder.length).toBe(2);
      expect(executionOrder).toContain('slow');
      expect(executionOrder).toContain('fast');
    });
  });

  describe('Wildcard listener (*)', () => {
    it('should trigger on all events', () => {
      const wildcardCallback = vi.fn();

      eventBus.on('*', wildcardCallback);

      eventBus.emit('event1', { data: 1 });
      eventBus.emit('event2', { data: 2 });
      eventBus.emit('event3', { data: 3 });

      expect(wildcardCallback).toHaveBeenCalledTimes(3);
      expect(wildcardCallback).toHaveBeenCalledWith('event1', { data: 1 });
      expect(wildcardCallback).toHaveBeenCalledWith('event2', { data: 2 });
      expect(wildcardCallback).toHaveBeenCalledWith('event3', { data: 3 });
    });

    it('should not interfere with specific event listeners', () => {
      const specificCallback = vi.fn();
      const wildcardCallback = vi.fn();

      eventBus.on('specific-event', specificCallback);
      eventBus.on('*', wildcardCallback);

      eventBus.emit('specific-event', { test: true });

      expect(specificCallback).toHaveBeenCalledTimes(1);
      expect(specificCallback).toHaveBeenCalledWith({ test: true });
      expect(wildcardCallback).toHaveBeenCalledTimes(1);
      expect(wildcardCallback).toHaveBeenCalledWith('specific-event', { test: true });
    });
  });

  describe('EventNames constants', () => {
    it('should have all required event name constants', () => {
      expect(EventNames).toHaveProperty('AUTH_LOGIN');
      expect(EventNames).toHaveProperty('AUTH_LOGOUT');
      expect(EventNames).toHaveProperty('AUTH_REGISTER');
      expect(EventNames).toHaveProperty('WORKOUT_COMPLETED');
      expect(EventNames).toHaveProperty('NUTRITION_LOGGED');
      expect(EventNames).toHaveProperty('MODAL_OPEN');
      expect(EventNames).toHaveProperty('MODAL_CLOSE');
    });

    it('should work with EventNames constants', () => {
      const callback = vi.fn();

      eventBus.on(EventNames.AUTH_LOGIN, callback);
      eventBus.emit(EventNames.AUTH_LOGIN, { user: { email: 'test@example.com' } });

      expect(callback).toHaveBeenCalledWith({ user: { email: 'test@example.com' } });
    });
  });

  describe('Memory management', () => {
    it('should properly clean up once listeners', () => {
      const callback = vi.fn();

      eventBus.once('cleanup-test', callback);
      eventBus.emit('cleanup-test');

      // Check that the listener has been removed
      const listeners = eventBus.events['cleanup-test'] || [];
      expect(listeners.length).toBe(0);
    });

    it('should handle removing non-existent listeners', () => {
      const callback = vi.fn();

      expect(() => eventBus.off('non-existent', callback)).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty event names', () => {
      const callback = vi.fn();

      eventBus.on('', callback);
      eventBus.emit('', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should handle undefined data', () => {
      const callback = vi.fn();

      eventBus.on('undefined-data', callback);
      eventBus.emit('undefined-data');

      expect(callback).toHaveBeenCalledWith(undefined);
    });

    it('should handle multiple rapid emissions', () => {
      const callback = vi.fn();

      eventBus.on('rapid-event', callback);

      for (let i = 0; i < 100; i++) {
        eventBus.emit('rapid-event', { count: i });
      }

      expect(callback).toHaveBeenCalledTimes(100);
    });
  });
});
