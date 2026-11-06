import React from 'react';
import { Animated, Platform } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import RegisterScreen from '@/app/auth/register';
import { formatLocalDate, latestAdultBirthDate } from '@/utils/birth-date';

const mockRegister = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ role: 'customer' }),
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: require('react-native').View }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('lucide-react-native', () => ({
  ArrowLeft: 'ArrowLeft', Calendar: 'Calendar', ChevronDown: 'ChevronDown',
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/components/ui/Button', () => ({
  Button: ({ title, onPress }: { title: string; onPress: () => void }) =>
    require('react').createElement(
      require('react-native').Text, { accessibilityRole: 'button', onPress }, title,
    ),
}));
jest.mock('@react-native-community/datetimepicker', () => function MockDateTimePicker() {
  return null;
});
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ register: mockRegister, isLoading: false, error: null }),
}));

afterEach(() => {
  jest.restoreAllMocks();
  mockRegister.mockClear();
});

it('Android requires a confirmed date and submits a birth date before 1970 unchanged', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.spyOn(Animated, 'loop').mockImplementation(() => Animated.delay(0));
  const ui = render(<RegisterScreen />);
  fireEvent.changeText(ui.getByPlaceholderText('register.fullNamePlaceholder'), ' A ');
  fireEvent.changeText(ui.getByPlaceholderText('register.emailPlaceholder'), ' traveler@example.test ');
  fireEvent.changeText(ui.getByPlaceholderText('register.contactNumberPlaceholder'), ' 021234567 ');
  fireEvent.changeText(ui.getByPlaceholderText('register.passwordPlaceholder'), 'ExamplePass123');
  fireEvent.changeText(ui.getByPlaceholderText('register.confirmPasswordPlaceholder'), 'ExamplePass123');
  fireEvent.press(ui.getByText('register.selectGender'));
  fireEvent.press(ui.getByText('register.other'));
  fireEvent.press(ui.getByRole('checkbox', { name: /agree to the terms/i }));
  const openPicker = () => fireEvent.press(ui.getByRole('button', { name: 'register.dateOfBirth' }));
  const submit = () => fireEvent.press(ui.getByRole('button', { name: 'register.createAccount' }));

  openPicker();
  const picker = ui.UNSAFE_getByType(DateTimePicker);
  expect(picker.props.minimumDate).toEqual(new Date(1900, 0, 1));
  fireEvent(picker, 'change', { type: 'dismissed' }, picker.props.value);
  submit();
  expect(ui.getByRole('alert')).toHaveTextContent('register.dateRequired');
  expect(mockRegister).not.toHaveBeenCalled();

  openPicker();
  fireEvent(ui.UNSAFE_getByType(DateTimePicker), 'change', { type: 'set' }, new Date(1965, 0, 2));
  submit();
  await waitFor(() => expect(mockRegister).toHaveBeenCalledWith(
    'A', 'traveler@example.test', 'ExamplePass123', 'customer', '021234567', '1965-01-02', 'other',
    expect.anything(),
  ));
});

it('uses the full calendar date for the 18-year cutoff, including on a leap day', () => {
  expect(formatLocalDate(latestAdultBirthDate(new Date(2026, 10, 6)))).toBe('2008-11-06');
  expect(formatLocalDate(latestAdultBirthDate(new Date(2024, 1, 29)))).toBe('2006-02-28');
});
