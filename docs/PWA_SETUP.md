# PWA Setup Guide

This document describes the Progressive Web App (PWA) configuration for Tirak.

## Overview

Tirak is configured as a Progressive Web App, allowing users to install it on their devices and use it offline. The PWA includes:

- **Web App Manifest** - Defines how the app appears when installed
- **Service Worker** - Enables offline functionality and caching
- **Install Prompt** - Allows users to install the app on their devices

## Files Structure

```
public/
  ├── manifest.json          # PWA manifest configuration
  └── service-worker.js      # Service worker for offline support

utils/
  └── pwa.ts                 # PWA utility functions

components/
  └── PWAHead.tsx            # Component to inject PWA meta tags
```

## Configuration

### app.json

The `web` section in `app.json` contains PWA configuration:

```json
{
  "web": {
    "name": "Tirak - Companion Marketplace",
    "shortName": "Tirak",
    "themeColor": "#000000",
    "backgroundColor": "#ffffff",
    "display": "standalone",
    "orientation": "portrait",
    "startUrl": "/"
  }
}
```

### Manifest (public/manifest.json)

The manifest file defines:
- App name and description
- Icons for different sizes
- Display mode (standalone)
- Theme colors
- App shortcuts
- Share target configuration

### Service Worker (public/service-worker.js)

The service worker provides:
- **Offline caching** - Caches app shell and assets
- **Runtime caching** - Caches API responses
- **Background sync** - Syncs data when connection is restored
- **Push notifications** - Handles push notifications

## Building for PWA

### Development

```bash
npm run start-web
```

### Production Build

```bash
npm run build:pwa
# or
npm run build:web
```

**Note:** The build uses `expo export --platform web` (for Metro bundler) and automatically copies PWA files from the `public/` folder to the `dist/` output directory.

This will create a static build in the `dist/` folder that can be deployed to any static hosting service. The PWA files (`manifest.json` and `service-worker.js`) are automatically included in the build.

## Features

### 1. Install Prompt

Users can install the app by:
- Clicking the install button (if shown)
- Using the browser's install prompt
- Adding to home screen on mobile devices

The install prompt is automatically handled by the browser when the PWA criteria are met.

### 2. Offline Support

The service worker caches:
- App shell (HTML, CSS, JS)
- Static assets (images, fonts)
- API responses (with network-first strategy)

### 3. Push Notifications

Push notifications are supported through the service worker. To enable:

```typescript
import { requestNotificationPermission, showNotification } from '@/utils/pwa';

// Request permission
await requestNotificationPermission();

// Show notification
await showNotification('New booking request', {
  body: 'You have a new booking request',
  icon: '/assets/images/icon.png'
});
```

### 4. App Shortcuts

The manifest includes shortcuts for:
- Search Companions (`/search`)
- Bookings (`/bookings`)

These appear when users long-press the app icon on supported devices.

## Testing

### Local Testing

1. Start the development server:
   ```bash
   npm run start-web
   ```

2. Open Chrome DevTools
3. Go to Application tab
4. Check:
   - Manifest is loaded correctly
   - Service Worker is registered
   - Cache storage is working

### Lighthouse Audit

Run Lighthouse in Chrome DevTools to verify PWA compliance:
- Installable
- Offline support
- Fast loading
- Responsive design

## Deployment

### Static Hosting

The PWA can be deployed to:
- **Vercel** - Automatic PWA support
- **Netlify** - Automatic PWA support
- **GitHub Pages** - Requires HTTPS
- **Firebase Hosting** - Automatic PWA support
- **AWS S3 + CloudFront** - Requires HTTPS

### Requirements

- **HTTPS** - Required for service workers (except localhost)
- **Valid manifest** - Must be accessible at `/manifest.json`
- **Service worker** - Must be accessible at `/service-worker.js`
- **Icons** - Must be accessible and properly sized

## Troubleshooting

### Service Worker Not Registering

1. Check browser console for errors
2. Verify service worker file is accessible
3. Ensure HTTPS is enabled (or using localhost)
4. Clear browser cache and reload

### Manifest Not Loading

1. Check `PWAHead` component is rendering
2. Verify manifest.json is in public folder
3. Check browser console for 404 errors
4. Ensure manifest link is in HTML head

### Install Prompt Not Showing

1. Verify all PWA criteria are met:
   - HTTPS enabled
   - Valid manifest
   - Service worker registered
   - Icons provided
2. Check browser support
3. Clear site data and retry

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet
- ⚠️ Opera (Limited support)

## Additional Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)

