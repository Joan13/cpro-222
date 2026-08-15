import { useState, useCallback, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export type DateFilterType = 'all' | 'today' | 'this_week' | 'this_month' | 'this_year';

export interface UseMediaGalleryOptions {
  pageSize?: number;
  autoLoad?: boolean;
  mediaTypes?: MediaLibrary.MediaTypeValue[];
}

export interface UseMediaGalleryReturn {
  assets: MediaLibrary.Asset[];
  albums: MediaLibrary.Album[];
  selectedAlbumId: string | null;
  setSelectedAlbumId: (albumId: string | null) => void;
  dateFilter: DateFilterType;
  setDateFilter: (filter: DateFilterType) => void;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  permissionResponse: MediaLibrary.PermissionResponse | null;
  isPermissionGranted: boolean;
  isPermissionLimited: boolean;
  isPermissionDenied: boolean;
  requestPermission: () => Promise<MediaLibrary.PermissionResponse>;
  presentPermissionsPicker: () => Promise<void>;
  openSettings: () => Promise<void>;
  loadMoreAssets: () => Promise<void>;
  refreshAssets: () => Promise<void>;
  loadAlbums: () => Promise<MediaLibrary.Album[]>;
}

function getCreatedAfterTimestamp(filter: DateFilterType): number | undefined {
  const now = new Date();
  if (filter === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  if (filter === 'this_week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(now.getFullYear(), now.getMonth(), diff).getTime();
  }
  if (filter === 'this_month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }
  if (filter === 'this_year') {
    return new Date(now.getFullYear(), 0, 1).getTime();
  }
  return undefined;
}

export function useMediaGallery(options: UseMediaGalleryOptions = {}): UseMediaGalleryReturn {
  const {
    pageSize = 30,
    autoLoad = true,
    mediaTypes = [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
  } = options;

  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumIdState] = useState<string | null>(null);
  const [dateFilter, setDateFilterState] = useState<DateFilterType>('all');

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [permissionResponse, setPermissionResponse] = useState<MediaLibrary.PermissionResponse | null>(null);

  const isFetchingRef = useRef<boolean>(false);

  // Check initial permissions
  const checkPermissions = useCallback(async () => {
    try {
      const response = await MediaLibrary.getPermissionsAsync();
      setPermissionResponse(response);
      return response;
    } catch (err: any) {
      console.error('Error fetching media permissions:', err);
      setError(err?.message || 'Failed to check media permissions');
      return null;
    }
  }, []);

  // Request permissions
  const requestPermission = useCallback(async () => {
    try {
      const response = await MediaLibrary.requestPermissionsAsync();
      setPermissionResponse(response);
      if (response.granted || response.accessPrivileges === 'limited') {
        fetchInitialAssets(selectedAlbumId, dateFilter);
        loadAlbums();
      }
      return response;
    } catch (err: any) {
      console.error('Error requesting media permissions:', err);
      setError(err?.message || 'Failed to request media permissions');
      throw err;
    }
  }, [selectedAlbumId, dateFilter]);

  // Open device settings
  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.error('Error opening settings:', err);
    }
  }, []);

  // Fetch albums / categories
  const loadAlbums = useCallback(async (): Promise<MediaLibrary.Album[]> => {
    try {
      const fetchedAlbums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
      // Sort albums with non-empty ones first
      const validAlbums = fetchedAlbums
        .filter(a => a.assetCount > 0)
        .sort((a, b) => b.assetCount - a.assetCount);
      setAlbums(validAlbums);
      return validAlbums;
    } catch (err) {
      console.error('Error loading albums:', err);
      return [];
    }
  }, []);

  // Present permission picker for limited access mode
  const presentPermissionsPicker = useCallback(async () => {
    try {
      if (MediaLibrary.presentPermissionsPickerAsync) {
        await MediaLibrary.presentPermissionsPickerAsync();
        await fetchInitialAssets(selectedAlbumId, dateFilter);
        await loadAlbums();
      }
    } catch (err: any) {
      console.error('Error presenting permission picker:', err);
    }
  }, [selectedAlbumId, dateFilter, loadAlbums]);

  // Fetch initial assets (first page)
  const fetchInitialAssets = useCallback(
    async (albumId: string | null, filter: DateFilterType) => {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const createdAfter = getCreatedAfterTimestamp(filter);
        const options: MediaLibrary.AssetsOptions = {
          first: pageSize,
          mediaType: mediaTypes,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        };

        if (albumId) {
          options.album = albumId;
        }
        if (createdAfter) {
          options.createdAfter = createdAfter;
        }

        const page = await MediaLibrary.getAssetsAsync(options);

        setAssets(page.assets);
        setEndCursor(page.endCursor);
        setHasMore(page.hasNextPage);
      } catch (err: any) {
        console.error('Error loading photos:', err);
        setError(err?.message || 'Failed to load photos');
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [pageSize, mediaTypes]
  );

  // Set selected album ID and reload
  const setSelectedAlbumId = useCallback(
    (albumId: string | null) => {
      setSelectedAlbumIdState(albumId);
      fetchInitialAssets(albumId, dateFilter);
    },
    [dateFilter, fetchInitialAssets]
  );

  // Set date filter and reload
  const setDateFilter = useCallback(
    (filter: DateFilterType) => {
      setDateFilterState(filter);
      fetchInitialAssets(selectedAlbumId, filter);
    },
    [selectedAlbumId, fetchInitialAssets]
  );

  // Fetch next page of assets
  const loadMoreAssets = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || loading || loadingMore || !endCursor) return;
    isFetchingRef.current = true;
    setLoadingMore(true);

    try {
      const createdAfter = getCreatedAfterTimestamp(dateFilter);
      const options: MediaLibrary.AssetsOptions = {
        first: pageSize,
        after: endCursor,
        mediaType: mediaTypes,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      };

      if (selectedAlbumId) {
        options.album = selectedAlbumId;
      }
      if (createdAfter) {
        options.createdAfter = createdAfter;
      }

      const page = await MediaLibrary.getAssetsAsync(options);

      setAssets(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const newAssets = page.assets.filter(a => !existingIds.has(a.id));
        return [...prev, ...newAssets];
      });

      setEndCursor(page.endCursor);
      setHasMore(page.hasNextPage);
    } catch (err: any) {
      console.error('Error loading more photos:', err);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [pageSize, endCursor, hasMore, loading, loadingMore, dateFilter, selectedAlbumId]);

  // Refresh assets
  const refreshAssets = useCallback(async () => {
    await fetchInitialAssets(selectedAlbumId, dateFilter);
    await loadAlbums();
  }, [fetchInitialAssets, selectedAlbumId, dateFilter, loadAlbums]);

  // Handle initial auto load
  useEffect(() => {
    if (!autoLoad) return;

    checkPermissions().then(res => {
      if (res && (res.granted || res.accessPrivileges === 'limited')) {
        fetchInitialAssets(selectedAlbumId, dateFilter);
        loadAlbums();
      } else {
        setLoading(false);
      }
    });
  }, [autoLoad, checkPermissions, fetchInitialAssets, loadAlbums]);

  const isPermissionGranted = permissionResponse?.granted === true;
  const isPermissionLimited = permissionResponse?.accessPrivileges === 'limited';
  const isPermissionDenied =
    !!permissionResponse &&
    !permissionResponse.granted &&
    permissionResponse.status !== MediaLibrary.PermissionStatus.UNDETERMINED;

  return {
    assets,
    albums,
    selectedAlbumId,
    setSelectedAlbumId,
    dateFilter,
    setDateFilter,
    loading,
    loadingMore,
    hasMore,
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
    loadAlbums,
  };
}
