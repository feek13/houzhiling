/**
 * Performance Monitoring Utility
 * Tracks and reports application performance metrics
 */

export const performanceMonitor = (() => {
  // Performance metrics storage
  const metrics = {
    pageLoad: null,
    firstPaint: null,
    firstContentfulPaint: null,
    domContentLoaded: null,
    moduleLoads: [],
    userInteractions: [],
    memoryUsage: [],
    customMarks: new Map()
  };

  // Configuration
  let config = {
    enabled: true,
    logToConsole: false,
    sampleRate: 1.0, // 1.0 = 100% sampling
    reportInterval: 30000 // Report every 30 seconds
  };

  /**
   * Initialize performance monitoring
   */
  const init = (options = {}) => {
    config = { ...config, ...options };

    if (!config.enabled) {
      return;
    }

    // Capture initial page load metrics
    capturePageLoadMetrics();

    // Monitor resource timing
    observeResourceTiming();

    // Monitor long tasks
    observeLongTasks();

    // Monitor layout shifts
    observeLayoutShifts();

    // Monitor first input delay
    observeFirstInputDelay();

    // Periodic memory monitoring
    if (performance.memory) {
      setInterval(captureMemoryUsage, config.reportInterval);
    }

    console.log('[PerformanceMonitor] Initialized');
  };

  /**
   * Capture page load metrics
   */
  const capturePageLoadMetrics = () => {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    // Wait for page load to complete
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        if (navigation) {
          metrics.pageLoad = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            domProcessing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            total: navigation.loadEventEnd - navigation.fetchStart
          };

          log('Page Load Metrics', metrics.pageLoad);
        }

        paint.forEach(entry => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });

        if (metrics.firstContentfulPaint) {
          log('First Contentful Paint', `${metrics.firstContentfulPaint.toFixed(2)}ms`);
        }
      }, 0);
    });

    // DOM Content Loaded
    document.addEventListener('DOMContentLoaded', () => {
      metrics.domContentLoaded = performance.now();
      log('DOM Content Loaded', `${metrics.domContentLoaded.toFixed(2)}ms`);
    });
  };

  /**
   * Observe resource timing
   */
  const observeResourceTiming = () => {
    if (!window.PerformanceObserver) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'script' || entry.initiatorType === 'link') {
          metrics.moduleLoads.push({
            name: entry.name,
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize,
            timestamp: entry.startTime
          });

          if (entry.duration > 1000) {
            log('Slow Resource', {
              name: entry.name,
              duration: `${entry.duration.toFixed(2)}ms`
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  };

  /**
   * Observe long tasks (blocking the main thread)
   */
  const observeLongTasks = () => {
    if (!window.PerformanceObserver) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            log('Long Task Detected', {
              duration: `${entry.duration.toFixed(2)}ms`,
              startTime: `${entry.startTime.toFixed(2)}ms`
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task API not supported
    }
  };

  /**
   * Observe Cumulative Layout Shift (CLS)
   */
  const observeLayoutShifts = () => {
    if (!window.PerformanceObserver) {
      return;
    }

    let clsValue = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;

            if (entry.value > 0.1) {
              log('Layout Shift', {
                value: entry.value.toFixed(4),
                cumulative: clsValue.toFixed(4)
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Layout shift API not supported
    }
  };

  /**
   * Observe First Input Delay (FID)
   */
  const observeFirstInputDelay = () => {
    if (!window.PerformanceObserver) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = entry.processingStart - entry.startTime;

          log('First Input Delay', `${fid.toFixed(2)}ms`);

          if (fid > 100) {
            log('Slow FID Warning', `FID exceeded 100ms: ${fid.toFixed(2)}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // First input API not supported
    }
  };

  /**
   * Capture memory usage
   */
  const captureMemoryUsage = () => {
    if (!performance.memory) {
      return;
    }

    const memory = {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };

    metrics.memoryUsage.push(memory);

    // Keep only last 100 samples
    if (metrics.memoryUsage.length > 100) {
      metrics.memoryUsage.shift();
    }

    // Warn if memory usage is high
    const usagePercent = (memory.used / memory.limit) * 100;
    if (usagePercent > 90) {
      log('High Memory Usage', `${usagePercent.toFixed(2)}%`);
    }
  };

  /**
   * Mark a custom performance point
   */
  const mark = (name) => {
    if (!performance.mark) {
      return;
    }

    performance.mark(name);
    metrics.customMarks.set(name, performance.now());

    log('Performance Mark', name);
  };

  /**
   * Measure time between two marks
   */
  const measure = (name, startMark, endMark) => {
    if (!performance.measure) {
      return null;
    }

    try {
      performance.measure(name, startMark, endMark);

      const measures = performance.getEntriesByName(name, 'measure');
      const duration = measures[measures.length - 1].duration;

      log('Performance Measure', {
        name,
        duration: `${duration.toFixed(2)}ms`
      });

      return duration;
    } catch (e) {
      console.warn(`[PerformanceMonitor] Measure failed: ${e.message}`);
      return null;
    }
  };

  /**
   * Start timing an operation
   */
  const startTimer = (label) => {
    const startTime = performance.now();

    return {
      stop: () => {
        const duration = performance.now() - startTime;
        log(`Timer: ${label}`, `${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  };

  /**
   * Get current metrics report
   */
  const getMetrics = () => {
    const report = {
      pageLoad: metrics.pageLoad,
      paint: {
        firstPaint: metrics.firstPaint,
        firstContentfulPaint: metrics.firstContentfulPaint
      },
      domContentLoaded: metrics.domContentLoaded,
      moduleLoads: metrics.moduleLoads.length,
      slowModules: metrics.moduleLoads.filter(m => m.duration > 1000).length,
      memory: performance.memory ? {
        used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      } : null,
      customMarks: Array.from(metrics.customMarks.keys())
    };

    return report;
  };

  /**
   * Generate performance report
   */
  const generateReport = () => {
    const report = getMetrics();

    console.group('📊 Performance Report');
    console.log('Page Load:', report.pageLoad);
    console.log('Paint Metrics:', report.paint);
    console.log('DOM Content Loaded:', report.domContentLoaded?.toFixed(2) + 'ms');
    console.log('Modules Loaded:', report.moduleLoads);
    console.log('Slow Modules:', report.slowModules);

    if (report.memory) {
      console.log('Memory Usage:', report.memory);
    }

    if (report.customMarks.length > 0) {
      console.log('Custom Marks:', report.customMarks);
    }

    console.groupEnd();

    return report;
  };

  /**
   * Get performance score (0-100)
   */
  const getScore = () => {
    let score = 100;

    // Penalize slow FCP (First Contentful Paint)
    if (metrics.firstContentfulPaint) {
      if (metrics.firstContentfulPaint > 3000) score -= 30;
      else if (metrics.firstContentfulPaint > 1800) score -= 15;
      else if (metrics.firstContentfulPaint > 1000) score -= 5;
    }

    // Penalize slow modules
    const slowModules = metrics.moduleLoads.filter(m => m.duration > 1000).length;
    score -= slowModules * 5;

    // Penalize high memory usage
    if (performance.memory) {
      const usagePercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 90) score -= 20;
      else if (usagePercent > 75) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  };

  /**
   * Get performance recommendations
   */
  const getRecommendations = () => {
    const recommendations = [];

    // Check FCP
    if (metrics.firstContentfulPaint > 1800) {
      recommendations.push({
        priority: 'high',
        issue: 'Slow First Contentful Paint',
        suggestion: 'Optimize critical rendering path, reduce render-blocking resources'
      });
    }

    // Check slow modules
    const slowModules = metrics.moduleLoads.filter(m => m.duration > 1000);
    if (slowModules.length > 0) {
      recommendations.push({
        priority: 'medium',
        issue: `${slowModules.length} slow module(s)`,
        suggestion: 'Consider code splitting or lazy loading for large modules'
      });
    }

    // Check memory
    if (performance.memory) {
      const usagePercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 75) {
        recommendations.push({
          priority: 'high',
          issue: 'High memory usage',
          suggestion: 'Check for memory leaks, clean up event listeners, optimize data structures'
        });
      }
    }

    return recommendations;
  };

  /**
   * Log helper
   */
  const log = (label, data) => {
    if (!config.enabled || !config.logToConsole) {
      return;
    }

    console.log(`[PerformanceMonitor] ${label}:`, data);
  };

  /**
   * Clear metrics
   */
  const clear = () => {
    metrics.moduleLoads = [];
    metrics.userInteractions = [];
    metrics.memoryUsage = [];
    metrics.customMarks.clear();

    if (performance.clearMarks) {
      performance.clearMarks();
    }

    if (performance.clearMeasures) {
      performance.clearMeasures();
    }

    log('Metrics Cleared', 'All performance metrics have been cleared');
  };

  return {
    init,
    mark,
    measure,
    startTimer,
    getMetrics,
    generateReport,
    getScore,
    getRecommendations,
    clear,
    captureMemoryUsage
  };
})();
