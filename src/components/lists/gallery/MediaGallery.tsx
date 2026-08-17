import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import * as MediaLibrary from 'expo-media-library';
import { useAppSelector } from '../../../store/app/hooks';
import { useMediaGallery, DateFilterType } from '../../../hooks/useMediaGallery';
import { GalleryItem } from './GalleryItem';
import { YambiText, TextNormalYambiGray } from '../../app/Text';
import ButtonNormal from '../../app/ButtonNormal';
import { IconApp } from '../../app/IconApp';
import BottomSheet from '../../app/BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { strings } from '../../../lang/lang';
import { ProcessedPhoto } from '../../../types/gallery';
import { PhotoEditor } from './PhotoEditor';


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
  pageSize?: number;
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
  pageSize = 30,
  mediaTypes = [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
  enableEditing = false,
}) => {
  const theme = useAppSelector(state => state.app_theme);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  // Dynamic responsive columns based on screen width
  const numColumns = useMemo(() => {
    if (width >= 900) return 6;
    if (width >= 600) return 5;
    if (width >= 400) return 4;
    return 3;
  }, [width]);

  // Precise layout math for full screen width with 2px gap between photos:
  const itemMargin = 1; // 1px on each side = 2px gap between pictures
  const totalMarginPerRow = itemMargin * 2 * numColumns;
  const itemSize = Math.floor((width - totalMarginPerRow) / numColumns);
  const sidePadding = Math.max(0, Math.floor((width - (itemSize * numColumns + totalMarginPerRow)) / 2));

  const [showAlbumSheet, setShowAlbumSheet] = useState<boolean>(false);
  const [showDateSheet, setShowDateSheet] = useState<boolean>(false);

  const {
    assets,
    albums,
    selectedAlbumId,
    setSelectedAlbumId,
    dateFilter,
    setDateFilter,
    loading,
    loadingMore,
    error,
    permissionResponse,
    isPermissionGranted,
    isPermissionLimited,
    isPermissionDenied,
    requestPermission,
    presentPermissionsPicker,
    openSettings,
    loadMoreAssets,
    refreshAssets,
  } = useMediaGallery({ pageSize, mediaTypes });

  // Selection state
  const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>(initialSelection);

  useEffect(() => {
    if (initialSelection && initialSelection.length > 0) {
      setSelectedAssets(initialSelection);
    }
  }, [initialSelection]);

  // Lookup map for selection status & order index
  const selectedMap = useMemo(() => {
    const map = new Map<string, number>();
    selectedAssets.forEach((asset, index) => {
      map.set(asset.id, index + 1);
    });
    return map;
  }, [selectedAssets]);

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
            if (maxSelection && prev.length >= maxSelection) {
              return prev;
            }
            next = [...prev, asset];
          }
        }

        if (onSelectAssets) {
          onSelectAssets(next);
        }
        return next;
      });
    },
    [multiple, maxSelection, onSelectAssets]
  );

  // Select all currently loaded pictures
  const handleSelectAllToggle = useCallback(() => {
    if (assets.length === 0) return;

    const allSelected = assets.every(a => selectedMap.has(a.id));

    if (allSelected) {
      const visibleIds = new Set(assets.map(a => a.id));
      const next = selectedAssets.filter(a => !visibleIds.has(a.id));
      setSelectedAssets(next);
      if (onSelectAssets) onSelectAssets(next);
    } else {
      let nextSelected = [...selectedAssets];
      const existingIds = new Set(nextSelected.map(a => a.id));

      for (const asset of assets) {
        if (!existingIds.has(asset.id)) {
          if (maxSelection && nextSelected.length >= maxSelection) break;
          nextSelected.push(asset);
        }
      }

      setSelectedAssets(nextSelected);
      if (onSelectAssets) onSelectAssets(nextSelected);
    }
  }, [assets, selectedMap, selectedAssets, maxSelection, onSelectAssets]);

  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);

  const handleEditorComplete = useCallback(
    (processedPhotos: ProcessedPhoto[]) => {
      setIsEditingMode(false);
      if (onComplete) {
        onComplete(processedPhotos);
      }
      if (onConfirm) {
        onConfirm(processedPhotos);
      }
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

      if (onComplete) {
        onComplete(processed);
      }
      if (onConfirm) {
        onConfirm(selectedAssets);
      }
    }
  }, [enableEditing, selectedAssets, onConfirm, onComplete]);

  const selectedAlbumObj = useMemo(() => {
    if (!selectedAlbumId) return null;
    return albums.find(a => a.id === selectedAlbumId) || null;
  }, [albums, selectedAlbumId]);

  const selectedDateFilterObj = useMemo(() => {
    return DATE_FILTERS.find(f => f.key === dateFilter) || DATE_FILTERS[0];
  }, [dateFilter]);

  const getDateFilterLabel = useCallback((labelKey: string) => {
    return (strings as any)[labelKey] || labelKey;
  }, []);

  const isAllVisibleSelected = useMemo(() => {
    if (assets.length === 0) return false;
    return assets.every(a => selectedMap.has(a.id));
  }, [assets, selectedMap]);

  const keyExtractor = useCallback((item: MediaLibrary.Asset) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: MediaLibrary.Asset }) => {
      const selectionIndex = selectedMap.get(item.id);
      const isSelected = selectionIndex !== undefined;

      return (
        <GalleryItem
          asset={item}
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
    [selectedMap, itemSize, multiple, handleToggleSelect, theme]
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.high_color} />
      </View>
    );
  }, [loadingMore, theme.colors.high_color]);

  // Initial Permission Loading State
  if (permissionResponse === null || (loading && assets.length === 0 && !error)) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.high_color} />
        <YambiText
          text={strings.loading_photos}
          style={{ marginTop: 12, color: theme.colors.gray }}
        />
      </View>
    );
  }

  // Permission Denied View
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
          <ButtonNormal
            normal
            title={strings.request_permission}
            onPress={requestPermission}
            iconName="shield"
            iconPack="FI"
          />
          <ButtonNormal
            outline
            title={strings.open_settings}
            onPress={openSettings}
            iconName="settings"
            iconPack="FI"
          />
        </View>
      </View>
    );
  }

  // Error state
  if (error && assets.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background, padding: 24 }]}>
        <IconApp name="alert-circle" pack="FI" size={48} color={theme.colors.error} />
        <YambiText
          text={strings.error_loading_photos}
          bold
          style={{ marginTop: 12, color: theme.colors.text }}
        />
        <TextNormalYambiGray text={error} styles={{ textAlign: 'center', marginTop: 4, marginBottom: 16 }} />
        <ButtonNormal outline title={strings.retry} onPress={refreshAssets} iconName="refresh-cw" iconPack="FI" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Control Toolbar Horizontal ScrollView */}
      <View style={[styles.topControlToolbarWrapper, { borderColor: theme.colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topControlToolbarContent}
        >
          {/* Album Category Dropdown Trigger */}
          <Pressable
            onPress={() => setShowAlbumSheet(true)}
            style={[
              styles.toolbarPillButton,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
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

          {/* Date Filter Trigger */}
          <Pressable
            onPress={() => setShowDateSheet(true)}
            style={[
              styles.toolbarPillButton,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
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

          {/* Select All Toggle Button */}
          {showSelectAll && multiple && assets.length > 0 ? (
            <Pressable
              onPress={handleSelectAllToggle}
              style={[
                styles.toolbarPillButton,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <IconApp
                name={isAllVisibleSelected ? 'checkmark-circle' : 'square-outline'}
                pack="IO"
                size={16}
                color={
                  isAllVisibleSelected
                    ? theme.colors.high_color
                    : theme.colors.gray
                }
                styles={{ marginRight: 6 }}
              />
              <YambiText
                text={strings.select_all}
                bold
                size="small"
                style={{
                  color: theme.colors.text,
                }}
              />
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      {/* Limited Access Banner */}
      {isPermissionLimited ? (
        <Pressable
          onPress={presentPermissionsPicker}
          style={[
            styles.limitedBanner,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <IconApp name="info" pack="FI" size={18} color={theme.colors.high_color} styles={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <YambiText
                text={strings.limited_photo_access}
                bold
                size="small"
                style={{ color: theme.colors.text }}
              />
              <YambiText
                text={strings.tap_to_manage_photos}
                size="xsmall"
                color="gray"
              />
            </View>
          </View>
          <IconApp name="chevron-right" pack="FI" size={16} color={theme.colors.gray} />
        </Pressable>
      ) : null}

      {/* Photos Grid or Empty State */}
      {assets.length === 0 ? (
        <View style={styles.centerContainer}>
          <IconApp name="image" pack="FI" size={44} color={theme.colors.gray} />
          <YambiText
            text={strings.no_photos_found}
            bold
            style={{ marginTop: 12, color: theme.colors.gray }}
          />
          <ButtonNormal
            ghost
            title={strings.refresh}
            onPress={refreshAssets}
            iconName="refresh-cw"
            iconPack="FI"
            styles={{ marginTop: 12 }}
          />
        </View>
      ) : (
        <FlashList
          key={`grid-${numColumns}`}
          data={assets}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          estimatedItemSize={itemSize}
          onEndReached={loadMoreAssets}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{
            paddingHorizontal: sidePadding,
            paddingTop: 6,
            paddingBottom: showConfirmButton ? bottomOffset + 70 : 20,
          }}
        />
      )}

      {/* Album Category Selection Bottom Sheet */}
      <BottomSheet
        visible={showAlbumSheet}
        onClose={() => setShowAlbumSheet(false)}
        title={strings.select_category_album}
      >
        <ScrollView style={{ maxHeight: 350 }}>
          {/* Option for All Photos */}
          <Pressable
            onPress={() => {
              setSelectedAlbumId(null);
              setShowAlbumSheet(false);
            }}
            style={[
              styles.sheetListItem,
              {
                backgroundColor:
                  selectedAlbumId === null ? theme.colors.high_color + '15' : 'transparent',
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconApp name="grid" pack="FI" size={20} color={theme.colors.high_color} styles={{ marginRight: 12 }} />
              <YambiText text={strings.all_photos} bold style={{ color: theme.colors.text }} />
            </View>
            {selectedAlbumId === null ? (
              <IconApp name="check" pack="FI" size={18} color={theme.colors.high_color} />
            ) : null}
          </Pressable>

          {/* List of device albums */}
          {albums.map(album => {
            const isSelected = selectedAlbumId === album.id;
            return (
              <Pressable
                key={album.id}
                onPress={() => {
                  setSelectedAlbumId(album.id);
                  setShowAlbumSheet(false);
                }}
                style={[
                  styles.sheetListItem,
                  {
                    backgroundColor: isSelected ? theme.colors.high_color + '15' : 'transparent',
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconApp name="folder" pack="FI" size={20} color={theme.colors.gray} styles={{ marginRight: 12 }} />
                  <View>
                    <YambiText text={album.title} bold style={{ color: theme.colors.text }} />
                    <YambiText text={`${album.assetCount} photos`} size="xsmall" color="gray" />
                  </View>
                </View>
                {isSelected ? (
                  <IconApp name="check" pack="FI" size={18} color={theme.colors.high_color} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>

      {/* Date Filter Selection Bottom Sheet */}
      <BottomSheet
        visible={showDateSheet}
        onClose={() => setShowDateSheet(false)}
        title={strings.filter_by_date}
      >
        <View style={{ paddingVertical: 4 }}>
          {DATE_FILTERS.map(f => {
            const isSelected = dateFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  setDateFilter(f.key);
                  setShowDateSheet(false);
                }}
                style={[
                  styles.sheetListItem,
                  {
                    backgroundColor: isSelected ? theme.colors.high_color + '15' : 'transparent',
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconApp name="calendar" pack="FI" size={20} color={theme.colors.high_color} styles={{ marginRight: 12 }} />
                  <YambiText text={getDateFilterLabel(f.labelKey)} bold style={{ color: theme.colors.text }} />
                </View>
                {isSelected ? (
                  <IconApp name="check" pack="FI" size={18} color={theme.colors.high_color} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>

      {/* Floating Action / Confirmation Area over the photos */}
      {showConfirmButton && selectedAssets.length > 0 ? (
        <View
          style={[
            styles.floatingBottomBar,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              bottom: bottomOffset
            },
          ]}
        >
          <View>
            <YambiText
              text={`${selectedAssets.length} ${selectedAssets.length === 1 ? strings.photo_selected : strings.photos_selected
                }`}
              bold
              style={{ color: theme.colors.text }}
            />
          </View>

          <ButtonNormal
            normal
            // title={`${strings.confirm} (${selectedAssets.length})`}
            title={` (${selectedAssets.length})`}
            onPress={handleConfirm}
            iconName="check"
            iconPack="FI"
            styles={{ paddingHorizontal: 20, borderRadius: 12 }}
          />
        </View>
      ) : null}

      {/* Photo Editor Step Modal */}
      <PhotoEditor
        visible={isEditingMode}
        assets={selectedAssets}
        onClose={() => setIsEditingMode(false)}
        onComplete={handleEditorComplete}
      />
    </View>
  );
};

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
    bottom: 20,
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
