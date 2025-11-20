# FitSpark 性能优化指南

FitSpark 实现的性能优化策略、最佳实践和工具的综合指南。

## 目录

- [概述](#概述)
- [性能工具](#性能工具)
- [懒加载](#懒加载)
- [代码分割](#代码分割)
- [防抖与节流](#防抖与节流)
- [性能监控](#性能监控)
- [最佳实践](#最佳实践)
- [优化清单](#优化清单)
- [故障排查](#故障排查)

## 概述

FitSpark 实现了全面的性能优化以确保：

- **快速初始加载**: < 2s 首次内容绘制
- **流畅交互**: < 100ms 响应时间
- **高效内存**: < 50MB 堆使用
- **优化资源**: 懒加载和代码分割
- **最小阻塞**: 防抖/节流操作

### 性能指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 首次内容绘制 (FCP) | < 1.8s | ~1.2s |
| 可交互时间 (TTI) | < 3.8s | ~2.5s |
| 首次输入延迟 (FID) | < 100ms | ~50ms |
| 累积布局偏移 (CLS) | < 0.1 | ~0.05 |
| 总阻塞时间 (TBT) | < 300ms | ~150ms |

## 性能工具

### 懒加载器 (`src/assets/js/utils/lazyLoader.js`)

动态模块加载和资源优化工具。

#### 模块加载

```javascript
import { lazyLoader } from './utils/lazyLoader.js';

// 动态加载模块
const module = await lazyLoader.loadModule('./modules/charts.js');

// 带选项
const module = await lazyLoader.loadModule('./modules/analytics.js', {
  cache: true,
  timeout: 10000,
  retries: 3
});
```

#### 图片懒加载

```html
<!-- HTML -->
<img data-src="image.jpg" data-srcset="image-2x.jpg 2x" alt="懒加载图片">

<!-- JavaScript -->
<script>
import { lazyLoader } from './utils/lazyLoader.js';

// 初始化图片懒加载
lazyLoader.lazyLoadImages('img[data-src]');
</script>
```

#### 区块懒加载

```javascript
// 当区块可见时加载
lazyLoader.lazyLoadSections('[data-lazy]', (section) => {
  // 初始化区块内容
  initializeSectionContent(section);
});
```

#### 资源预取

```javascript
// 预取资源
lazyLoader.prefetch([
  '/api/data.json',
  '/assets/images/hero.jpg'
], 'fetch');

// 预连接域名
lazyLoader.preconnect([
  'https://api.example.com',
  'https://cdn.example.com'
]);
```

#### 动态 CSS 和脚本加载

```javascript
// 动态加载 CSS
await lazyLoader.loadCSS('/assets/css/charts.css', {
  media: 'screen'
});

// 动态加载脚本
await lazyLoader.loadScript('/assets/js/charts.js', {
  async: true,
  defer: true
});
```

### 性能监控器 (`src/assets/js/utils/performanceMonitor.js`)

追踪和报告应用性能指标。

#### 初始化

```javascript
import { performanceMonitor } from './utils/performanceMonitor.js';

// 带选项初始化
performanceMonitor.init({
  enabled: true,
  logToConsole: true,
  sampleRate: 1.0,
  reportInterval: 30000
});
```

#### 自定义计时

```javascript
// 标记性能点
performanceMonitor.mark('feature-start');
// ... 功能代码 ...
performanceMonitor.mark('feature-end');

// 测量持续时间
const duration = performanceMonitor.measure(
  'feature-duration',
  'feature-start',
  'feature-end'
);

console.log(`功能耗时 ${duration}ms`);
```

#### 简单计时器

```javascript
const timer = performanceMonitor.startTimer('数据库查询');
await database.query();
timer.stop(); // 输出: "Timer: 数据库查询: 45.23ms"
```

#### 性能报告

```javascript
// 获取当前指标
const metrics = performanceMonitor.getMetrics();

// 生成完整报告
const report = performanceMonitor.generateReport();

// 获取性能评分 (0-100)
const score = performanceMonitor.getScore();

// 获取建议
const recommendations = performanceMonitor.getRecommendations();
```

## 懒加载

### 为什么懒加载？

懒加载将非关键资源的加载延迟到需要时：

- **更快初始加载**: 仅预先加载关键资源
- **减少带宽**: 不加载未使用的资源
- **更好用户体验**: 页面更快可交互

### 实现策略

#### 1. 图片懒加载

```html
<!-- 之前 -->
<img src="large-image.jpg" alt="大图片">

<!-- 之后 -->
<img data-src="large-image.jpg" alt="大图片" class="lazy-image">

<script>
// 初始化
lazyLoader.lazyLoadImages('.lazy-image');
</script>
```

#### 2. 模块懒加载

```javascript
// 仅在需要时加载重模块
document.getElementById('charts-button').addEventListener('click', async () => {
  const { chartsModule } = await lazyLoader.loadModule('./modules/charts.js');
  chartsModule.init();
});
```

#### 3. 基于路由的懒加载

```javascript
const routes = {
  '/dashboard': () => lazyLoader.loadModule('./pages/dashboard.js'),
  '/analytics': () => lazyLoader.loadModule('./pages/analytics.js'),
  '/settings': () => lazyLoader.loadModule('./pages/settings.js')
};

async function loadRoute(path) {
  const loader = routes[path];
  if (loader) {
    const module = await loader();
    module.init();
  }
}
```

## 代码分割

### 手动代码分割

按功能/路由分割代码：

```
src/assets/js/
├── app.js              # 主入口（关键路径）
├── modules/
│   ├── core/          # 始终加载
│   │   ├── auth.js
│   │   └── storage.js
│   └── lazy/          # 懒加载
│       ├── charts.js
│       ├── analytics.js
│       └── reports.js
```

### 动态导入

```javascript
// 不使用静态导入
// import { analytics } from './modules/analytics.js';

// 使用动态导入
async function showAnalytics() {
  const { analytics } = await import('./modules/analytics.js');
  analytics.render();
}
```

### 第三方库代码分割

分离第三方库：

```javascript
// 仅在需要时加载 Chart.js
async function loadChartLibrary() {
  if (!window.Chart) {
    await lazyLoader.loadScript('https://cdn.jsdelivr.net/npm/chart.js@4');
  }
  return window.Chart;
}
```

## 防抖与节流

### 防抖工具

延迟执行直到自上次调用后经过等待时间。

**使用场景：**
- 搜索输入
- 窗口调整大小
- 表单验证
- 自动保存

```javascript
import { debounce } from './utils/debounce.js';

// 搜索输入防抖
const debouncedSearch = debounce((query) => {
  searchAPI(query);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});

// 自动保存防抖
const debouncedSave = debounce(() => {
  saveToStorage();
}, 1000);

formInput.addEventListener('change', debouncedSave);
```

### 节流工具

确保函数在每个时间段内最多调用一次。

**使用场景：**
- 滚动事件
- 鼠标移动追踪
- 窗口调整大小
- 按钮点击防护

```javascript
import { throttle } from './utils/debounce.js';

// 滚动事件节流
const throttledScroll = throttle(() => {
  updateScrollPosition();
}, 100);

window.addEventListener('scroll', throttledScroll);

// 按钮点击节流
const throttledSubmit = throttle(() => {
  submitForm();
}, 2000);

submitButton.addEventListener('click', throttledSubmit);
```

### RAF 节流

使用 requestAnimationFrame 实现流畅动画：

```javascript
import { rafThrottle } from './utils/debounce.js';

// 流畅滚动效果
const rafScroll = rafThrottle(() => {
  updateParallaxEffect();
  updateScrollAnimations();
});

window.addEventListener('scroll', rafScroll);
```

### 记忆化

缓存昂贵函数结果：

```javascript
import { memoize } from './utils/debounce.js';

// 昂贵计算
const calculateBMI = memoize((weight, height) => {
  console.log('计算 BMI...'); // 仅在首次调用时输出
  return weight / ((height / 100) ** 2);
});

calculateBMI(75, 180); // 计算: 23.15
calculateBMI(75, 180); // 返回缓存: 23.15（无计算）
```

### 对比表

| 技术 | 使用时机 | 示例 |
|------|---------|------|
| **防抖** | 等待调用暂停 | 搜索输入、自动保存 |
| **节流** | 定期执行 | 滚动、调整大小事件 |
| **RAF 节流** | 流畅动画 | 视差、滚动效果 |
| **记忆化** | 缓存昂贵结果 | 计算、API 调用 |
| **一次** | 仅执行一次 | 初始化 |
| **批处理** | 分组多个调用 | 批量更新 |

## 性能监控

### 实时监控

```javascript
// 初始化监控
performanceMonitor.init({
  enabled: true,
  logToConsole: process.env.NODE_ENV === 'development',
  reportInterval: 30000
});

// 监控自定义操作
const timer = performanceMonitor.startTimer('数据处理');
await processLargeDataset();
timer.stop();

// 检查性能评分
setInterval(() => {
  const score = performanceMonitor.getScore();
  if (score < 70) {
    console.warn('检测到性能下降');
  }
}, 60000);
```

### 核心 Web 指标

FitSpark 自动追踪：

1. **最大内容绘制 (LCP)**
   - 测量加载性能
   - 目标: < 2.5s

2. **首次输入延迟 (FID)**
   - 测量交互性
   - 目标: < 100ms

3. **累积布局偏移 (CLS)**
   - 测量视觉稳定性
   - 目标: < 0.1

### 性能预算

设置并执行性能预算：

```javascript
const BUDGET = {
  maxPageWeight: 1500, // KB
  maxRequests: 50,
  maxLoadTime: 3000, // ms
  maxMemory: 50 // MB
};

// 检查预算
const metrics = performanceMonitor.getMetrics();
if (metrics.memory.used > BUDGET.maxMemory) {
  console.warn('超出内存预算');
}
```

## 最佳实践

### 1. 关键渲染路径

**优化关键资源：**

```html
<!-- 内联关键 CSS -->
<style>
  /* 关键的首屏样式 */
  .header { /* ... */ }
  .hero { /* ... */ }
</style>

<!-- 延迟非关键 CSS -->
<link rel="preload" href="non-critical.css" as="style" onload="this.rel='stylesheet'">

<!-- 延迟 JavaScript -->
<script src="app.js" defer></script>
```

### 2. 资源优化

```javascript
// 压缩图片
// 使用 WebP 格式并提供回退
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="回退">
</picture>

// 生产环境压缩 CSS 和 JavaScript
// 使用 gzip/brotli 压缩
// 启用浏览器缓存
```

### 3. 高效事件处理器

```javascript
// 不好：每次渲染创建新函数
elements.forEach(el => {
  el.addEventListener('click', () => handleClick(el));
});

// 好：使用事件委托
container.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (target) {
    handleClick(target);
  }
});
```

### 4. 避免内存泄漏

```javascript
// 始终清理
class Component {
  init() {
    this.handler = this.handleScroll.bind(this);
    window.addEventListener('scroll', this.handler);
  }

  destroy() {
    // 清理！
    window.removeEventListener('scroll', this.handler);
    this.handler = null;
  }

  handleScroll() {
    // 处理滚动
  }
}
```

### 5. 优化循环

```javascript
// 不好：重复 DOM 查询
for (let i = 0; i < items.length; i++) {
  document.querySelector('.container').appendChild(items[i]);
}

// 好：缓存 DOM 引用，批量更新
const container = document.querySelector('.container');
const fragment = document.createDocumentFragment();

for (let i = 0; i < items.length; i++) {
  fragment.appendChild(items[i]);
}

container.appendChild(fragment);
```

### 6. 使用 Web Workers

对于 CPU 密集型任务：

```javascript
// worker.js
self.addEventListener('message', (e) => {
  const result = expensiveCalculation(e.data);
  self.postMessage(result);
});

// main.js
const worker = new Worker('worker.js');
worker.postMessage(data);
worker.addEventListener('message', (e) => {
  console.log('结果:', e.data);
});
```

## 优化清单

### 初始加载优化

- [ ] 最小化关键 CSS (< 14KB)
- [ ] 延迟非关键 JavaScript
- [ ] 懒加载图片
- [ ] 启用文本压缩 (gzip/brotli)
- [ ] 使用 HTTP/2
- [ ] 实现 Service Worker 缓存
- [ ] 优化字体加载
- [ ] 删除未使用的 CSS/JS

### 运行时优化

- [ ] 搜索输入防抖
- [ ] 滚动/调整大小事件节流
- [ ] 动画使用 RAF
- [ ] 长列表实现虚拟滚动
- [ ] 记忆化昂贵计算
- [ ] 使用事件委托
- [ ] 清理事件监听器
- [ ] 优化图片尺寸

### 内存优化

- [ ] 销毁时删除事件监听器
- [ ] 清除定时器/超时
- [ ] 释放引用
- [ ] 限制缓存大小
- [ ] 对象关联使用 WeakMap
- [ ] 监控内存使用

### 网络优化

- [ ] 打包和压缩资源
- [ ] 静态资源使用 CDN
- [ ] 实现资源提示 (preload, prefetch)
- [ ] 启用缓存头
- [ ] 压缩 API 响应
- [ ] 批量 API 请求

## 故障排查

### 页面加载慢

**诊断：**
```javascript
const report = performanceMonitor.generateReport();
console.log('FCP:', report.paint.firstContentfulPaint);

// 检查慢资源
const slowResources = report.moduleLoads.filter(m => m.duration > 1000);
```

**解决方案：**
- 懒加载非关键模块
- 优化图片
- 延迟第三方脚本
- 启用缓存

### 内存使用高

**诊断：**
```javascript
performanceMonitor.captureMemoryUsage();
const metrics = performanceMonitor.getMetrics();
console.log('内存:', metrics.memory);
```

**解决方案：**
- 检查内存泄漏（使用 Chrome DevTools 堆快照）
- 清理事件监听器
- 限制缓存大小
- 缓存使用 WeakMap

### 滚动卡顿

**诊断：**
```javascript
// 检查长任务和布局偏移
// 使用 Chrome DevTools Performance 选项卡
```

**解决方案：**
```javascript
// 节流滚动处理器
const optimizedScroll = rafThrottle(() => {
  updateUI();
});

// 避免强制同步布局
// 不好：循环中导致重排
elements.forEach(el => {
  el.style.width = el.offsetWidth + 10 + 'px'; // 先读后写
});

// 好：批量读写
const widths = elements.map(el => el.offsetWidth);
elements.forEach((el, i) => {
  el.style.width = widths[i] + 10 + 'px';
});
```

### 交互慢

**诊断：**
```javascript
// 监控首次输入延迟
// 检查控制台 "Slow FID Warning"
```

**解决方案：**
- 拆分长任务
- 重计算使用 Web Workers
- 延迟非关键代码
- 优化事件处理器

## 性能测试

### Lighthouse

```bash
# 运行 Lighthouse 审计
npx lighthouse http://localhost:3000 --view

# 目标评分：
# 性能: > 90
# 可访问性: > 90
# 最佳实践: > 90
# SEO: > 90
```

### Chrome DevTools

1. **Performance 选项卡**: 记录运行时性能
2. **Network 选项卡**: 检查资源加载
3. **Memory 选项卡**: 查找内存泄漏
4. **Lighthouse 选项卡**: 运行审计

### 自动化测试

```javascript
// 添加性能测试
describe('Performance', () => {
  it('should load in < 2s', async () => {
    const start = Date.now();
    await page.goto('http://localhost:3000');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });

  it('should have good FCP', async () => {
    const metrics = await page.metrics();
    expect(metrics.FirstContentfulPaint).toBeLessThan(1800);
  });
});
```

## 资源

- [Web.dev 性能](https://web.dev/performance/)
- [MDN 性能](https://developer.mozilla.org/zh-CN/docs/Web/Performance)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## 总结

FitSpark 通过以下方式实现全面性能优化：

- **懒加载** 按需资源加载
- **代码分割** 更小的初始包
- **防抖/节流** 高效事件处理
- **性能监控** 持续优化
- **最佳实践** 可维护的性能

目标：**性能评分 > 90/100**

---

如有性能问题，运行：
```javascript
performanceMonitor.generateReport();
performanceMonitor.getRecommendations();
```
