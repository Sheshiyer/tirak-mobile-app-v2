import { Platform } from 'react-native';

export const colors = {
  // Primary colors (Exact from reference image)
  primary: '#A85CF9', // Purple from reference image (corrected to valid 6-digit hex)
  primaryLight: '#6f4caa', // Previous primary becomes light variant
  primaryDark: '#4a3580',

  // Secondary colors (Exact from reference image)
  secondary: '#FFBAA0', // Pink from reference image (#FFBAA0)
  secondaryLight: '#FDCEDF', // Light pink from reference image (#FDCEDF)
  secondaryDark: '#ff7979', // Deeper pink

  // Design system accent colors (Reference-based)
  coral: '#FFBAA0', // Coral pink for accents and CTAs (matches reference secondary)
  coralLight: '#FDCEDF', // Light pink for subtle backgrounds (matches reference)
  coralDark: '#ff7979', // Existing secondary dark as coral dark

  // Brand pink colors (existing compatibility)
  pink: '#ffacac',
  pinkLight: '#ffdfdf',
  pinkDark: '#ff7979',

  // Reference image white
  referenceWhite: '#FFFFF5', // White from reference image (corrected to valid 6-digit hex)
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#111827',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Semantic colors
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  
  error: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',
  
  info: '#3B82F6',
  infoLight: '#60A5FA',
  infoDark: '#2563EB',
  
  // App specific colors
  background: '#FFFFFF',
  lightBackground: '#F9FAFB',
  surface: '#F9FAFB',
  surfaceSecondary: '#F3F4F6',
  
  text: '#111827',
  darkText: '#111827',
  textLight: '#6B7280',
  darkGray: '#6B7280',
  textMuted: '#9CA3AF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  transparent: 'transparent',

  // Additional surface colors
  surfaceLight: '#F8FAFC',
  lightGray: '#E2E8F0',

  // Error colors
  // Neutral variations
  neutral50: '#F9FAFB',
  neutral100: '#F3F4F6',
  neutral200: '#E5E7EB',
  neutral300: '#D1D5DB',
  neutral400: '#9CA3AF',
  neutral500: '#6B7280',
  neutral600: '#4B5563',
  neutral700: '#374151',
  neutral800: '#1F2937',
  neutral900: '#111827',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  xxl: 48,
};

export const typography = {
  // Font families - Strategic custom font usage
  families: {
    // Custom fonts for visual impact (headings/subheadings only)
    heading: 'Garet-Heavy', // Custom font for main titles and headers
    subheading: 'ProximaNova-Semibold', // Custom font for section titles

    // System fonts for performance and readability (body text)
    body: Platform.select({
      ios: 'San Francisco',
      android: 'Roboto',
      default: 'System',
    }), // System font for body text - fast loading, high readability
    caption: Platform.select({
      ios: 'San Francisco',
      android: 'Roboto',
      default: 'System',
    }), // System font for captions
    system: 'System', // Fallback system font
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  // Typography styles with strategic font usage
  styles: {
    heading: {
      fontFamily: 'Garet-Heavy', // Custom font for visual impact
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 30, // 1.25 * 24
      // Fallback for custom font loading
      ...(Platform.OS === 'web' && { fontFamily: 'system-ui, -apple-system, sans-serif' }),
    },
    subheading: {
      fontFamily: 'ProximaNova-Semibold', // Custom font for section titles
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 25, // 1.4 * 18
      // Fallback for custom font loading
      ...(Platform.OS === 'web' && { fontFamily: 'system-ui, -apple-system, sans-serif' }),
    },
    body: {
      fontFamily: Platform.select({
        ios: 'San Francisco',
        android: 'Roboto',
        default: 'System',
      }), // System font for performance and readability
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24, // 1.5 * 16
    },
    caption: {
      fontFamily: Platform.select({
        ios: 'San Francisco',
        android: 'Roboto',
        default: 'System',
      }), // System font for performance and readability
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20, // 1.4 * 14
    },
  },
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const gradients = {
  primary: [colors.primary, colors.primaryLight] as [string, string], // Purple gradient
  secondary: [colors.secondary, colors.secondaryLight] as [string, string], // Pink gradient
  accent: [colors.primary, colors.secondary] as [string, string], // Purple to pink
  coral: [colors.coral, colors.coralLight] as [string, string], // NEW - Coral gradient for accents
  coralToPurple: [colors.coral, colors.primary] as [string, string], // NEW - Coral to purple
};

export const shadows = {
  xs: {
    shadowColor: colors.gray900,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.gray900,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.gray900,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.gray900,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: colors.gray900,
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
};

export default colors;
