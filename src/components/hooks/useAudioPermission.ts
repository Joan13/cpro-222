import { Platform } from 'react-native';
import { AudioModule, setAudioModeAsync } from 'expo-audio';
import { useEffect, useState } from 'react';

export default function useAudioPermission() {
  const [permissionResponse, setPermissionResponse] = useState<Awaited<ReturnType<typeof AudioModule.getRecordingPermissionsAsync>> | null>(null);

  useEffect(() => {
    const loadPermission = async () => {
      const response = await AudioModule.getRecordingPermissionsAsync();
      setPermissionResponse(response);
    };

    loadPermission();
  }, []);

  const ensureAudioPermission = async () => {
    try {
      // 🔸 Attendre que le hook soit initialisé
      if (!permissionResponse) return;

      // 🔸 Si la permission n'est pas encore accordée, on la demande
      if (!permissionResponse.granted) {
        const newPermission = await AudioModule.requestRecordingPermissionsAsync();
        setPermissionResponse(newPermission);
        if (!newPermission.granted) {
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
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
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
