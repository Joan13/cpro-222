import React from 'react';
import { View, Pressable, ViewStyle, StyleSheet } from 'react-native';
import { Host, BottomSheet as ExpoBottomSheet, RNHostView } from '@expo/ui/swift-ui';
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
        fitToContents
      >
        <RNHostView matchContents>
          <View style={[{ padding: 16, width: '100%', backgroundColor: theme.card || theme.background }, containerStyle]}>
            {title ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <YambiText text={title} style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }} />
                <Pressable onPress={onClose} hitSlop={8}>
                  <IconApp pack="FI" name="x" size={20} color={theme.gray} />
                </Pressable>
              </View>
            ) : null}
            {children}
          </View>
        </RNHostView>
      </ExpoBottomSheet>
    </Host>
  );
};

export default BottomSheet;
