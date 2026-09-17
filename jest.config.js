module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  globals: {
    __DEV__: true,
  },
  moduleFileExtensions: [
    'ios.ts',
    'ios.tsx',
    'ios.js',
    'ios.jsx',
    'native.ts',
    'native.tsx',
    'native.js',
    'native.jsx',
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
  ],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo)/)',
  ],
};
