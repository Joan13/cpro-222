import React, { useCallback } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { NavProps } from '../../types/types';
import { useAppSelector } from '../../store/app/hooks';
import { MediaGallery } from '../../components/lists/gallery/MediaGallery';

const GalleryScreen: React.FC<NavProps> = ({ navigation, route }) => {
    const theme = useAppSelector(state => state.app_theme);

    const multiple = route.params?.multiple ?? true;
    const maxSelection = route.params?.maxSelection;
    const initialSelection = route.params?.initialSelection ?? [];
    const onSelectCallback = route.params?.onSelect;

    const handleConfirm = useCallback(
        (selectedAssets: MediaLibrary.Asset[]) => {
            if (onSelectCallback) {
                onSelectCallback(selectedAssets);
            }
            navigation.goBack();
        },
        [navigation, onSelectCallback]
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <MediaGallery
                    multiple={multiple}
                    maxSelection={maxSelection}
                    initialSelection={initialSelection}
                    onConfirm={handleConfirm}
                    showConfirmButton={true}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});

export default GalleryScreen;
