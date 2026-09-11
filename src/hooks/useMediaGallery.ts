import { useState, useCallback, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export type DateFilterType = 'all' | 'today' | 'this_week' | 'this_month' | 'this_year';

/**
 * A slot in the gallery grid.
 * When `asset` is undefined, the slot is a placeholder/skeleton.
 * When `asset` is defined, the photo is loaded and ready to display.
 */
export type GallerySlot = {
  id: string;
  index: number;
  asset?: MediaLibrary.Asset;
};

/** Number of assets fetched per chunk in Phase 2 */
const CHUNK_SIZE = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCreatedAfterTimestamp(filter: DateFilterType): number | undefined {
  const now = new Date();
  if (filter === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  if (filter === 'this_week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseMediaGalleryOptions {
  autoLoad?: boolean;
  mediaTypes?: MediaLibrary.MediaTypeValue[];
}

export interface UseMediaGalleryReturn {
  /** Full grid slots array — placeholder or loaded asset per position */
  slots: GallerySlot[];
  /** Total number of assets matching the current filter */
  totalCount: number;
  /** Available albums */
  albums: MediaLibrary.Album[];
  selectedAlbumId: string | null;
  setSelectedAlbumId: (albumId: string | null) => void;
  dateFilter: DateFilterType;
  setDateFilter: (filter: DateFilterType) => void;
  /** True during Phase 1: fetching totalCount and creating placeholder grid */
  initializing: boolean;
  /** True while a chunk is being fetched in Phase 2 */
  loadingChunk: boolean;
  error: string | null;
  permissionResponse: MediaLibrary.PermissionResponse | null;
  isPermissionGranted: boolean;
  isPermissionLimited: boolean;
  isPermissionDenied: boolean;
  requestPermission: () => Promise<MediaLibrary.PermissionResponse>;
  presentPermissionsPicker: () => Promise<void>;
  openSettings: () => Promise<void>;
  /**
   * Called by onViewableItemsChanged with visible slot indices.
   * Triggers chunk loading for any unloaded visible area + 1 chunk prefetch ahead.
   */
  ensureChunksForIndices: (indices: number[]) => void;
  refreshGallery: () => Promise<void>;
  loadAlbums: () => Promise<MediaLibrary.Album[]>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMediaGallery(options: UseMediaGalleryOptions = {}): UseMediaGalleryReturn {
  const {
    autoLoad = true,
    mediaTypes = [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
  } = options;

  // ── Gallery state ──────────────────────────────────────────────────────────
  const [slots, setSlots] = useState<GallerySlot[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const totalCountRef = useRef(0);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [initializing, setInitializing] = useState(true);
  const [loadingChunk, setLoadingChunk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Album / filter state ───────────────────────────────────────────────────
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumIdState] = useState<string | null>(null);
  const [dateFilter, setDateFilterState] = useState<DateFilterType>('all');

  // ── Permission state ───────────────────────────────────────────────────────
  const [permissionResponse, setPermissionResponse] = useState<MediaLibrary.PermissionResponse | null>(null);

  // ── Stable refs (avoid stale closures) ────────────────────────────────────
  const selectedAlbumIdRef = useRef<string | null>(null);
  const dateFilterRef = useRef<DateFilterType>('all');
  selectedAlbumIdRef.current = selectedAlbumId;
  dateFilterRef.current = dateFilter;

  // ── Chunk loading refs ─────────────────────────────────────────────────────
  /**
   * The last chunk index that has been fully loaded (high-watermark model).
   * Chunk N is indices [N*CHUNK_SIZE, (N+1)*CHUNK_SIZE - 1].
   * -1 means nothing loaded yet.
   */
  const highWatermarkRef = useRef(-1);
  /**
   * The highest chunk we want to reach.
   * Updated by ensureChunksForIndices; picked up by the running loop.
   */
  const desiredWatermarkRef = useRef(-1);
  /**
   * endCursor returned after loading chunk N.
   * Used as the `after` cursor when fetching chunk N+1.
   */
  const chunkCursors = useRef<Map<number, string>>(new Map());
  /**
   * Guard: true while the load loop is executing.
   * Reset by initGallery so the new loop can start cleanly.
   */
  const isLoadingChunkRef = useRef(false);
  /**
   * Monotonically increasing ID for the current load loop.
   * Incremented by initGallery to invalidate any running loop.
   */
  const loopIdRef = useRef(0);
  /**
   * Monotonically increasing ID for the current gallery session.
   * Incremented by initGallery to detect stale async responses.
   */
  const requestIdRef = useRef(0);

  // ── Permission helpers ─────────────────────────────────────────────────────

  const checkPermissions = useCallback(async () => {
    try {
      const response = await MediaLibrary.getPermissionsAsync();
      setPermissionResponse(response);
      return response;
    } catch (err: any) {
      console.error('[MediaGallery] Error fetching permissions:', err);
      setError(err?.message || 'Failed to check media permissions');
      return null;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const response = await MediaLibrary.requestPermissionsAsync();
      setPermissionResponse(response);
      if (response.granted || response.accessPrivileges === 'limited') {
        // initGallery and loadAlbums are referenced after their declarations, which is fine in closures
        // They will be available when this callback actually executes
      }
      return response;
    } catch (err: any) {
      console.error('[MediaGallery] Error requesting permissions:', err);
      setError(err?.message || 'Failed to request media permissions');
      throw err;
    }
  }, []);

  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.error('[MediaGallery] Error opening settings:', err);
    }
  }, []);

  const loadAlbums = useCallback(async (): Promise<MediaLibrary.Album[]> => {
    try {
      const fetched = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false });
      const valid = fetched
        .filter(a => a.assetCount > 0)
        .sort((a, b) => b.assetCount - a.assetCount);
      setAlbums(valid);
      return valid;
    } catch (err) {
      console.error('[MediaGallery] Error loading albums:', err);
      return [];
    }
  }, []);

  // ── Phase 2: Sequential chunk loader ──────────────────────────────────────

  /**
   * Loads chunks sequentially from (highWatermark + 1) up to targetChunkIndex.
   * Uses cursor chaining: each chunk's endCursor becomes the `after` for the next chunk.
   * Safe for concurrent calls: later calls update desiredWatermarkRef and are picked up
   * by the running loop without starting a new loop.
   */
  const loadNextChunksUpTo = useCallback(async (targetChunkIndex: number) => {
    // Update desired target (other callers may raise it further while we're loading)
    if (targetChunkIndex > desiredWatermarkRef.current) {
      desiredWatermarkRef.current = targetChunkIndex;
    }

    // Only one loop runs at a time; the while-condition below will keep it going
    // as long as desiredWatermarkRef is ahead of highWatermarkRef.
    if (isLoadingChunkRef.current) return;

    const myLoopId = ++loopIdRef.current;
    isLoadingChunkRef.current = true;
    setLoadingChunk(true);

    while (highWatermarkRef.current < desiredWatermarkRef.current) {
      // Check if a gallery reset happened (initGallery increments loopIdRef)
      if (myLoopId !== loopIdRef.current) break;

      const nextChunk = highWatermarkRef.current + 1;

      // Retrieve cursor from the previous chunk (undefined only for chunk 0)
      const after = nextChunk === 0
        ? undefined
        : chunkCursors.current.get(nextChunk - 1);

      if (nextChunk > 0 && after === undefined) {
        // Cursor missing — shouldn't happen in sequential load, but guard anyway
        console.warn(`[MediaGallery] Missing cursor for chunk ${nextChunk - 1}`);
        break;
      }

      const currentRequestId = requestIdRef.current;

      try {
        const albumId = selectedAlbumIdRef.current;
        const filter = dateFilterRef.current;
        const createdAfter = getCreatedAfterTimestamp(filter);

        const opts: MediaLibrary.AssetsOptions = {
          first: CHUNK_SIZE,
          mediaType: mediaTypes,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        };
        if (after !== undefined) opts.after = after;
        if (albumId) opts.album = albumId;
        if (createdAfter) opts.createdAfter = createdAfter;

        const page = await MediaLibrary.getAssetsAsync(opts);

        // Stale-response guard
        if (myLoopId !== loopIdRef.current) break;
        if (currentRequestId !== requestIdRef.current) break;

        if (page.assets.length === 0) {
          // No more assets from the API — stop
          break;
        }

        // Store endCursor so the next chunk can use it as `after`
        if (page.endCursor) {
          chunkCursors.current.set(nextChunk, page.endCursor);
        }

        highWatermarkRef.current = nextChunk;

        // Fill the corresponding slots with real asset data
        const offset = nextChunk * CHUNK_SIZE;
        setSlots(prev => {
          const next = [...prev];
          page.assets.forEach((asset, j) => {
            const idx = offset + j;
            if (idx < next.length) {
              next[idx] = { id: asset.id, index: idx, asset };
            }
          });
          return next;
        });

      } catch (err: any) {
        console.error(`[MediaGallery] Error loading chunk ${nextChunk}:`, err);
        break;
      }
    }

    // Only this loop clears the guard; a reset loop must not interfere
    if (myLoopId === loopIdRef.current) {
      isLoadingChunkRef.current = false;
      setLoadingChunk(false);

      // If a new target arrived while we were loading, continue
      if (highWatermarkRef.current < desiredWatermarkRef.current) {
        loadNextChunksUpTo(desiredWatermarkRef.current);
      }
    }
  }, [mediaTypes]);

  /**
   * Called by LegendList's onViewableItemsChanged with the currently visible slot indices.
   * Ensures all visible chunks and the next prefetch chunk are loaded.
   */
  const ensureChunksForIndices = useCallback((indices: number[]) => {
    if (indices.length === 0 || totalCountRef.current === 0) return;

    const maxIndex = Math.max(...indices);
    const maxChunkNeeded = Math.floor(maxIndex / CHUNK_SIZE);
    // Prefetch 1 chunk ahead for smooth scrolling
    const maxChunk = Math.floor((totalCountRef.current - 1) / CHUNK_SIZE);
    const targetChunk = Math.min(maxChunkNeeded + 1, maxChunk);

    if (targetChunk > highWatermarkRef.current) {
      loadNextChunksUpTo(targetChunk);
    }
  }, [loadNextChunksUpTo]);

  // ── Phase 1: Gallery initializer ──────────────────────────────────────────

  /**
   * Phase 1: Fetches totalCount with a minimal API call and creates placeholder slots
   * for the entire gallery grid. Phase 2 (chunk loading) starts automatically for
   * the first two chunks once the grid is rendered.
   */
  const initGallery = useCallback(async (albumId: string | null, filter: DateFilterType) => {
    // Invalidate any running chunk loop and stale API responses
    const currentRequestId = ++requestIdRef.current;
    ++loopIdRef.current; // stops any running loadNextChunksUpTo loop
    isLoadingChunkRef.current = false; // allow new loop to start
    highWatermarkRef.current = -1;
    desiredWatermarkRef.current = -1;
    chunkCursors.current = new Map();
    totalCountRef.current = 0;

    setInitializing(true);
    setLoadingChunk(false);
    setSlots([]);
    setTotalCount(0);
    setError(null);

    try {
      const createdAfter = getCreatedAfterTimestamp(filter);

      // Minimal call — we only need totalCount, not the actual asset data yet
      const opts: MediaLibrary.AssetsOptions = {
        first: 1,
        mediaType: mediaTypes,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      };
      if (albumId) opts.album = albumId;
      if (createdAfter) opts.createdAfter = createdAfter;

      const result = await MediaLibrary.getAssetsAsync(opts);

      if (currentRequestId !== requestIdRef.current) return; // stale

      const total = result.totalCount;
      totalCountRef.current = total;
      setTotalCount(total);

      // Build the full placeholder grid immediately
      const placeholderSlots: GallerySlot[] = Array.from({ length: total }, (_, i) => ({
        id: `slot-${i}`,
        index: i,
      }));
      setSlots(placeholderSlots);
      setInitializing(false);

      if (currentRequestId !== requestIdRef.current) return; // stale

      // Phase 2 kickoff: prefetch first 2 chunks immediately
      if (total > 0) {
        const prefetchUpTo = total > CHUNK_SIZE ? 1 : 0;
        loadNextChunksUpTo(prefetchUpTo);
      }
    } catch (err: any) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error('[MediaGallery] Init failed:', err);
      setError(err?.message || 'Failed to initialize gallery');
      setInitializing(false);
    }
  }, [mediaTypes, loadNextChunksUpTo]);

  // ── Filter / album setters ─────────────────────────────────────────────────

  const setSelectedAlbumId = useCallback((albumId: string | null) => {
    setSelectedAlbumIdState(albumId);
    selectedAlbumIdRef.current = albumId;
    initGallery(albumId, dateFilterRef.current);
  }, [initGallery]);

  const setDateFilter = useCallback((filter: DateFilterType) => {
    setDateFilterState(filter);
    dateFilterRef.current = filter;
    initGallery(selectedAlbumIdRef.current, filter);
  }, [initGallery]);

  const refreshGallery = useCallback(async () => {
    await initGallery(selectedAlbumIdRef.current, dateFilterRef.current);
    await loadAlbums();
  }, [initGallery, loadAlbums]);

  const presentPermissionsPicker = useCallback(async () => {
    try {
      if (MediaLibrary.presentPermissionsPickerAsync) {
        await MediaLibrary.presentPermissionsPickerAsync();
        await initGallery(selectedAlbumIdRef.current, dateFilterRef.current);
        await loadAlbums();
      }
    } catch (err: any) {
      console.error('[MediaGallery] Error presenting permission picker:', err);
    }
  }, [initGallery, loadAlbums]);

  // ── Auto-load on mount ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!autoLoad) return;

    checkPermissions().then(res => {
      if (res && (res.granted || res.accessPrivileges === 'limited')) {
        initGallery(selectedAlbumIdRef.current, dateFilterRef.current);
        loadAlbums();
      } else {
        setInitializing(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

  // Separate effect: when requestPermission is called and grants access, init
  // This is handled inside requestPermission callback via the closure.

  // ── Computed values ────────────────────────────────────────────────────────

  const isPermissionGranted = permissionResponse?.granted === true;
  const isPermissionLimited = permissionResponse?.accessPrivileges === 'limited';
  const isPermissionDenied =
    !!permissionResponse &&
    !permissionResponse.granted &&
    permissionResponse.status !== MediaLibrary.PermissionStatus.UNDETERMINED;

  return {
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
    loadAlbums,
  };
}
