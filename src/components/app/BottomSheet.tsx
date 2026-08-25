import React from 'react';
import { View, Pressable, ViewStyle, StyleSheet } from 'react-native';
import {
    Host,
    ModalBottomSheet,
    RNHostView,
    LazyColumn,
} from '@expo/ui/jetpack-compose';
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
            <ModalBottomSheet
                onDismissRequest={onClose}
                showDragHandle={true}
                sheetGesturesEnabled={true}
                containerColor={theme.card || theme.background}
            >
                {/*
                 * LazyColumn is a native Jetpack Compose scrollable container.
                 * It properly participates in Compose's nested scroll protocol
                 * with ModalBottomSheet, allowing:
                 *   - Sheet to auto-size based on content (compact for small content)
                 *   - Sheet to expand when content grows
                 *   - Content to scroll natively when sheet is at max height
                 *
                 * Each child is wrapped in its own RNHostView so that React Native
                 * content can be rendered inside the native LazyColumn items.
                 */}
                <LazyColumn
                    contentPadding={{ start: 16, end: 16, bottom: 32, top: 0 }}
                    verticalArrangement={{ spacedBy: 0 }}
                >
                    {title && (
                        <RNHostView matchContents>
                            <View style={[styles.titleRow, { backgroundColor: theme.card || theme.background }]}>
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
                        <View style={[{ width: '100%', backgroundColor: theme.card || theme.background }, containerStyle]}>
                            {children}
                        </View>
                    </RNHostView>
                </LazyColumn>
            </ModalBottomSheet>
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
