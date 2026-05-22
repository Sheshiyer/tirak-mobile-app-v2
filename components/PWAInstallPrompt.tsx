import { logger } from '@/utils/logger';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { X, Download, Share } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check if user already dismissed the prompt in this session
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Detect iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode) {
      // Show iOS install prompt after a short delay
      setTimeout(() => {
        setShowIOSPrompt(true);
      }, 2000);
    }

    // Detect Android Chrome (beforeinstallprompt event)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show Android install prompt after a short delay
      setTimeout(() => {
        setShowAndroidPrompt(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowIOSPrompt(false);
    setShowAndroidPrompt(false);
    setIsDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleIOSInstall = () => {
    // Can't programmatically trigger iOS install, just show instructions
    // The prompt stays visible with instructions
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        logger.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowAndroidPrompt(false);
      setIsDismissed(true);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  if (isDismissed || Platform.OS !== 'web') {
    return null;
  }

  // iOS Install Prompt
  if (showIOSPrompt) {
    return (
      <Modal
        visible={showIOSPrompt}
        transparent
        animationType="slide"
        onRequestClose={handleDismiss}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.iosPromptContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
              <X size={24} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Download size={48} color={designTokens.colors.semantic.primary} />
            </View>

            <Text style={styles.title}>Install Tirak App</Text>
            <Text style={styles.description}>
              Add Tirak to your home screen for quick and easy access!
            </Text>

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionTitle}>How to install:</Text>
              
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    Tap the Share button{' '}
                    <Share size={16} color={designTokens.colors.semantic.primary} />
                    {' '}at the bottom of your screen
                  </Text>
                </View>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    Scroll down and tap "Add to Home Screen"
                  </Text>
                </View>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    Tap "Add" in the top right corner
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <Text style={styles.dismissButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Android Install Prompt
  if (showAndroidPrompt) {
    return (
      <Modal
        visible={showAndroidPrompt}
        transparent
        animationType="slide"
        onRequestClose={handleDismiss}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.androidPromptContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
              <X size={24} color={designTokens.colors.semantic.text} />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Download size={48} color={designTokens.colors.semantic.primary} />
            </View>

            <Text style={styles.title}>Install Tirak App</Text>
            <Text style={styles.description}>
              Install Tirak on your home screen for faster access and a better experience!
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.installButton} onPress={handleAndroidInstall}>
                <Download size={20} color="#FFFFFF" />
                <Text style={styles.installButtonText}>Install App</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
                <Text style={styles.dismissButtonText}>Not Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  iosPromptContainer: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopLeftRadius: designTokens.borderRadius.xl,
    borderTopRightRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.scale.xl,
    paddingBottom: designTokens.spacing.scale.xxl,
    maxHeight: '80%',
  },
  androidPromptContainer: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopLeftRadius: designTokens.borderRadius.xl,
    borderTopRightRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.scale.xl,
    paddingBottom: designTokens.spacing.scale.xxl,
  },
  closeButton: {
    position: 'absolute',
    top: designTokens.spacing.scale.md,
    right: designTokens.spacing.scale.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${designTokens.colors.semantic.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: designTokens.spacing.scale.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: designTokens.colors.semantic.text,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  description: {
    fontSize: 16,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.scale.xl,
    lineHeight: 24,
  },
  instructionsContainer: {
    backgroundColor: designTokens.colors.semantic.background,
    borderRadius: designTokens.borderRadius.md,
    padding: designTokens.spacing.scale.lg,
    marginBottom: designTokens.spacing.scale.lg,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.md,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.scale.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: designTokens.colors.semantic.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.scale.sm,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: designTokens.spacing.scale.md,
  },
  installButton: {
    flexDirection: 'row',
    backgroundColor: designTokens.colors.semantic.primary,
    paddingVertical: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.xl,
    borderRadius: designTokens.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
  },
  installButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    paddingVertical: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.xl,
    borderRadius: designTokens.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.semantic.textSecondary,
  },
});
