import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import * as MediaLibrary from 'expo-media-library';
import { useAppSelector } from '../../../store/app/hooks';
import { useMediaGallery, DateFilterType, GallerySlot } from '../../../hooks/useMediaGallery';
import { GalleryItem } from './GalleryItem';
import { YambiText, TextNormalYambiGray } from '../../app/Text';
import ButtonNormal from '../../app/ButtonNormal';
import { IconApp } from '../../app/IconApp';
import BottomSheet from '../../app/BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { strings } from '../../../lang/lang';
import { ProcessedPhoto } from '../../../types/gallery';
import { PhotoEditor } from './PhotoEditor';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MediaGalleryProps {
  multiple?: boolean;
  maxSelection?: number;
  initialSelection?: MediaLibrary.Asset[];
  onSelectAssets?: (assets: MediaLibrary.Asset[]) => void;
  onConfirm?: (assets: any[]) => void;
  onComplete?: (photos: ProcessedPhoto[]) => void;
  headerTitle?: string;
  showConfirmButton?: boolean;
  showSelectAll?: boolean;
  mediaTypes?: MediaLibrary.MediaTypeValue[];
  enableEditing?: boolean;
}

const DATE_FILTERS: Array<{ key: DateFilterType; labelKey: string }> = [
  { key: 'all', labelKey: 'all_time' },
  { key: 'today', labelKey: 'today' },
  { key: 'this_week', labelKey: 'this_week' },
  { key: 'this_month', labelKey: 'this_month' },
  { key: 'this_year', labelKey: 'this_year' },
];

// ─── Skeleton cell (shared animation, no per-item Animated.Value) ─────────────

interface SkeletonCellProps {
  size: number;
  margin: number;
  anim: Animated.Value;
  backgroundColor: string;
}

const SkeletonCell = React.memo(({ size, margin, anim, backgroundColor }: SkeletonCellProps) => {
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        margin,
        backgroundColor,
        opacity,
        borderRadius: 2,
      }}
    />
  );
});

// ─── Component ────────────────────────────────────────────────────────────────

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  multiple = true,
  maxSelection,
  initialSelection = [],
  onSelectAssets,
  onConfirm,
  onComplete,
  headerTitle,
  showConfirmButton = true,
  showSelectAll = true,
  mediaTypes = [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
  enableEditing = false,
}) => {
  const theme = useAppSelector(state => state.app_theme);
  const { width, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  // ── Skeleton pulse animation (one shared value for all skeleton cells) ──────
  const skeletonAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonAnim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(skeletonAnim, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Grid layout ─────────────────────────────────────────────────────────────
  const numColumns = useMemo(() => {
    if (width >= 900) return 6;
    if (width >= 600) return 5;
    if (width >= 400) return 4;
    return 3;
  }, [width]);

  const itemMargin = 1;
  const totalMarginPerRow = itemMargin * 2 * numColumns;
  const itemSize = Math.floor((width - totalMarginPerRow) / numColumns);
  const sidePadding = Math.max(0, Math.floor((width - (itemSize * numColumns + totalMarginPerRow)) / 2));

  // ── Hook ────────────────────────────────────────────────────────────────────
  const [showAlbumSheet, setShowAlbumSheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);

  const {
    slots,
    totalCount,
    albums,
    selectedAlbumId,
    setSelectedAlbumId,
    dateFilter,
    setDateFilter,
    initializing,
    loadingChunk,
    error,
    permissionResponse,
    isPermissionGranted,
    isPermissionLimited,
    isPermissionDenied,
    requestPermission,
    presentPermissionsPicker,
    openSettings,
    ensureChunksForIndices,
    refreshGallery,
  } = useMediaGallery({ mediaTypes });

  // ── Selection state ──────────────────────────────────────────────────────────
  const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>(initialSelection);

  useEffect(() => {
    if (initialSelection && initialSelection.length > 0) {
      setSelectedAssets(initialSelection);
    }
  }, [initialSelection]);

  const selectedMap = useMemo(() => {
    const map = new Map<string, number>();
    selectedAssets.forEach((asset, index) => map.set(asset.id, index + 1));
    return map;
  }, [selectedAssets]);

  /** All currently loaded assets (slots with real data) */
  const loadedAssets = useMemo(
    () => slots.filter(s => s.asset !== undefined).map(s => s.asset!),
    [slots]
  );

  const handleToggleSelect = useCallback(
    (asset: MediaLibrary.Asset) => {
      setSelectedAssets(prev => {
        const isSelected = prev.some(item => item.id === asset.id);
        let next: MediaLibrary.Asset[];
        if (isSelected) {
          next = prev.filter(item => item.id !== asset.id);
        } else {
          if (!multiple) {
            next = [asset];
          } else {
            if (maxSelection && prev.length >= maxSelection) return prev;
            next = [...prev, asset];
          }
        }
        if (onSelectAssets) onSelectAssets(next);
        return next;
      });
    },
    [multiple, maxSelection, onSelectAssets]
  );

  const handleSelectAllToggle = useCallback(() => {
    if (loadedAssets.length === 0) return;
    const allSelected = loadedAssets.every(a => selectedMap.has(a.id));

    if (allSelected) {
      const visibleIds = new Set(loadedAssets.map(a => a.id));
      const next = selectedAssets.filter(a => !visibleIds.has(a.id));
      setSelectedAssets(next);
      if (onSelectAssets) onSelectAssets(next);
    } else {
      let next = [...selectedAssets];
      const existing = new Set(next.map(a => a.id));
      for (const asset of loadedAssets) {
        if (!existing.has(asset.id)) {
          if (maxSelection && next.length >= maxSelection) break;
          next.push(asset);
        }
      }
      setSelectedAssets(next);
      if (onSelectAssets) onSelectAssets(next);
    }
  }, [loadedAssets, selectedMap, selectedAssets, maxSelection, onSelectAssets]);

  const [isEditingMode, setIsEditingMode] = useState(false);

  const handleEditorComplete = useCallback(
    (processedPhotos: ProcessedPhoto[]) => {
      setIsEditingMode(false);
      if (onComplete) onComplete(processedPhotos);
      if (onConfirm) onConfirm(processedPhotos);
    },
    [onComplete, onConfirm]
  );

  const handleConfirm = useCallback(() => {
    if (selectedAssets.length === 0) return;
    if (enableEditing) {
      setIsEditingMode(true);
    } else {
      const processed: ProcessedPhoto[] = selectedAssets.map(a => ({
        uri: a.uri,
        width: a.width,
        height: a.height,
        mimeType: (a.mediaType as any) === 'video' ? 'video/mp4' : 'image/jpeg',
        assetId: a.id,
        originalAsset: a,
      }));
      if (onComplete) onComplete(processed);
      if (onConfirm) onConfirm(selectedAssets);
    }
  }, [enableEditing, selectedAssets, onConfirm, onComplete]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedAlbumObj = useMemo(
    () => (selectedAlbumId ? albums.find(a => a.id === selectedAlbumId) || null : null),
    [albums, selectedAlbumId]
  );

  const selectedDateFilterObj = useMemo(
    () => DATE_FILTERS.find(f => f.key === dateFilter) || DATE_FILTERS[0],
    [dateFilter]
  );

  const getDateFilterLabel = useCallback(
    (labelKey: string) => (strings as any)[labelKey] || labelKey,
    []
  );

  const isAllVisibleSelected = useMemo(
    () => loadedAssets.length > 0 && loadedAssets.every(a => selectedMap.has(a.id)),
    [loadedAssets, selectedMap]
  );

  // ── LegendList helpers ───────────────────────────────────────────────────────
  const keyExtractor = useCallback((item: GallerySlot) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: GallerySlot }) => {
      if (!item.asset) {
        // Placeholder skeleton cell
        return (
          <SkeletonCell
            size={itemSize}
            margin={itemMargin}
            anim={skeletonAnim}
            backgroundColor={theme.colors.card}
          />
        );
      }

      const selectionIndex = selectedMap.get(item.asset.id);
      const isSelected = selectionIndex !== undefined;

      return (
        <GalleryItem
          asset={item.asset}
          size={itemSize}
          isSelected={isSelected}
          selectionIndex={selectionIndex}
          multiple={multiple}
          onPress={handleToggleSelect}
          accentColor={theme.colors.button_background_color || theme.colors.high_color}
          badgeTextColor={theme.colors.button_foreground_color || '#FFFFFF'}
          borderRadius={4}
        />
      );
    },
    [selectedMap, itemSize, itemMargin, skeletonAnim, theme, multiple, handleToggleSelect]
  );

  const renderFooter = useCallback(() => {
    if (loadingChunk) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={theme.colors.high_color} />
        </View>
      );
    }
    return <View style={{ height: 40 }} />;
  }, [loadingChunk, theme]);

  /**
   * onViewableItemsChanged — called by LegendList with currently visible items.
   * We extract their indices and pass them to ensureChunksForIndices to trigger
   * chunk loading for visible + 1 prefetch chunk ahead.
   */
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const indices = viewableItems
        .map(v => v.index)
        .filter((i): i is number => i !== null && i !== undefined && i >= 0);
      ensureChunksForIndices(indices);
    },
    [ensureChunksForIndices]
  );

  // viewabilityConfig: stable object reference so LegendList doesn't re-create it
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 15,
  }), []);

  // ── Render guards ────────────────────────────────────────────────────────────

  // Phase 1 loading (counting assets, building grid structure)
  if (permissionResponse === null || initializing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.high_color} />
        <YambiText
          text={initializing ? strings.loading_photos : strings.loading_photos}
          style={{ marginTop: 12, color: theme.colors.gray }}
        />
      </View>
    );
  }

  // Permission denied
  if (isPermissionDenied || (!isPermissionGranted && !isPermissionLimited)) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background, padding: 24 }]}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <IconApp name="image" pack="FI" size={40} color={theme.colors.high_color} />
        </View>
        <YambiText
          text={strings.photo_permission_required}
          bold
          size="big"
          style={{ marginTop: 16, textAlign: 'center', color: theme.colors.text }}
        />
        <TextNormalYambiGray
          text={strings.photo_permission_description}
          styles={{ textAlign: 'center', marginTop: 8, marginBottom: 24 }}
        />
        <View style={{ width: '100%', maxWidth: 280, gap: 12 }}>
          <ButtonNormal normal title={strings.request_permission} onPress={requestPermission} iconName="shield" iconPack="FI" />
          <ButtonNormal outline title={strings.open_settings} onPress={openSettings} iconName="settings" iconPack="FI" />
        </View>
      </View>
    );
  }

  // Error (with no loaded content)
  if (error && slots.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background, padding: 24 }]}>
        <IconApp name="alert-circle" pack="FI" size={48} color={theme.colors.error} />
        <YambiText text={strings.error_loading_photos} bold style={{ marginTop: 12, color: theme.colors.text }} />
        <TextNormalYambiGray text={error} styles={{ textAlign: 'center', marginTop: 4, marginBottom: 16 }} />
        <ButtonNormal outline title={strings.retry} onPress={refreshGallery} iconName="refresh-cw" iconPack="FI" />
      </View>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* Top Control Toolbar */}
      <View style={[styles.topControlToolbarWrapper, { borderColor: theme.colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topControlToolbarContent}
        >
          {/* Album selector */}
          <Pressable
            onPress={() => setShowAlbumSheet(true)}
            style={[styles.toolbarPillButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <IconApp name="grid" pack="FI" size={14} color={theme.colors.high_color} styles={{ marginRight: 6 }} />
            <YambiText
              text={selectedAlbumObj ? selectedAlbumObj.title : strings.all_albums}
              bold
              size="small"
              style={{ color: theme.colors.text }}
            />
            <IconApp name="chevron-down" pack="FI" size={14} color={theme.colors.gray} styles={{ marginLeft: 6 }} />
          </Pressable>

          {/* Date filter */}
          <Pressable
            onPress={() => setShowDateSheet(true)}
            style={[styles.toolbarPillButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <IconApp name="calendar" pack="FI" size={14} color={theme.colors.high_color} styles={{ marginRight: 6 }} />
            <YambiText
              text={getDateFilterLabel(selectedDateFilterObj.labelKey)}
              bold
              size="small"
              style={{ color: theme.colors.text }}
            />
            <IconApp name="chevron-down" pack="FI" size={14} color={theme.colors.gray} styles={{ marginLeft: 6 }} />
          </Pressable>

          {/* Select all */}
          {showSelectAll && multiple && loadedAssets.length > 0 ? (
            <Pressable
              onPress={handleSelectAllToggle}
              style={[styles.toolbarPillButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <IconApp
                name={isAllVisibleSelected ? 'checkmark-circle' : 'square-outline'}
                pack="IO"
                size={16}
                color={isAllVisibleSelected ? theme.colors.high_color : theme.colors.gray}
                styles={{ marginRight: 6 }}
              />
              <YambiText text={strings.select_all} bold size="small" style={{ color: theme.colors.text }} />
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      {/* Limited access banner */}
      {isPermissionLimited ? (
        <Pressable
          onPress={presentPermissionsPicker}
          style={[styles.limitedBanner, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <IconApp name="info" pack="FI" size={18} color={theme.colors.high_color} styles={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <YambiText text={strings.limited_photo_access} bold size="small" style={{ color: theme.colors.text }} />
              <YambiText text={strings.tap_to_manage_photos} size="xsmall" color="gray" />
            </View>
          </View>
          <IconApp name="chevron-right" pack="FI" size={16} color={theme.colors.gray} />
        </Pressable>
      ) : null}

      {/* Empty state */}
      {totalCount === 0 && !initializing ? (
        <View style={styles.centerContainer}>
          <IconApp name="image" pack="FI" size={44} color={theme.colors.gray} />
          <YambiText text={strings.no_photos_found} bold style={{ marginTop: 12, color: theme.colors.gray }} />
          <ButtonNormal
            ghost
            title={strings.refresh}
            onPress={refreshGallery}
            iconName="refresh-cw"
            iconPack="FI"
            styles={{ marginTop: 12 }}
          />
        </View>
      ) : (
        /**
         * LegendList renders ALL totalCount slots from the start.
         * Skeletons show for unloaded slots, real photos for loaded ones.
         * onViewableItemsChanged drives chunk loading.
         * estimatedListSize is required for New Architecture (Fabric) to know
         * the list's viewport dimensions from the start.
         */
        <LegendList
          style={{ flex: 1 }}
          key={`grid-${numColumns}`}
          data={slots}
          extraData={selectedMap}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          estimatedItemSize={itemSize + itemMargin * 2}
          estimatedListSize={{ height: windowHeight, width }}
          drawDistance={windowHeight}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{
            paddingHorizontal: sidePadding,
            paddingTop: 6,
            paddingBottom: showConfirmButton ? bottomOffset + 70 : 20,
          }}
        />
      )}

      {/* Album bottom sheet */}
      {showAlbumSheet ? (
        <BottomSheet visible={showAlbumSheet} onClose={() => setShowAlbumSheet(false)}>
          <View style={{ paddingBottom: 10, paddingHorizontal: 20 }}>
            <Pressable
              onPress={() => { setSelectedAlbumId(null); setShowAlbumSheet(false); }}
              style={[
                styles.sheetListItem,
                { backgroundColor: selectedAlbumId === null ? theme.colors.high_color + '15' : 'transparent', borderColor: theme.colors.border },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconApp name="grid" pack="FI" size={20} color={theme.colors.high_color} styles={{ marginRight: 12 }} />
                <YambiText text={strings.all_photos} bold style={{ color: theme.colors.text }} />
              </View>
              {selectedAlbumId === null ? <IconApp name="check" pack="FI" size={18} color={theme.colors.high_color} /> : null}
            </Pressable>

            {albums.map(album => {
              const isSelected = selectedAlbumId === album.id;
              return (
                <Pressable
                  key={album.id}
                  onPress={() => { setSelectedAlbumId(album.id); setShowAlbumSheet(false); }}
                  style={[
                    styles.sheetListItem,
                    { backgroundColor: isSelected ? theme.colors.high_color + '15' : 'transparent', borderColor: theme.colors.border },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconApp name="folder" pack="FI" size={20} color={theme.colors.gray} styles={{ marginRight: 12 }} />
                    <View>
                      <YambiText text={album.title} bold style={{ color: theme.colors.text }} />
                      <YambiText text={`${album.assetCount} photos`} size="xsmall" color="gray" />
                    </View>
                  </View>
                  {isSelected ? <IconApp name="check" pack="FI" size={18} color={theme.colors.high_color} /> : null}
                </Pressable>
              );
            })}
          </View>
        </BottomSheet>
      ) : null}

      {/* Date filter bottom sheet */}
      {showDateSheet ? (
        <BottomSheet visible={showDateSheet} onClose={() => setShowDateSheet(false)}>
          <View style={{ paddingVertical: 4, paddingHorizontal: 20 }}>
            {DATE_FILTERS.map(f => {
              const isSelected = dateFilter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => { setDateFilter(f.key); setShowDateSheet(false); }}
                  style={[
                    styles.sheetListItem,
                    { backgroundColor: isSelected ? theme.colors.high_color + '15' : 'transparent', borderColor: theme.colors.border },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconApp name="calendar" pack="FI" size={20} color={theme.colors.high_color} styles={{ marginRight: 12 }} />
                    <YambiText text={getDateFilterLabel(f.labelKey)} bold style={{ color: theme.colors.text }} />
                  </View>
                  {isSelected ? <IconApp name="check" pack="FI" size={18} color={theme.colors.high_color} /> : null}
                </Pressable>
              );
            })}
          </View>
        </BottomSheet>
      ) : null}

      {/* Floating confirmation bar */}
      {showConfirmButton && selectedAssets.length > 0 ? (
        <View
          style={[
            styles.floatingBottomBar,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border, bottom: bottomOffset },
          ]}
        >
          <View>
            <YambiText
              text={`${selectedAssets.length} ${selectedAssets.length === 1 ? strings.photo_selected : strings.photos_selected}`}
              bold
              style={{ color: theme.colors.text }}
            />
          </View>
          <ButtonNormal
            normal
            title={` (${selectedAssets.length})`}
            onPress={handleConfirm}
            iconName="check"
            iconPack="FI"
            styles={{ paddingHorizontal: 20, borderRadius: 12 }}
          />
        </View>
      ) : null}

      {/* Photo editor */}
      <PhotoEditor
        visible={isEditingMode}
        assets={selectedAssets}
        onClose={() => setIsEditingMode(false)}
        onComplete={handleEditorComplete}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  topControlToolbarWrapper: {
    borderBottomWidth: 1,
  },
  topControlToolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toolbarPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  limitedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  sheetListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
  },
  floatingBottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 100,
  },
});
