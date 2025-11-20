# OAuth 登录集成指南

## 概述

FitSpark 已集成第三方 OAuth 登录功能，支持用户通过 GitHub、Google 和 Facebook 账号快速登录。

**注意**: 当前实现为模拟版本，用于演示 OAuth 流程。在生产环境中需要配置真实的 OAuth 应用凭据。

## 功能特性

✅ **支持的提供商**:
- GitHub
- Google
- Facebook

✅ **核心功能**:
- 一键授权登录
- 安全的 State 参数验证
- 用户资料自动同步
- OAuth 账号关联
- 事件总线集成

## 架构

### 文件结构

```
src/
├── assets/
│   ├── js/
│   │   ├── services/
│   │   │   └── oauthService.js    # OAuth 核心服务
│   │   └── modules/
│   │       └── authUI.js          # 已集成 OAuth 按钮
│   └── css/
│       └── oauth.css              # OAuth 样式
└── docs/
    └── OAUTH_GUIDE.md             # 本文档
```

### 服务架构

```
┌─────────────┐
│   authUI    │  用户界面
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ oauthService│  OAuth 逻辑
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  eventBus   │  事件通知
└─────────────┘
```

## 使用方法

### 用户登录流程

1. 用户点击"登录"按钮
2. 在登录表单中选择 OAuth 提供商（GitHub/Google/Facebook）
3. 系统模拟跳转到 OAuth 授权页面
4. 自动完成授权（模拟环境）
5. 获取用户信息并创建/更新账号
6. 登录成功

### 开发者 API

#### 1. 发起 OAuth 授权

```javascript
import { oauthService } from './services/oauthService.js';

// 授权登录
const result = oauthService.authorize('github');
console.log('授权请求:', result);
// {
//   provider: 'github',
//   state: 'random_state_string',
//   authUrl: 'https://github.com/login/oauth/authorize'
// }
```

#### 2. 处理 OAuth 回调

```javascript
// 在实际应用中，这会在 OAuth 回调 URL 中自动调用
const user = oauthService.handleCallback(
  'github',           // provider
  'state_string',     // state (用于验证)
  'auth_code'         // 授权码
);

if (user) {
  console.log('登录成功:', user);
}
```

#### 3. 获取支持的提供商

```javascript
const providers = oauthService.getProviders();
// [
//   {
//     id: 'github',
//     name: 'GitHub',
//     icon: '🐙',
//     color: '#24292e',
//     authUrl: 'https://github.com/login/oauth/authorize',
//     scopes: ['user', 'user:email']
//   },
//   // ... 其他提供商
// ]
```

#### 4. 检查 OAuth 状态

```javascript
// 检查当前用户是否通过 OAuth 登录
const isOAuth = oauthService.isOAuthUser();
console.log('OAuth 用户:', isOAuth);

// 获取当前用户的 OAuth 提供商
const provider = oauthService.getCurrentProvider();
console.log('提供商:', provider); // 'github' | 'google' | 'facebook' | null
```

#### 5. 断开 OAuth 连接

```javascript
const success = oauthService.disconnect('github');
if (success) {
  console.log('已断开 GitHub 连接');
}
```

## OAuth 提供商配置

### GitHub

```javascript
{
  name: 'GitHub',
  icon: '🐙',
  color: '#24292e',
  authUrl: 'https://github.com/login/oauth/authorize',
  scopes: ['user', 'user:email']
}
```

**申请步骤** (生产环境):
1. 访问 GitHub Developer Settings
2. 创建 OAuth App
3. 设置回调 URL: `https://yourdomain.com/auth/github/callback`
4. 获取 Client ID 和 Client Secret

### Google

```javascript
{
  name: 'Google',
  icon: '🔍',
  color: '#4285f4',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  scopes: ['profile', 'email']
}
```

**申请步骤** (生产环境):
1. 访问 Google Cloud Console
2. 创建 OAuth 2.0 客户端 ID
3. 配置授权重定向 URI
4. 获取客户端 ID 和密钥

### Facebook

```javascript
{
  name: 'Facebook',
  icon: '📘',
  color: '#1877f2',
  authUrl: 'https://www.facebook.com/v12.0/dialog/oauth',
  scopes: ['public_profile', 'email']
}
```

**申请步骤** (生产环境):
1. 访问 Facebook Developers
2. 创建应用
3. 添加 Facebook Login 产品
4. 配置 OAuth 重定向 URI
5. 获取应用 ID 和密钥

## 事件集成

OAuth 服务与事件总线完全集成:

```javascript
import { eventBus, EventNames } from './services/eventBus.js';

// 监听登录成功事件
eventBus.on(EventNames.AUTH_LOGIN, (data) => {
  console.log('用户登录:', data.user);
  console.log('提供商:', data.provider); // 'github' | 'google' | 'facebook'
});

// 监听登出事件
eventBus.on(EventNames.AUTH_LOGOUT, (data) => {
  console.log('用户登出:', data.user);
  if (data.reason === 'oauth_disconnect') {
    console.log('OAuth 连接已断开');
  }
});

// 监听错误事件
eventBus.on(EventNames.ERROR_OCCURRED, (data) => {
  if (data.source === 'oauth') {
    console.error('OAuth 错误:', data.message);
  }
});
```

## 安全性

### CSRF 防护

OAuth 服务实现了 State 参数验证:

```javascript
// 授权时生成随机 state
const state = generateState(); // 随机字符串
storage.save('oauth_state', state);

// 回调时验证 state
const savedState = storage.get('oauth_state');
if (state !== savedState) {
  throw new Error('State 验证失败，可能存在 CSRF 攻击');
}
```

### 数据存储

- OAuth 用户数据存储在 localStorage
- 包含 `oauthProvider` 和 `oauthId` 字段
- 敏感令牌不会存储在客户端

### 最佳实践

1. **HTTPS Only**: 生产环境必须使用 HTTPS
2. **Token 管理**: 访问令牌应在后端处理
3. **Scope 最小化**: 只请求必要的权限
4. **定期刷新**: 实现 Token 刷新机制
5. **错误处理**: 优雅处理授权失败

## 生产环境部署

### 1. 后端 API 集成

```javascript
// 前端发起授权
async function authorizeOAuth(provider) {
  // 构建授权 URL
  const authUrl = buildAuthUrl(provider);

  // 重定向到 OAuth 提供商
  window.location.href = authUrl;
}

// 后端处理回调
app.get('/auth/:provider/callback', async (req, res) => {
  const { code, state } = req.query;
  const { provider } = req.params;

  // 验证 state
  if (!verifyState(state)) {
    return res.status(403).json({ error: 'Invalid state' });
  }

  // 交换访问令牌
  const token = await exchangeToken(provider, code);

  // 获取用户信息
  const userProfile = await fetchUserProfile(provider, token);

  // 创建或更新用户
  const user = await createOrUpdateUser(userProfile);

  // 创建会话
  req.session.userId = user.id;

  // 重定向回前端
  res.redirect('/?oauth_success=true');
});
```

### 2. 环境变量配置

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=https://yourdomain.com/auth/github/callback

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_CALLBACK_URL=https://yourdomain.com/auth/facebook/callback
```

### 3. 前端配置更新

```javascript
// config/oauth.js
export const OAUTH_CONFIG = {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    redirectUri: process.env.GITHUB_CALLBACK_URL,
    scopes: ['user', 'user:email']
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: process.env.GOOGLE_CALLBACK_URL,
    scopes: ['profile', 'email']
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    redirectUri: process.env.FACEBOOK_CALLBACK_URL,
    scopes: ['public_profile', 'email']
  }
};
```

## UI 定制

### 修改按钮样式

```css
/* 自定义 OAuth 按钮颜色 */
.oauth-btn[data-provider="github"] {
  --oauth-color: #your-color;
  --oauth-color-rgb: r, g, b;
}
```

### 添加新提供商

```javascript
// 1. 在 oauthService.js 中添加配置
const OAUTH_PROVIDERS = {
  // ... 现有提供商
  twitter: {
    name: 'Twitter',
    icon: '🐦',
    color: '#1da1f2',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'users.read']
  }
};

// 2. 添加模拟用户数据
const MOCK_OAUTH_USERS = {
  // ... 现有用户
  twitter: {
    id: 'tw_11111',
    provider: 'twitter',
    email: 'user@twitter.com',
    nickname: 'Twitter用户',
    avatar: 'https://ui-avatars.com/api/?name=Twitter&background=1da1f2&color=fff'
  }
};

// 3. 添加 CSS 样式
.oauth-btn[data-provider="twitter"] {
  --oauth-color: #1da1f2;
  --oauth-color-rgb: 29, 161, 242;
}
```

## 故障排查

### 问题 1: OAuth 按钮不显示

**检查清单**:
- ✅ oauth.css 已添加到 index.html
- ✅ oauthService.js 已导入到 authUI.js
- ✅ 清除浏览器缓存
- ✅ 检查控制台错误

### 问题 2: State 验证失败

**原因**: localStorage 被清除或 state 不匹配

**解决方案**:
```javascript
// 调试 state 验证
console.log('保存的 state:', storage.get('oauth_state'));
console.log('接收的 state:', state);
```

### 问题 3: 用户信息未同步

**原因**: fetchUserProfile 返回 null

**解决方案**:
1. 检查 MOCK_OAUTH_USERS 配置
2. 验证 provider 参数正确
3. 查看控制台日志

## 监控与分析

### 记录 OAuth 事件

```javascript
// 统计 OAuth 登录
eventBus.on(EventNames.AUTH_LOGIN, (data) => {
  if (data.provider) {
    // 发送分析事件
    analytics.track('OAuth Login', {
      provider: data.provider,
      userId: data.user.id,
      timestamp: Date.now()
    });
  }
});

// 统计 OAuth 错误
eventBus.on(EventNames.ERROR_OCCURRED, (data) => {
  if (data.source === 'oauth') {
    analytics.track('OAuth Error', {
      provider: data.provider,
      error: data.message,
      timestamp: Date.now()
    });
  }
});
```

## 示例代码

### 完整登录流程示例

```javascript
import { oauthService } from './services/oauthService.js';
import { eventBus, EventNames } from './services/eventBus.js';

// 创建 OAuth 登录组件
function createOAuthLoginComponent() {
  const container = document.createElement('div');

  // 获取支持的提供商
  const providers = oauthService.getProviders();

  // 创建按钮
  providers.forEach(provider => {
    const button = document.createElement('button');
    button.textContent = `登录 ${provider.name}`;
    button.onclick = async () => {
      try {
        // 发起授权
        oauthService.authorize(provider.id);

        // 显示加载状态
        button.textContent = '授权中...';
        button.disabled = true;
      } catch (error) {
        console.error('授权失败:', error);
        button.textContent = `登录 ${provider.name}`;
        button.disabled = false;
      }
    };

    container.appendChild(button);
  });

  // 监听登录成功
  eventBus.once(EventNames.AUTH_LOGIN, (data) => {
    console.log('登录成功:', data.user);
    // 跳转到仪表板
    window.location.href = '/dashboard';
  });

  return container;
}
```

## 总结

✅ **已实现功能**:
- OAuth 服务核心逻辑
- UI 集成与样式
- 事件总线集成
- CSRF 防护
- 用户资料同步

⏳ **后续优化**:
- 真实 OAuth 提供商集成
- Token 刷新机制
- 多账号绑定
- 第三方账号管理界面

📚 **相关文档**:
- [事件总线指南](./EVENT_BUS_GUIDE.md)
- [认证服务文档](./AUTH_SERVICE.md)

---

**注意**: 当前为演示版本，生产环境需要配置真实的 OAuth 凭据和后端服务器。
