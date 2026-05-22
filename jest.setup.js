import '@testing-library/jest-native/extend-expect';

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
  XCircle: 'XCircle',
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
    },
    borderRadius: {
      lg: 8,
      xl: 12,
    },
    shadows: {
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    },
  },
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
