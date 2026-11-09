import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
jest.mock('lucide-react-native', () => ({ Send: () => null, ArrowLeft: () => null }));
import { ChatAccessState } from '@/components/chat/ChatAccessState';
import { EnhancedMessageInput } from '@/components/chat/EnhancedMessageInput';

it('keeps the legitimate booking gate bounded and navigable without offering chat access', () => {
  const primary = jest.fn(); const back = jest.fn();
  const screen = render(<ChatAccessState bookingRequired message="Your guide must confirm the booking first." onPrimary={primary} onBack={back} />);
  expect(screen.getByRole('header').props.children).toBe('Chat opens after confirmation');
  expect(screen.getByText('Your guide must confirm the booking first.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'View bookings' }));
  fireEvent.press(screen.getByRole('button', { name: 'Back to messages' }));
  expect(primary).toHaveBeenCalledTimes(1); expect(back).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Send message' })).toBeNull();
});
it('shows transport failure as a retryable error, not as the booking requirement', () => {
  const retry = jest.fn();
  const screen = render(<ChatAccessState bookingRequired={false} message="Check your connection and try again." onPrimary={retry} onBack={jest.fn()} />);
  expect(screen.getByRole('alert').props.children).toBe('Check your connection and try again.');
  expect(screen.queryByRole('button', { name: 'View bookings' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Try again' })); expect(retry).toHaveBeenCalledTimes(1);
});
it.each([['', false, true], ['  ', false, true], ['Hello', true, true], ['Hello', false, false]] as const)('send semantics match text=%s busy=%s', (message, disabled, expected) => {
  const send = jest.fn();
  const screen = render(<EnhancedMessageInput message={message} disabled={disabled} onMessageChange={jest.fn()} onSend={send} />);
  const control = screen.getByRole('button', { name: 'Send message' });
  expect(control.props.accessibilityState.disabled).toBe(expected);
  fireEvent.press(control);
  expect(send).toHaveBeenCalledTimes(expected ? 0 : 1);
});

jest.mock('@/components/ui/ProfileImage', () => ({ ProfileImage: () => null }));
import { StyleSheet, View } from 'react-native';
import { ChatPeerHeader } from '@/components/chat/ChatPeerHeader';
it('allows the actual peer header name to shrink and ellipsize instead of enlarging narrow viewports', () => {
  const name = 'Tirak E2E Guide — Delete After Test long peer name';
  const screen = render(<ChatPeerHeader name={name} image="" onBack={jest.fn()} />);
  const text = screen.getByText(name);
  expect(text.props.numberOfLines).toBe(1);
  expect(text.props.ellipsizeMode).toBe('tail');
  const containers = screen.UNSAFE_getAllByType(View).map(view => StyleSheet.flatten(view.props.style));
  expect(containers).toEqual(expect.arrayContaining([expect.objectContaining({ minWidth: 0, flexShrink: 1, flex: 1 })]));
  const back = screen.getByRole('button', { name: 'Go back' });
  expect(StyleSheet.flatten(back.props.style)).toMatchObject({ width: 44, height: 44, flexShrink: 0 });
});
