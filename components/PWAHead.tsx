/**
 * PWA Head component to inject manifest link and meta tags
 * This ensures the PWA manifest is properly linked in the HTML head
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function PWAHead() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    // Use setTimeout to avoid blocking initial render
    const timeoutId = setTimeout(() => {
      try {

        // Check if manifest link already exists
        let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        
        if (!manifestLink) {
          manifestLink = document.createElement('link');
          manifestLink.rel = 'manifest';
          manifestLink.href = '/manifest.json';
          document.head.appendChild(manifestLink);
        }

        // Add apple-touch-icon for iOS (180x180 is the standard size)
        let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
        if (!appleIcon) {
          appleIcon = document.createElement('link');
          appleIcon.rel = 'apple-touch-icon';
          appleIcon.href = '/apple-touch-icon.png';
          document.head.appendChild(appleIcon);
        } else {
          // Update existing apple-touch-icon to use the correct path
          appleIcon.href = '/apple-touch-icon.png';
        }

        // Add shortcut icon (favicon)
        let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          favicon.type = 'image/png';
          favicon.href = '/favicon.png';
          document.head.appendChild(favicon);
        }

        // Add meta tags for PWA
        const metaTags = [
          { name: 'theme-color', content: '#6B46C1' },
          { name: 'mobile-web-app-capable', content: 'yes' },
          { name: 'apple-mobile-web-app-capable', content: 'yes' },
          { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
          { name: 'apple-mobile-web-app-title', content: 'Tirak' },
        ];

        metaTags.forEach(({ name, content }) => {
          let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
          if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
          }
        });

        // Remove font preload links that Expo adds automatically to avoid warnings
        // Expo's font preloading can cause warnings if fonts aren't used immediately
        // We'll let expo-font handle font loading instead
        const fontPreloads = document.querySelectorAll('link[rel="preload"][as="font"]');
        fontPreloads.forEach((link) => {
          const href = link.getAttribute('href');
          if (href && (href.includes('Proxima') || href.includes('Garet'))) {
            // Remove preload and let expo-font handle it
            link.remove();
          }
        });
      } catch (error) {
        console.error('[PWA] Error setting up PWA head:', error);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}

