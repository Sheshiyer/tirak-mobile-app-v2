import React from 'react';
import { render, screen } from '@testing-library/react-native';
import SupplierLayout from '@/app/(supplier)/_layout';
import { useAuthStoreHydrated } from '@/hooks/useAuthStoreHydrated';

jest.mock('expo-router', () => {
  const { createElement } = require('react');
  const { Text } = require('react-native');
  return {
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

test('redirects a traveler who opens the guide route to traveler home', () => {
  session(true, 'customer');
  render(<SupplierLayout />);
  expect(screen.getByText('/(app)')).toBeOnTheScreen();
  expect(screen.queryByText('Guide stack')).toBeNull();
});

test('redirects signed-out visitors through the existing startup flow', () => {
  session(true);
  render(<SupplierLayout />);
  expect(screen.getByText('/splash')).toBeOnTheScreen();
});

test.each(['supplier', 'companion'])('opens the guide stack for the %s role', (role) => {
  session(true, role);
  render(<SupplierLayout />);
  expect(screen.getByText('Guide stack')).toBeOnTheScreen();
});
