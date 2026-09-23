import { createNavigationContainerRef, StackActions } from '@react-navigation/native';
import type { RootStackParamList } from '../types/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

let pendingNavigation: { name: keyof RootStackParamList; params?: any } | null = null;

export function navigate(name: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) {
  if (navigationRef.isReady()) {
    (navigationRef as { navigate: (n: string, p?: object) => void }).navigate(name as string, params as object);
  } else {
    console.log(`[Navigation_ref] NavigationContainer not ready, queuing navigation to ${String(name)}`);
    pendingNavigation = { name, params };
  }
}

export function replace(name: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name as string, params as object));
  } else {
    pendingNavigation = { name, params };
  }
}

export function flushPendingNavigation() {
  if (pendingNavigation && navigationRef.isReady()) {
    const target = pendingNavigation;
    pendingNavigation = null;
    console.log(`[Navigation_ref] Flushing pending navigation to ${String(target.name)}`);
    (navigationRef as { navigate: (n: string, p?: object) => void }).navigate(target.name as string, target.params as object);
  }
}

export function navigateWithRetry(name: keyof RootStackParamList, params?: any, maxRetries = 30) {
  navigate(name, params);
  let count = 0;
  const interval = setInterval(() => {
    count++;
    if (navigationRef.isReady()) {
      flushPendingNavigation();
      clearInterval(interval);
    } else if (count >= maxRetries) {
      clearInterval(interval);
    }
  }, 100);
}
