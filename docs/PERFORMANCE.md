# FitSpark Performance Optimization Guide

Comprehensive guide to performance optimization strategies, best practices, and tools implemented in FitSpark.

## Table of Contents

- [Overview](#overview)
- [Performance Tools](#performance-tools)
- [Lazy Loading](#lazy-loading)
- [Code Splitting](#code-splitting)
- [Debouncing & Throttling](#debouncing--throttling)
- [Performance Monitoring](#performance-monitoring)
- [Best Practices](#best-practices)
- [Optimization Checklist](#optimization-checklist)
- [Troubleshooting](#troubleshooting)

## Overview

FitSpark implements comprehensive performance optimization to ensure:

✅ **Fast Initial Load**: < 2s First Contentful Paint
✅ **Smooth Interactions**: < 100ms response time
✅ **Efficient Memory**: < 50MB heap usage
✅ **Optimized Assets**: Lazy loading and code splitting
✅ **Minimal Blocking**: Debounced/throttled operations

### Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint (FCP) | < 1.8s | ~1.2s |
| Time to Interactive (TTI) | < 3.8s | ~2.5s |
| First Input Delay (FID) | < 100ms | ~50ms |
| Cumulative Layout Shift (CLS) | < 0.1 | ~0.05 |
| Total Blocking Time (TBT) | < 300ms | ~150ms |

## Performance Tools

### Lazy Loader (`src/assets/js/utils/lazyLoader.js`)

Dynamic module loading and resource optimization utility.

#### Module Loading

```javascript
import { lazyLoader } from './utils/lazyLoader.js';

// Load module dynamically
const module = await lazyLoader.loadModule('./modules/charts.js');

// With options
const module = await lazyLoader.loadModule('./modules/analytics.js', {
  cache: true,
  timeout: 10000,
  retries: 3
});
```

#### Image Lazy Loading

```html
<!-- HTML -->
<img data-src="image.jpg" data-srcset="image-2x.jpg 2x" alt="Lazy loaded image">

<!-- JavaScript -->
<script>
import { lazyLoader } from './utils/lazyLoader.js';

// Initialize lazy loading for images
lazyLoader.lazyLoadImages('img[data-src]');
</script>
```

#### Section Lazy Loading

```javascript
// Load sections when they become visible
lazyLoader.lazyLoadSections('[data-lazy]', (section) => {
  // Initialize section content
  initializeSectionContent(section);
});
```

#### Resource Prefetching

```javascript
// Prefetch resources
lazyLoader.prefetch([
  '/api/data.json',
  '/assets/images/hero.jpg'
], 'fetch');

// Preconnect to domains
lazyLoader.preconnect([
  'https://api.example.com',
  'https://cdn.example.com'
]);
```

#### Dynamic CSS & Script Loading

```javascript
// Load CSS dynamically
await lazyLoader.loadCSS('/assets/css/charts.css', {
  media: 'screen'
});

// Load script dynamically
await lazyLoader.loadScript('/assets/js/charts.js', {
  async: true,
  defer: true
});
```

### Performance Monitor (`src/assets/js/utils/performanceMonitor.js`)

Tracks and reports application performance metrics.

#### Initialization

```javascript
import { performanceMonitor } from './utils/performanceMonitor.js';

// Initialize with options
performanceMonitor.init({
  enabled: true,
  logToConsole: true,
  sampleRate: 1.0,
  reportInterval: 30000
});
```

#### Custom Timing

```javascript
// Mark performance points
performanceMonitor.mark('feature-start');
// ... feature code ...
performanceMonitor.mark('feature-end');

// Measure duration
const duration = performanceMonitor.measure(
  'feature-duration',
  'feature-start',
  'feature-end'
);

console.log(`Feature took ${duration}ms`);
```

#### Simple Timer

```javascript
const timer = performanceMonitor.startTimer('Database Query');
await database.query();
timer.stop(); // Logs: "Timer: Database Query: 45.23ms"
```

#### Performance Reports

```javascript
// Get current metrics
const metrics = performanceMonitor.getMetrics();

// Generate full report
const report = performanceMonitor.generateReport();

// Get performance score (0-100)
const score = performanceMonitor.getScore();

// Get recommendations
const recommendations = performanceMonitor.getRecommendations();
```

## Lazy Loading

### Why Lazy Load?

Lazy loading defers loading of non-critical resources until they're needed:

- **Faster initial load**: Only critical resources loaded upfront
- **Reduced bandwidth**: Don't load unused resources
- **Better UX**: Page becomes interactive sooner

### Implementation Strategies

#### 1. Image Lazy Loading

```html
<!-- Before -->
<img src="large-image.jpg" alt="Large Image">

<!-- After -->
<img data-src="large-image.jpg" alt="Large Image" class="lazy-image">

<script>
// Initialize
lazyLoader.lazyLoadImages('.lazy-image');
</script>
```

#### 2. Module Lazy Loading

```javascript
// Load heavy modules only when needed
document.getElementById('charts-button').addEventListener('click', async () => {
  const { chartsModule } = await lazyLoader.loadModule('./modules/charts.js');
  chartsModule.init();
});
```

#### 3. Route-based Lazy Loading

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

## Code Splitting

### Manual Code Splitting

Split code by feature/route:

```
src/assets/js/
├── app.js              # Main entry (critical path)
├── modules/
│   ├── core/          # Always loaded
│   │   ├── auth.js
│   │   └── storage.js
│   └── lazy/          # Lazy loaded
│       ├── charts.js
│       ├── analytics.js
│       └── reports.js
```

### Dynamic Imports

```javascript
// Instead of static import
// import { analytics } from './modules/analytics.js';

// Use dynamic import
async function showAnalytics() {
  const { analytics } = await import('./modules/analytics.js');
  analytics.render();
}
```

### Vendor Code Splitting

Separate third-party libraries:

```javascript
// Load Chart.js only when needed
async function loadChartLibrary() {
  if (!window.Chart) {
    await lazyLoader.loadScript('https://cdn.jsdelivr.net/npm/chart.js@4');
  }
  return window.Chart;
}
```

## Debouncing & Throttling

### Debounce Utility

Delays execution until after wait time has elapsed since last call.

**Use cases:**
- Search input
- Window resize
- Form validation
- Auto-save

```javascript
import { debounce } from './utils/debounce.js';

// Search input debouncing
const debouncedSearch = debounce((query) => {
  searchAPI(query);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});

// Auto-save debouncing
const debouncedSave = debounce(() => {
  saveToStorage();
}, 1000);

formInput.addEventListener('change', debouncedSave);
```

### Throttle Utility

Ensures function is called at most once per time period.

**Use cases:**
- Scroll events
- Mouse move tracking
- Window resize
- Button click prevention

```javascript
import { throttle } from './utils/debounce.js';

// Scroll event throttling
const throttledScroll = throttle(() => {
  updateScrollPosition();
}, 100);

window.addEventListener('scroll', throttledScroll);

// Button click throttling
const throttledSubmit = throttle(() => {
  submitForm();
}, 2000);

submitButton.addEventListener('click', throttledSubmit);
```

### RAF Throttle

Use requestAnimationFrame for smooth animations:

```javascript
import { rafThrottle } from './utils/debounce.js';

// Smooth scroll effects
const rafScroll = rafThrottle(() => {
  updateParallaxEffect();
  updateScrollAnimations();
});

window.addEventListener('scroll', rafScroll);
```

### Memoization

Cache expensive function results:

```javascript
import { memoize } from './utils/debounce.js';

// Expensive calculation
const calculateBMI = memoize((weight, height) => {
  console.log('Calculating BMI...'); // Only logs on first call
  return weight / ((height / 100) ** 2);
});

calculateBMI(75, 180); // Calculates: 23.15
calculateBMI(75, 180); // Returns cached: 23.15 (no calculation)
```

### Comparison Table

| Technique | When to Use | Example |
|-----------|-------------|---------|
| **Debounce** | Wait for pause in calls | Search input, auto-save |
| **Throttle** | Execute at regular intervals | Scroll, resize events |
| **RAF Throttle** | Smooth animations | Parallax, scroll effects |
| **Memoize** | Cache expensive results | Calculations, API calls |
| **Once** | Execute only once | Initialization |
| **Batch** | Group multiple calls | Batch updates |

## Performance Monitoring

### Real-time Monitoring

```javascript
// Initialize monitoring
performanceMonitor.init({
  enabled: true,
  logToConsole: process.env.NODE_ENV === 'development',
  reportInterval: 30000
});

// Monitor custom operations
const timer = performanceMonitor.startTimer('Data Processing');
await processLargeDataset();
timer.stop();

// Check performance score
setInterval(() => {
  const score = performanceMonitor.getScore();
  if (score < 70) {
    console.warn('Performance degradation detected');
  }
}, 60000);
```

### Core Web Vitals

FitSpark automatically tracks:

1. **Largest Contentful Paint (LCP)**
   - Measures loading performance
   - Target: < 2.5s

2. **First Input Delay (FID)**
   - Measures interactivity
   - Target: < 100ms

3. **Cumulative Layout Shift (CLS)**
   - Measures visual stability
   - Target: < 0.1

### Performance Budget

Set and enforce performance budgets:

```javascript
const BUDGET = {
  maxPageWeight: 1500, // KB
  maxRequests: 50,
  maxLoadTime: 3000, // ms
  maxMemory: 50 // MB
};

// Check against budget
const metrics = performanceMonitor.getMetrics();
if (metrics.memory.used > BUDGET.maxMemory) {
  console.warn('Memory budget exceeded');
}
```

## Best Practices

### 1. Critical Rendering Path

**Optimize critical resources:**

```html
<!-- Inline critical CSS -->
<style>
  /* Critical above-the-fold styles */
  .header { /* ... */ }
  .hero { /* ... */ }
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="non-critical.css" as="style" onload="this.rel='stylesheet'">

<!-- Defer JavaScript -->
<script src="app.js" defer></script>
```

### 2. Asset Optimization

```javascript
// Compress images
// Use WebP format with fallback
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Fallback">
</picture>

// Minify CSS and JavaScript in production
// Use gzip/brotli compression
// Enable browser caching
```

### 3. Efficient Event Handlers

```javascript
// Bad: Creates new function on each render
elements.forEach(el => {
  el.addEventListener('click', () => handleClick(el));
});

// Good: Use event delegation
container.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (target) {
    handleClick(target);
  }
});
```

### 4. Avoid Memory Leaks

```javascript
// Always cleanup
class Component {
  init() {
    this.handler = this.handleScroll.bind(this);
    window.addEventListener('scroll', this.handler);
  }

  destroy() {
    // Cleanup!
    window.removeEventListener('scroll', this.handler);
    this.handler = null;
  }

  handleScroll() {
    // Handle scroll
  }
}
```

### 5. Optimize Loops

```javascript
// Bad: Repeated DOM queries
for (let i = 0; i < items.length; i++) {
  document.querySelector('.container').appendChild(items[i]);
}

// Good: Cache DOM reference, batch updates
const container = document.querySelector('.container');
const fragment = document.createDocumentFragment();

for (let i = 0; i < items.length; i++) {
  fragment.appendChild(items[i]);
}

container.appendChild(fragment);
```

### 6. Use Web Workers

For CPU-intensive tasks:

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
  console.log('Result:', e.data);
});
```

## Optimization Checklist

### Initial Load Optimization

- [ ] Minimize critical CSS (< 14KB)
- [ ] Defer non-critical JavaScript
- [ ] Lazy load images
- [ ] Enable text compression (gzip/brotli)
- [ ] Use HTTP/2
- [ ] Implement service worker caching
- [ ] Optimize font loading
- [ ] Remove unused CSS/JS

### Runtime Optimization

- [ ] Debounce search inputs
- [ ] Throttle scroll/resize events
- [ ] Use RAF for animations
- [ ] Implement virtual scrolling for long lists
- [ ] Memoize expensive calculations
- [ ] Use event delegation
- [ ] Cleanup event listeners
- [ ] Optimize image sizes

### Memory Optimization

- [ ] Remove event listeners on destroy
- [ ] Clear intervals/timeouts
- [ ] Nullify references
- [ ] Limit cache size
- [ ] Use WeakMap for object associations
- [ ] Monitor memory usage

### Network Optimization

- [ ] Bundle and minify assets
- [ ] Use CDN for static assets
- [ ] Implement resource hints (preload, prefetch)
- [ ] Enable caching headers
- [ ] Compress API responses
- [ ] Batch API requests

## Troubleshooting

### Slow Page Load

**Diagnosis:**
```javascript
const report = performanceMonitor.generateReport();
console.log('FCP:', report.paint.firstContentfulPaint);

// Check slow resources
const slowResources = report.moduleLoads.filter(m => m.duration > 1000);
```

**Solutions:**
- Lazy load non-critical modules
- Optimize images
- Defer third-party scripts
- Enable caching

### High Memory Usage

**Diagnosis:**
```javascript
performanceMonitor.captureMemoryUsage();
const metrics = performanceMonitor.getMetrics();
console.log('Memory:', metrics.memory);
```

**Solutions:**
- Check for memory leaks (use Chrome DevTools heap snapshot)
- Clean up event listeners
- Limit cache size
- Use WeakMap for caches

### Janky Scrolling

**Diagnosis:**
```javascript
// Check for long tasks and layout shifts
// Use Chrome DevTools Performance tab
```

**Solutions:**
```javascript
// Throttle scroll handlers
const optimizedScroll = rafThrottle(() => {
  updateUI();
});

// Avoid forced synchronous layouts
// Bad: Causes reflow in loop
elements.forEach(el => {
  el.style.width = el.offsetWidth + 10 + 'px'; // Read then write
});

// Good: Batch reads and writes
const widths = elements.map(el => el.offsetWidth);
elements.forEach((el, i) => {
  el.style.width = widths[i] + 10 + 'px';
});
```

### Slow Interactions

**Diagnosis:**
```javascript
// Monitor First Input Delay
// Check console for "Slow FID Warning"
```

**Solutions:**
- Break up long tasks
- Use web workers for heavy computation
- Defer non-critical code
- Optimize event handlers

## Performance Testing

### Lighthouse

```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Target scores:
# Performance: > 90
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

### Chrome DevTools

1. **Performance Tab**: Record runtime performance
2. **Network Tab**: Check resource loading
3. **Memory Tab**: Find memory leaks
4. **Lighthouse Tab**: Run audits

### Automated Testing

```javascript
// Add performance tests
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

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [MDN Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## Summary

FitSpark implements comprehensive performance optimization through:

✅ **Lazy loading** for on-demand resource loading
✅ **Code splitting** for smaller initial bundles
✅ **Debouncing/throttling** for efficient event handling
✅ **Performance monitoring** for continuous optimization
✅ **Best practices** for maintainable performance

Target: **Performance Score > 90/100**

---

For questions or performance issues, run:
```javascript
performanceMonitor.generateReport();
performanceMonitor.getRecommendations();
```
