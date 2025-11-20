# FitSpark Testing Documentation

Complete guide to testing the FitSpark application, including unit tests, integration tests, and testing best practices.

## Table of Contents

- [Overview](#overview)
- [Test Setup](#test-setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [Writing New Tests](#writing-new-tests)
- [Code Coverage](#code-coverage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

FitSpark uses **Vitest** as the testing framework. Vitest provides:

- Fast execution with native ES module support
- Jest-compatible API
- Built-in code coverage with V8
- Watch mode for development
- TypeScript support out of the box

### Test Types

1. **Unit Tests** (`tests/unit/`)
   - Test individual functions and modules in isolation
   - Mock external dependencies
   - Fast execution

2. **Integration Tests** (`tests/integration/`)
   - Test how multiple modules work together
   - Test complete user workflows
   - Verify data flow between services

## Test Setup

### Installation

```bash
# Install dependencies
npm install

# Install testing dependencies explicitly
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 jsdom
```

### Configuration

Test configuration is in `vitest.config.js`:

```javascript
{
  test: {
    globals: true,              // Enable global test APIs
    environment: 'jsdom',       // Browser-like environment
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
}
```

### Setup File

`tests/setup.js` configures the test environment:

- Mocks localStorage and sessionStorage
- Mocks window.location
- Mocks navigator.clipboard
- Mocks Web Share API
- Clears mocks between tests

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-reruns on file changes)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Watch Mode

Watch mode is ideal for development:

```bash
npm run test:watch
```

Commands in watch mode:
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `t` to filter by test name
- Press `q` to quit

### Coverage Reports

Generate coverage reports:

```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory:
- `coverage/index.html` - Visual HTML report
- `coverage/coverage-final.json` - JSON data
- Console output shows coverage summary

## Test Structure

```
tests/
├── setup.js                      # Global test setup
├── unit/                         # Unit tests
│   ├── storage.test.js          # Storage service tests
│   ├── eventBus.test.js         # Event bus tests
│   └── authService.test.js      # Auth service tests
└── integration/                  # Integration tests
    ├── auth-flow.test.js        # Authentication workflow
    └── workout-flow.test.js     # Workout tracking workflow
```

## Unit Tests

### Storage Service Tests (`tests/unit/storage.test.js`)

Tests the localStorage abstraction layer.

**Test Coverage:**
- ✅ Save and retrieve values (string, object, array)
- ✅ Default values for missing keys
- ✅ Remove and clear operations
- ✅ Check key existence
- ✅ Error handling (invalid JSON, circular references)
- ✅ Complex data types (Date, Boolean, Number, null, undefined)
- ✅ Large data sets

**Example:**
```javascript
describe('Storage Service', () => {
  it('should save and retrieve an object', () => {
    const testObj = { name: 'Test', age: 25 };
    storage.save('testObj', testObj);
    const result = storage.get('testObj');
    expect(result).toEqual(testObj);
  });
});
```

### Event Bus Tests (`tests/unit/eventBus.test.js`)

Tests the publish-subscribe event system.

**Test Coverage:**
- ✅ Event registration with `on()`
- ✅ One-time listeners with `once()`
- ✅ Event unregistration with `off()`
- ✅ Event emission with `emit()`
- ✅ Async event handling with `emitAsync()`
- ✅ Priority ordering
- ✅ Wildcard listeners (`*`)
- ✅ Error handling in listeners
- ✅ Memory management

**Example:**
```javascript
describe('Event Bus Service', () => {
  it('should trigger multiple listeners', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    eventBus.on('test-event', callback1);
    eventBus.on('test-event', callback2);
    eventBus.emit('test-event', { data: 'test' });

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
```

### Auth Service Tests (`tests/unit/authService.test.js`)

Tests user authentication and authorization.

**Test Coverage:**
- ✅ User registration with validation
- ✅ Login with credentials
- ✅ Logout functionality
- ✅ Current user retrieval
- ✅ Profile updates
- ✅ Password changes
- ✅ Authentication state
- ✅ Email format validation
- ✅ Password strength validation
- ✅ Event emissions
- ✅ Security (password hashing, no password exposure)

**Example:**
```javascript
describe('Auth Service', () => {
  it('should successfully register a new user', () => {
    const result = authService.register({
      email: 'test@example.com',
      password: 'SecurePass123',
      nickname: 'Test'
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.password).toBeUndefined(); // Security check
  });
});
```

## Integration Tests

### Authentication Flow (`tests/integration/auth-flow.test.js`)

Tests complete authentication workflows.

**Test Coverage:**
- ✅ Complete registration flow (register → login → storage → events)
- ✅ Duplicate registration prevention
- ✅ Login/logout workflow
- ✅ Failed login handling
- ✅ Profile management
- ✅ Password change and re-authentication
- ✅ Multi-user scenarios
- ✅ Event propagation order
- ✅ State persistence across page reloads
- ✅ Corrupted data handling
- ✅ Security (no password exposure)

**Example:**
```javascript
describe('Authentication Flow Integration', () => {
  it('should handle full user registration workflow', () => {
    const registerCallback = vi.fn();
    eventBus.on(EventNames.AUTH_REGISTER, registerCallback);

    // Register
    authService.register({
      email: 'test@example.com',
      password: 'Pass123',
      nickname: 'Test'
    });

    // Verify all steps
    expect(registerCallback).toHaveBeenCalled();
    expect(storage.get('users').length).toBe(1);
    expect(authService.isAuthenticated()).toBe(true);
  });
});
```

### Workout Flow (`tests/integration/workout-flow.test.js`)

Tests workout and activity tracking.

**Test Coverage:**
- ✅ Workout logging and events
- ✅ Multiple workout tracking
- ✅ Workout statistics calculation
- ✅ Nutrition logging
- ✅ Daily nutrition intake tracking
- ✅ Check-in and streak tracking
- ✅ Badge awarding
- ✅ Body metrics tracking
- ✅ BMI calculation
- ✅ Activity feed aggregation
- ✅ Event-driven updates
- ✅ Multi-user isolation
- ✅ Data consistency

**Example:**
```javascript
describe('Workout Flow Integration', () => {
  it('should log workout and trigger events', () => {
    const callback = vi.fn();
    eventBus.on(EventNames.WORKOUT_COMPLETED, callback);

    const workout = {
      muscle: '胸部',
      duration: 45,
      calories: 350
    };

    // Save and emit
    storage.save('workouts', [workout]);
    eventBus.emit(EventNames.WORKOUT_COMPLETED, { workout });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(storage.get('workouts').length).toBe(1);
  });
});
```

## Writing New Tests

### Test File Structure

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { yourModule } from '../path/to/module.js';

describe('Module Name', () => {
  beforeEach(() => {
    // Setup before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Function Name', () => {
    it('should do something specific', () => {
      // Arrange
      const input = { data: 'test' };

      // Act
      const result = yourModule.doSomething(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Best Practices for Writing Tests

1. **Follow AAA Pattern**
   - **Arrange**: Set up test data and conditions
   - **Act**: Execute the function/action
   - **Assert**: Verify the result

2. **Use Descriptive Test Names**
   ```javascript
   // Good
   it('should return null when user is not logged in', () => {});

   // Bad
   it('test 1', () => {});
   ```

3. **Test One Thing Per Test**
   ```javascript
   // Good
   it('should validate email format', () => {});
   it('should validate password length', () => {});

   // Bad
   it('should validate input', () => {
     // Tests email, password, name all together
   });
   ```

4. **Use beforeEach for Common Setup**
   ```javascript
   describe('Auth Tests', () => {
     beforeEach(() => {
       localStorage.clear();
       authService.logout();
     });

     it('test 1', () => {});
     it('test 2', () => {});
   });
   ```

5. **Mock External Dependencies**
   ```javascript
   const mockFetch = vi.fn(() => Promise.resolve({ data: 'test' }));
   global.fetch = mockFetch;
   ```

6. **Test Edge Cases**
   - Empty inputs
   - Null/undefined values
   - Invalid data types
   - Boundary conditions

7. **Test Error Handling**
   ```javascript
   it('should handle errors gracefully', () => {
     expect(() => riskyFunction()).not.toThrow();
   });
   ```

### Mocking Guide

**Mock Functions:**
```javascript
const mockCallback = vi.fn();
mockCallback('test');
expect(mockCallback).toHaveBeenCalledWith('test');
```

**Mock Return Values:**
```javascript
const mock = vi.fn(() => 42);
expect(mock()).toBe(42);
```

**Mock Async Functions:**
```javascript
const mockAsync = vi.fn(() => Promise.resolve('data'));
const result = await mockAsync();
expect(result).toBe('data');
```

**Spy on Objects:**
```javascript
const spy = vi.spyOn(object, 'method');
object.method();
expect(spy).toHaveBeenCalled();
```

## Code Coverage

### Coverage Metrics

- **Line Coverage**: Percentage of lines executed
- **Branch Coverage**: Percentage of conditional branches tested
- **Function Coverage**: Percentage of functions called
- **Statement Coverage**: Percentage of statements executed

### Target Coverage

FitSpark aims for:
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: 60%+ coverage
- **Overall**: 70%+ coverage

### Viewing Coverage

```bash
# Generate and view coverage
npm run test:coverage
open coverage/index.html
```

### Coverage Reports

Coverage reports highlight:
- 🟢 Green: Well-covered code
- 🟡 Yellow: Partially covered code
- 🔴 Red: Uncovered code

Focus on covering critical paths first:
1. Authentication flows
2. Data storage and retrieval
3. Event handling
4. User workflows

## Best Practices

### Test Organization

1. **Group Related Tests**
   ```javascript
   describe('User Management', () => {
     describe('Registration', () => {
       it('should register new user', () => {});
       it('should reject duplicate email', () => {});
     });

     describe('Login', () => {
       it('should login with correct credentials', () => {});
       it('should fail with wrong password', () => {});
     });
   });
   ```

2. **Use Descriptive Names**
   - Test names should read like documentation
   - Use "should" statements
   - Be specific about what is being tested

3. **Keep Tests Independent**
   - Each test should run in isolation
   - Don't depend on test execution order
   - Clean up after each test

4. **Test Behavior, Not Implementation**
   ```javascript
   // Good: Test the behavior
   it('should return user email after login', () => {
     authService.login('user@test.com', 'pass');
     expect(authService.currentUser().email).toBe('user@test.com');
   });

   // Bad: Test implementation details
   it('should call getUserFromStorage internally', () => {
     // Don't test internal functions
   });
   ```

### Performance

1. **Fast Tests**
   - Unit tests should run in milliseconds
   - Integration tests in seconds
   - Use mocks to avoid slow operations

2. **Parallel Execution**
   - Vitest runs tests in parallel by default
   - Keep tests independent for parallelization

3. **Watch Mode**
   - Use watch mode during development
   - Vitest only reruns affected tests

### Debugging Tests

**Console Output:**
```javascript
it('debug test', () => {
  const data = { value: 42 };
  console.log('Debug:', data); // Shows in test output
  expect(data.value).toBe(42);
});
```

**Test Only:**
```javascript
it.only('run only this test', () => {
  // This test will run exclusively
});
```

**Skip Tests:**
```javascript
it.skip('skip this test', () => {
  // This test will be skipped
});
```

**Test UI:**
```bash
npm run test:ui
# Opens browser interface for debugging
```

## Troubleshooting

### Common Issues

**Issue: Tests fail with "Cannot find module"**
```bash
# Solution: Check import paths are correct
# Use relative paths for project files
import { storage } from '../../src/assets/js/services/storage.js';
```

**Issue: "localStorage is not defined"**
```bash
# Solution: Ensure tests/setup.js is configured in vitest.config.js
setupFiles: ['./tests/setup.js']
```

**Issue: Tests pass locally but fail in CI**
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

**Issue: Async tests timeout**
```javascript
// Solution: Increase timeout or await promises
it('async test', async () => {
  await asyncFunction();
}, 10000); // 10 second timeout
```

**Issue: Flaky tests (pass sometimes, fail sometimes)**
```bash
# Common causes:
# 1. Tests depend on execution order
# 2. Not cleaning up properly
# 3. Race conditions in async code

# Solution: Make tests independent
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
```

### Getting Help

- Check [Vitest Documentation](https://vitest.dev)
- Review existing tests for examples
- Run tests with `--reporter=verbose` for detailed output
- Use `console.log()` for debugging

## Continuous Integration

### Running Tests in CI

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npm test

- name: Generate Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

Run tests before commits:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

## Maintenance

### When to Update Tests

- When adding new features
- When fixing bugs
- When refactoring code
- When changing APIs
- When user workflows change

### Test Review Checklist

- [ ] All tests pass
- [ ] Coverage meets targets
- [ ] Tests are independent
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] Mock cleanup proper
- [ ] Test names descriptive
- [ ] No flaky tests

## Summary

FitSpark's testing strategy ensures:

✅ **Reliability**: Catch bugs before production
✅ **Confidence**: Refactor safely with test coverage
✅ **Documentation**: Tests serve as executable documentation
✅ **Quality**: Maintain high code quality standards

For questions or issues, refer to:
- This documentation
- Existing test files as examples
- Vitest official documentation
