/**
 * OAuth 认证服务
 * 功能：模拟第三方 OAuth 登录流程
 *
 * 注意：这是一个模拟实现，用于演示 OAuth 流程
 * 在生产环境中，需要使用真实的 OAuth 提供商和后端服务器
 */

import { storage } from './storage.js';
import { eventBus, EventNames } from './eventBus.js';

// OAuth 提供商配置
const OAUTH_PROVIDERS = {
  github: {
    name: 'GitHub',
    icon: '🐙',
    color: '#24292e',
    authUrl: 'https://github.com/login/oauth/authorize',
    scopes: ['user', 'user:email']
  },
  google: {
    name: 'Google',
    icon: '🔍',
    color: '#4285f4',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: ['profile', 'email']
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: '#1877f2',
    authUrl: 'https://www.facebook.com/v12.0/dialog/oauth',
    scopes: ['public_profile', 'email']
  }
};

// 模拟用户数据
const MOCK_OAUTH_USERS = {
  github: {
    id: 'gh_12345',
    provider: 'github',
    email: 'user@github.com',
    nickname: 'GitHub用户',
    avatar: 'https://ui-avatars.com/api/?name=GitHub&background=24292e&color=fff',
    profile: {
      bio: '来自 GitHub 的健身爱好者'
    }
  },
  google: {
    id: 'gg_67890',
    provider: 'google',
    email: 'user@gmail.com',
    nickname: 'Google用户',
    avatar: 'https://ui-avatars.com/api/?name=Google&background=4285f4&color=fff',
    profile: {
      bio: '来自 Google 的运动达人'
    }
  },
  facebook: {
    id: 'fb_54321',
    provider: 'facebook',
    email: 'user@facebook.com',
    nickname: 'Facebook用户',
    avatar: 'https://ui-avatars.com/api/?name=Facebook&background=1877f2&color=fff',
    profile: {
      bio: '来自 Facebook 的健康生活倡导者'
    }
  }
};

export const oauthService = (() => {
  /**
   * 生成随机 state 参数（用于防止 CSRF 攻击）
   */
  const generateState = () => {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  };

  /**
   * 模拟 OAuth 授权流程
   * @param {string} provider - OAuth 提供商 (github, google, facebook)
   */
  const authorize = (provider) => {
    if (!OAUTH_PROVIDERS[provider]) {
      console.error(`[OAuth] 未知的 OAuth 提供商: ${provider}`);
      eventBus.emit(EventNames.ERROR_OCCURRED, {
        source: 'oauth',
        message: `未知的提供商: ${provider}`
      });
      return;
    }

    const providerConfig = OAUTH_PROVIDERS[provider];
    const state = generateState();

    // 保存 state 用于验证回调
    storage.save('oauth_state', state);
    storage.save('oauth_provider', provider);

    console.log(`[OAuth] 正在跳转到 ${providerConfig.name} 授权页面...`);
    console.log(`[OAuth] 授权 URL: ${providerConfig.authUrl}`);
    console.log(`[OAuth] 权限范围: ${providerConfig.scopes.join(', ')}`);

    // 在实际应用中，这里会重定向到 OAuth 提供商的授权页面
    // window.location.href = `${providerConfig.authUrl}?client_id=...&redirect_uri=...&scope=...&state=${state}`;

    // 模拟：延迟 1 秒后自动完成授权
    setTimeout(() => {
      handleCallback(provider, state);
    }, 1000);

    return {
      provider,
      state,
      authUrl: providerConfig.authUrl
    };
  };

  /**
   * 处理 OAuth 回调
   * @param {string} provider - OAuth 提供商
   * @param {string} state - State 参数
   * @param {string} code - 授权码（模拟）
   */
  const handleCallback = (provider, state, code = 'mock_auth_code') => {
    // 验证 state
    const savedState = storage.get('oauth_state');
    const savedProvider = storage.get('oauth_provider');

    if (state !== savedState || provider !== savedProvider) {
      console.error('[OAuth] State 验证失败，可能存在 CSRF 攻击');
      eventBus.emit(EventNames.ERROR_OCCURRED, {
        source: 'oauth',
        message: 'State 验证失败'
      });
      return null;
    }

    console.log(`[OAuth] State 验证成功`);
    console.log(`[OAuth] 使用授权码: ${code}`);

    // 清理临时数据
    storage.remove('oauth_state');
    storage.remove('oauth_provider');

    // 模拟：使用授权码交换访问令牌
    const mockToken = `${provider}_token_${Date.now()}`;
    console.log(`[OAuth] 获取访问令牌: ${mockToken}`);

    // 模拟：使用访问令牌获取用户信息
    const userData = fetchUserProfile(provider, mockToken);

    if (userData) {
      // 保存用户信息
      const user = createOrUpdateUser(userData);
      storage.save('currentUser', user);

      console.log(`[OAuth] 登录成功:`, user);

      // 发布登录事件
      eventBus.emit(EventNames.AUTH_LOGIN, { user, provider });

      return user;
    }

    return null;
  };

  /**
   * 模拟获取用户资料
   * @param {string} provider - OAuth 提供商
   * @param {string} token - 访问令牌
   */
  const fetchUserProfile = (provider, token) => {
    console.log(`[OAuth] 正在从 ${provider} 获取用户资料...`);

    // 在实际应用中，这里会调用 OAuth 提供商的 API
    // const response = await fetch(`https://api.${provider}.com/user`, {
    //   headers: { 'Authorization': `Bearer ${token}` }
    // });

    // 模拟：返回预定义的用户数据
    const mockUser = MOCK_OAUTH_USERS[provider];

    if (mockUser) {
      console.log(`[OAuth] 成功获取用户资料:`, mockUser);
      return mockUser;
    }

    console.error(`[OAuth] 无法获取用户资料`);
    return null;
  };

  /**
   * 创建或更新用户
   * @param {Object} oauthData - OAuth 用户数据
   */
  const createOrUpdateUser = (oauthData) => {
    const users = storage.get('users', []);

    // 查找是否已存在该 OAuth 用户
    let existingUser = users.find(u =>
      u.oauthProvider === oauthData.provider &&
      u.oauthId === oauthData.id
    );

    if (existingUser) {
      // 更新现有用户
      existingUser.email = oauthData.email;
      existingUser.nickname = oauthData.nickname;
      existingUser.avatar = oauthData.avatar;
      existingUser.lastLogin = new Date().toISOString();

      console.log(`[OAuth] 更新现有用户:`, existingUser.email);
    } else {
      // 创建新用户
      existingUser = {
        id: `user_${Date.now()}`,
        email: oauthData.email,
        nickname: oauthData.nickname,
        avatar: oauthData.avatar,
        oauthProvider: oauthData.provider,
        oauthId: oauthData.id,
        profile: oauthData.profile || {},
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        metricsHistory: [],
        goals: {
          targetWeight: 70,
          targetCalories: 2000
        }
      };

      users.push(existingUser);
      console.log(`[OAuth] 创建新用户:`, existingUser.email);
    }

    storage.save('users', users);
    return existingUser;
  };

  /**
   * 获取所有支持的 OAuth 提供商
   */
  const getProviders = () => {
    return Object.keys(OAUTH_PROVIDERS).map(key => ({
      id: key,
      ...OAUTH_PROVIDERS[key]
    }));
  };

  /**
   * 断开 OAuth 连接
   * @param {string} provider - OAuth 提供商
   */
  const disconnect = (provider) => {
    const currentUser = storage.get('currentUser');

    if (!currentUser) {
      console.error('[OAuth] 没有当前用户');
      return false;
    }

    if (currentUser.oauthProvider !== provider) {
      console.error(`[OAuth] 当前用户不是通过 ${provider} 登录的`);
      return false;
    }

    console.log(`[OAuth] 断开 ${provider} 连接`);

    // 清除 OAuth 信息但保留用户数据
    delete currentUser.oauthProvider;
    delete currentUser.oauthId;

    storage.save('currentUser', currentUser);

    eventBus.emit(EventNames.AUTH_LOGOUT, {
      user: currentUser,
      reason: 'oauth_disconnect'
    });

    return true;
  };

  /**
   * 检查用户是否通过 OAuth 登录
   */
  const isOAuthUser = () => {
    const currentUser = storage.get('currentUser');
    return currentUser && currentUser.oauthProvider;
  };

  /**
   * 获取当前用户的 OAuth 提供商
   */
  const getCurrentProvider = () => {
    const currentUser = storage.get('currentUser');
    return currentUser?.oauthProvider || null;
  };

  return {
    authorize,
    handleCallback,
    getProviders,
    disconnect,
    isOAuthUser,
    getCurrentProvider
  };
})();
