import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';

jest.mock('expo-linear-gradient', () => {
  const ReactRuntime = require('react');
  const NativeView = require('react-native').View;
  return {
    LinearGradient: ({ children, ...props }: { children: React.ReactNode }) => (
      ReactRuntime.createElement(NativeView, props, children)
    ),
  };
});

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 'light' },
  impactAsync: jest.fn(),
}));

jest.mock('react-native-reanimated', () => {
  const NativeView = require('react-native').View;
  return {
    __esModule: true,
    default: { View: NativeView },
    useSharedValue: (value: number) => ({ value }),
    useAnimatedStyle: (factory: () => object) => factory(),
    withSpring: (value: number) => value,
  };
});

import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

describe('shared booking control accessibility', () => {
  test('Button exposes its role, label, disabled and busy state while preserving caller state', () => {
    const screen = render(
      <Button
        title="Confirm booking"
        onPress={jest.fn()}
        loading
        accessibilityState={{ selected: true }}
      />,
    );

    const button = screen.getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Confirm booking');
    expect(button.props.accessibilityState).toMatchObject({
      selected: true,
      disabled: true,
      busy: true,
    });
  });

  test('ProgressBar exposes current, minimum and maximum step and hides decoration', () => {
    const screen = render(
      <ProgressBar
        currentStep={3}
        totalSteps={7}
        accessibilityLabel="Booking progress"
      />,
    );

    const progress = screen.getByRole('progressbar');
    expect(progress.props.accessibilityValue).toEqual({ min: 1, max: 7, now: 3 });
    expect(progress.props.accessibilityLabel).toBe('Booking progress');
  });
});
