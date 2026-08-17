import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  PanResponder,
  BackHandler,
} from 'react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { manipulateAsync, SaveFormat, FlipType, Action } from 'expo-image-manipulator';
import { FlashList } from '@shopify/flash-list';
import {
  Canvas,
  Image as SkiaImage,
  ColorMatrix,
  useImage,
  Skia,
  ImageFormat,
  Blur,
  RadialGradient,
  LinearGradient,
  Rect,
  Paint,
  Group,
  vec,
  BlendMode,
  TileMode,
} from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../../../store/app/hooks';
import {
  ProcessedPhoto,
  ItemTransformState,
  ImageAdjustments,
  AdvancedEffectsState,
  DuotonePresetId,
  LightLeakPosition,
} from '../../../types/gallery';
import {
  FILTER_PRESETS,
  DEFAULT_ADJUSTMENTS,
  buildCombinedColorMatrix,
} from '../../../utils/filterPresets';
import {
  DEFAULT_ADVANCED_EFFECTS,
  DUOTONE_PRESETS,
  buildDuotoneColorMatrix,
  applyFadeToColorMatrix,
} from '../../../utils/advancedEffects';
import { YambiText } from '../../app/Text';
import ButtonNormal from '../../app/ButtonNormal';
import { IconApp } from '../../app/IconApp';
import AppSlider from '../../app/Slider';
import { strings } from '../../../lang/lang';

export interface PhotoEditorProps {
  assets: MediaLibrary.Asset[];
  visible: boolean;
  onClose: () => void;
  onComplete: (processedPhotos: ProcessedPhoto[]) => void;
}

const DEFAULT_TRANSFORM: ItemTransformState = {
  cropX: 0.05,
  cropY: 0.05,
  cropW: 0.9,
  cropH: 0.9,
  rotation: 0,
  flipH: false,
  flipV: false,
  filterId: 'original',
  filterIntensity: 100,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  effects: { ...DEFAULT_ADVANCED_EFFECTS },
};

type ActiveTab = 'crop' | 'filters' | 'adjust' | 'effects';
type ActiveEffectSubTab =
  | 'vignette'
  | 'grain'
  | 'blur'
  | 'glow'
  | 'fade'
  | 'duotone'
  | 'light_leak'
  | 'overlay';

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  assets,
  visible,
  onClose,
  onComplete,
}) => {
  const theme = useAppSelector(state => state.app_theme);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('crop');
  const [activeEffectSubTab, setActiveEffectSubTab] =
    useState<ActiveEffectSubTab>('vignette');
  const [processing, setProcessing] = useState<boolean>(false);
  const flashListRef = useRef<any>(null);
  const isScrollingProgrammaticallyRef = useRef<boolean>(false);

  // Hardware Back Button intercepts press and ONLY closes PhotoEditor modal
  useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      onClose();
      return true; // Prevents bubbling to parent navigation/screen pop
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [visible, onClose]);

  // Store per-asset editing state
  const [transformsMap, setTransformsMap] = useState<
    Record<string, ItemTransformState>
  >({});

  const currentAsset = useMemo(
    () => assets[currentIndex] || null,
    [assets, currentIndex]
  );

  const currentTransform = useMemo<ItemTransformState>(() => {
    if (!currentAsset) return DEFAULT_TRANSFORM;
    return transformsMap[currentAsset.id] || DEFAULT_TRANSFORM;
  }, [currentAsset, transformsMap]);

  // Skia real-time image loader
  const skiaImage = useImage((currentAsset as any)?.localUri || currentAsset?.uri || null);

  // Maximum bounding box available for previewing image
  const maxCanvasW = screenWidth - 32;
  const maxCanvasH = Math.min(screenHeight * 0.44, 400);

  // Compute exact displayed image dimensions based on original or rotated asset aspect ratio
  const { displayedW, displayedH } = useMemo(() => {
    if (!currentAsset) return { displayedW: maxCanvasW, displayedH: maxCanvasH };

    const rawW = currentAsset.width || 1000;
    const rawH = currentAsset.height || 1000;

    const isRotated90 = currentTransform.rotation % 180 !== 0;
    const effectiveW = isRotated90 ? rawH : rawW;
    const effectiveH = isRotated90 ? rawW : rawH;

    const imageRatio = effectiveW / effectiveH;
    const containerRatio = maxCanvasW / maxCanvasH;

    let dW = maxCanvasW;
    let dH = maxCanvasH;

    if (imageRatio > containerRatio) {
      dW = maxCanvasW;
      dH = maxCanvasW / imageRatio;
    } else {
      dH = maxCanvasH;
      dW = maxCanvasH * imageRatio;
    }

    return { displayedW: Math.max(120, dW), displayedH: Math.max(120, dH) };
  }, [currentAsset, currentTransform.rotation, maxCanvasW, maxCanvasH]);

  // Combined 20-element ColorMatrix for Skia GPU Preview (Preset + Intensity + Adjustments + Fade + Duotone)
  const combinedMatrix = useMemo(() => {
    let m = buildCombinedColorMatrix(
      currentTransform.filterId,
      currentTransform.filterIntensity,
      currentTransform.adjustments
    );

    // Apply Fade
    if (currentTransform.effects.fadeAmount > 0) {
      m = applyFadeToColorMatrix(m, currentTransform.effects.fadeAmount);
    }

    // Apply Duotone if enabled
    if (currentTransform.effects.duotonePreset !== 'none') {
      const duotoneM = buildDuotoneColorMatrix(
        currentTransform.effects.duotonePreset
      );
      // Multiply color matrix
      const res = new Array(20).fill(0);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          let sum = 0;
          for (let k = 0; k < 4; k++) {
            sum += duotoneM[r * 5 + k] * m[k * 5 + c];
          }
          if (c === 4) sum += duotoneM[r * 5 + 4];
          res[r * 5 + c] = sum;
        }
      }
      m = res;
    }

    return m;
  }, [
    currentTransform.filterId,
    currentTransform.filterIntensity,
    currentTransform.adjustments,
    currentTransform.effects.fadeAmount,
    currentTransform.effects.duotonePreset,
  ]);

  // Refs for zero-lag native UI updates (60-120 FPS performance)
  const cropXRef = useRef(currentTransform.cropX);
  const cropYRef = useRef(currentTransform.cropY);
  const cropWRef = useRef(currentTransform.cropW);
  const cropHRef = useRef(currentTransform.cropH);

  const displayedWRef = useRef(displayedW);
  const displayedHRef = useRef(displayedH);

  displayedWRef.current = displayedW;
  displayedHRef.current = displayedH;

  // Native View refs for direct setNativeProps without React re-renders
  const cropBoxRef = useRef<View>(null);
  const topMaskRef = useRef<View>(null);
  const bottomMaskRef = useRef<View>(null);
  const leftMaskRef = useRef<View>(null);
  const rightMaskRef = useRef<View>(null);

  // Sync refs and native views when current asset/transform changes
  const applyNativeCropUI = useCallback(
    (x: number, y: number, w: number, h: number) => {
      cropXRef.current = x;
      cropYRef.current = y;
      cropWRef.current = w;
      cropHRef.current = h;

      cropBoxRef.current?.setNativeProps({
        style: {
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          width: `${w * 100}%`,
          height: `${h * 100}%`,
        },
      });

      topMaskRef.current?.setNativeProps({
        style: { height: `${y * 100}%` },
      });

      bottomMaskRef.current?.setNativeProps({
        style: { top: `${(y + h) * 100}%` },
      });

      leftMaskRef.current?.setNativeProps({
        style: { top: `${y * 100}%`, height: `${h * 100}%`, width: `${x * 100}%` },
      });

      rightMaskRef.current?.setNativeProps({
        style: {
          top: `${y * 100}%`,
          height: `${h * 100}%`,
          left: `${(x + w) * 100}%`,
        },
      });
    },
    []
  );

  useEffect(() => {
    applyNativeCropUI(
      currentTransform.cropX,
      currentTransform.cropY,
      currentTransform.cropW,
      currentTransform.cropH
    );
  }, [currentTransform, applyNativeCropUI]);

  const saveCurrentCropState = useCallback(() => {
    if (!currentAsset) return;
    setTransformsMap(prev => {
      const existing = prev[currentAsset.id] || DEFAULT_TRANSFORM;
      return {
        ...prev,
        [currentAsset.id]: {
          ...existing,
          cropX: cropXRef.current,
          cropY: cropYRef.current,
          cropW: cropWRef.current,
          cropH: cropHRef.current,
        },
      };
    });
  }, [currentAsset]);

  const updateCurrentTransform = useCallback(
    (updater: (prev: ItemTransformState) => ItemTransformState) => {
      if (!currentAsset) return;
      setTransformsMap(prev => {
        const existing = prev[currentAsset.id] || DEFAULT_TRANSFORM;
        const next = updater(existing);
        cropXRef.current = next.cropX;
        cropYRef.current = next.cropY;
        cropWRef.current = next.cropW;
        cropHRef.current = next.cropH;
        return {
          ...prev,
          [currentAsset.id]: next,
        };
      });
    },
    [currentAsset]
  );

  // Persistent gesture start state
  const gestureStateRef = useRef({ startX: 0, startY: 0, startW: 0, startH: 0 });

  // Stable PanResponders created ONCE to prevent mid-gesture destruction
  const makeResponder = useCallback(
    (type: 'move' | 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r') => {
      const minW = 0.15;
      const minH = 0.15;

      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          gestureStateRef.current = {
            startX: cropXRef.current,
            startY: cropYRef.current,
            startW: cropWRef.current,
            startH: cropHRef.current,
          };
        },
        onPanResponderMove: (evt, gestureState) => {
          const dW = displayedWRef.current || 300;
          const dH = displayedHRef.current || 300;
          const dx = gestureState.dx / dW;
          const dy = gestureState.dy / dH;

          const { startX, startY, startW, startH } = gestureStateRef.current;

          let newX = cropXRef.current;
          let newY = cropYRef.current;
          let newW = cropWRef.current;
          let newH = cropHRef.current;

          if (type === 'move') {
            newX = Math.max(0, Math.min(1 - startW, startX + dx));
            newY = Math.max(0, Math.min(1 - startH, startY + dy));
            newW = startW;
            newH = startH;
          } else if (type === 'tl') {
            const rawX = Math.max(0, Math.min(startX + startW - minW, startX + dx));
            newW = startW + (startX - rawX);
            newX = rawX;
            const rawY = Math.max(0, Math.min(startY + startH - minH, startY + dy));
            newH = startH + (startY - rawY);
            newY = rawY;
          } else if (type === 'tr') {
            newW = Math.max(minW, Math.min(1 - startX, startW + dx));
            newX = startX;
            const rawY = Math.max(0, Math.min(startY + startH - minH, startY + dy));
            newH = startH + (startY - rawY);
            newY = rawY;
          } else if (type === 'bl') {
            const rawX = Math.max(0, Math.min(startX + startW - minW, startX + dx));
            newW = startW + (startX - rawX);
            newX = rawX;
            newH = Math.max(minH, Math.min(1 - startY, startH + dy));
            newY = startY;
          } else if (type === 'br') {
            newW = Math.max(minW, Math.min(1 - startX, startW + dx));
            newH = Math.max(minH, Math.min(1 - startY, startH + dy));
            newX = startX;
            newY = startY;
          } else if (type === 't') {
            const rawY = Math.max(0, Math.min(startY + startH - minH, startY + dy));
            newH = startH + (startY - rawY);
            newY = rawY;
            newX = startX;
            newW = startW;
          } else if (type === 'b') {
            newH = Math.max(minH, Math.min(1 - startY, startH + dy));
            newY = startY;
            newX = startX;
            newW = startW;
          } else if (type === 'l') {
            const rawX = Math.max(0, Math.min(startX + startW - minW, startX + dx));
            newW = startW + (startX - rawX);
            newX = rawX;
            newY = startY;
            newH = startH;
          } else if (type === 'r') {
            newW = Math.max(minW, Math.min(1 - startX, startW + dx));
            newX = startX;
            newY = startY;
            newH = startH;
          }

          applyNativeCropUI(newX, newY, newW, newH);
        },
        onPanResponderRelease: () => {
          saveCurrentCropState();
        },
        onPanResponderTerminate: () => {
          saveCurrentCropState();
        },
      });
    },
    [applyNativeCropUI, saveCurrentCropState]
  );

  const moveResponder = useRef(makeResponder('move')).current;
  const tlResponder = useRef(makeResponder('tl')).current;
  const trResponder = useRef(makeResponder('tr')).current;
  const blResponder = useRef(makeResponder('bl')).current;
  const brResponder = useRef(makeResponder('br')).current;
  const tResponder = useRef(makeResponder('t')).current;
  const bResponder = useRef(makeResponder('b')).current;
  const lResponder = useRef(makeResponder('l')).current;
  const rResponder = useRef(makeResponder('r')).current;

  // Rotate left/right
  const handleRotate = useCallback(
    (degrees: number) => {
      updateCurrentTransform(prev => ({
        ...prev,
        rotation: (prev.rotation + degrees + 360) % 360,
      }));
    },
    [updateCurrentTransform]
  );

  // Flip horizontal
  const handleFlipH = useCallback(() => {
    updateCurrentTransform(prev => ({
      ...prev,
      flipH: !prev.flipH,
    }));
  }, [updateCurrentTransform]);

  // Flip vertical
  const handleFlipV = useCallback(() => {
    updateCurrentTransform(prev => ({
      ...prev,
      flipV: !prev.flipV,
    }));
  }, [updateCurrentTransform]);

  // Filter selection
  const handleSelectFilter = useCallback(
    (filterId: string) => {
      updateCurrentTransform(prev => ({
        ...prev,
        filterId,
      }));
    },
    [updateCurrentTransform]
  );

  // Filter intensity adjustment
  const handleSetIntensity = useCallback(
    (val: number) => {
      updateCurrentTransform(prev => ({
        ...prev,
        filterIntensity: val,
      }));
    },
    [updateCurrentTransform]
  );

  // Individual adjustment change
  const handleSetAdjustment = useCallback(
    (key: keyof ImageAdjustments, val: number) => {
      updateCurrentTransform(prev => ({
        ...prev,
        adjustments: {
          ...prev.adjustments,
          [key]: val,
        },
      }));
    },
    [updateCurrentTransform]
  );

  // Advanced effect parameter change
  const handleSetEffect = useCallback(
    (key: keyof AdvancedEffectsState, val: any) => {
      updateCurrentTransform(prev => ({
        ...prev,
        effects: {
          ...prev.effects,
          [key]: val,
        },
      }));
    },
    [updateCurrentTransform]
  );

  // Reset transformations
  const handleReset = useCallback(() => {
    updateCurrentTransform(() => DEFAULT_TRANSFORM);
  }, [updateCurrentTransform]);

  // Process all assets using expo-image-manipulator + Skia Offscreen Export and finish
  const handleDone = useCallback(async () => {
    if (processing) return;
    setProcessing(true);

    try {
      const results: ProcessedPhoto[] = [];

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];

        // Skip video assets from image manipulation
        if (
          asset.mediaType === MediaLibrary.MediaType.video ||
          (asset.mediaType as any) === 'video'
        ) {
          results.push({
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            mimeType: 'video/mp4',
            assetId: asset.id,
            originalAsset: asset,
          });
          continue;
        }

        let cropX = DEFAULT_TRANSFORM.cropX;
        let cropY = DEFAULT_TRANSFORM.cropY;
        let cropW = DEFAULT_TRANSFORM.cropW;
        let cropH = DEFAULT_TRANSFORM.cropH;
        let rotation = DEFAULT_TRANSFORM.rotation;
        let flipH = DEFAULT_TRANSFORM.flipH;
        let flipV = DEFAULT_TRANSFORM.flipV;

        if (currentAsset && asset.id === currentAsset.id) {
          // ALWAYS read live gesture refs for active current asset!
          cropX = cropXRef.current;
          cropY = cropYRef.current;
          cropW = cropWRef.current;
          cropH = cropHRef.current;
          rotation = currentTransform.rotation;
          flipH = currentTransform.flipH;
          flipV = currentTransform.flipV;
        } else if (transformsMap[asset.id]) {
          const t = transformsMap[asset.id];
          cropX = t.cropX;
          cropY = t.cropY;
          cropW = t.cropW;
          cropH = t.cropH;
          rotation = t.rotation;
          flipH = t.flipH;
          flipV = t.flipV;
        }

        const actions: Action[] = [];

        // 1. Rotation first
        if (rotation % 360 !== 0) {
          actions.push({ rotate: rotation });
        }

        // 2. Flips
        if (flipH) {
          actions.push({ flip: FlipType.Horizontal });
        }
        if (flipV) {
          actions.push({ flip: FlipType.Vertical });
        }

        // Calculate effective image dimensions after rotation
        const isRotated90 = rotation % 180 !== 0;
        const effectiveW = isRotated90 ? asset.height : asset.width;
        const effectiveH = isRotated90 ? asset.width : asset.height;

        // 3. ALWAYS Crop to the exact user selection
        const originX = Math.round(cropX * effectiveW);
        const originY = Math.round(cropY * effectiveH);
        const cropWidth = Math.min(
          effectiveW - originX,
          Math.round(cropW * effectiveW)
        );
        const cropHeight = Math.min(
          effectiveH - originY,
          Math.round(cropH * effectiveH)
        );

        actions.push({
          crop: {
            originX: Math.max(0, originX),
            originY: Math.max(0, originY),
            width: Math.max(10, cropWidth),
            height: Math.max(10, cropHeight),
          },
        });

        // Perform single-shot image crop manipulation
        const manipResult = await manipulateAsync(asset.uri, actions, {
          compress: 0.85,
          format: SaveFormat.JPEG,
        });

        let finalUri = manipResult.uri;

        // Apply Skia GPU filter & advanced effects to final cropped image
        const filterId =
          asset.id === currentAsset?.id
            ? currentTransform.filterId
            : transformsMap[asset.id]?.filterId || 'original';
        const filterIntensity =
          asset.id === currentAsset?.id
            ? currentTransform.filterIntensity
            : transformsMap[asset.id]?.filterIntensity ?? 100;
        const adjustments =
          asset.id === currentAsset?.id
            ? currentTransform.adjustments
            : transformsMap[asset.id]?.adjustments || DEFAULT_ADJUSTMENTS;
        const effects =
          asset.id === currentAsset?.id
            ? currentTransform.effects
            : transformsMap[asset.id]?.effects || DEFAULT_ADVANCED_EFFECTS;

        const hasEffectsOrFilters =
          filterId !== 'original' ||
          adjustments.brightness !== 0 ||
          adjustments.contrast !== 0 ||
          adjustments.saturation !== 0 ||
          adjustments.temperature !== 0 ||
          effects.blurAmount > 0 ||
          effects.vignetteAmount > 0 ||
          effects.fadeAmount > 0 ||
          effects.duotonePreset !== 'none' ||
          effects.lightLeakIntensity > 0;

        if (hasEffectsOrFilters) {
          try {
            const fileData = await Skia.Data.fromURI(manipResult.uri);
            const skImage = Skia.Image.MakeImageFromEncoded(fileData);
            if (skImage) {
              const W = skImage.width();
              const H = skImage.height();
              const surface =
                Skia.Surface.MakeOffscreen(W, H) || Skia.Surface.Make(W, H);

              if (surface) {
                const canvas = surface.getCanvas();
                const paint = Skia.Paint();

                // Compute ColorFilter matrix
                let itemMatrix = buildCombinedColorMatrix(
                  filterId,
                  filterIntensity,
                  adjustments
                );
                if (effects.fadeAmount > 0) {
                  itemMatrix = applyFadeToColorMatrix(
                    itemMatrix,
                    effects.fadeAmount
                  );
                }
                if (effects.duotonePreset !== 'none') {
                  const duotoneM = buildDuotoneColorMatrix(effects.duotonePreset);
                  const res = new Array(20).fill(0);
                  for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 5; c++) {
                      let sum = 0;
                      for (let k = 0; k < 4; k++) {
                        sum += duotoneM[r * 5 + k] * itemMatrix[k * 5 + c];
                      }
                      if (c === 4) sum += duotoneM[r * 5 + 4];
                      res[r * 5 + c] = sum;
                    }
                  }
                  itemMatrix = res;
                }

                const colorFilter = Skia.ColorFilter.MakeMatrix(itemMatrix);
                paint.setColorFilter(colorFilter);

                if (effects.blurAmount > 0) {
                  const sigma = (effects.blurAmount / 100) * 8;
                  const blurFilter = Skia.ImageFilter.MakeBlur(
                    sigma,
                    sigma,
                    TileMode.Clamp,
                    null
                  );
                  if (blurFilter) paint.setImageFilter(blurFilter);
                }

                canvas.drawImage(skImage, 0, 0, paint);

                // Apply Vignette overlay on surface
                if (effects.vignetteAmount > 0) {
                  const vPaint = Skia.Paint();
                  const vRadius = Math.max(W, H) * (0.8 - (effects.vignetteSoftness / 100) * 0.3);
                  const vAlpha = (effects.vignetteAmount / 100) * 0.75;
                  const vShader = Skia.Shader.MakeTwoPointConicalGradient(
                    vec(W / 2, H / 2),
                    vRadius * 0.3,
                    vec(W / 2, H / 2),
                    vRadius,
                    [
                      Skia.Color(`rgba(0, 0, 0, 0)`),
                      Skia.Color(`rgba(0, 0, 0, ${vAlpha})`),
                    ],
                    [0, 1],
                    TileMode.Clamp
                  );
                  if (vShader) {
                    vPaint.setShader(vShader);
                    canvas.drawRect({ x: 0, y: 0, width: W, height: H }, vPaint);
                  }
                }

                // Apply Light Leak overlay on surface
                if (effects.lightLeakIntensity > 0) {
                  const leakPaint = Skia.Paint();
                  const lAlpha = (effects.lightLeakIntensity / 100) * 0.6;
                  const leakShader = Skia.Shader.MakeLinearGradient(
                    vec(W, 0),
                    vec(0, H),
                    [
                      Skia.Color(`rgba(255, 170, 50, ${lAlpha})`),
                      Skia.Color(`rgba(255, 100, 200, ${lAlpha * 0.5})`),
                      Skia.Color(`rgba(0, 0, 0, 0)`),
                    ],
                    [0, 0.4, 1],
                    TileMode.Clamp
                  );
                  if (leakShader) {
                    leakPaint.setShader(leakShader);
                    leakPaint.setBlendMode(BlendMode.Screen);
                    canvas.drawRect({ x: 0, y: 0, width: W, height: H }, leakPaint);
                  }
                }

                surface.flush();
                const filterSnapshot = surface.makeImageSnapshot();
                const base64Jpeg = filterSnapshot.encodeToBase64(
                  ImageFormat.JPEG,
                  85
                );
                const destUri = `${FileSystem.cacheDirectory}edited_${Date.now()}_${i}.jpg`;
                await FileSystem.writeAsStringAsync(destUri, base64Jpeg, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                finalUri = destUri;
              }
            }
          } catch (skiaErr) {
            console.error('Error applying Skia filter to export file:', skiaErr);
          }
        }

        results.push({
          uri: finalUri,
          width: manipResult.width,
          height: manipResult.height,
          mimeType: 'image/jpeg',
          assetId: asset.id,
          originalAsset: asset,
        });
      }

      setProcessing(false);
      onComplete(results);
    } catch (err: any) {
      console.error('Error manipulating images:', err);
      setProcessing(false);
      // Fallback: return original assets if manipulation fails
      const fallback: ProcessedPhoto[] = assets.map(a => ({
        uri: a.uri,
        width: a.width,
        height: a.height,
        mimeType: 'image/jpeg',
        assetId: a.id,
        originalAsset: a,
      }));
      onComplete(fallback);
    }
  }, [assets, currentAsset, currentTransform, transformsMap, processing, onComplete]);

  if (!visible || !currentAsset) return null;

  const cropLPercent = `${currentTransform.cropX * 100}%`;
  const cropTPercent = `${currentTransform.cropY * 100}%`;
  const cropWPercent = `${currentTransform.cropW * 100}%`;
  const cropHPercent = `${currentTransform.cropH * 100}%`;

  return (
    <View style={[styles.modalOverlay, { backgroundColor: theme.colors.background }]}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top, 12), borderColor: theme.colors.border },
        ]}
      >
        <Pressable onPress={onClose} style={styles.headerButton}>
          <IconApp name="x" pack="FI" size={24} color={theme.colors.text} />
        </Pressable>

        <YambiText
          text={
            assets.length > 1
              ? `Edit Photo (${currentIndex + 1}/${assets.length})`
              : (strings as any).edit_photos || 'Edit Photo'
          }
          bold
          size="normal"
          style={{ color: theme.colors.text }}
        />

        <Pressable onPress={handleReset} style={styles.headerButton}>
          <YambiText
            text={(strings as any).reset || 'Reset'}
            size="small"
            style={{ color: theme.colors.high_color }}
          />
        </Pressable>
      </View>

      {/* Interactive Crop & GPU Filter Canvas Container with Paginated FlashList */}
      <View style={styles.canvasContainer}>
        {assets.length > 1 ? (
          <FlashList
            ref={flashListRef}
            data={assets}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            estimatedItemSize={screenWidth}
            style={{ width: screenWidth, height: maxCanvasH + 20 }}
            contentContainerStyle={{ alignItems: 'center' }}
            extraData={[currentIndex, currentTransform, transformsMap, displayedW, displayedH]}
            onMomentumScrollEnd={evt => {
              if (isScrollingProgrammaticallyRef.current) {
                isScrollingProgrammaticallyRef.current = false;
                return;
              }
              const newIdx = Math.round(evt.nativeEvent.contentOffset.x / screenWidth);
              if (newIdx >= 0 && newIdx < assets.length && newIdx !== currentIndex) {
                setCurrentIndex(newIdx);
              }
            }}
            renderItem={({ item, index }) => {
              const isCurrent = index === currentIndex;
              const itemTransform = transformsMap[item.id] || DEFAULT_TRANSFORM;

              if (isCurrent) {
                return (
                  <View style={{ width: screenWidth, height: maxCanvasH + 20, alignItems: 'center', justifyContent: 'center' }}>
                    <View
                      style={[
                        styles.previewFrame,
                        {
                          width: displayedW,
                          height: displayedH,
                          transform: [
                            { rotate: `${currentTransform.rotation}deg` },
                            { scaleX: currentTransform.flipH ? -1 : 1 },
                            { scaleY: currentTransform.flipV ? -1 : 1 },
                          ],
                        },
                      ]}
                    >
                      {/* Skia GPU Canvas real-time rendering */}
                      {skiaImage ? (
                        <Canvas style={{ width: displayedW, height: displayedH }}>
                          <Group>
                            <SkiaImage
                              image={skiaImage}
                              fit="fill"
                              x={0}
                              y={0}
                              width={displayedW}
                              height={displayedH}
                            >
                              <ColorMatrix matrix={combinedMatrix} />
                              {currentTransform.effects.blurAmount > 0 && (
                                <Blur blur={(currentTransform.effects.blurAmount / 100) * 6} />
                              )}
                            </SkiaImage>

                            {/* Real-time Vignette RadialGradient Overlay */}
                            {currentTransform.effects.vignetteAmount > 0 && (
                              <Rect x={0} y={0} width={displayedW} height={displayedH}>
                                <RadialGradient
                                  c={vec(displayedW / 2, displayedH / 2)}
                                  r={
                                    Math.max(displayedW, displayedH) *
                                    (0.8 - (currentTransform.effects.vignetteSoftness / 100) * 0.3)
                                  }
                                  colors={[
                                    'rgba(0,0,0,0)',
                                    `rgba(0,0,0,${(currentTransform.effects.vignetteAmount / 100) * 0.75})`,
                                  ]}
                                />
                              </Rect>
                            )}

                            {/* Real-time Light Leak LinearGradient Overlay */}
                            {currentTransform.effects.lightLeakIntensity > 0 && (
                              <Rect x={0} y={0} width={displayedW} height={displayedH}>
                                <LinearGradient
                                  start={vec(displayedW, 0)}
                                  end={vec(0, displayedH)}
                                  colors={[
                                    `rgba(255, 170, 50, ${(currentTransform.effects.lightLeakIntensity / 100) * 0.6})`,
                                    `rgba(255, 100, 200, ${(currentTransform.effects.lightLeakIntensity / 100) * 0.3})`,
                                    'rgba(0,0,0,0)',
                                  ]}
                                />
                              </Rect>
                            )}
                          </Group>
                        </Canvas>
                      ) : (
                        <Image
                          source={{ uri: currentAsset.uri }}
                          style={StyleSheet.absoluteFillObject}
                          contentFit="fill"
                        />
                      )}

                      {/* Dimmed Mask Overlays with Native View Refs */}
                      <View
                        ref={topMaskRef}
                        style={[styles.dimmedMask, { top: 0, left: 0, right: 0, height: cropTPercent as any }]}
                      />
                      <View
                        ref={bottomMaskRef}
                        style={[
                          styles.dimmedMask,
                          {
                            top: `${(currentTransform.cropY + currentTransform.cropH) * 100}%` as any,
                            bottom: 0,
                            left: 0,
                            right: 0,
                          },
                        ]}
                      />
                      <View
                        ref={leftMaskRef}
                        style={[
                          styles.dimmedMask,
                          {
                            top: cropTPercent as any,
                            height: cropHPercent as any,
                            left: 0,
                            width: cropLPercent as any,
                          },
                        ]}
                      />
                      <View
                        ref={rightMaskRef}
                        style={[
                          styles.dimmedMask,
                          {
                            top: cropTPercent as any,
                            height: cropHPercent as any,
                            left: `${(currentTransform.cropX + currentTransform.cropW) * 100}%` as any,
                            right: 0,
                          },
                        ]}
                      />

                      {/* Dynamic Crop Box with Native View Ref */}
                      <View
                        ref={cropBoxRef}
                        style={[
                          styles.cropBox,
                          {
                            left: cropLPercent as any,
                            top: cropTPercent as any,
                            width: cropWPercent as any,
                            height: cropHPercent as any,
                            borderColor: '#FFFFFF',
                          },
                        ]}
                      >
                        {/* Center Drag Move Surface (active in crop tab) */}
                        <View
                          {...(activeTab === 'crop' ? moveResponder.panHandlers : {})}
                          style={styles.centerMoveArea}
                        >
                          <View style={styles.cropGridHorizontal} />
                          <View style={styles.cropGridVertical} />
                        </View>

                        {/* Drag Handles active during Crop tab */}
                        {activeTab === 'crop' && (
                          <>
                            <View {...tResponder.panHandlers} style={styles.edgeTouchTop} />
                            <View {...bResponder.panHandlers} style={styles.edgeTouchBottom} />
                            <View {...lResponder.panHandlers} style={styles.edgeTouchLeft} />
                            <View {...rResponder.panHandlers} style={styles.edgeTouchRight} />

                            <View {...tlResponder.panHandlers} style={[styles.cornerTouch, styles.cornerTL]}>
                              <View style={[styles.cornerVisual, styles.cornerVisualTL]} />
                            </View>
                            <View {...trResponder.panHandlers} style={[styles.cornerTouch, styles.cornerTR]}>
                              <View style={[styles.cornerVisual, styles.cornerVisualTR]} />
                            </View>
                            <View {...blResponder.panHandlers} style={[styles.cornerTouch, styles.cornerBL]}>
                              <View style={[styles.cornerVisual, styles.cornerVisualBL]} />
                            </View>
                            <View {...brResponder.panHandlers} style={[styles.cornerTouch, styles.cornerBR]} />
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                );
              }

              return (
                <View style={{ width: screenWidth, height: maxCanvasH + 20, alignItems: 'center', justifyContent: 'center' }}>
                  <View
                    style={[
                      styles.previewFrame,
                      {
                        width: displayedW,
                        height: displayedH,
                        transform: [
                          { rotate: `${itemTransform.rotation}deg` },
                          { scaleX: itemTransform.flipH ? -1 : 1 },
                          { scaleY: itemTransform.flipV ? -1 : 1 },
                        ],
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                    />
                  </View>
                </View>
              );
            }}
          />
        ) : (
          <View
            style={[
              styles.previewFrame,
              {
                width: displayedW,
                height: displayedH,
                transform: [
                  { rotate: `${currentTransform.rotation}deg` },
                  { scaleX: currentTransform.flipH ? -1 : 1 },
                  { scaleY: currentTransform.flipV ? -1 : 1 },
                ],
              },
            ]}
          >
            {/* Skia GPU Canvas real-time rendering */}
            {skiaImage ? (
              <Canvas style={{ width: displayedW, height: displayedH }}>
                <Group>
                  <SkiaImage
                    image={skiaImage}
                    fit="fill"
                    x={0}
                    y={0}
                    width={displayedW}
                    height={displayedH}
                  >
                    <ColorMatrix matrix={combinedMatrix} />
                    {currentTransform.effects.blurAmount > 0 && (
                      <Blur blur={(currentTransform.effects.blurAmount / 100) * 6} />
                    )}
                  </SkiaImage>

                  {/* Real-time Vignette RadialGradient Overlay */}
                  {currentTransform.effects.vignetteAmount > 0 && (
                    <Rect x={0} y={0} width={displayedW} height={displayedH}>
                      <RadialGradient
                        c={vec(displayedW / 2, displayedH / 2)}
                        r={
                          Math.max(displayedW, displayedH) *
                          (0.8 - (currentTransform.effects.vignetteSoftness / 100) * 0.3)
                        }
                        colors={[
                          'rgba(0,0,0,0)',
                          `rgba(0,0,0,${(currentTransform.effects.vignetteAmount / 100) * 0.75})`,
                        ]}
                      />
                    </Rect>
                  )}

                  {/* Real-time Light Leak LinearGradient Overlay */}
                  {currentTransform.effects.lightLeakIntensity > 0 && (
                    <Rect x={0} y={0} width={displayedW} height={displayedH}>
                      <LinearGradient
                        start={vec(displayedW, 0)}
                        end={vec(0, displayedH)}
                        colors={[
                          `rgba(255, 170, 50, ${(currentTransform.effects.lightLeakIntensity / 100) * 0.6})`,
                          `rgba(255, 100, 200, ${(currentTransform.effects.lightLeakIntensity / 100) * 0.3})`,
                          'rgba(0,0,0,0)',
                        ]}
                      />
                    </Rect>
                  )}
                </Group>
              </Canvas>
            ) : (
              <Image
                source={{ uri: currentAsset.uri }}
                style={StyleSheet.absoluteFillObject}
                contentFit="fill"
              />
            )}

            {/* Dimmed Mask Overlays with Native View Refs */}
            <View
              ref={topMaskRef}
              style={[styles.dimmedMask, { top: 0, left: 0, right: 0, height: cropTPercent as any }]}
            />
            <View
              ref={bottomMaskRef}
              style={[
                styles.dimmedMask,
                {
                  top: `${(currentTransform.cropY + currentTransform.cropH) * 100}%` as any,
                  bottom: 0,
                  left: 0,
                  right: 0,
                },
              ]}
            />
            <View
              ref={leftMaskRef}
              style={[
                styles.dimmedMask,
                {
                  top: cropTPercent as any,
                  height: cropHPercent as any,
                  left: 0,
                  width: cropLPercent as any,
                },
              ]}
            />
            <View
              ref={rightMaskRef}
              style={[
                styles.dimmedMask,
                {
                  top: cropTPercent as any,
                  height: cropHPercent as any,
                  left: `${(currentTransform.cropX + currentTransform.cropW) * 100}%` as any,
                  right: 0,
                },
              ]}
            />

            {/* Dynamic Crop Box with Native View Ref */}
            <View
              ref={cropBoxRef}
              style={[
                styles.cropBox,
                {
                  left: cropLPercent as any,
                  top: cropTPercent as any,
                  width: cropWPercent as any,
                  height: cropHPercent as any,
                  borderColor: '#FFFFFF',
                },
              ]}
            >
              {/* Center Drag Move Surface (active in crop tab) */}
              <View
                {...(activeTab === 'crop' ? moveResponder.panHandlers : {})}
                style={styles.centerMoveArea}
              >
                <View style={styles.cropGridHorizontal} />
                <View style={styles.cropGridVertical} />
              </View>

              {/* Drag Handles active during Crop tab */}
              {activeTab === 'crop' && (
                <>
                  <View {...tResponder.panHandlers} style={styles.edgeTouchTop} />
                  <View {...bResponder.panHandlers} style={styles.edgeTouchBottom} />
                  <View {...lResponder.panHandlers} style={styles.edgeTouchLeft} />
                  <View {...rResponder.panHandlers} style={styles.edgeTouchRight} />

                  <View {...tlResponder.panHandlers} style={[styles.cornerTouch, styles.cornerTL]}>
                    <View style={[styles.cornerVisual, styles.cornerVisualTL]} />
                  </View>
                  <View {...trResponder.panHandlers} style={[styles.cornerTouch, styles.cornerTR]}>
                    <View style={[styles.cornerVisual, styles.cornerVisualTR]} />
                  </View>
                  <View {...blResponder.panHandlers} style={[styles.cornerTouch, styles.cornerBL]}>
                    <View style={[styles.cornerVisual, styles.cornerVisualBL]} />
                  </View>
                  <View {...brResponder.panHandlers} style={[styles.cornerTouch, styles.cornerBR]}>
                    <View style={[styles.cornerVisual, styles.cornerVisualBR]} />
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Editing Toolbar according to Active Tab */}
      <View style={[styles.toolbarContainer, { borderColor: theme.colors.border }]}>
        {activeTab === 'crop' && (
          <View style={styles.controlsRow}>
            <Pressable onPress={() => handleRotate(-90)} style={styles.actionIconButton}>
              <IconApp name="rotate-ccw" pack="FI" size={20} color={theme.colors.text} />
              <Text style={[styles.actionLabel, { color: theme.colors.gray }]}>-90°</Text>
            </Pressable>

            <Pressable onPress={() => handleRotate(90)} style={styles.actionIconButton}>
              <IconApp name="rotate-cw" pack="FI" size={20} color={theme.colors.text} />
              <Text style={[styles.actionLabel, { color: theme.colors.gray }]}>+90°</Text>
            </Pressable>

            <Pressable onPress={handleFlipH} style={styles.actionIconButton}>
              <IconApp name="repeat" pack="FI" size={20} color={theme.colors.text} />
              <Text style={[styles.actionLabel, { color: theme.colors.gray }]}>Flip H</Text>
            </Pressable>

            <Pressable onPress={handleFlipV} style={styles.actionIconButton}>
              <IconApp name="refresh-cw" pack="FI" size={20} color={theme.colors.text} />
              <Text style={[styles.actionLabel, { color: theme.colors.gray }]}>Flip V</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'filters' && (
          <View>
            {/* Filter Intensity Quick Buttons */}
            {currentTransform.filterId !== 'original' && (
              <View style={styles.intensityBar}>
                <YambiText
                  text={(strings as any).intensity || 'Intensity'}
                  size="xsmall"
                  bold
                  style={{ color: theme.colors.gray }}
                />
                {[25, 50, 75, 100].map(val => (
                  <Pressable
                    key={val}
                    onPress={() => handleSetIntensity(val)}
                    style={[
                      styles.intensityPill,
                      {
                        backgroundColor:
                          currentTransform.filterIntensity === val
                            ? theme.colors.button_background_color || theme.colors.high_color
                            : theme.colors.card,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.intensityText,
                        {
                          color:
                            currentTransform.filterIntensity === val
                              ? theme.colors.button_foreground_color || '#FFF'
                              : theme.colors.text,
                        },
                      ]}
                    >
                      {val}%
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Horizontal Filter Presets Selector with Live Skia Previews */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {FILTER_PRESETS.map(preset => {
                const isSelected = currentTransform.filterId === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => handleSelectFilter(preset.id)}
                    style={[
                      styles.filterThumbnailCard,
                      {
                        borderColor: isSelected
                          ? theme.colors.button_background_color || theme.colors.high_color
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.filterThumbnailImageContainer}>
                      {skiaImage ? (
                        <Canvas style={styles.filterThumbnailCanvas}>
                          <SkiaImage
                            image={skiaImage}
                            fit="cover"
                            x={0}
                            y={0}
                            width={52}
                            height={52}
                          >
                            <ColorMatrix matrix={preset.matrix} />
                          </SkiaImage>
                        </Canvas>
                      ) : (
                        <Image
                          source={{ uri: currentAsset.uri }}
                          style={styles.filterThumbnailImage}
                          contentFit="cover"
                        />
                      )}
                    </View>
                    <YambiText
                      text={(strings as any)[preset.nameKey] || preset.defaultName}
                      size="xsmall"
                      bold={isSelected}
                      style={{
                        color: isSelected
                          ? theme.colors.button_background_color || theme.colors.high_color
                          : theme.colors.text,
                        marginTop: 4,
                      }}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {activeTab === 'adjust' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.adjustScroll}
          >
            {[
              { key: 'brightness', label: (strings as any).brightness || 'Brightness' },
              { key: 'contrast', label: (strings as any).contrast || 'Contrast' },
              { key: 'saturation', label: (strings as any).saturation || 'Saturation' },
              { key: 'temperature', label: (strings as any).temperature || 'Temperature' },
            ].map(adj => {
              const currentVal =
                currentTransform.adjustments[adj.key as keyof ImageAdjustments] || 0;
              return (
                <View
                  key={adj.key}
                  style={[
                    styles.adjustCard,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  ]}
                >
                  <YambiText
                    text={adj.label}
                    size="xsmall"
                    bold
                    style={{ color: theme.colors.text }}
                  />
                  <Text style={[styles.adjustValText, { color: theme.colors.high_color }]}>
                    {currentVal > 0 ? `+${currentVal}` : currentVal}
                  </Text>
                  <View style={styles.adjustStepRow}>
                    <Pressable
                      onPress={() =>
                        handleSetAdjustment(
                          adj.key as keyof ImageAdjustments,
                          Math.max(-100, currentVal - 15)
                        )
                      }
                      style={styles.stepButton}
                    >
                      <Text style={[styles.stepText, { color: theme.colors.text }]}>-</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        handleSetAdjustment(adj.key as keyof ImageAdjustments, 0)
                      }
                      style={styles.stepButton}
                    >
                      <Text style={[styles.stepText, { color: theme.colors.gray }]}>0</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        handleSetAdjustment(
                          adj.key as keyof ImageAdjustments,
                          Math.min(100, currentVal + 15)
                        )
                      }
                      style={styles.stepButton}
                    >
                      <Text style={[styles.stepText, { color: theme.colors.text }]}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {activeTab === 'effects' && (
          <View>
            {/* Sub-Effects Horizontal Navigation Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.effectsSubScroll}
            >
              {[
                { id: 'vignette', label: (strings as any).vignette || 'Vignette' },
                { id: 'fade', label: (strings as any).fade || 'Fade' },
                { id: 'blur', label: (strings as any).blur || 'Blur' },
                { id: 'duotone', label: (strings as any).duotone || 'Duotone' },
                { id: 'light_leak', label: (strings as any).light_leak || 'Light Leak' },
              ].map(sub => {
                const isSelected = activeEffectSubTab === sub.id;
                return (
                  <Pressable
                    key={sub.id}
                    onPress={() => setActiveEffectSubTab(sub.id as ActiveEffectSubTab)}
                    style={[
                      styles.effectSubPill,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.button_background_color || theme.colors.high_color
                          : theme.colors.card,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.effectSubText,
                        {
                          color: isSelected
                            ? theme.colors.button_foreground_color || '#FFF'
                            : theme.colors.text,
                        },
                      ]}
                    >
                      {sub.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Controls according to selected sub-effect */}
            <View style={styles.effectControlsContainer}>
              {activeEffectSubTab === 'vignette' && (
                <View style={styles.fullWidthSliderWrapper}>
                  <AppSlider
                    value={currentTransform.effects.vignetteAmount}
                    minimumValue={0}
                    maximumValue={100}
                    onValueChange={val => handleSetEffect('vignetteAmount', val)}
                  />
                </View>
              )}

              {activeEffectSubTab === 'fade' && (
                <View style={styles.fullWidthSliderWrapper}>
                  <AppSlider
                    value={currentTransform.effects.fadeAmount}
                    minimumValue={0}
                    maximumValue={100}
                    onValueChange={val => handleSetEffect('fadeAmount', val)}
                  />
                </View>
              )}

              {activeEffectSubTab === 'blur' && (
                <View style={styles.fullWidthSliderWrapper}>
                  <AppSlider
                    value={currentTransform.effects.blurAmount}
                    minimumValue={0}
                    maximumValue={100}
                    onValueChange={val => handleSetEffect('blurAmount', val)}
                  />
                </View>
              )}

              {activeEffectSubTab === 'duotone' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  {DUOTONE_PRESETS.map(preset => {
                    const isSelected = currentTransform.effects.duotonePreset === preset.id;
                    return (
                      <Pressable
                        key={preset.id}
                        onPress={() => handleSetEffect('duotonePreset', preset.id)}
                        style={[
                          styles.duotonePill,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.button_background_color || theme.colors.high_color
                              : theme.colors.card,
                            borderColor: isSelected
                              ? theme.colors.button_background_color || theme.colors.high_color
                              : theme.colors.border,
                          },
                        ]}
                      >
                        <YambiText
                          text={(strings as any)[preset.nameKey] || preset.defaultName}
                          size="xsmall"
                          bold={isSelected}
                          style={{
                            color: isSelected
                              ? theme.colors.button_foreground_color || '#FFFFFF'
                              : theme.colors.text,
                          }}
                        />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {activeEffectSubTab === 'light_leak' && (
                <View style={styles.fullWidthSliderWrapper}>
                  <AppSlider
                    value={currentTransform.effects.lightLeakIntensity}
                    minimumValue={0}
                    maximumValue={100}
                    onValueChange={val => handleSetEffect('lightLeakIntensity', val)}
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tab Navigation Selector */}
        <View style={styles.tabBar}>
          {[
            { id: 'crop', label: (strings as any).crop || 'Crop', icon: 'crop' },
            { id: 'filters', label: (strings as any).filters || 'Filters', icon: 'sliders' },
            { id: 'adjust', label: (strings as any).adjust || 'Adjust', icon: 'sun' },
            { id: 'effects', label: (strings as any).effects || 'Effects', icon: 'zap' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id as ActiveTab)}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: isActive ? theme.colors.card : 'transparent',
                  },
                ]}
              >
                <IconApp
                  name={tab.icon}
                  pack="FI"
                  size={16}
                  color={
                    isActive
                      ? theme.colors.button_background_color || theme.colors.high_color
                      : theme.colors.gray
                  }
                />
                <YambiText
                  text={tab.label}
                  size="xsmall"
                  bold={isActive}
                  style={{
                    color: isActive
                      ? theme.colors.button_background_color || theme.colors.high_color
                      : theme.colors.gray,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Bottom Floating Confirmation Bar */}
      <View
        style={[
          styles.bottomActionBar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <ButtonNormal
          normal
          title={
            processing
              ? (strings as any).processing_images || 'Processing...'
              : (strings as any).finish || 'Finish'
          }
          onPress={handleDone}
          loading={processing}
          iconName="check"
          iconPack="FI"
          styles={{ width: '100%', borderRadius: 14 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  canvasContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  previewFrame: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#000000',
    alignSelf: 'center',
  },
  dimmedMask: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 1,
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  centerMoveArea: {
    ...StyleSheet.absoluteFillObject,
  },
  cropGridHorizontal: {
    position: 'absolute',
    top: '33.33%',
    bottom: '33.33%',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  cropGridVertical: {
    position: 'absolute',
    left: '33.33%',
    right: '33.33%',
    top: 0,
    bottom: 0,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },

  // Touch Zones with 44px Touch Targets
  edgeTouchTop: {
    position: 'absolute',
    top: -22,
    left: 22,
    right: 22,
    height: 44,
    zIndex: 5,
  },
  edgeTouchBottom: {
    position: 'absolute',
    bottom: -22,
    left: 22,
    right: 22,
    height: 44,
    zIndex: 5,
  },
  edgeTouchLeft: {
    position: 'absolute',
    left: -22,
    top: 22,
    bottom: 22,
    width: 44,
    zIndex: 5,
  },
  edgeTouchRight: {
    position: 'absolute',
    right: -22,
    top: 22,
    bottom: 22,
    width: 44,
    zIndex: 5,
  },

  // Corner Touch Zones (44x44px target)
  cornerTouch: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cornerTL: {
    top: -22,
    left: -22,
  },
  cornerTR: {
    top: -22,
    right: -22,
  },
  cornerBL: {
    bottom: -22,
    left: -22,
  },
  cornerBR: {
    bottom: -22,
    right: -22,
  },
  cornerVisual: {
    width: 16,
    height: 16,
    borderColor: '#FFFFFF',
  },
  cornerVisualTL: {
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerVisualTR: {
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerVisualBL: {
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerVisualBR: {
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },

  toolbarContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionIconButton: {
    alignItems: 'center',
    padding: 6,
  },
  actionLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },

  // Filter Bar Styles
  intensityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  intensityPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  intensityText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  filterThumbnailCard: {
    alignItems: 'center',
    width: 62,
    borderRadius: 10,
    borderWidth: 2,
    padding: 4,
  },
  filterThumbnailImage: {
    width: 52,
    height: 52,
    borderRadius: 6,
  },
  filterThumbnailImageContainer: {
    width: 52,
    height: 52,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  filterThumbnailCanvas: {
    width: 52,
    height: 52,
  },

  // Adjustment Slider Cards
  adjustScroll: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  adjustCard: {
    width: 110,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  adjustValText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  adjustStepRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Advanced Effects Sub-Bar
  effectsSubScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  effectSubPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  effectSubText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  effectControlsContainer: {
    paddingHorizontal: 0,
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
  },
  fullWidthSliderWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 4,
    alignItems: 'center',
    overflow: 'hidden',
  },
  effectSliderRow: {
    alignItems: 'center',
    gap: 6,
  },
  duotonePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },

  // Tab Bar Styles
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },

  bottomActionBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
});
