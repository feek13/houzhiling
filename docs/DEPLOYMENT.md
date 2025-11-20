# FitSpark Deployment Guide

Complete guide to deploying FitSpark with CI/CD pipelines, hosting options, and best practices.

## Table of Contents

- [Quick Start](#quick-start)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment Options](#deployment-options)
- [Environment Setup](#environment-setup)
- [Production Build](#production-build)
- [Monitoring](#monitoring)
- [Rollback Strategy](#rollback-strategy)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Git repository setup
- GitHub account (for CI/CD)

### Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/fitspark.git
cd fitspark

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Production Deployment

```bash
# Run tests
npm test

# Build for production
npm run build

# Deploy
npm run deploy
```

## CI/CD Pipeline

FitSpark uses GitHub Actions for continuous integration and deployment.

### Workflows

#### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Stages:**
1. **Lint & Format** - Code quality checks
2. **Test** - Unit and integration tests
3. **Build** - Verify build succeeds
4. **Security** - npm audit for vulnerabilities
5. **Performance** - Lighthouse CI checks

**Triggers:**
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
```

#### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

Deploys to production on merges to `main`.

**Stages:**
1. **Deploy** - Build and deploy to hosting
2. **Release** - Create GitHub release
3. **Notify** - Send deployment notifications

**Triggers:**
```yaml
on:
  push:
    branches: [ main ]
  workflow_dispatch:  # Manual trigger
```

### Setup GitHub Actions

1. **Enable Actions:**
   - Go to repository Settings → Actions
   - Enable "Allow all actions and reusable workflows"

2. **Configure Secrets:**
   ```
   Settings → Secrets and variables → Actions → New repository secret
   ```

   Required secrets:
   - `DEPLOY_TOKEN` - Deployment authentication
   - `CODECOV_TOKEN` - Code coverage reports (optional)

3. **Status Badges:**
   Add to README.md:
   ```markdown
   ![CI](https://github.com/yourusername/fitspark/workflows/CI/badge.svg)
   ![Deploy](https://github.com/yourusername/fitspark/workflows/Deploy/badge.svg)
   ```

### Workflow Files

The workflows are already configured in:
- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/deploy.yml` - Deployment

## Deployment Options

### Option 1: GitHub Pages (Recommended)

**Pros:**
- Free hosting
- HTTPS by default
- Easy setup
- Automatic deployments

**Setup:**

1. Enable GitHub Pages:
   ```
   Repository Settings → Pages
   Source: gh-pages branch
   ```

2. Configure custom domain (optional):
   ```
   Settings → Pages → Custom domain: fitspark.example.com
   ```

3. Add CNAME record in DNS:
   ```
   CNAME fitspark.example.com → yourusername.github.io
   ```

4. Deploy workflow handles the rest automatically!

### Option 2: Netlify

**Pros:**
- Easy deployment
- Automatic HTTPS
- Serverless functions
- Form handling

**Setup:**

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Initialize:
   ```bash
   netlify init
   ```

3. Configure `netlify.toml`:
   ```toml
   [build]
     publish = "src"
     command = "npm run build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

4. Deploy:
   ```bash
   netlify deploy --prod
   ```

### Option 3: Vercel

**Pros:**
- Excellent performance
- Edge network
- Preview deployments
- Zero config

**Setup:**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow prompts to configure

### Option 4: Self-hosted

**For production servers:**

```bash
# Install nginx
sudo apt install nginx

# Configure nginx
sudo nano /etc/nginx/sites-available/fitspark

# Add configuration:
server {
    listen 80;
    server_name fitspark.example.com;
    root /var/www/fitspark/src;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}

# Enable site
sudo ln -s /etc/nginx/sites-available/fitspark /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d fitspark.example.com
```

## Environment Setup

### Environment Variables

Create `.env` files for different environments:

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

### Configuration Management

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

## Production Build

### Build Optimization

1. **Minification:**
   ```bash
   # Install terser for JS minification
   npm install -D terser

   # Minify JavaScript
   npx terser src/assets/js/app.js -c -m -o dist/app.min.js
   ```

2. **CSS Optimization:**
   ```bash
   # Install cssnano
   npm install -D cssnano postcss-cli

   # Minify CSS
   npx postcss src/assets/css/*.css --use cssnano -d dist/css
   ```

3. **Image Optimization:**
   ```bash
   # Install imagemin
   npm install -D imagemin imagemin-mozjpeg imagemin-pngquant

   # Optimize images
   npx imagemin src/assets/images/* --out-dir=dist/images
   ```

### Build Script

Add to `package.json`:

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

### Asset Optimization

**Checklist:**
- [ ] Minify JavaScript
- [ ] Minify CSS
- [ ] Optimize images (WebP format)
- [ ] Enable gzip/brotli compression
- [ ] Set cache headers
- [ ] Use CDN for static assets
- [ ] Implement service worker
- [ ] Lazy load images
- [ ] Code splitting

## Monitoring

### Performance Monitoring

```javascript
// Monitor in production
if (config.analytics) {
  performanceMonitor.init({
    enabled: true,
    reportInterval: 60000
  });

  // Send metrics to analytics
  setInterval(() => {
    const metrics = performanceMonitor.getMetrics();
    sendToAnalytics(metrics);
  }, 300000); // Every 5 minutes
}
```

### Error Tracking

**Sentry Integration:**

```javascript
// Install Sentry
npm install @sentry/browser

// Initialize
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Uptime Monitoring

**Services:**
- [UptimeRobot](https://uptimerobot.com/) - Free uptime monitoring
- [Pingdom](https://www.pingdom.com/) - Advanced monitoring
- [StatusCake](https://www.statuscake.com/) - Free tier available

### Logs

```javascript
// Structured logging
const logger = {
  info: (message, meta = {}) => {
    if (config.debug) {
      console.log('[INFO]', message, meta);
    }
    // Send to log service in production
  },
  error: (message, error, meta = {}) => {
    console.error('[ERROR]', message, error, meta);
    // Send to error tracking service
    if (config.analytics) {
      Sentry.captureException(error, { extra: meta });
    }
  }
};
```

## Rollback Strategy

### Git-based Rollback

```bash
# View recent deployments
git log --oneline -10

# Rollback to previous commit
git revert HEAD --no-edit
git push origin main

# Or rollback multiple commits
git revert HEAD~3..HEAD --no-edit
git push origin main
```

### GitHub Pages Rollback

```bash
# Checkout previous version
git checkout <commit-hash>

# Force push to gh-pages
git push origin HEAD:gh-pages --force
```

### Netlify Rollback

```bash
# List deployments
netlify deploy:list

# Rollback to specific deployment
netlify deploy:rollback --deploy-id=<deployment-id>
```

### Database Rollback

```bash
# Backup before deployment
npm run backup:db

# Restore if needed
npm run restore:db --backup=<backup-file>
```

## Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Version bumped in package.json
- [ ] CHANGELOG updated
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Security audit passed
- [ ] Performance benchmarks met

### During Deployment

- [ ] Backup current production data
- [ ] Run database migrations
- [ ] Deploy new version
- [ ] Verify deployment successful
- [ ] Check error rates
- [ ] Monitor performance metrics

### Post-deployment

- [ ] Smoke tests passed
- [ ] All critical features working
- [ ] No error spikes
- [ ] Performance acceptable
- [ ] Analytics tracking
- [ ] Notify team
- [ ] Update documentation

## Troubleshooting

### Deployment Fails

**Check CI logs:**
```bash
# View workflow runs
gh run list

# View specific run
gh run view <run-id>
```

**Common issues:**
1. **Tests failing** - Fix tests locally first
2. **Build errors** - Check node version compatibility
3. **Permission denied** - Verify secrets are configured

### Site Not Loading

**Checklist:**
1. DNS propagation (can take 24-48 hours)
2. HTTPS certificate issued
3. Correct branch deployed
4. Build artifacts present
5. Server logs for errors

**Debug:**
```bash
# Check DNS
nslookup fitspark.example.com

# Test HTTPS
curl -I https://fitspark.example.com

# Check SSL certificate
openssl s_client -connect fitspark.example.com:443
```

### Performance Issues

**Diagnosis:**
```bash
# Run Lighthouse
npm run lighthouse

# Check bundle size
npm run analyze

# Profile in Chrome DevTools
Performance tab → Record → Analyze
```

**Solutions:**
- Enable caching
- Optimize images
- Lazy load resources
- Use CDN
- Enable compression

### Assets Not Loading

**Common causes:**
1. Wrong base path in URLs
2. CORS issues
3. Cache not cleared
4. Missing files in build

**Fix:**
```javascript
// Ensure correct base URL
const BASE_URL = window.location.origin;
const assetUrl = `${BASE_URL}/assets/images/logo.png`;
```

## Best Practices

### Version Control

```bash
# Use semantic versioning
# MAJOR.MINOR.PATCH
# 1.0.0 → 1.1.0 → 1.1.1

# Tag releases
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### Branch Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (feature branches)
```

**Workflow:**
1. Create feature branch from `develop`
2. Develop and test
3. PR to `develop`
4. QA on staging
5. PR `develop` → `main`
6. Auto-deploy to production

### Security

```bash
# Regular security audits
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Documentation

Keep these docs updated:
- README.md - Project overview
- CHANGELOG.md - Version history
- DEPLOYMENT.md - This file
- API.md - API documentation

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)
- [Nginx Docs](https://nginx.org/en/docs/)

## Support

For deployment issues:
1. Check this documentation
2. Review GitHub Actions logs
3. Check hosting provider status
4. Open issue on GitHub

---

**Happy Deploying! 🚀**

Current Status: Ready for Production Deployment
Last Updated: 2025-01-19
