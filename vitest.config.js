import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        '**/mock*.js'
      ]
    },
    include: ['tests/**/*.test.js'],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/assets/js/services'),
      '@modules': path.resolve(__dirname, './src/assets/js/modules'),
      '@utils': path.resolve(__dirname, './src/assets/js/utils')
    }
  }
});
