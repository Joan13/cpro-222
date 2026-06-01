import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  View,
  type KeyboardEvent,
} from 'react-native';
type Props = {
  children: ReactNode;
};

/**
 * Tracks software keyboard height. On hide, height is reset to 0 so no gap
 * persists (unlike KeyboardAvoidingView with behavior="height" on Android).
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const onShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    };
    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardHeight;
}

/**
 * Keeps focused TextInputs above the software keyboard.
 * Uses bottom padding from keyboard events on all platforms.
 *
 * Chat screens (Inbox) should use SafeAreaView edges without "bottom" and let
 * FooterInbox manage home-indicator padding when the keyboard is closed.
 */
export default function KeyboardRootView({ children }: Props) {
  const keyboardHeight = useKeyboardHeight();

  // Full keyboard height: chat screens opt out of bottom SafeArea (see Inbox).
  const bottomPadding = keyboardHeight > 0 ? keyboardHeight : 0;

  return (
    <View style={[styles.flex, bottomPadding > 0 && { paddingBottom: bottomPadding }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
