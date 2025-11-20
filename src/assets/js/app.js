/**
 * app.js - 应用入口（路由驱动版本）
 *
 * 改造说明：
 * - 移除全量模块初始化（从18个模块同时init改为按需加载）
 * - 引入路由系统，根据URL动态加载对应视图和模块
 * - 保留事件总线、性能监控等核心功能
 */

import { Router, createRoutes } from './router.js';
import { Navigation } from './components/Navigation.js';
import { authService } from './services/authService.js';
import { eventBus, EventNames } from './services/eventBus.js';
import { performanceMonitor } from './utils/performanceMonitor.js';
import { lazyLoader } from './utils/lazyLoader.js';
import { modal } from './modules/modal.js';
import { workoutService } from './services/workoutService.js';

/**
 * 定义路由配置
 */
const defineRoutes = () => {
  createRoutes([
    // 首页 - 欢迎页
    {
      path: '/',
      view: () => import('./views/HomeView.js'),
      meta: { requiresAuth: false }
    },

    // 登录/注册页
    {
      path: '/auth',
      view: () => import('./views/AuthView.js'),
      meta: { requiresAuth: false },
      beforeEnter: (to, from) => {
        // 如果已登录，重定向到个人中心
        if (authService.currentUser() !== null) {
          return '/personal/profile';
        }
      }
    },

    // 个人中心（重定向到个人资料）
    {
      path: '/personal',
      view: () => import('./views/ProfileView.js'),
      meta: { requiresAuth: true },
      beforeEnter: (to, from) => {
        return '/personal/profile';
      }
    },

    // 个人中心 - 个人资料
    {
      path: '/personal/profile',
      view: () => import('./views/ProfileView.js'),
      meta: { requiresAuth: true }
    },

    // 个人中心 - 身体数据
    {
      path: '/personal/health',
      view: () => import('./views/HealthView.js'),
      meta: { requiresAuth: false }
    },

    // 训练中心（重定向到训练课程）
    {
      path: '/training',
      view: () => import('./views/WorkoutsView.js'),
      meta: { requiresAuth: false },
      beforeEnter: (to, from) => {
        return '/training/workouts';
      }
    },

    // 训练中心 - 训练课程
    {
      path: '/training/workouts',
      view: () => import('./views/WorkoutsView.js'),
      meta: { requiresAuth: false }
    },

    // 训练中心 - 训练日历
    {
      path: '/training/calendar',
      view: () => import('./views/CalendarView.js'),
      meta: { requiresAuth: false }
    },

    // 训练中心 - 营养日志
    {
      path: '/training/nutrition',
      view: () => import('./views/NutritionView.js'),
      meta: { requiresAuth: false }
    },

    // 社交中心（重定向到好友）
    {
      path: '/social',
      view: () => import('./views/FriendsView.js'),
      meta: { requiresAuth: false },
      beforeEnter: (to, from) => {
        return '/social/friends';
      }
    },

    // 社交中心 - 好友
    {
      path: '/social/friends',
      view: () => import('./views/FriendsView.js'),
      meta: { requiresAuth: false }
    },

    // 社交中心 - 动态
    {
      path: '/social/feed',
      view: () => import('./views/FeedView.js'),
      meta: { requiresAuth: false }
    },

    // 社交中心 - 社区
    {
      path: '/social/community',
      view: () => import('./views/CommunityView.js'),
      meta: { requiresAuth: false }
    },

    // 数据中心（重定向到数据分析）
    {
      path: '/data',
      view: () => import('./views/AnalyticsView.js'),
      meta: { requiresAuth: false },
      beforeEnter: (to, from) => {
        return '/data/analytics';
      }
    },

    // 数据中心 - 数据分析
    {
      path: '/data/analytics',
      view: () => import('./views/AnalyticsView.js'),
      meta: { requiresAuth: false }
    },

    // 数据中心 - 排行榜
    {
      path: '/data/leaderboard',
      view: () => import('./views/LeaderboardView.js'),
      meta: { requiresAuth: false }
    },

    // Roadmap
    {
      path: '/roadmap',
      view: () => import('./views/RoadmapView.js'),
      meta: { requiresAuth: false }
    }
  ]);
};

/**
 * 设置全局路由守卫
 */
const setupRouterGuards = () => {
  Router.beforeEach((to, from) => {
    // 检查是否需要认证
    if (to.meta?.requiresAuth && authService.currentUser() === null) {
      // 未登录，重定向到登录页
      console.log('[Router Guard] 需要登录，重定向到 /auth');
      return '/auth';
    }

    // 允许导航
    return true;
  });

  // 设置404处理
  Router.setNotFound((path) => {
    console.warn(`[Router] 404: ${path}`);
    const container = document.getElementById('app');
    if (container) {
      container.textContent = '';

      const notFoundDiv = document.createElement('div');
      notFoundDiv.className = 'not-found';
      notFoundDiv.style.cssText = 'text-align:center; padding:50px;';

      const h1 = document.createElement('h1');
      h1.textContent = '404 - 页面未找到';

      const p = document.createElement('p');
      p.textContent = `路径 "${path}" 不存在`;

      const link = document.createElement('a');
      link.href = '/';
      link.textContent = '返回首页';
      link.setAttribute('data-link', '');
      link.className = 'btn primary';

      notFoundDiv.appendChild(h1);
      notFoundDiv.appendChild(p);
      notFoundDiv.appendChild(link);
      container.appendChild(notFoundDiv);
    }
  });
};

/**
 * 初始化事件总线监听器
 */
const initEventBusListeners = () => {
  // 监听登录事件
  eventBus.on(EventNames.AUTH_LOGIN, (data) => {
    console.log('[EventBus] User logged in:', data.user.email);

    // 登录后重定向到个人中心
    Router.push('/personal/profile');

    // 刷新导航和按钮
    Navigation.updateNavHighlight();
    updateAuthButton();
  });

  // 监听登出事件
  eventBus.on(EventNames.AUTH_LOGOUT, (data) => {
    console.log('[EventBus] User logged out:', data.user.email);

    // 登出后返回首页
    Router.push('/');

    // 刷新导航和按钮
    Navigation.updateNavHighlight();
    updateAuthButton();
  });

  // 监听模态框事件
  eventBus.on(EventNames.MODAL_OPEN, (data) => {
    console.log('[EventBus] Modal opened:', data.type || 'generic');
  });

  eventBus.on(EventNames.MODAL_CLOSE, () => {
    console.log('[EventBus] Modal closed');
  });

  // 监听训练完成事件（用于跨模块数据同步）
  eventBus.on(EventNames.WORKOUT_COMPLETED, (data) => {
    console.log('[EventBus] Workout completed:', data);
    // 其他模块会通过eventBus监听并自动更新
  });

  // 监听营养记录事件
  eventBus.on(EventNames.NUTRITION_LOGGED, (data) => {
    console.log('[EventBus] Nutrition logged:', data);
  });

  // Wildcard listener for debugging
  if (eventBus.debug) {
    eventBus.on('*', (eventName, data) => {
      console.log(`[EventBus] Event fired: ${eventName}`, data);
    });
  }
};

/**
 * 更新"开始体验"按钮的显示状态
 */
const updateAuthButton = () => {
  const authBtn = document.getElementById('auth-btn');
  if (!authBtn) return;

  const currentUser = authService.currentUser();

  if (currentUser) {
    // 已登录：隐藏按钮或改为用户信息
    authBtn.textContent = currentUser.nickname || '我的主页';
    authBtn.classList.remove('primary');
    authBtn.classList.add('secondary');
  } else {
    // 未登录：显示"开始体验"
    authBtn.textContent = '开始体验';
    authBtn.classList.remove('secondary');
    authBtn.classList.add('primary');
  }
};

/**
 * 初始化模态框
 */
const initModal = () => {
  // 关闭按钮
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => modal.close());
  });

  // 点击backdrop关闭
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => modal.close());
  }

  // "开始体验"按钮 - 跳转到auth页面
  const authBtn = document.getElementById('auth-btn');
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      if (authService.currentUser() !== null) {
        Router.push('/personal/profile');
      } else {
        Router.push('/auth');
      }
    });

    // 初始化时更新按钮状态
    updateAuthButton();
  }
};

/**
 * 应用初始化
 */
const init = async () => {
  // 初始化性能监控
  performanceMonitor.init({
    enabled: true,
    logToConsole: false,
    sampleRate: 1.0,
    reportInterval: 30000
  });

  performanceMonitor.mark('app-init-start');

  // 初始化懒加载
  lazyLoader.lazyLoadImages('img[data-src]');

  // 初始化课程数据（迁移官方课程到localStorage）
  await workoutService.initOfficialWorkouts();

  // 初始化事件总线
  initEventBusListeners();

  // 定义路由
  defineRoutes();

  // 设置路由守卫
  setupRouterGuards();

  // 初始化路由系统
  Router.init();

  // 初始化导航组件
  Navigation.init();

  // 初始化模态框
  initModal();

  performanceMonitor.mark('app-init-end');
  performanceMonitor.measure('app-initialization', 'app-init-start', 'app-init-end');

  // Log performance report after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const score = performanceMonitor.getScore();
      console.log(`[Performance] Score: ${score}/100`);

      if (score < 80) {
        const recommendations = performanceMonitor.getRecommendations();
        console.warn('[Performance] Recommendations:', recommendations);
      }

      // 统计初始加载JS大小
      const scriptSize = document.querySelector('script[src*="app.js"]')?.src?.length || 0;
      console.log(`[Performance] Initial JS size: ~${Math.round(scriptSize / 1024)}KB (estimated)`);
    }, 1000);
  });
};

// 启动应用
window.addEventListener('DOMContentLoaded', init);

// 导出用于测试
export { init, defineRoutes, setupRouterGuards };
