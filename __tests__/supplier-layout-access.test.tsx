import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { usePathname } from 'expo-router';
import SupplierLayout from '@/app/(supplier)/_layout';
import { useAuthStoreHydrated } from '@/hooks/useAuthStoreHydrated';

jest.mock('expo-router', () => {
  const { createElement } = require('react');
  const { Text } = require('react-native');
  return {
    usePathname: jest.fn(() => '/'),
    Redirect: ({ href }: { href: string }) => createElement(Text, null, href),
    Stack: Object.assign(() => createElement(Text, null, 'Guide stack'), { Screen: () => null }),
  };
});
jest.mock('@/hooks/useAuthStoreHydrated', () => ({ useAuthStoreHydrated: jest.fn() }));

function session(isHydrated: boolean, userType?: string) {
  jest.mocked(useAuthStoreHydrated).mockReturnValue({
    isHydrated,
    user: userType ? { userType } : null,
  } as ReturnType<typeof useAuthStoreHydrated>);
}

test('waits for session hydration before routing or mounting guide pages', () => {
  session(false);
  render(<SupplierLayout />);
  expect(screen.toJSON()).toBeNull();
});

test.each([['/', '/(app)'], ['/settings', '/(app)/settings']])('redirects a traveler opening %s to their own route', (path, destination) => {
  session(true, 'customer');
  jest.mocked(usePathname).mockReturnValueOnce(path);
  render(<SupplierLayout />);
  expect(screen.getByText(destination)).toBeOnTheScreen();
  expect(screen.queryByText('Guide stack')).toBeNull();
});

test.each([['android', '/splash'], ['web', '/auth']])('preserves the signed-out %s startup path', (platform, destination) => {
  const previous = Platform.OS;
  Object.defineProperty(Platform, 'OS', { value: platform, configurable: true });
  try {
    session(true);
    render(<SupplierLayout />);
    expect(screen.getByText(destination)).toBeOnTheScreen();
  } finally {
    Object.defineProperty(Platform, 'OS', { value: previous, configurable: true });
  }
});

test.each(['supplier', 'companion'])('opens the guide stack for the %s role', (role) => {
  session(true, role);
  render(<SupplierLayout />);
  expect(screen.getByText('Guide stack')).toBeOnTheScreen();
});
