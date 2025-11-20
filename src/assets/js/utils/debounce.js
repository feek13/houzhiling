/**
 * Debounce and Throttle Utilities
 * Optimize frequent function calls for better performance
 */

/**
 * Debounce function
 * Delays execution until after a specified wait time has elapsed since the last call
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute on leading edge instead of trailing
 * @returns {Function} Debounced function
 *
 * @example
 * const debouncedSearch = debounce((query) => {
 *   searchAPI(query);
 * }, 300);
 *
 * input.addEventListener('input', (e) => {
 *   debouncedSearch(e.target.value);
 * });
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;

  const debounced = function (...args) {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(context, args);
    }
  };

  // Add cancel method
  debounced.cancel = () => {
    clearTimeout(timeout);
    timeout = null;
  };

  // Add flush method
  debounced.flush = function (...args) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
      func.apply(this, args);
    }
  };

  return debounced;
};

/**
 * Throttle function
 * Ensures function is called at most once per specified time period
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @param {Object} options - Configuration options
 * @returns {Function} Throttled function
 *
 * @example
 * const throttledScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 *
 * window.addEventListener('scroll', throttledScroll);
 */
export const throttle = (func, limit, options = {}) => {
  const { leading = true, trailing = true } = options;

  let inThrottle;
  let lastFunc;
  let lastRan;

  return function (...args) {
    const context = this;

    if (!inThrottle) {
      if (leading) {
        func.apply(context, args);
      }
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          if (trailing) {
            func.apply(context, args);
          }
          lastRan = Date.now();
        }
      }, Math.max(limit - (Date.now() - lastRan), 0));
    }
  };
};

/**
 * RequestAnimationFrame-based throttle
 * Uses browser's optimal frame rate for smooth animations
 *
 * @param {Function} func - Function to throttle
 * @returns {Function} RAF-throttled function
 *
 * @example
 * const rafScroll = rafThrottle(() => {
 *   updateParallaxEffect();
 * });
 *
 * window.addEventListener('scroll', rafScroll);
 */
export const rafThrottle = (func) => {
  let rafId = null;
  let lastArgs;

  const throttled = function (...args) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, lastArgs);
        rafId = null;
      });
    }
  };

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttled;
};

/**
 * Leading debounce
 * Executes immediately on first call, then debounces subsequent calls
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Leading debounced function
 *
 * @example
 * const immediateAction = leadingDebounce(() => {
 *   showNotification('Action triggered!');
 * }, 1000);
 */
export const leadingDebounce = (func, wait) => {
  return debounce(func, wait, true);
};

/**
 * Debounce with promise
 * Returns a promise that resolves when debounced function executes
 *
 * @param {Function} func - Async function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced async function
 *
 * @example
 * const debouncedFetch = debouncePromise(
 *   async (query) => fetch(`/api/search?q=${query}`),
 *   300
 * );
 *
 * const result = await debouncedFetch('search term');
 */
export const debouncePromise = (func, wait) => {
  let timeout;
  let resolveList = [];

  return function (...args) {
    return new Promise((resolve, reject) => {
      clearTimeout(timeout);

      resolveList.push({ resolve, reject });

      timeout = setTimeout(async () => {
        const currentResolveList = resolveList;
        resolveList = [];

        try {
          const result = await func.apply(this, args);
          currentResolveList.forEach(({ resolve }) => resolve(result));
        } catch (error) {
          currentResolveList.forEach(({ reject }) => reject(error));
        }
      }, wait);
    });
  };
};

/**
 * Throttle with trailing call guarantee
 * Ensures the last call is always executed
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function with trailing call
 *
 * @example
 * const throttledResize = trailingThrottle(() => {
 *   recalculateLayout();
 * }, 200);
 *
 * window.addEventListener('resize', throttledResize);
 */
export const trailingThrottle = (func, limit) => {
  return throttle(func, limit, { leading: true, trailing: true });
};

/**
 * Once function
 * Ensures function is called only once, returns cached result on subsequent calls
 *
 * @param {Function} func - Function to call once
 * @returns {Function} Function that executes only once
 *
 * @example
 * const initializeOnce = once(() => {
 *   expensiveInitialization();
 * });
 *
 * initializeOnce(); // Runs
 * initializeOnce(); // Returns cached result
 */
export const once = (func) => {
  let called = false;
  let result;

  return function (...args) {
    if (!called) {
      called = true;
      result = func.apply(this, args);
    }
    return result;
  };
};

/**
 * Memoize function
 * Caches function results based on arguments
 *
 * @param {Function} func - Function to memoize
 * @param {Function} resolver - Custom key resolver function
 * @returns {Function} Memoized function
 *
 * @example
 * const expensiveCalc = memoize((a, b) => {
 *   console.log('Calculating...');
 *   return a * b * Math.random();
 * });
 *
 * expensiveCalc(5, 10); // Calculates
 * expensiveCalc(5, 10); // Returns cached result
 */
export const memoize = (func, resolver) => {
  const cache = new Map();

  const memoized = function (...args) {
    const key = resolver ? resolver.apply(this, args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  };

  memoized.cache = cache;

  memoized.clear = () => {
    cache.clear();
  };

  return memoized;
};

/**
 * Batch function calls
 * Collects multiple calls and executes them together
 *
 * @param {Function} func - Function to batch
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Batched function
 *
 * @example
 * const batchedUpdate = batch((items) => {
 *   updateDatabase(items);
 * }, 100);
 *
 * batchedUpdate(item1);
 * batchedUpdate(item2);
 * batchedUpdate(item3);
 * // All three items processed together after 100ms
 */
export const batch = (func, wait) => {
  let timeout;
  let items = [];

  return function (item) {
    items.push(item);

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      const currentItems = items;
      items = [];
      func.call(this, currentItems);
    }, wait);
  };
};

/**
 * Idle callback
 * Executes function when browser is idle
 *
 * @param {Function} func - Function to execute
 * @param {Object} options - requestIdleCallback options
 * @returns {number} Idle callback ID
 *
 * @example
 * idle(() => {
 *   performNonCriticalTask();
 * }, { timeout: 2000 });
 */
export const idle = (func, options = {}) => {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(func, options);
  } else {
    // Fallback for browsers without requestIdleCallback
    return setTimeout(func, 1);
  }
};

/**
 * Cancel idle callback
 *
 * @param {number} id - Idle callback ID
 */
export const cancelIdle = (id) => {
  if ('cancelIdleCallback' in window) {
    cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

/**
 * Sample rate limiter
 * Only executes function for a percentage of calls
 *
 * @param {Function} func - Function to rate limit
 * @param {number} rate - Sample rate (0-1, where 1 = 100%)
 * @returns {Function} Rate-limited function
 *
 * @example
 * const logSample = sample(() => {
 *   logAnalytics();
 * }, 0.1); // Only log 10% of calls
 */
export const sample = (func, rate) => {
  return function (...args) {
    if (Math.random() < rate) {
      return func.apply(this, args);
    }
  };
};

// Export all utilities
export default {
  debounce,
  throttle,
  rafThrottle,
  leadingDebounce,
  debouncePromise,
  trailingThrottle,
  once,
  memoize,
  batch,
  idle,
  cancelIdle,
  sample
};
