import { AdvancedEffectsState, DuotonePresetId } from '../types/gallery';
import { IDENTITY_MATRIX } from './filterPresets';

export const DEFAULT_ADVANCED_EFFECTS: AdvancedEffectsState = {
  vignetteAmount: 0,
  vignetteSoftness: 50,
  grainAmount: 0,
  blurAmount: 0,
  sharpenAmount: 0,
  glowAmount: 0,
  glowRadius: 20,
  fadeAmount: 0,
  duotonePreset: 'none',
  overlayOpacity: 0,
  overlayColor: '#FFA500',
  overlayBlendMode: 'softLight',
  lightLeakIntensity: 0,
  lightLeakPosition: 'topRight',
};

export interface DuotoneColors {
  id: DuotonePresetId;
  nameKey: string;
  defaultName: string;
  shadowRGB: [number, number, number];
  highlightRGB: [number, number, number];
}

export const DUOTONE_PRESETS: DuotoneColors[] = [
  {
    id: 'none',
    nameKey: 'none',
    defaultName: 'None',
    shadowRGB: [0, 0, 0],
    highlightRGB: [1, 1, 1],
  },
  {
    id: 'blue_cream',
    nameKey: 'duotone_blue_cream',
    defaultName: 'Blue / Cream',
    shadowRGB: [0.05, 0.12, 0.38],
    highlightRGB: [0.98, 0.94, 0.82],
  },
  {
    id: 'purple_pink',
    nameKey: 'duotone_purple_pink',
    defaultName: 'Purple / Pink',
    shadowRGB: [0.22, 0.05, 0.38],
    highlightRGB: [1.0, 0.6, 0.82],
  },
  {
    id: 'teal_orange',
    nameKey: 'duotone_teal_orange',
    defaultName: 'Teal / Orange',
    shadowRGB: [0.0, 0.32, 0.42],
    highlightRGB: [1.0, 0.58, 0.22],
  },
  {
    id: 'bw',
    nameKey: 'duotone_bw',
    defaultName: 'B&W Contrast',
    shadowRGB: [0.0, 0.0, 0.0],
    highlightRGB: [1.0, 1.0, 1.0],
  },
  {
    id: 'sepia',
    nameKey: 'duotone_sepia',
    defaultName: 'Classic Sepia',
    shadowRGB: [0.2, 0.12, 0.04],
    highlightRGB: [0.96, 0.88, 0.72],
  },
  {
    id: 'midnight',
    nameKey: 'duotone_midnight',
    defaultName: 'Midnight Cyan',
    shadowRGB: [0.02, 0.04, 0.16],
    highlightRGB: [0.45, 0.75, 0.95],
  },
];

// Returns a 20-element 4x5 ColorMatrix that converts colors to luminance and interpolates between Shadow and Highlight RGB
export function buildDuotoneColorMatrix(presetId: DuotonePresetId): number[] {
  const preset = DUOTONE_PRESETS.find(p => p.id === presetId);
  if (!preset || preset.id === 'none') return IDENTITY_MATRIX;

  const [sR, sG, sB] = preset.shadowRGB;
  const [hR, hG, hB] = preset.highlightRGB;

  // Lum weights: R=0.299, G=0.587, B=0.114
  const dR = hR - sR;
  const dG = hG - sG;
  const dB = hB - sB;

  return [
    0.299 * dR, 0.587 * dR, 0.114 * dR, 0, sR,
    0.299 * dG, 0.587 * dG, 0.114 * dG, 0, sG,
    0.299 * dB, 0.587 * dB, 0.114 * dB, 0, sB,
    0,          0,          0,          1, 0,
  ];
}

// Compute Fade matrix lifting blacks (0..100 -> offset 0..0.15)
export function applyFadeToColorMatrix(matrix: number[], fadeAmount: number): number[] {
  if (fadeAmount <= 0) return [...matrix];
  const lift = (fadeAmount / 100) * 0.15;
  const scale = 1 - lift * 0.5;

  const res = [...matrix];
  res[0] *= scale;
  res[6] *= scale;
  res[12] *= scale;
  res[4] += lift;
  res[9] += lift;
  res[14] += lift;

  return res;
}
