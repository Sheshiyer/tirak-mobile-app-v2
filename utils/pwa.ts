import { logger } from '@/utils/logger';
/**
 * PWA utilities for service worker registration and PWA features
 */

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    logger.log('[PWA] Service workers not supported');
    return null;
  }

  try {
    // Try multiple possible paths for service worker
    const swPath = '/service-worker.js';
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: '/',
    });

    logger.log('[PWA] Service Worker registered:', registration);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            logger.log('[PWA] New service worker available');
            // You can show a notification to the user here
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
};

export const unregisterServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    if (success) {
      logger.log('[PWA] Service Worker unregistered');
    }
  } catch (error) {
    console.error('[PWA] Service Worker unregistration failed:', error);
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

export const showNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  const permission = await requestNotificationPermission();
  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      icon: '/assets/images/icon.png',
      badge: '/assets/images/icon.png',
      ...options,
    });
  }
};

export const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if running in standalone mode (installed PWA)
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const promptInstall = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }

  const deferredPrompt = (window as any).deferredPrompt;
  if (!deferredPrompt) {
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    (window as any).deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
    return false;
  }
};

