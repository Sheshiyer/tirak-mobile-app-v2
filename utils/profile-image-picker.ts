import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type ProfileImageKind = 'cover' | 'profile';

export function chooseProfileImage(
  kind: ProfileImageKind,
  onPick: (uri: string) => void,
  onError: (message: string) => void,
): void {
  const launch = async (camera: boolean) => {
    try {
      // Browser file dialogs must launch in the original button gesture.
      // Web does not need native photo-library permission requests.
      if (Platform.OS !== 'web') {
        const permission = camera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          onError(camera ? 'Please allow camera access to update your photo.' : 'Please allow photo library access to update your photo.');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: kind === 'cover' ? [16, 9] : [1, 1],
        quality: 0.85,
      };
      const result = await (camera
        ? ImagePicker.launchCameraAsync(options)
        : ImagePicker.launchImageLibraryAsync(options));
      if (!result.canceled && result.assets?.[0]?.uri) onPick(result.assets[0].uri);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'The photo picker could not be opened. Please try again.');
    }
  };
  if (Platform.OS === 'web') {
    void launch(false);
    return;
  }
  Alert.alert(kind === 'cover' ? 'Change Cover Photo' : 'Change Profile Photo', 'Choose an option', [
    { text: 'Camera', onPress: () => void launch(true) },
    { text: 'Gallery', onPress: () => void launch(false) },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
