/**
 * Test Setup Configuration
 * Sets up the testing environment for Vitest
 */

import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;

// Mock window.location
delete global.window.location;
global.window.location = {
  href: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  origin: 'http://localhost:3000',
  reload: vi.fn(),
  replace: vi.fn(),
  assign: vi.fn()
};

// Mock navigator.clipboard
global.navigator.clipboard = {
  writeText: vi.fn(() => Promise.resolve()),
  readText: vi.fn(() => Promise.resolve(''))
};

// Mock navigator.share (Web Share API)
global.navigator.share = vi.fn(() => Promise.resolve());

// Mock window.open
global.window.open = vi.fn();

// Mock alert, confirm, prompt
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
global.prompt = vi.fn(() => 'test');

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Setup DOM
if (!global.document.body) {
  const body = document.createElement('body');
  document.body = body;
}

// Clear mocks and localStorage before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Cleanup after each test
afterEach(() => {
  vi.restoreAllMocks();
});
