/**
 * Navigation.js - 导航组件
 *
 * 功能：
 * - 一级导航（4个功能中心 + Roadmap）
 * - 二级标签导航（动态渲染）
 * - 路由激活状态高亮
 * - 响应路由变化
 */

import { Router } from '../router.js';
import { authService } from '../services/authService.js';
import { eventBus, EventNames } from '../services/eventBus.js';

export const Navigation = (() => {
  // 二级导航配置
  const SUB_NAV_CONFIG = {
    personal: [
      { path: '/personal/profile', label: '个人资料' },
      { path: '/personal/health', label: '身体数据' }
    ],
    training: [
      { path: '/training/workouts', label: '训练课程' },
      { path: '/training/calendar', label: '训练日历' },
      { path: '/training/nutrition', label: '营养日志' }
    ],
    social: [
      { path: '/social/friends', label: '好友' },
      { path: '/social/feed', label: '动态' },
      { path: '/social/community', label: '社区' }
    ],
    data: [
      { path: '/data/analytics', label: '数据分析' },
      { path: '/data/leaderboard', label: '排行榜' }
    ]
  };

  // 一级导航配置
  const MAIN_NAV_CONFIG = [
    { path: '/personal', label: '个人中心', key: 'personal', requiresAuth: true },
    { path: '/training', label: '训练中心', key: 'training', requiresAuth: false },
    { path: '/social', label: '社交中心', key: 'social', requiresAuth: false },
    { path: '/data', label: '数据中心', key: 'data', requiresAuth: false },
    { path: '/roadmap', label: 'Roadmap', key: 'roadmap', requiresAuth: false }
  ];

  /**
   * 初始化导航
   */
  const init = () => {
    renderMainNav();
    updateSubNav();
    initMobileMenu();

    // 监听路由变化
    window.addEventListener('routechange', () => {
      updateNavHighlight();
      updateSubNav();
    });

    // 监听登录状态变化 (使用 eventBus)
    eventBus.on(EventNames.AUTH_LOGIN, () => {
      renderMainNav();
      updateNavHighlight();
    });

    eventBus.on(EventNames.AUTH_LOGOUT, () => {
      renderMainNav();
      updateNavHighlight();
    });

    // 初始高亮
    updateNavHighlight();
  };

  /**
   * 渲染一级导航
   */
  const renderMainNav = () => {
    const mainNav = document.querySelector('.main-nav');
    if (!mainNav) return;

    const isAuthenticated = authService.currentUser() !== null;

    mainNav.textContent = ''; // 清空

    // 始终显示的导航项
    const homeLink = createNavLink('/', '首页');
    mainNav.appendChild(homeLink);

    // 如果未登录，显示登录链接
    if (!isAuthenticated) {
      const authLink = createNavLink('/auth', '登录/注册');
      mainNav.appendChild(authLink);
    }

    // 渲染主导航
    MAIN_NAV_CONFIG.forEach(item => {
      // 如果需要认证且用户未登录，跳过
      if (item.requiresAuth && !isAuthenticated) {
        return;
      }

      const link = createNavLink(item.path, item.label);
      link.dataset.navKey = item.key;
      mainNav.appendChild(link);
    });

    // 渲染移动端导航
    renderMobileNav(isAuthenticated);
  };

  /**
   * 渲染移动端导航
   */
  const renderMobileNav = (isAuthenticated) => {
    const mobileMenuInner = document.querySelector('.mobile-menu-inner');
    if (!mobileMenuInner) return;

    mobileMenuInner.innerHTML = ''; // 清空

    // 首页链接
    mobileMenuInner.appendChild(createNavLink('/', '首页'));

    // 主导航项
    MAIN_NAV_CONFIG.forEach(item => {
      if (item.requiresAuth && !isAuthenticated) return;
      mobileMenuInner.appendChild(createNavLink(item.path, item.label));
    });

    // 登录/注册 (如果未登录)
    if (!isAuthenticated) {
      mobileMenuInner.appendChild(createNavLink('/auth', '登录/注册'));
    }
  };

  /**
   * 初始化移动端菜单事件
   */
  const initMobileMenu = () => {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const links = menu ? menu.querySelectorAll('a') : [];

    if (!btn || !menu) return;

    // 切换菜单
    btn.addEventListener('click', () => {
      const isActive = btn.classList.contains('active');
      if (isActive) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // 点击链接关闭菜单
    menu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        closeMobileMenu();
      }
    });
  };

  const openMobileMenu = () => {
    document.getElementById('mobile-menu-btn')?.classList.add('active');
    document.getElementById('mobile-menu')?.classList.add('active');
    document.body.style.overflow = 'hidden'; // 禁止背景滚动
  };

  const closeMobileMenu = () => {
    document.getElementById('mobile-menu-btn')?.classList.remove('active');
    document.getElementById('mobile-menu')?.classList.remove('active');
    document.body.style.overflow = '';
  };

  /**
   * 创建导航链接
   */
  const createNavLink = (path, label) => {
    const link = document.createElement('a');
    link.href = path;
    link.textContent = label;
    link.setAttribute('data-link', '');
    return link;
  };

  /**
   * 更新导航高亮
   */
  const updateNavHighlight = () => {
    const currentPath = Router.getCurrentPath() || window.location.pathname;
    const mainNav = document.querySelector('.main-nav');
    if (!mainNav) return;

    // 移除所有active类
    mainNav.querySelectorAll('a').forEach(link => {
      link.classList.remove('active');
    });

    // 添加active类到当前路径
    const segments = currentPath.split('/').filter(Boolean);
    const firstSegment = segments[0] || '';

    // 高亮一级导航
    mainNav.querySelectorAll('a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || href === `/${firstSegment}`) {
        link.classList.add('active');
      }
    });

    // 高亮二级导航
    const subNav = document.getElementById('sub-nav');
    if (subNav) {
      subNav.querySelectorAll('a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
          link.classList.add('active');
        }
      });
    }
  };

  /**
   * 更新二级导航
   */
  const updateSubNav = () => {
    const subNav = document.getElementById('sub-nav');
    if (!subNav) return;

    const currentPath = Router.getCurrentPath() || window.location.pathname;
    const segments = currentPath.split('/').filter(Boolean);
    const firstSegment = segments[0] || '';

    // 获取二级导航配置
    const subNavItems = SUB_NAV_CONFIG[firstSegment];

    if (!subNavItems) {
      // 无二级导航，隐藏
      subNav.style.display = 'none';
      subNav.textContent = '';
      return;
    }

    // 显示二级导航
    subNav.style.display = 'flex';
    subNav.textContent = '';

    // 渲染二级导航项
    subNavItems.forEach(item => {
      const link = createNavLink(item.path, item.label);
      if (currentPath === item.path) {
        link.classList.add('active');
      }
      subNav.appendChild(link);
    });
  };

  /**
   * 获取当前激活的一级导航key
   */
  const getCurrentNavKey = () => {
    const currentPath = Router.getCurrentPath() || window.location.pathname;
    const segments = currentPath.split('/').filter(Boolean);
    return segments[0] || '';
  };

  // 公共API
  return {
    init,
    updateNavHighlight,
    updateSubNav,
    getCurrentNavKey
  };
})();

export default Navigation;
