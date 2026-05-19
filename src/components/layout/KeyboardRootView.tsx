import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
};

/**
 * Keeps focused TextInputs above the software keyboard on iOS.
 * On Android, windowSoftInputMode=adjustResize (see app.json) already
 * resizes the window; a root KeyboardAvoidingView fights that and can leave
 * a persistent bottom gap after the keyboard dismisses.
 */
export default function KeyboardRootView({ children }: Props) {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'android') {
    return <View style={styles.flex}>{children}</View>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
      keyboardVerticalOffset={insets.top}>
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
