/**
 * Comprehensive Design Token System
 * Based on Reference Image Analysis and Strategic Font Usage
 *
 * This file contains all design tokens extracted from the reference image
 * with strategic font usage: custom fonts for headings/subheadings (visual impact)
 * and system fonts for body text (performance and readability).
 */

import { Platform, useColorScheme } from 'react-native';
import { colors, spacing, borderRadius, shadows, gradients } from './colors';

// ============================================================================
// COLOR TOKENS - Exact from Reference Image
// ============================================================================

export const designTokens = {
  colors: {
    // Reference Image Colors (Exact Values)
    reference: {
      purple: '#A85CF9',     // Primary purple from reference (corrected to valid 6-digit hex)
      pink: '#FFBAA0',       // Secondary pink from reference
      lightPink: '#FDCEDF',  // Light pink from reference
      white: '#FFFFF5',      // White from reference (corrected to valid 6-digit hex)
    },
    
    // Semantic Color System
    semantic: {
      primary: colors.primary,           // Main brand purple
      secondary: colors.secondary,       // Main brand pink
      accent: colors.coral,              // Coral accent color
      background: colors.background,     // Main background
      surface: colors.surface,           // Card surfaces
      text: colors.text,                 // Primary text
      textSecondary: colors.textLight,   // Secondary text
      border: colors.border,             // Border color
      surfaceSecondary: colors.surfaceSecondary,
      primaryContrast: colors.white,
      success: colors.success,           // Success state
      error: colors.error,               // Error state
      warning: colors.warning,           // Warning state
      info: colors.info,                 // Informational state
    },
    
    // Component-Specific Colors
    components: {
      button: {
        primary: colors.primary,
        secondary: colors.coral,
        text: colors.white,
        disabled: colors.gray300,
      },
      card: {
        background: colors.white,
        border: colors.border,
        shadow: 'rgba(0, 0, 0, 0.1)',
      },
      navigation: {
        background: colors.white,
        active: colors.primary,
        inactive: colors.gray400,
        indicator: colors.coral,
      },
      input: {
        background: colors.white,
        border: colors.border,
        focus: colors.primary,
        placeholder: colors.gray400,
      },
    },
  },

  // ============================================================================
  // TYPOGRAPHY TOKENS - Strategic Font Usage
  // ============================================================================
  typography: {
    // Font Families - Strategic Usage
    families: {
      // Custom fonts for visual impact (headings/subheadings only)
      heading: 'Garet-Heavy',           // Custom font for main titles
      subheading: 'ProximaNova-Semibold', // Custom font for section titles

      // System fonts for performance (body text/captions)
      body: Platform.select({
        ios: 'San Francisco',
        android: 'Roboto',
        default: 'System',
      }),
      caption: Platform.select({
        ios: 'San Francisco',
        android: 'Roboto',
        default: 'System',
      }),
      system: 'System',
    },

    // Font Sizes (From Reference Image)
    sizes: {
      heading: 24,        // Garet Heavy 24px
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      base: 16,
      subheading: 18,     // Proxima Nova Semibold 18px
      body: 16,           // System font 16px
      caption: 14,        // System font 14px
      small: 12,          // Very small text
      large: 20,          // Large text
      xlarge: 28,         // Extra large
      xxl: 32,
    },

    // Font Weights
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      heavy: '800' as const,
    },

    // Line Heights (Optimized for readability)
    lineHeights: {
      tight: 1.2,         // Headings
      normal: 1.5,        // Body text
      relaxed: 1.75,      // Loose text
    },

    // Typography Styles (Ready-to-use combinations)
    styles: {
      // Custom fonts for visual impact
      heading: {
        fontFamily: 'Garet-Heavy',
        fontSize: 24,
        fontWeight: '700' as const,
        lineHeight: 30,
        // Web fallback
        ...(Platform.OS === 'web' && {
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
        }),
      },
      subheading: {
        fontFamily: 'ProximaNova-Semibold',
        fontSize: 18,
        fontWeight: '600' as const,
        lineHeight: 25,
        // Web fallback
        ...(Platform.OS === 'web' && {
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
        }),
      },

      // System fonts for performance and readability
      body: {
        fontFamily: Platform.select({
          ios: 'San Francisco',
          android: 'Roboto',
          web: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          default: 'System',
        }),
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
      },
      caption: {
        fontFamily: Platform.select({
          ios: 'San Francisco',
          android: 'Roboto',
          web: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          default: 'System',
        }),
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
      },
    },
  },

  // ============================================================================
  // SPACING TOKENS - Consistent Layout System
  // ============================================================================
  spacing: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    xxl: spacing['2xl'],
    // Base spacing scale
    scale: spacing,

    // Component-specific spacing
    components: {
      card: {
        padding: 16,
        margin: 8,
        gap: 12,
      },
      button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        gap: 8,
      },
      list: {
        itemSpacing: 12,
        sectionSpacing: 24,
      },
      navigation: {
        height: 60,
        padding: 16,
      },
    },
  },

  // ============================================================================
  // BORDER RADIUS TOKENS
  // ============================================================================
  borderRadius: {
    ...borderRadius,

    // Component-specific radius
    components: {
      button: 12,
      card: 16,
      input: 8,
      image: 8,
      avatar: 9999,
      chip: 20,
    },
  },

  // ============================================================================
  // SHADOW TOKENS
  // ============================================================================
  shadows,

  // ============================================================================
  // GRADIENT TOKENS
  // ============================================================================
  gradients,

  // ============================================================================
  // ANIMATION TOKENS - Organic Motion Design
  // ============================================================================
  
  animation: {
    // Duration tokens
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
      slower: 800,
    },
    
    // Easing curves (Organic motion)
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      organic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Droplet animation
    },
    
    // Common animation presets
    presets: {
      fadeIn: {
        duration: 300,
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
      },
      slideUp: {
        duration: 400,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      bounce: {
        duration: 600,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
};

export default designTokens;

// ============================================================================
// COMPONENT TOKENS - Ready-to-use Component Styles
// ============================================================================

export const componentTokens = {
  // Button component tokens
  button: {
    borderRadius: designTokens.borderRadius.components.button,
    primary: {
      backgroundColor: designTokens.colors.semantic.primary,
      color: designTokens.colors.components.button.text,
      borderRadius: designTokens.borderRadius.components.button,
      paddingHorizontal: designTokens.spacing.components.button.paddingHorizontal,
      paddingVertical: designTokens.spacing.components.button.paddingVertical,
      ...designTokens.shadows.md,
    },
    secondary: {
      backgroundColor: designTokens.colors.semantic.accent,
      color: designTokens.colors.components.button.text,
      borderRadius: designTokens.borderRadius.components.button,
      paddingHorizontal: designTokens.spacing.components.button.paddingHorizontal,
      paddingVertical: designTokens.spacing.components.button.paddingVertical,
      ...designTokens.shadows.sm,
    },
  },

  // Card component tokens
  card: {
    borderRadius: designTokens.borderRadius.components.card,
    shadow: designTokens.shadows.md,
    default: {
      backgroundColor: designTokens.colors.components.card.background,
      borderRadius: designTokens.borderRadius.components.card,
      padding: designTokens.spacing.components.card.padding,
      ...designTokens.shadows.md,
    },
  },

  // Typography component tokens
  text: {
    heading: {
      ...designTokens.typography.styles.heading,
      color: designTokens.colors.semantic.text,
    },
    subheading: {
      ...designTokens.typography.styles.subheading,
      color: designTokens.colors.semantic.text,
    },
    body: {
      ...designTokens.typography.styles.body,
      color: designTokens.colors.semantic.text,
    },
    caption: {
      ...designTokens.typography.styles.caption,
      color: designTokens.colors.semantic.textSecondary,
    },
  },
};

// Helper to get theme-aware tokens
export function getDesignTokens(scheme: 'light' | 'dark') {
  return {
    ...designTokens,
    colors: {
      ...designTokens.colors,
      semantic: {
        ...designTokens.colors.semantic,
        text: scheme === 'dark' ? '#FFF' : designTokens.colors.semantic.text,
        textSecondary: scheme === 'dark' ? '#DDD' : designTokens.colors.semantic.textSecondary,
        background: scheme === 'dark' ? '#181818' : designTokens.colors.semantic.background,
        surface: scheme === 'dark' ? '#232323' : designTokens.colors.semantic.surface,
        border: scheme === 'dark' ? '#333' : designTokens.colors.semantic.border,
      },
    },
  };
}
