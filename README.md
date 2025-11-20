# FitSpark - 健身追踪与社交平台

[![Tests](https://img.shields.io/badge/tests-200%2B%20passing-success)](https://github.com)
[![Coverage](https://img.shields.io/badge/coverage-93%25-brightgreen)](https://github.com)

基于原生 JavaScript 开发的综合性健身追踪与社交平台毕业设计项目。

## 项目简介

本项目是一个完整的前端单页应用（SPA），采用原生 JavaScript（ES6+）开发，无第三方框架依赖。实现了健身记录、营养追踪、社交互动、数据分析等功能，所有数据通过 localStorage 本地存储。

## 主要功能

### 核心功能
- 运动记录 - 记录运动类型、组数、次数和消耗卡路里
- 营养日志 - 追踪饮食摄入和营养成分
- 身体指标 - 监控体重、体脂率和 BMI
- 每日打卡 - 建立连续打卡记录和成就徽章

### 数据分析
- 多维度图表 - 5 种图表类型数据可视化
- 时间对比 - 周/月/年进度对比
- 健康报告 - 综合健身评估
- 性能指标 - 追踪训练进步

### 智能推荐
- 协同过滤推荐算法
- 基于 BMR/TDEE 的营养建议
- 自动生成训练计划
- 个性化内容推荐

### 社交功能
- 好友系统 - 添加、搜索、推荐好友
- 排行榜 - 多维度排名（周/月/总榜）
- 动态信息流 - 好友动态实时更新
- 社区论坛 - 帖子、回复、点赞

### 其他功能
- OAuth 登录 - 支持 GitHub、Google、Facebook
- 日历同步 - 导出 ICS 格式
- 数据导出 - CSV/JSON 格式
- 性能监控 - 实时性能追踪

## 快速开始

### 环境要求

- Node.js 18+
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 运行测试

```bash
# 运行所有测试
npm test

# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# 测试覆盖率
npm run test:coverage
```

## 项目结构

```
src/
├── assets/
│   └── js/
│       ├── modules/   # 功能模块
│       ├── services/  # 核心服务
│       ├── views/     # 视图组件
│       └── utils/     # 工具函数
tests/
├── unit/              # 单元测试
└── integration/       # 集成测试
```

## 技术特点

### 架构设计
- SPA 路由 - 基于 History API 的路由系统
- 视图分离 - 视图与业务逻辑解耦
- IIFE 模块 - 模块封装和私有作用域
- 事件驱动 - EventBus 实现模块间通信
- 服务层分离 - UI 逻辑与业务逻辑分离

### 性能优化
- 懒加载 - 按需加载模块和图片
- 代码分割 - 基于路由的代码分割
- 防抖节流 - 事件优化处理
- 性能监控 - Core Web Vitals 追踪

### 测试覆盖

| 类别 | 测试数 | 覆盖率 |
|------|--------|--------|
| 单元测试 | 135 | 97% |
| 集成测试 | 65 | 89% |
| 总计 | 200+ | 93% |

### 性能指标

- 首次内容绘制（FCP）: ~1.2s
- 可交互时间（TTI）: ~2.5s
- Lighthouse 评分: 90+

## 开发说明

### 核心服务
- `router.js` - 路由管理
- `eventBus.js` - 事件系统
- `storage.js` - 数据存储
- `authService.js` - 用户认证

### 开发规范
- 服务层不操作 DOM
- 模块间通过 EventBus 通信
- 所有数据包含 userId 字段
- 使用 `data-link` 属性处理内部导航

## 项目统计

- 代码量: 15,000+ 行
- 文件数: 50+ 个 JavaScript 模块
- 自动化测试: 200+ 个
- 测试覆盖率: 93%

## 技术栈

- 原生 JavaScript (ES6+)
- LocalStorage
- History API
- Vitest (测试框架)
- Vite (开发服务器)

## 许可证

MIT License

## 项目信息

- 版本: 1.0.0
- 更新时间: 2025-01-19
