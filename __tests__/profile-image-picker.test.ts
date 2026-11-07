jest.mock('react-native', () => ({ Platform: { OS: 'web' }, Alert: { alert: jest.fn() } }));
jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'images' },
  requestCameraPermissionsAsync: jest.fn(), requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(), launchImageLibraryAsync: jest.fn(),
}));
import { Alert, Platform } from 'react-native';
import * as Picker from 'expo-image-picker';
import { chooseProfileImage } from '../utils/profile-image-picker';
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
beforeEach(() => { jest.clearAllMocks(); (Platform as any).OS = 'web'; });
it('launches web library synchronously from click without permissions or native alert, then applies photo', async () => {
  (Picker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'blob:photo' }] });
  const picked = jest.fn();
  chooseProfileImage('profile', picked, jest.fn());
  expect(Picker.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
  expect(Picker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
  expect(Alert.alert).not.toHaveBeenCalled();
  expect(Picker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ aspect: [1, 1] }));
  await flush(); expect(picked).toHaveBeenCalledWith('blob:photo');
});
it('reports web rejection and leaves cancellation unchanged', async () => {
  const error = jest.fn(), picked = jest.fn();
  (Picker.launchImageLibraryAsync as jest.Mock).mockRejectedValueOnce(new Error('Picker failed'));
  chooseProfileImage('cover', picked, error); await flush();
  expect(error).toHaveBeenCalledWith('Picker failed'); expect(picked).not.toHaveBeenCalled();
  (Picker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({ canceled: true });
  chooseProfileImage('cover', picked, error); await flush(); expect(picked).not.toHaveBeenCalled();
});
it('retains native camera/gallery menu, permission and cover aspect', async () => {
  (Platform as any).OS = 'ios';
  (Picker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
  (Picker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
  (Picker.launchCameraAsync as jest.Mock).mockResolvedValue({ canceled: true });
  (Picker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true });
  chooseProfileImage('cover', jest.fn(), jest.fn());
  expect(Picker.launchImageLibraryAsync).not.toHaveBeenCalled();
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
  expect(buttons.map((b: any) => b.text)).toEqual(['Camera', 'Gallery', 'Cancel']);
  buttons[0].onPress(); await flush();
  expect(Picker.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(Picker.launchCameraAsync).toHaveBeenCalledWith(expect.objectContaining({ aspect: [16, 9] }));
  buttons[1].onPress(); await flush();
  expect(Picker.requestMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(Picker.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
});
