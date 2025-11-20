/**
 * Unit Tests for Storage Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../../src/assets/js/services/storage.js';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('save() and get()', () => {
    it('should save and retrieve a string value', () => {
      storage.save('testKey', 'testValue');
      const result = storage.get('testKey');
      expect(result).toBe('testValue');
    });

    it('should save and retrieve an object', () => {
      const testObj = { name: 'Test', age: 25 };
      storage.save('testObj', testObj);
      const result = storage.get('testObj');
      expect(result).toEqual(testObj);
    });

    it('should save and retrieve an array', () => {
      const testArray = [1, 2, 3, 4, 5];
      storage.save('testArray', testArray);
      const result = storage.get('testArray');
      expect(result).toEqual(testArray);
    });

    it('should return default value if key does not exist', () => {
      const result = storage.get('nonExistentKey', 'defaultValue');
      expect(result).toBe('defaultValue');
    });

    it('should return null if key does not exist and no default provided', () => {
      const result = storage.get('nonExistentKey');
      expect(result).toBeNull();
    });

    it('should handle nested objects', () => {
      const nested = {
        user: {
          profile: {
            name: 'John',
            settings: {
              theme: 'dark'
            }
          }
        }
      };
      storage.save('nested', nested);
      const result = storage.get('nested');
      expect(result).toEqual(nested);
      expect(result.user.profile.settings.theme).toBe('dark');
    });
  });

  describe('remove()', () => {
    it('should remove a key from storage', () => {
      storage.save('toRemove', 'value');
      expect(storage.get('toRemove')).toBe('value');

      storage.remove('toRemove');
      expect(storage.get('toRemove')).toBeNull();
    });

    it('should not throw error when removing non-existent key', () => {
      expect(() => storage.remove('nonExistent')).not.toThrow();
    });
  });

  describe('clear()', () => {
    it('should clear all storage', () => {
      storage.save('key1', 'value1');
      storage.save('key2', 'value2');
      storage.save('key3', 'value3');

      expect(storage.get('key1')).toBe('value1');
      expect(storage.get('key2')).toBe('value2');

      storage.clear();

      expect(storage.get('key1')).toBeNull();
      expect(storage.get('key2')).toBeNull();
      expect(storage.get('key3')).toBeNull();
    });
  });

  describe('has()', () => {
    it('should return true if key exists', () => {
      storage.save('existingKey', 'value');
      expect(storage.has('existingKey')).toBe(true);
    });

    it('should return false if key does not exist', () => {
      expect(storage.has('nonExistentKey')).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      // Directly set invalid JSON in localStorage
      localStorage.setItem('invalidJSON', '{invalid json}');

      const result = storage.get('invalidJSON', 'default');
      expect(result).toBe('default');
    });

    it('should handle circular reference objects', () => {
      const circular = { name: 'test' };
      circular.self = circular; // Create circular reference

      // Should not throw, but will not save circular references properly
      expect(() => storage.save('circular', circular)).not.toThrow();
    });
  });

  describe('Complex data types', () => {
    it('should handle Date objects (converted to string)', () => {
      const date = new Date('2025-01-01');
      storage.save('date', date);
      const result = storage.get('date');
      // Dates are serialized as ISO strings
      expect(result).toBe(date.toISOString());
    });

    it('should handle boolean values', () => {
      storage.save('boolTrue', true);
      storage.save('boolFalse', false);

      expect(storage.get('boolTrue')).toBe(true);
      expect(storage.get('boolFalse')).toBe(false);
    });

    it('should handle number values', () => {
      storage.save('intNumber', 42);
      storage.save('floatNumber', 3.14);
      storage.save('negativeNumber', -100);

      expect(storage.get('intNumber')).toBe(42);
      expect(storage.get('floatNumber')).toBe(3.14);
      expect(storage.get('negativeNumber')).toBe(-100);
    });

    it('should handle null and undefined', () => {
      storage.save('nullValue', null);
      storage.save('undefinedValue', undefined);

      expect(storage.get('nullValue')).toBeNull();
      // undefined gets converted to null in JSON
      expect(storage.get('undefinedValue')).toBeNull();
    });
  });

  describe('Storage capacity', () => {
    it('should handle large data sets', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: `Some data for item ${i}`
      }));

      storage.save('largeData', largeArray);
      const result = storage.get('largeData');

      expect(result).toEqual(largeArray);
      expect(result.length).toBe(1000);
    });
  });
});
