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
    pageSize = 50,
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

  // Synchronous refs to prevent stale closure bugs & re-binding onEndReached
  const isFetchingRef = useRef<boolean>(false);
  const isLoadingMoreRef = useRef<boolean>(false);
  const endCursorRef = useRef<string | undefined>(undefined);
  const hasMoreRef = useRef<boolean>(true);
  const requestIdRef = useRef<number>(0);
  const selectedAlbumIdRef = useRef<string | null>(null);
  const dateFilterRef = useRef<DateFilterType>('all');

  selectedAlbumIdRef.current = selectedAlbumId;
  dateFilterRef.current = dateFilter;

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
        fetchInitialAssets(selectedAlbumIdRef.current, dateFilterRef.current);
        loadAlbums();
      }
      return response;
    } catch (err: any) {
      console.error('Error requesting media permissions:', err);
      setError(err?.message || 'Failed to request media permissions');
      throw err;
    }
  }, []);

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

  // Fetch initial assets (first page)
  const fetchInitialAssets = useCallback(
    async (albumId: string | null, filter: DateFilterType) => {
      const currentRequestId = ++requestIdRef.current;
      isFetchingRef.current = true;
      isLoadingMoreRef.current = false;
      hasMoreRef.current = true;
      endCursorRef.current = undefined;

      setLoading(true);
      setLoadingMore(false);
      setHasMore(true);
      setEndCursor(undefined);
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

        if (currentRequestId !== requestIdRef.current) return;

        setAssets(page.assets);
        endCursorRef.current = page.endCursor;
        setEndCursor(page.endCursor);

        const canLoadMore = page.hasNextPage && page.assets.length > 0;
        hasMoreRef.current = canLoadMore;
        setHasMore(canLoadMore);
      } catch (err: any) {
        if (currentRequestId !== requestIdRef.current) return;
        console.error('Error loading photos:', err);
        setError(err?.message || 'Failed to load photos');
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    },
    [pageSize, mediaTypes]
  );

  // Present permission picker for limited access mode
  const presentPermissionsPicker = useCallback(async () => {
    try {
      if (MediaLibrary.presentPermissionsPickerAsync) {
        await MediaLibrary.presentPermissionsPickerAsync();
        await fetchInitialAssets(selectedAlbumIdRef.current, dateFilterRef.current);
        await loadAlbums();
      }
    } catch (err: any) {
      console.error('Error presenting permission picker:', err);
    }
  }, [fetchInitialAssets, loadAlbums]);

  // Set selected album ID and reload
  const setSelectedAlbumId = useCallback(
    (albumId: string | null) => {
      setSelectedAlbumIdState(albumId);
      selectedAlbumIdRef.current = albumId;
      fetchInitialAssets(albumId, dateFilterRef.current);
    },
    [fetchInitialAssets]
  );

  // Set date filter and reload
  const setDateFilter = useCallback(
    (filter: DateFilterType) => {
      setDateFilterState(filter);
      dateFilterRef.current = filter;
      fetchInitialAssets(selectedAlbumIdRef.current, filter);
    },
    [fetchInitialAssets]
  );

  // Fetch next page of assets with stable ref dependencies
  const loadMoreAssets = useCallback(async () => {
    const currentCursor = endCursorRef.current;

    if (
      isFetchingRef.current ||
      isLoadingMoreRef.current ||
      !hasMoreRef.current ||
      !currentCursor
    ) {
      return;
    }

    const currentRequestId = requestIdRef.current;
    isFetchingRef.current = true;
    isLoadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const currentAlbumId = selectedAlbumIdRef.current;
      const currentFilter = dateFilterRef.current;
      const createdAfter = getCreatedAfterTimestamp(currentFilter);

      const options: MediaLibrary.AssetsOptions = {
        first: pageSize,
        after: currentCursor,
        mediaType: mediaTypes,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      };

      if (currentAlbumId) {
        options.album = currentAlbumId;
      }
      if (createdAfter) {
        options.createdAfter = createdAfter;
      }

      const page = await MediaLibrary.getAssetsAsync(options);

      if (currentRequestId !== requestIdRef.current) return;

      // Detect cursor stagnation or empty response
      if (page.assets.length === 0 || page.endCursor === currentCursor) {
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }

      let addedAny = false;
      setAssets(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const newAssets = page.assets.filter(a => !existingIds.has(a.id));
        if (newAssets.length === 0) {
          return prev;
        }
        addedAny = true;
        return [...prev, ...newAssets];
      });

      if (!addedAny) {
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }

      endCursorRef.current = page.endCursor;
      setEndCursor(page.endCursor);

      const canLoadMore = page.hasNextPage;
      hasMoreRef.current = canLoadMore;
      setHasMore(canLoadMore);
    } catch (err: any) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error('Error loading more photos:', err);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoadingMore(false);
        isLoadingMoreRef.current = false;
        isFetchingRef.current = false;
      }
    }
  }, [pageSize, mediaTypes]);

  // Refresh assets
  const refreshAssets = useCallback(async () => {
    await fetchInitialAssets(selectedAlbumIdRef.current, dateFilterRef.current);
    await loadAlbums();
  }, [fetchInitialAssets, loadAlbums]);

  // Handle initial auto load
  useEffect(() => {
    if (!autoLoad) return;

    checkPermissions().then(res => {
      if (res && (res.granted || res.accessPrivileges === 'limited')) {
        fetchInitialAssets(selectedAlbumIdRef.current, dateFilterRef.current);
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
