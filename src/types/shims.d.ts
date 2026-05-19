declare module 'react-native-ui-lib/keyboard';

import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    sharedTransitionTag?: string;
  }
  interface ImageProps {
    sharedTransitionTag?: string;
  }
}
