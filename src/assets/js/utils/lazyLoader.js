/**
 * Lazy Loading Utility
 * Implements dynamic module loading and code splitting for better performance
 */

export const lazyLoader = (() => {
  // Cache for loaded modules
  const moduleCache = new Map();

  // Loading state tracking
  const loadingState = new Map();

  /**
   * Dynamically import a module with caching
   * @param {string} modulePath - Path to the module
   * @param {Object} options - Loading options
   * @returns {Promise<Module>} The loaded module
   */
  const loadModule = async (modulePath, options = {}) => {
    const {
      cache = true,
      timeout = 10000,
      retries = 3
    } = options;

    // Return cached module if available
    if (cache && moduleCache.has(modulePath)) {
      return moduleCache.get(modulePath);
    }

    // Return existing promise if already loading
    if (loadingState.has(modulePath)) {
      return loadingState.get(modulePath);
    }

    // Create loading promise with timeout and retry
    const loadPromise = loadWithRetry(modulePath, retries, timeout);

    loadingState.set(modulePath, loadPromise);

    try {
      const module = await loadPromise;

      if (cache) {
        moduleCache.set(modulePath, module);
      }

      loadingState.delete(modulePath);
      return module;
    } catch (error) {
      loadingState.delete(modulePath);
      throw error;
    }
  };

  /**
   * Load module with retry logic
   */
  const loadWithRetry = async (modulePath, retries, timeout) => {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        const module = await Promise.race([
          import(modulePath),
          timeoutPromise(timeout)
        ]);

        console.log(`[LazyLoader] Loaded: ${modulePath} (attempt ${i + 1})`);
        return module;
      } catch (error) {
        lastError = error;
        console.warn(`[LazyLoader] Retry ${i + 1}/${retries} for ${modulePath}`);

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
      }
    }

    throw new Error(`Failed to load module ${modulePath} after ${retries} attempts: ${lastError.message}`);
  };

  /**
   * Timeout promise utility
   */
  const timeoutPromise = (ms) => {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Module load timeout after ${ms}ms`)), ms)
    );
  };

  /**
   * Preload modules in the background
   * @param {string[]} modulePaths - Array of module paths to preload
   */
  const preload = async (modulePaths) => {
    const preloadPromises = modulePaths.map(path =>
      loadModule(path, { cache: true }).catch(err => {
        console.warn(`[LazyLoader] Preload failed for ${path}:`, err);
        return null;
      })
    );

    const results = await Promise.allSettled(preloadPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;

    console.log(`[LazyLoader] Preloaded ${successful}/${modulePaths.length} modules`);
    return results;
  };

  /**
   * Clear module cache
   * @param {string} modulePath - Specific module to clear, or clear all if not provided
   */
  const clearCache = (modulePath) => {
    if (modulePath) {
      moduleCache.delete(modulePath);
      console.log(`[LazyLoader] Cleared cache for: ${modulePath}`);
    } else {
      moduleCache.clear();
      console.log('[LazyLoader] Cleared all module cache');
    }
  };

  /**
   * Get cache statistics
   */
  const getCacheStats = () => {
    return {
      cached: moduleCache.size,
      loading: loadingState.size,
      modules: Array.from(moduleCache.keys())
    };
  };

  /**
   * Lazy load images with intersection observer
   * @param {string} selector - CSS selector for images to lazy load
   */
  const lazyLoadImages = (selector = 'img[data-src]') => {
    const images = document.querySelectorAll(selector);

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            const srcset = img.dataset.srcset;

            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
            }

            if (srcset) {
              img.srcset = srcset;
              img.removeAttribute('data-srcset');
            }

            img.classList.add('loaded');
            observer.unobserve(img);

            console.log(`[LazyLoader] Loaded image: ${src || srcset}`);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      images.forEach(img => imageObserver.observe(img));

      return imageObserver;
    } else {
      // Fallback for browsers without IntersectionObserver
      images.forEach(img => {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        if (src) img.src = src;
        if (srcset) img.srcset = srcset;

        img.classList.add('loaded');
      });
    }
  };

  /**
   * Lazy load sections of the page
   * @param {string} selector - CSS selector for sections to lazy load
   * @param {Function} callback - Callback when section becomes visible
   */
  const lazyLoadSections = (selector, callback) => {
    const sections = document.querySelectorAll(selector);

    if ('IntersectionObserver' in window) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const section = entry.target;
            section.classList.add('visible');

            if (callback) {
              callback(section);
            }

            console.log(`[LazyLoader] Section visible: ${section.id || section.className}`);
          }
        });
      }, {
        rootMargin: '100px 0px',
        threshold: 0.1
      });

      sections.forEach(section => sectionObserver.observe(section));

      return sectionObserver;
    }
  };

  /**
   * Prefetch resources
   * @param {string[]} urls - URLs to prefetch
   * @param {string} as - Resource type (script, style, image, etc.)
   */
  const prefetch = (urls, as = 'fetch') => {
    if (!Array.isArray(urls)) {
      urls = [urls];
    }

    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = as;
      document.head.appendChild(link);

      console.log(`[LazyLoader] Prefetching: ${url}`);
    });
  };

  /**
   * Preconnect to domains
   * @param {string[]} domains - Domains to preconnect
   */
  const preconnect = (domains) => {
    if (!Array.isArray(domains)) {
      domains = [domains];
    }

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);

      console.log(`[LazyLoader] Preconnecting to: ${domain}`);
    });
  };

  /**
   * Load CSS dynamically
   * @param {string} href - CSS file URL
   * @param {Object} options - Loading options
   */
  const loadCSS = (href, options = {}) => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;

      if (options.media) {
        link.media = options.media;
      }

      link.onload = () => {
        console.log(`[LazyLoader] CSS loaded: ${href}`);
        resolve(link);
      };

      link.onerror = () => {
        reject(new Error(`Failed to load CSS: ${href}`));
      };

      document.head.appendChild(link);
    });
  };

  /**
   * Load JavaScript dynamically
   * @param {string} src - JavaScript file URL
   * @param {Object} options - Loading options
   */
  const loadScript = (src, options = {}) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async !== false;
      script.defer = options.defer === true;

      if (options.type) {
        script.type = options.type;
      }

      script.onload = () => {
        console.log(`[LazyLoader] Script loaded: ${src}`);
        resolve(script);
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.body.appendChild(script);
    });
  };

  return {
    loadModule,
    preload,
    clearCache,
    getCacheStats,
    lazyLoadImages,
    lazyLoadSections,
    prefetch,
    preconnect,
    loadCSS,
    loadScript
  };
})();
