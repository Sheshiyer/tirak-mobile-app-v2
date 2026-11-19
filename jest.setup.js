import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Calendar: 'Calendar',
  Settings: 'Settings',
  TrendingUp: 'TrendingUp',
  Plus: 'Plus',
  Clock: 'Clock',
  CheckCircle: 'CheckCircle',
  CheckCircle2: 'CheckCircle2',
  XCircle: 'XCircle',
  AlertTriangle: 'AlertTriangle',
  RefreshCw: 'RefreshCw',
  UploadCloud: 'UploadCloud',
  ShieldCheck: 'ShieldCheck',
  Shield: 'Shield',
  FileText: 'FileText',
  MapPin: 'MapPin',
  AlertCircle: 'AlertCircle',
  Edit: 'Edit',
  Edit2: 'Edit2',
  Edit3: 'Edit3',
  ArrowLeft: 'ArrowLeft',
  Save: 'Save',
  X: 'X',
  Camera: 'Camera',
}));

// Mock design tokens
jest.mock('@/constants/design-tokens', () => ({
  designTokens: {
    colors: {
      semantic: {
        primary: '#007AFF',
        accent: '#FF9500',
        success: '#34C759',
        surface: '#FFFFFF',
        text: '#000000',
        textSecondary: '#666666',
        error: '#FF3B30',
        warning: '#FF9500',
        border: '#E5E5EA',
        background: '#F2F2F7',
      },
      components: {
        button: { text: '#FFFFFF' },
        input: { background: '#FFFFFF', border: '#E5E5EA', placeholder: '#999999' },
      },
    },
    spacing: {
      scale: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
    },
    typography: {
      styles: {
        heading: { fontSize: 24, fontWeight: 'bold' },
        subheading: { fontSize: 18, fontWeight: '600' },
        body: { fontSize: 16 },
      },
      weights: {
        semibold: '600',
        bold: 'bold',
      },
      sizes: {
        body: 16,
        caption: 12,
        small: 12,
        large: 20,
      },
      lineHeights: {
        normal: 1.2,
      },
    },
    borderRadius: {
      lg: 8,
      xl: 12,
      components: {
        button: 8,
        input: 8,
        card: 12,
      },
    },
    shadows: {
      sm: {},
      md: {},
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    },
  },
  componentTokens: {
    text: {
      subheading: { fontSize: 18, fontWeight: '600' },
      caption: { fontSize: 12 },
      body: { fontSize: 16 },
    },
    card: {
      default: {},
    },
    button: {
      primary: {},
    },
  },
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
