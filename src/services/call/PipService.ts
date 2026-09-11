import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { PipModule } = NativeModules;
const eventEmitter = PipModule ? new NativeEventEmitter(PipModule) : null;

/**
 * Updates the native Android system Picture-in-Picture status.
 * System-level PiP is ONLY enabled when isVideoCallActive is true.
 */
export const setSystemPipVideoCallActive = (active: boolean) => {
  if (Platform.OS === 'android' && PipModule && PipModule.setVideoCallActive) {
    try {
      PipModule.setVideoCallActive(active);
    } catch (e) {
      console.error('[PipService] Error calling setVideoCallActive:', e);
    }
  }
};

/**
 * Explicitly triggers system-level PiP mode if a video call is active.
 */
export const enterSystemPipMode = () => {
  if (Platform.OS === 'android' && PipModule && PipModule.enterPipMode) {
    try {
      PipModule.enterPipMode();
    } catch (e) {
      console.error('[PipService] Error calling enterPipMode:', e);
    }
  }
};

/**
 * Subscribes to system Picture-in-Picture mode change events.
 */
export const subscribeSystemPipMode = (callback: (isInPip: boolean) => void) => {
  if (!eventEmitter) return () => {};
  try {
    const subscription = eventEmitter.addListener('onPictureInPictureModeChanged', callback);
    return () => subscription.remove();
  } catch (e) {
    console.error('[PipService] Error subscribing to PiP events:', e);
    return () => {};
  }
};
