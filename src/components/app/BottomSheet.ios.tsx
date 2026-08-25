import React from 'react';
import { View, Pressable, ViewStyle, StyleSheet } from 'react-native';
import {
    Host,
    BottomSheet as ExpoBottomSheet,
    RNHostView,
    ScrollView as NativeScrollView,
    VStack,
} from '@expo/ui/swift-ui';
import { IconApp } from './IconApp';
import { YambiText } from './Text';
import { useAppSelector } from '../../store/app/hooks';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  containerStyle,
}) => {
  const theme = useAppSelector(state => state.app_theme.colors);

  if (!visible) return null;

  return (
    <Host matchContents style={StyleSheet.absoluteFillObject}>
      <ExpoBottomSheet
        isPresented={visible}
        onIsPresentedChange={(isPresented) => {
          if (!isPresented) onClose();
        }}
        fitToContents={false}
      >
        {/*
         * NativeScrollView is @expo/ui/swift-ui's own SwiftUI ScrollView.
         * It properly participates in SwiftUI's sheet gesture coordination:
         *   - When sheet is at medium/partial detent → dragging expands the sheet
         *   - When sheet is at large (full screen) → dragging scrolls the content
         *
         * Each child is wrapped in its own RNHostView so React Native content
         * can be rendered inside the native SwiftUI scroll container items.
         */}
        <NativeScrollView axes="vertical" showsIndicators={true}>
          <VStack>
            {title && (
              <RNHostView matchContents>
                <View style={[styles.titleRow, { backgroundColor: theme.card || theme.background, paddingHorizontal: 16 }]}>
                  <YambiText
                    text={title}
                    style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}
                  />
                  <Pressable onPress={onClose} hitSlop={12}>
                    <IconApp pack="FI" name="x" size={20} color={theme.gray} />
                  </Pressable>
                </View>
              </RNHostView>
            )}
            <RNHostView matchContents>
              <View
                style={[
                  {
                    width: '100%',
                    paddingHorizontal: 16,
                    paddingBottom: 32,
                    backgroundColor: theme.card || theme.background,
                  },
                  containerStyle,
                ]}
              >
                {children}
              </View>
            </RNHostView>
          </VStack>
        </NativeScrollView>
      </ExpoBottomSheet>
    </Host>
  );
};

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
});

export default BottomSheet;
