# PWA Deployment Guide

This guide covers deploying your Tirak PWA to various hosting platforms.

## Prerequisites

1. **Build the PWA:**
   ```bash
   npm run build:pwa
   ```
   
   This creates a production-ready static build in the `dist/` folder.

2. **Verify the build:**
   ```bash
   ls -la dist/
   ```
   
   You should see:
   - `index.html`
   - `manifest.json`
   - `service-worker.js`
   - All your app routes and assets

## Deployment Options

### 1. Vercel (Recommended - Easiest)

**Option A: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Set build command: `npm run build:pwa`
4. Set output directory: `dist`
5. Deploy!

**Option C: GitHub Integration**
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Vercel auto-deploys on every push

**Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build:pwa",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Netlify

**Option A: Netlify CLI**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
npm run deploy
# or
netlify deploy --dir=dist --prod
```

**Option B: Netlify Dashboard**
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `dist/` folder
3. Your site is live!

**Option C: Git Integration**
1. Connect your Git repository
2. Set build command: `npm run build:pwa`
3. Set publish directory: `dist`
4. Deploy!

**Configuration (`netlify.toml`):**
```toml
[build]
  command = "npm run build:pwa"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Firebase Hosting

**Setup:**
```bash
# Install Firebase CLI
npm i -g firebase-tools

# Login
firebase login

# Initialize (if not already done)
firebase init hosting

# Select:
# - dist as public directory
# - Yes to single-page app
# - No to GitHub deployments (or Yes if you want)

# Deploy
firebase deploy --only hosting
```

**Configuration (`firebase.json`):**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/service-worker.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      },
      {
        "source": "/manifest.json",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/manifest+json"
          }
        ]
      }
    ]
  }
}
```

### 4. GitHub Pages

**Setup:**
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy:gh": "npm run build:pwa && gh-pages -d dist"
```

**Deploy:**
```bash
npm run deploy:gh
```

**Note:** GitHub Pages requires HTTPS and works well for PWAs.

### 5. AWS S3 + CloudFront

**Setup:**
```bash
# Install AWS CLI
# Configure AWS credentials

# Create S3 bucket
aws s3 mb s3://your-pwa-bucket

# Upload files
aws s3 sync dist/ s3://your-pwa-bucket --delete

# Enable static website hosting
aws s3 website s3://your-pwa-bucket \
  --index-document index.html \
  --error-document index.html

# Set up CloudFront for HTTPS (required for PWA)
# Use AWS Console to create CloudFront distribution
```

### 6. Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Pages
3. Connect your Git repository
4. Set build command: `npm run build:pwa`
5. Set build output directory: `dist`
6. Deploy!

## Post-Deployment Checklist

After deploying, verify:

- [ ] **HTTPS is enabled** (required for PWA)
- [ ] **Manifest is accessible:** `https://your-domain.com/manifest.json`
- [ ] **Service worker is accessible:** `https://your-domain.com/service-worker.js`
- [ ] **Test PWA installation** in Chrome DevTools:
  - Open DevTools → Application tab
  - Check "Manifest" section
  - Check "Service Workers" section
  - Test "Add to Home Screen"
- [ ] **Lighthouse PWA audit:**
  - Run Lighthouse in Chrome DevTools
  - Verify PWA score is 90+
- [ ] **Test offline functionality**
- [ ] **Test on mobile devices**

## Environment Variables

If you need environment variables in production:

**Vercel:**
- Add in Dashboard → Settings → Environment Variables

**Netlify:**
- Add in Site settings → Build & deploy → Environment variables

**Firebase:**
- Use `.env.production` file (not recommended for secrets)
- Or use Firebase Functions for server-side logic

## Custom Domain

All platforms support custom domains:

1. **Vercel:** Settings → Domains → Add domain
2. **Netlify:** Site settings → Domain management → Add custom domain
3. **Firebase:** Hosting → Add custom domain

## Continuous Deployment

Set up automatic deployments:

1. **Push to Git** → Auto-deploys to production
2. **Pull requests** → Preview deployments
3. **Branch protection** → Require reviews before production

## Troubleshooting

### Service Worker Not Registering
- Ensure HTTPS is enabled
- Check browser console for errors
- Verify service-worker.js is accessible

### Manifest Not Loading
- Check manifest.json is in dist/ root
- Verify Content-Type header is `application/manifest+json`
- Check browser console for errors

### Routes Not Working
- Ensure SPA rewrite rules are configured
- All routes should redirect to `/index.html`

### Build Fails
- Clear caches: `rm -rf .expo node_modules/.cache`
- Rebuild: `npm run build:pwa`
- Check for TypeScript/ESLint errors

## Quick Deploy Commands

```bash
# Build
npm run build:pwa

# Vercel
vercel --prod

# Netlify
netlify deploy --dir=dist --prod

# Firebase
firebase deploy --only hosting

# GitHub Pages
npm run deploy:gh
```

## Recommended Platform

**For easiest setup:** Vercel or Netlify
- Zero configuration
- Automatic HTTPS
- Git integration
- Free tier available

**For enterprise:** AWS S3 + CloudFront or Firebase
- More control
- Better for high traffic
- More configuration needed

