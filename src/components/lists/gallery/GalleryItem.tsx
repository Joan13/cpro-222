import React, { memo } from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { IconApp } from '../../app/IconApp';

export interface GalleryItemProps {
  asset: MediaLibrary.Asset;
  size: number;
  isSelected: boolean;
  selectionIndex?: number;
  multiple?: boolean;
  onPress: (asset: MediaLibrary.Asset) => void;
  accentColor: string;
  badgeTextColor: string;
  borderRadius?: number;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  const sec = Math.round(seconds);
  const mins = Math.floor(sec / 60);
  const remainingSecs = sec % 60;
  return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
}

const GalleryItemComponent: React.FC<GalleryItemProps> = ({
  asset,
  size,
  isSelected,
  selectionIndex,
  multiple = true,
  onPress,
  accentColor,
  badgeTextColor,
  borderRadius = 4,
}) => {
  const isVideo =
    asset.mediaType === MediaLibrary.MediaType.video || (asset.mediaType as any) === 'video';
  const durationText = isVideo ? formatDuration(asset.duration) : '';

  return (
    <Pressable
      onPress={() => onPress(asset)}
      style={({ pressed }) => [
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: borderRadius,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Image
        source={{ uri: asset.uri }}
        style={[styles.image, { borderRadius: borderRadius }]}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />

      {isSelected && <View style={[styles.selectedOverlay, { borderRadius: borderRadius }]} />}

      {/* Video Indicator Badge */}
      {isVideo ? (
        <View style={styles.videoBadge}>
          <IconApp pack="FI" name="play" size={10} color="#FFFFFF" styles={{ marginRight: 3 }} />
          {durationText ? <Text style={styles.videoDurationText}>{durationText}</Text> : null}
        </View>
      ) : null}

      <View style={styles.badgeContainer}>
        {isSelected ? (
          <View style={[styles.selectedBadge, { backgroundColor: accentColor }]}>
            {multiple && selectionIndex !== undefined ? (
              <Text style={[styles.selectionIndexText, { color: badgeTextColor }]}>
                {selectionIndex}
              </Text>
            ) : (
              <IconApp pack="FI" name="check" size={12} color={badgeTextColor} />
            )}
          </View>
        ) : (
          <View style={styles.unselectedBadge}>
            <IconApp pack="FI" name="circle" size={14} color="rgba(255,255,255,0.7)" />
          </View>
        )}
      </View>
    </Pressable>
  );
};

export const GalleryItem = memo(GalleryItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.asset.id === nextProps.asset.id &&
    prevProps.size === nextProps.size &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectionIndex === nextProps.selectionIndex &&
    prevProps.multiple === nextProps.multiple &&
    prevProps.accentColor === nextProps.accentColor &&
    prevProps.badgeTextColor === nextProps.badgeTextColor &&
    prevProps.borderRadius === nextProps.borderRadius
  );
});

const styles = StyleSheet.create({
  container: {
    margin: 1, // 1px on each side = 2px gap between pictures
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  selectedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  unselectedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  selectionIndexText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 2,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
