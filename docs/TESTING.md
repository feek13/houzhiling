# FitSpark 测试文档

FitSpark 应用的完整测试指南，包括单元测试、集成测试和最佳实践。

## 目录

- [概述](#概述)
- [测试环境配置](#测试环境配置)
- [运行测试](#运行测试)
- [测试结构](#测试结构)
- [单元测试](#单元测试)
- [集成测试](#集成测试)
- [编写新测试](#编写新测试)
- [代码覆盖率](#代码覆盖率)
- [最佳实践](#最佳实践)
- [故障排查](#故障排查)

## 概述

FitSpark 使用 **Vitest** 作为测试框架。Vitest 提供：

- 快速执行，原生 ES 模块支持
- 兼容 Jest API
- 内置 V8 代码覆盖率
- 开发模式监听
- 开箱即用的 TypeScript 支持

### 测试类型

1. **单元测试** (`tests/unit/`)
   - 隔离测试单个函数和模块
   - 模拟外部依赖
   - 快速执行

2. **集成测试** (`tests/integration/`)
   - 测试多个模块协同工作
   - 测试完整用户流程
   - 验证服务间数据流

## 测试环境配置

### 安装

```bash
# 安装依赖
npm install

# 显式安装测试依赖
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 jsdom
```

### 配置

测试配置位于 `vitest.config.js`:

```javascript
{
  test: {
    globals: true,              // 启用全局测试 API
    environment: 'jsdom',       // 类浏览器环境
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
}
```

### 配置文件

`tests/setup.js` 配置测试环境：

- 模拟 localStorage 和 sessionStorage
- 模拟 window.location
- 模拟 navigator.clipboard
- 模拟 Web Share API
- 测试间清理 mock

## 运行测试

### 基本命令

```bash
# 运行所有测试
npm test

# 监听模式（文件修改时自动重新运行）
npm run test:watch

# 仅运行单元测试
npm run test:unit

# 仅运行集成测试
npm run test:integration

# UI 模式运行测试
npm run test:ui

# 生成覆盖率报告
npm run test:coverage
```

### 监听模式

监听模式适合开发：

```bash
npm run test:watch
```

监听模式命令：
- 按 `a` 运行所有测试
- 按 `f` 仅运行失败的测试
- 按 `t` 按名称过滤测试
- 按 `q` 退出

### 覆盖率报告

生成覆盖率报告：

```bash
npm run test:coverage
```

覆盖率报告生成在 `coverage/` 目录：
- `coverage/index.html` - 可视化 HTML 报告
- `coverage/coverage-final.json` - JSON 数据
- 控制台输出显示覆盖率摘要

## 测试结构

```
tests/
├── setup.js                      # 全局测试配置
├── unit/                         # 单元测试
│   ├── storage.test.js          # 存储服务测试
│   ├── eventBus.test.js         # 事件总线测试
│   └── authService.test.js      # 认证服务测试
└── integration/                  # 集成测试
    ├── auth-flow.test.js        # 认证流程
    └── workout-flow.test.js     # 运动追踪流程
```

## 单元测试

### 存储服务测试 (`tests/unit/storage.test.js`)

测试 localStorage 抽象层。

**测试覆盖：**
- 保存和检索值（字符串、对象、数组）
- 缺失键的默认值
- 删除和清空操作
- 检查键存在性
- 错误处理（无效 JSON、循环引用）
- 复杂数据类型（Date、Boolean、Number、null、undefined）
- 大数据集

**示例：**
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

### 事件总线测试 (`tests/unit/eventBus.test.js`)

测试发布-订阅事件系统。

**测试覆盖：**
- 使用 `on()` 注册事件
- 使用 `once()` 一次性监听器
- 使用 `off()` 注销事件
- 使用 `emit()` 发布事件
- 使用 `emitAsync()` 异步事件处理
- 优先级排序
- 通配符监听器 (`*`)
- 监听器错误处理
- 内存管理

**示例：**
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

### 认证服务测试 (`tests/unit/authService.test.js`)

测试用户认证和授权。

**测试覆盖：**
- 带验证的用户注册
- 凭据登录
- 登出功能
- 当前用户获取
- 个人资料更新
- 密码修改
- 认证状态
- 邮箱格式验证
- 密码强度验证
- 事件发布
- 安全性（密码哈希、无密码暴露）

**示例：**
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
    expect(result.user.password).toBeUndefined(); // 安全检查
  });
});
```

## 集成测试

### 认证流程 (`tests/integration/auth-flow.test.js`)

测试完整认证工作流。

**测试覆盖：**
- 完整注册流程（注册 → 登录 → 存储 → 事件）
- 重复注册防护
- 登录/登出流程
- 登录失败处理
- 个人资料管理
- 密码修改和重新认证
- 多用户场景
- 事件传播顺序
- 页面重载后状态持久化
- 损坏数据处理
- 安全性（无密码暴露）

**示例：**
```javascript
describe('Authentication Flow Integration', () => {
  it('should handle full user registration workflow', () => {
    const registerCallback = vi.fn();
    eventBus.on(EventNames.AUTH_REGISTER, registerCallback);

    // 注册
    authService.register({
      email: 'test@example.com',
      password: 'Pass123',
      nickname: 'Test'
    });

    // 验证所有步骤
    expect(registerCallback).toHaveBeenCalled();
    expect(storage.get('users').length).toBe(1);
    expect(authService.isAuthenticated()).toBe(true);
  });
});
```

### 运动流程 (`tests/integration/workout-flow.test.js`)

测试运动和活动追踪。

**测试覆盖：**
- 运动记录和事件
- 多个运动追踪
- 运动统计计算
- 营养记录
- 每日营养摄入追踪
- 打卡和连续天数追踪
- 徽章授予
- 身体指标追踪
- BMI 计算
- 活动信息流聚合
- 事件驱动更新
- 多用户隔离
- 数据一致性

## 编写新测试

### 测试文件结构

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { yourModule } from '../path/to/module.js';

describe('Module Name', () => {
  beforeEach(() => {
    // 每个测试前的配置
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Function Name', () => {
    it('should do something specific', () => {
      // Arrange（准备）
      const input = { data: 'test' };

      // Act（执行）
      const result = yourModule.doSomething(input);

      // Assert（断言）
      expect(result).toBe(expected);
    });
  });
});
```

### 编写测试最佳实践

1. **遵循 AAA 模式**
   - **Arrange（准备）**: 设置测试数据和条件
   - **Act（执行）**: 执行函数/操作
   - **Assert（断言）**: 验证结果

2. **使用描述性测试名称**
   ```javascript
   // 好的
   it('should return null when user is not logged in', () => {});

   // 不好的
   it('test 1', () => {});
   ```

3. **每个测试只测试一件事**
   ```javascript
   // 好的
   it('should validate email format', () => {});
   it('should validate password length', () => {});

   // 不好的
   it('should validate input', () => {
     // 同时测试邮箱、密码、姓名
   });
   ```

4. **使用 beforeEach 进行通用配置**
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

5. **模拟外部依赖**
   ```javascript
   const mockFetch = vi.fn(() => Promise.resolve({ data: 'test' }));
   global.fetch = mockFetch;
   ```

6. **测试边界情况**
   - 空输入
   - Null/undefined 值
   - 无效数据类型
   - 边界条件

7. **测试错误处理**
   ```javascript
   it('should handle errors gracefully', () => {
     expect(() => riskyFunction()).not.toThrow();
   });
   ```

### 模拟指南

**模拟函数：**
```javascript
const mockCallback = vi.fn();
mockCallback('test');
expect(mockCallback).toHaveBeenCalledWith('test');
```

**模拟返回值：**
```javascript
const mock = vi.fn(() => 42);
expect(mock()).toBe(42);
```

**模拟异步函数：**
```javascript
const mockAsync = vi.fn(() => Promise.resolve('data'));
const result = await mockAsync();
expect(result).toBe('data');
```

**监听对象：**
```javascript
const spy = vi.spyOn(object, 'method');
object.method();
expect(spy).toHaveBeenCalled();
```

## 代码覆盖率

### 覆盖率指标

- **行覆盖率**: 执行的代码行百分比
- **分支覆盖率**: 测试的条件分支百分比
- **函数覆盖率**: 调用的函数百分比
- **语句覆盖率**: 执行的语句百分比

### 目标覆盖率

FitSpark 目标：
- **单元测试**: 80%+ 覆盖率
- **集成测试**: 60%+ 覆盖率
- **总体**: 70%+ 覆盖率

### 查看覆盖率

```bash
# 生成并查看覆盖率
npm run test:coverage
open coverage/index.html
```

### 覆盖率报告

覆盖率报告高亮显示：
- 绿色：覆盖良好的代码
- 黄色：部分覆盖的代码
- 红色：未覆盖的代码

优先覆盖关键路径：
1. 认证流程
2. 数据存储和检索
3. 事件处理
4. 用户工作流

## 最佳实践

### 测试组织

1. **分组相关测试**
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

2. **使用描述性名称**
   - 测试名称应像文档一样易读
   - 使用 "should" 语句
   - 明确说明正在测试的内容

3. **保持测试独立**
   - 每个测试应独立运行
   - 不依赖测试执行顺序
   - 每次测试后清理

4. **测试行为，而非实现**
   ```javascript
   // 好的：测试行为
   it('should return user email after login', () => {
     authService.login('user@test.com', 'pass');
     expect(authService.currentUser().email).toBe('user@test.com');
   });

   // 不好的：测试实现细节
   it('should call getUserFromStorage internally', () => {
     // 不要测试内部函数
   });
   ```

### 性能

1. **快速测试**
   - 单元测试应在毫秒内运行
   - 集成测试在秒级
   - 使用 mock 避免慢速操作

2. **并行执行**
   - Vitest 默认并行运行测试
   - 保持测试独立以支持并行化

3. **监听模式**
   - 开发时使用监听模式
   - Vitest 只重新运行受影响的测试

### 调试测试

**控制台输出：**
```javascript
it('debug test', () => {
  const data = { value: 42 };
  console.log('Debug:', data); // 在测试输出中显示
  expect(data.value).toBe(42);
});
```

**仅运行指定测试：**
```javascript
it.only('run only this test', () => {
  // 此测试将独占运行
});
```

**跳过测试：**
```javascript
it.skip('skip this test', () => {
  // 此测试将被跳过
});
```

**测试 UI：**
```bash
npm run test:ui
# 打开浏览器界面进行调试
```

## 故障排查

### 常见问题

**问题：测试失败 "Cannot find module"**
```bash
# 解决方案：检查导入路径正确
# 使用相对路径导入项目文件
import { storage } from '../../src/assets/js/services/storage.js';
```

**问题："localStorage is not defined"**
```bash
# 解决方案：确保 tests/setup.js 在 vitest.config.js 中配置
setupFiles: ['./tests/setup.js']
```

**问题：本地测试通过但 CI 失败**
```bash
# 解决方案：清除缓存并重新安装
rm -rf node_modules package-lock.json
npm install
npm test
```

**问题：异步测试超时**
```javascript
// 解决方案：增加超时或等待 promise
it('async test', async () => {
  await asyncFunction();
}, 10000); // 10 秒超时
```

**问题：不稳定测试（有时通过，有时失败）**
```bash
# 常见原因：
# 1. 测试依赖执行顺序
# 2. 清理不当
# 3. 异步代码竞态条件

# 解决方案：使测试独立
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
```

### 获取帮助

- 查看 [Vitest 文档](https://vitest.dev)
- 查看现有测试作为示例
- 使用 `--reporter=verbose` 运行测试获取详细输出
- 使用 `console.log()` 调试

## 持续集成

### 在 CI 中运行测试

添加到 CI 流水线：

```yaml
# GitHub Actions 示例
- name: Run Tests
  run: npm test

- name: Generate Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### 预提交钩子

提交前运行测试：

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

## 维护

### 何时更新测试

- 添加新功能时
- 修复 bug 时
- 重构代码时
- 更改 API 时
- 用户工作流变化时

### 测试审查清单

- [ ] 所有测试通过
- [ ] 达到覆盖率目标
- [ ] 测试独立
- [ ] 覆盖边界情况
- [ ] 测试错误处理
- [ ] Mock 清理正确
- [ ] 测试名称描述性强
- [ ] 无不稳定测试

## 总结

FitSpark 的测试策略确保：

- **可靠性**: 在生产前捕获 bug
- **信心**: 在测试覆盖下安全重构
- **文档**: 测试作为可执行文档
- **质量**: 保持高代码质量标准

如有问题，请参考：
- 本文档
- 现有测试文件作为示例
- Vitest 官方文档
