import { createNavigationContainerRef, StackActions } from '@react-navigation/native';
import type { RootStackParamList } from '../types/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) {
  if (navigationRef.isReady()) {
    (navigationRef as { navigate: (n: string, p?: object) => void }).navigate(name as string, params as object);
  }
}

export function replace(name: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name as string, params as object));
  }
}
