/**
 * router.js - 基于 History API 的单页应用路由系统
 *
 * 功能：
 * - 支持嵌套路由（一级路由 + 二级标签路由）
 * - 浏览器前进/后退/刷新支持
 * - 路由守卫（权限控制）
 * - 404错误处理
 * - 视图懒加载
 */

export const Router = (() => {
  // 私有变量
  let routes = [];
  let currentRoute = null;
  let notFoundHandler = null;
  let beforeEachGuard = null;

  /**
   * 注册路由
   * @param {string} path - 路由路径（如 '/training/workouts'）
   * @param {Object} config - 路由配置
   * @param {Function} config.view - 返回视图对象的函数
   * @param {Function} config.beforeEnter - 路由独有的守卫
   * @param {Object} config.meta - 元数据（如 requiresAuth）
   */
  const addRoute = (path, config) => {
    routes.push({
      path,
      pattern: pathToRegex(path),
      ...config
    });
  };

  /**
   * 将路径转换为正则表达式
   * 支持动态参数：/user/:id => /user/123
   */
  const pathToRegex = (path) => {
    const paramNames = [];
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, (match, paramName) => {
        paramNames.push(paramName);
        return '([^\\/]+)';
      });
    return {
      regex: new RegExp(`^${pattern}$`),
      paramNames
    };
  };

  /**
   * 匹配当前路径
   * @param {string} path - 当前路径
   * @returns {Object|null} 匹配的路由配置
   */
  const matchRoute = (path) => {
    for (const route of routes) {
      const match = path.match(route.pattern.regex);
      if (match) {
        const params = {};
        route.pattern.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { route, params };
      }
    }
    return null;
  };

  /**
   * 导航到指定路径
   * @param {string} path - 目标路径
   * @param {boolean} replace - 是否替换当前历史记录
   */
  const push = async (path, replace = false) => {
    // 如果路径相同，不重复加载
    if (currentRoute === path) return;

    const matched = matchRoute(path);

    if (!matched) {
      handleNotFound(path);
      return;
    }

    const { route, params } = matched;

    // 执行全局守卫
    if (beforeEachGuard) {
      const guardResult = await beforeEachGuard(route, currentRoute);
      if (guardResult === false) return; // 守卫拦截
      if (typeof guardResult === 'string') {
        // 守卫重定向
        push(guardResult, replace);
        return;
      }
    }

    // 执行路由独有守卫
    if (route.beforeEnter) {
      const result = await route.beforeEnter(route, currentRoute);
      if (result === false) return;
      if (typeof result === 'string') {
        push(result, replace);
        return;
      }
    }

    // 更新浏览器历史
    if (replace) {
      window.history.replaceState({ path }, '', path);
    } else {
      window.history.pushState({ path }, '', path);
    }

    // 加载视图
    await loadView(route, params);

    currentRoute = path;

    // 触发路由变化事件
    window.dispatchEvent(new CustomEvent('routechange', {
      detail: { path, params, route }
    }));
  };

  /**
   * 创建DOM元素的安全方法
   */
  const createElementFromTemplate = (template) => {
    const wrapper = document.createElement('div');
    // 视图模板是受信任的内容（来自我们自己的代码）
    wrapper.innerHTML = template;
    return wrapper.firstElementChild || wrapper;
  };

  /**
   * 加载视图
   * @param {Object} route - 路由配置
   * @param {Object} params - 路由参数
   */
  const loadView = async (route, params) => {
    try {
      // 获取视图对象（可能是异步导入）
      const viewResult = await route.view();
      const view = viewResult.default || viewResult;

      // 卸载当前视图
      if (currentRoute && window.__currentView?.unmount) {
        await window.__currentView.unmount();
      }

      // 获取容器
      const container = document.getElementById('app');
      if (!container) {
        console.error('Router: 找不到 #app 容器');
        return;
      }

      // 渲染新视图（视图模板是受信任的内容）
      const template = typeof view.template === 'function'
        ? view.template(params)
        : view.template;

      // 清空容器
      container.textContent = '';

      // 创建并插入新内容
      const element = createElementFromTemplate(template);
      container.appendChild(element);

      // 挂载视图（初始化模块）
      if (view.mount) {
        await view.mount(params);
      }

      // 保存当前视图引用
      window.__currentView = view;

      // 滚动到顶部
      window.scrollTo(0, 0);

    } catch (error) {
      console.error('Router: 加载视图失败', error);
      handleError(error);
    }
  };

  /**
   * 处理404（使用安全的DOM方法）
   */
  const handleNotFound = (path) => {
    console.warn(`Router: 路由未找到 - ${path}`);
    if (notFoundHandler) {
      notFoundHandler(path);
    } else {
      // 默认404处理（使用安全的DOM方法）
      const container = document.getElementById('app');
      if (container) {
        container.textContent = ''; // 清空容器

        const notFoundDiv = document.createElement('div');
        notFoundDiv.className = 'not-found';

        const h1 = document.createElement('h1');
        h1.textContent = '404';

        const p = document.createElement('p');
        p.textContent = `页面未找到：${path}`; // 安全地显示路径

        const link = document.createElement('a');
        link.href = '/';
        link.textContent = '返回首页';
        link.setAttribute('data-link', '');

        notFoundDiv.appendChild(h1);
        notFoundDiv.appendChild(p);
        notFoundDiv.appendChild(link);
        container.appendChild(notFoundDiv);
      }
    }
  };

  /**
   * 处理错误（使用安全的DOM方法）
   */
  const handleError = (error) => {
    const container = document.getElementById('app');
    if (container) {
      container.textContent = ''; // 清空容器

      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';

      const h1 = document.createElement('h1');
      h1.textContent = '加载失败';

      const p = document.createElement('p');
      p.textContent = error.message; // 安全地显示错误信息

      const button = document.createElement('button');
      button.textContent = '刷新页面';
      button.onclick = () => location.reload();

      errorDiv.appendChild(h1);
      errorDiv.appendChild(p);
      errorDiv.appendChild(button);
      container.appendChild(errorDiv);
    }
  };

  /**
   * 注册全局前置守卫
   * @param {Function} guard - 守卫函数 (to, from) => boolean | string
   */
  const beforeEach = (guard) => {
    beforeEachGuard = guard;
  };

  /**
   * 注册404处理器
   */
  const setNotFound = (handler) => {
    notFoundHandler = handler;
  };

  /**
   * 初始化路由系统
   */
  const init = () => {
    // 监听浏览器前进/后退
    window.addEventListener('popstate', (event) => {
      const path = event.state?.path || window.location.pathname;
      push(path, true); // replace=true，避免重复添加历史记录
    });

    // 拦截所有链接点击
    document.addEventListener('click', (e) => {
      // 查找最近的 a 标签
      const link = e.target.closest('a[data-link]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) return;

      e.preventDefault();
      push(href);
    });

    // 加载初始路由
    const initialPath = window.location.pathname;
    push(initialPath, true);
  };

  /**
   * 获取当前路由路径
   */
  const getCurrentPath = () => currentRoute;

  /**
   * 返回上一页
   */
  const back = () => {
    window.history.back();
  };

  /**
   * 前进到下一页
   */
  const forward = () => {
    window.history.forward();
  };

  /**
   * 替换当前路由
   */
  const replace = (path) => {
    push(path, true);
  };

  // 公共API
  return {
    addRoute,
    push,
    replace,
    back,
    forward,
    beforeEach,
    setNotFound,
    init,
    getCurrentPath
  };
})();

/**
 * 路由配置工具函数
 */
export const createRoutes = (routeConfigs) => {
  routeConfigs.forEach(config => {
    Router.addRoute(config.path, {
      view: config.view,
      beforeEnter: config.beforeEnter,
      meta: config.meta
    });
  });
};
