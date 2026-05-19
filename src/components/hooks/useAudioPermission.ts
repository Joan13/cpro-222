import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export default function useAudioPermission() {
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const ensureAudioPermission = async () => {
    try {
      // 🔸 Attendre que le hook soit initialisé
      if (!permissionResponse) return;

      // 🔸 Si la permission n'est pas encore accordée, on la demande
      if (permissionResponse.status !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission.status !== 'granted') {
          if (__DEV__) {
            console.warn(
              'Microphone permission not granted.',
              newPermission.status,
              Platform.OS === 'android'
                ? 'Check RECORD_AUDIO in AndroidManifest and rebuild the native app.'
                : 'Check NSMicrophoneUsageDescription in Info.plist and rebuild.',
            );
          }
          return false;
        }
      }

      // 🔸 Config iOS (uniquement si permission accordée)
      if (Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      return true;
    } catch (err) {
      console.error('Erreur lors de la demande de permission audio :', err);
      return false;
    }
  };

  return { permissionResponse, ensureAudioPermission };
}
