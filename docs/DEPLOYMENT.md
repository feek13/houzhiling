# FitSpark 部署指南

FitSpark 的完整部署指南，包括 CI/CD 流水线、托管选项和最佳实践。

## 目录

- [快速开始](#快速开始)
- [CI/CD 流水线](#cicd-流水线)
- [部署选项](#部署选项)
- [环境配置](#环境配置)
- [生产构建](#生产构建)
- [监控](#监控)
- [回滚策略](#回滚策略)
- [故障排查](#故障排查)

## 快速开始

### 前置要求

- 已安装 Node.js 18+
- 已配置 Git 仓库
- GitHub 账号（用于 CI/CD）

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/fitspark.git
cd fitspark

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器
open http://localhost:3000
```

### 生产部署

```bash
# 运行测试
npm test

# 生产构建
npm run build

# 部署
npm run deploy
```

## CI/CD 流水线

FitSpark 使用 GitHub Actions 实现持续集成和部署。

### 工作流

#### 1. CI 工作流 (`.github/workflows/ci.yml`)

在每次推送和拉取请求到 `main` 和 `develop` 分支时运行。

**阶段：**
1. **代码检查与格式化** - 代码质量检查
2. **测试** - 单元和集成测试
3. **构建** - 验证构建成功
4. **安全** - npm audit 漏洞检查
5. **性能** - Lighthouse CI 检查

**触发条件：**
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
```

#### 2. 部署工作流 (`.github/workflows/deploy.yml`)

在合并到 `main` 时部署到生产环境。

**阶段：**
1. **部署** - 构建并部署到托管平台
2. **发布** - 创建 GitHub 发布
3. **通知** - 发送部署通知

**触发条件：**
```yaml
on:
  push:
    branches: [ main ]
  workflow_dispatch:  # 手动触发
```

### 配置 GitHub Actions

1. **启用 Actions:**
   - 前往仓库 Settings → Actions
   - 启用 "Allow all actions and reusable workflows"

2. **配置 Secrets:**
   ```
   Settings → Secrets and variables → Actions → New repository secret
   ```

   需要的 secrets:
   - `DEPLOY_TOKEN` - 部署认证令牌
   - `CODECOV_TOKEN` - 代码覆盖率报告（可选）

3. **状态徽章:**
   添加到 README.md:
   ```markdown
   ![CI](https://github.com/yourusername/fitspark/workflows/CI/badge.svg)
   ![Deploy](https://github.com/yourusername/fitspark/workflows/Deploy/badge.svg)
   ```

### 工作流文件

工作流已配置在：
- `.github/workflows/ci.yml` - 持续集成
- `.github/workflows/deploy.yml` - 部署

## 部署选项

### 选项 1: GitHub Pages (推荐)

**优点：**
- 免费托管
- 默认 HTTPS
- 简单配置
- 自动部署

**配置：**

1. 启用 GitHub Pages:
   ```
   Repository Settings → Pages
   Source: gh-pages branch
   ```

2. 配置自定义域名（可选）:
   ```
   Settings → Pages → Custom domain: fitspark.example.com
   ```

3. 添加 CNAME 记录到 DNS:
   ```
   CNAME fitspark.example.com → yourusername.github.io
   ```

4. 部署工作流会自动处理其余部分！

### 选项 2: Netlify

**优点：**
- 简单部署
- 自动 HTTPS
- 无服务器函数
- 表单处理

**配置：**

1. 安装 Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. 初始化:
   ```bash
   netlify init
   ```

3. 配置 `netlify.toml`:
   ```toml
   [build]
     publish = "src"
     command = "npm run build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

4. 部署:
   ```bash
   netlify deploy --prod
   ```

### 选项 3: Vercel

**优点：**
- 出色的性能
- 边缘网络
- 预览部署
- 零配置

**配置：**

1. 安装 Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. 部署:
   ```bash
   vercel
   ```

3. 按提示配置

### 选项 4: 自托管

**生产服务器：**

```bash
# 安装 nginx
sudo apt install nginx

# 配置 nginx
sudo nano /etc/nginx/sites-available/fitspark

# 添加配置：
server {
    listen 80;
    server_name fitspark.example.com;
    root /var/www/fitspark/src;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用 gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}

# 启用站点
sudo ln -s /etc/nginx/sites-available/fitspark /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 使用 Let's Encrypt 配置 SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d fitspark.example.com
```

## 环境配置

### 环境变量

为不同环境创建 `.env` 文件：

**`.env.development`:**
```env
NODE_ENV=development
API_URL=http://localhost:3000
ANALYTICS_ENABLED=false
DEBUG=true
```

**`.env.production`:**
```env
NODE_ENV=production
API_URL=https://api.fitspark.com
ANALYTICS_ENABLED=true
DEBUG=false
```

### 配置管理

```javascript
// config.js
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    analytics: false,
    debug: true
  },
  production: {
    apiUrl: 'https://api.fitspark.com',
    analytics: true,
    debug: false
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

## 生产构建

### 构建优化

1. **压缩：**
   ```bash
   # 安装 terser 用于 JS 压缩
   npm install -D terser

   # 压缩 JavaScript
   npx terser src/assets/js/app.js -c -m -o dist/app.min.js
   ```

2. **CSS 优化：**
   ```bash
   # 安装 cssnano
   npm install -D cssnano postcss-cli

   # 压缩 CSS
   npx postcss src/assets/css/*.css --use cssnano -d dist/css
   ```

3. **图片优化：**
   ```bash
   # 安装 imagemin
   npm install -D imagemin imagemin-mozjpeg imagemin-pngquant

   # 优化图片
   npx imagemin src/assets/images/* --out-dir=dist/images
   ```

### 构建脚本

添加到 `package.json`:

```json
{
  "scripts": {
    "build": "npm run build:js && npm run build:css && npm run build:html",
    "build:js": "terser src/assets/js/**/*.js -c -m -o dist/app.min.js",
    "build:css": "postcss src/assets/css/*.css --use cssnano -d dist/css",
    "build:html": "cp src/index.html dist/",
    "prebuild": "rm -rf dist && mkdir -p dist dist/css dist/js",
    "postbuild": "cp -r src/assets/images dist/ && echo 'Build complete!'"
  }
}
```

### 资源优化

**清单：**
- [ ] 压缩 JavaScript
- [ ] 压缩 CSS
- [ ] 优化图片（WebP 格式）
- [ ] 启用 gzip/brotli 压缩
- [ ] 设置缓存头
- [ ] 静态资源使用 CDN
- [ ] 实现 Service Worker
- [ ] 懒加载图片
- [ ] 代码分割

## 监控

### 性能监控

```javascript
// 生产环境监控
if (config.analytics) {
  performanceMonitor.init({
    enabled: true,
    reportInterval: 60000
  });

  // 发送指标到分析服务
  setInterval(() => {
    const metrics = performanceMonitor.getMetrics();
    sendToAnalytics(metrics);
  }, 300000); // 每 5 分钟
}
```

### 错误追踪

**Sentry 集成：**

```javascript
// 安装 Sentry
npm install @sentry/browser

// 初始化
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 正常运行时间监控

**服务：**
- [UptimeRobot](https://uptimerobot.com/) - 免费正常运行时间监控
- [Pingdom](https://www.pingdom.com/) - 高级监控
- [StatusCake](https://www.statuscake.com/) - 提供免费层

### 日志

```javascript
// 结构化日志
const logger = {
  info: (message, meta = {}) => {
    if (config.debug) {
      console.log('[INFO]', message, meta);
    }
    // 生产环境发送到日志服务
  },
  error: (message, error, meta = {}) => {
    console.error('[ERROR]', message, error, meta);
    // 发送到错误追踪服务
    if (config.analytics) {
      Sentry.captureException(error, { extra: meta });
    }
  }
};
```

## 回滚策略

### 基于 Git 的回滚

```bash
# 查看最近的部署
git log --oneline -10

# 回滚到上一个提交
git revert HEAD --no-edit
git push origin main

# 或回滚多个提交
git revert HEAD~3..HEAD --no-edit
git push origin main
```

### GitHub Pages 回滚

```bash
# 检出先前版本
git checkout <commit-hash>

# 强制推送到 gh-pages
git push origin HEAD:gh-pages --force
```

### Netlify 回滚

```bash
# 列出部署
netlify deploy:list

# 回滚到特定部署
netlify deploy:rollback --deploy-id=<deployment-id>
```

### 数据库回滚

```bash
# 部署前备份
npm run backup:db

# 需要时恢复
npm run restore:db --backup=<backup-file>
```

## 部署清单

### 部署前

- [ ] 所有测试通过
- [ ] 代码已审查
- [ ] package.json 中版本已更新
- [ ] CHANGELOG 已更新
- [ ] 环境变量已配置
- [ ] 数据库迁移已测试
- [ ] 安全审计通过
- [ ] 性能基准达标

### 部署期间

- [ ] 备份当前生产数据
- [ ] 运行数据库迁移
- [ ] 部署新版本
- [ ] 验证部署成功
- [ ] 检查错误率
- [ ] 监控性能指标

### 部署后

- [ ] 冒烟测试通过
- [ ] 所有关键功能正常
- [ ] 无错误峰值
- [ ] 性能可接受
- [ ] 分析追踪正常
- [ ] 通知团队
- [ ] 更新文档

## 故障排查

### 部署失败

**检查 CI 日志：**
```bash
# 查看工作流运行
gh run list

# 查看特定运行
gh run view <run-id>
```

**常见问题：**
1. **测试失败** - 先在本地修复测试
2. **构建错误** - 检查 node 版本兼容性
3. **权限拒绝** - 验证 secrets 已配置

### 站点无法加载

**清单：**
1. DNS 传播（可能需要 24-48 小时）
2. HTTPS 证书已颁发
3. 正确的分支已部署
4. 构建产物存在
5. 服务器日志查找错误

**调试：**
```bash
# 检查 DNS
nslookup fitspark.example.com

# 测试 HTTPS
curl -I https://fitspark.example.com

# 检查 SSL 证书
openssl s_client -connect fitspark.example.com:443
```

### 性能问题

**诊断：**
```bash
# 运行 Lighthouse
npm run lighthouse

# 检查包大小
npm run analyze

# 在 Chrome DevTools 中分析
Performance tab → Record → Analyze
```

**解决方案：**
- 启用缓存
- 优化图片
- 懒加载资源
- 使用 CDN
- 启用压缩

### 资源无法加载

**常见原因：**
1. URL 中基础路径错误
2. CORS 问题
3. 缓存未清除
4. 构建中缺少文件

**修复：**
```javascript
// 确保正确的基础 URL
const BASE_URL = window.location.origin;
const assetUrl = `${BASE_URL}/assets/images/logo.png`;
```

## 最佳实践

### 版本控制

```bash
# 使用语义化版本
# MAJOR.MINOR.PATCH
# 1.0.0 → 1.1.0 → 1.1.1

# 标记发布
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 分支策略

```
main (生产)
  ↑
develop (预发布)
  ↑
feature/* (功能分支)
```

**工作流：**
1. 从 `develop` 创建功能分支
2. 开发和测试
3. PR 到 `develop`
4. 在预发布环境 QA
5. PR `develop` → `main`
6. 自动部署到生产环境

### 安全

```bash
# 定期安全审计
npm audit

# 修复漏洞
npm audit fix

# 更新依赖
npm update

# 检查过时的包
npm outdated
```

### 文档

保持这些文档更新：
- README.md - 项目概述
- CHANGELOG.md - 版本历史
- DEPLOYMENT.md - 本文件
- API.md - API 文档

## 资源

- [GitHub Actions 文档](https://docs.github.com/cn/actions)
- [GitHub Pages 文档](https://docs.github.com/cn/pages)
- [Netlify 文档](https://docs.netlify.com/)
- [Vercel 文档](https://vercel.com/docs)
- [Nginx 文档](https://nginx.org/cn/docs/)

## 支持

如有部署问题：
1. 查看本文档
2. 查看 GitHub Actions 日志
3. 检查托管服务商状态
4. 在 GitHub 上提交 issue

---

当前状态：生产部署就绪
最后更新：2025-01-19
