import * as MediaLibrary from 'expo-media-library';

export interface ProcessedPhoto {
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
  assetId?: string;
  originalAsset?: MediaLibrary.Asset;
}

export interface ImageAdjustments {
  brightness: number;  // -100 to +100 (default 0)
  contrast: number;    // -100 to +100 (default 0)
  saturation: number;  // -100 to +100 (default 0)
  temperature: number; // -100 to +100 (default 0)
  vignette: number;    // 0 to 100 (default 0)
}

export interface FilterPreset {
  id: string;
  nameKey: string;
  defaultName: string;
  matrix: number[]; // 20-element 4x5 ColorMatrix array
}

export type DuotonePresetId = 'none' | 'blue_cream' | 'purple_pink' | 'teal_orange' | 'bw' | 'sepia' | 'midnight';
export type OverlayBlendMode = 'softLight' | 'overlay' | 'screen' | 'multiply';
export type LightLeakPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export interface AdvancedEffectsState {
  vignetteAmount: number;   // 0..100
  vignetteSoftness: number; // 0..100
  grainAmount: number;      // 0..100
  blurAmount: number;       // 0..100
  sharpenAmount: number;    // 0..100
  glowAmount: number;       // 0..100
  glowRadius: number;       // 0..100
  fadeAmount: number;       // 0..100
  duotonePreset: DuotonePresetId;
  overlayOpacity: number;   // 0..100
  overlayColor: string;     // hex or rgba string
  overlayBlendMode: OverlayBlendMode;
  lightLeakIntensity: number; // 0..100
  lightLeakPosition: LightLeakPosition;
}

export interface ItemTransformState {
  cropX: number; // 0..1 relative to displayed image width
  cropY: number; // 0..1 relative to displayed image height
  cropW: number; // 0..1 relative to displayed image width
  cropH: number; // 0..1 relative to displayed image height
  rotation: number; // 0, 90, 180, 270 degrees
  flipH: boolean;
  flipV: boolean;
  filterId: string;
  filterIntensity: number; // 0 to 100 (default 100)
  adjustments: ImageAdjustments;
  effects: AdvancedEffectsState;
}

export interface EditState {
  crop: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  filterId: string;
  filterIntensity: number;
  adjustments: ImageAdjustments;
  effects: AdvancedEffectsState;
}
