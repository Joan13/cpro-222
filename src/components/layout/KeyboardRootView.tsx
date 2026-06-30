import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type KeyboardEvent,
} from 'react-native';

type Props = {
  children: ReactNode;
};

/**
 * Tracks software keyboard height.
 * Useful for manual offset calculations in individual screens (e.g. FooterInbox).
 * On hide, height is reset to 0.
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
 * Root-level keyboard avoidance wrapper.
 *
 * Uses KeyboardAvoidingView with the `enabled` prop tied to keyboard visibility
 * to solve two problems at once:
 *
 *  1. While the keyboard is OPEN (`enabled={true}`):
 *     - iOS   → behavior="padding": pushes content up by the keyboard height.
 *     - Android → behavior="height": shrinks layout to keep content visible.
 *
 *  2. After the keyboard is DISMISSED (`enabled={false}`):
 *     - KeyboardAvoidingView acts as a plain View with flex: 1.
 *     - This removes any residual explicit height/padding that would otherwise
 *       leave an empty gap at the bottom of the screen (the ghost-gap bug).
 *
 * The `enabled` flag transitions only AFTER the keyboard animation completes
 * (keyboardDidHide / keyboardWillHide) so there is no visual jump.
 */
export default function KeyboardRootView({ children }: Props) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={keyboardVisible}
      keyboardVerticalOffset={0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
