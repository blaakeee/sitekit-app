import { useCameraPermissions } from 'expo-camera';
import { Linking } from 'react-native';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export function useCameraPermission() {
  const [permission, requestPermission] = useCameraPermissions();

  const state: PermissionState = !permission
    ? 'undetermined'
    : permission.granted
      ? 'granted'
      : 'denied';

  const request = async (): Promise<boolean> => {
    const result = await requestPermission();
    return result.granted;
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  return { state, request, openSettings };
}
