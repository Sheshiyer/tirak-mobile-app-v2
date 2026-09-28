import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
const mockSave = jest.fn();
const mockBack = jest.fn();
const mockRefetch = jest.fn();
let mockQuery: any;
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }) }));
jest.mock('@/stores/auth-store', () => ({ useAuthStore: (select: any) => select({ user: { id: 'owner' } }) }));
jest.mock('@/services/api/companion/availability-settings', () => ({
  useAvailabilitySettings: () => mockQuery,
  useSaveAvailabilitySettings: () => ({ mutateAsync: mockSave, isPending: false }),
  validateAvailabilitySettings: (settings: any) => { if (settings.days.some((day: any) => day.startTime >= day.endTime)) throw new Error('Invalid time'); },
}));
const SettingsScreen = require('@/app/(supplier)/availability/settings').default;
beforeEach(() => { jest.clearAllMocks(); mockSave.mockResolvedValue(undefined); mockQuery={data:{timeZone:'Asia/Bangkok', days:[{dayOfWeek:1,startTime:'09:15',endTime:'17:45',isAvailable:true}]},isLoading:false,isError:false,refetch:mockRefetch}; });
test('recurring settings render saved hours and save all weekdays only after user edit', async () => {
  const ui=render(<SettingsScreen />);
  expect(ui.getByDisplayValue('09:15')).toBeTruthy();
  expect(mockSave).not.toHaveBeenCalled();
  fireEvent.changeText(ui.getByLabelText('Monday availabilitySettings.end'),'18:15');
  fireEvent.press(ui.getByText('common.save'));
  await waitFor(() => expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({timeZone:'Asia/Bangkok',days:expect.arrayContaining([{dayOfWeek:1,startTime:'09:15',endTime:'18:15',isAvailable:true}])})));
  expect(ui.getByText('availabilitySettings.saved')).toBeTruthy();
  fireEvent.press(ui.getByText('common.back'));expect(mockBack).toHaveBeenCalled();
});
test('failed save shows failure while keeping entered hours', async () => {
  mockSave.mockRejectedValue(new Error('offline'));
  const ui=render(<SettingsScreen />);
  fireEvent.changeText(ui.getByLabelText('Monday availabilitySettings.end'),'18:15');
  fireEvent.press(ui.getByText('common.save'));
  await waitFor(() => expect(ui.getByText('availabilitySettings.saveFailed')).toBeTruthy());
  expect(ui.getByDisplayValue('18:15')).toBeTruthy();
  expect(ui.queryByText('availabilitySettings.saved')).toBeNull();
});
test('failed initial load shows retry, never a fabricated schedule', () => {
  mockQuery={data:undefined,isLoading:false,isError:true,refetch:mockRefetch};
  const ui=render(<SettingsScreen />);
  expect(ui.queryByDisplayValue('09:00')).toBeNull();
  fireEvent.press(ui.getByText('common.retry'));expect(mockRefetch).toHaveBeenCalled();
});
