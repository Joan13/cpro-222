import { FilterPreset, ImageAdjustments } from '../types/gallery';

export const IDENTITY_MATRIX: number[] = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'original',
    nameKey: 'filter_original',
    defaultName: 'Original',
    matrix: IDENTITY_MATRIX,
  },
  {
    id: 'vivid',
    nameKey: 'filter_vivid',
    defaultName: 'Vivid',
    matrix: [
      1.25, -0.08, -0.08, 0, 0,
      -0.08, 1.25, -0.08, 0, 0,
      -0.08, -0.08, 1.25, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'warm',
    nameKey: 'filter_warm',
    defaultName: 'Warm',
    matrix: [
      1.12, 0.04, 0, 0, 0.03,
      0, 1.06, 0, 0, 0.01,
      0, 0, 0.88, 0, -0.03,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'cool',
    nameKey: 'filter_cool',
    defaultName: 'Cool',
    matrix: [
      0.88, 0, 0, 0, -0.03,
      0, 1.02, 0.04, 0, 0,
      0, 0.04, 1.18, 0, 0.04,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'vintage',
    nameKey: 'filter_vintage',
    defaultName: 'Vintage',
    matrix: [
      0.9, 0.1, 0.1, 0, 0.05,
      0.05, 0.85, 0.1, 0, 0.03,
      0.05, 0.1, 0.72, 0, 0.08,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'cinema',
    nameKey: 'filter_cinema',
    defaultName: 'Cinema',
    matrix: [
      1.18, 0, 0.04, 0, 0.02,
      0, 1.02, 0.08, 0, 0,
      -0.06, 0.1, 1.22, 0, 0.03,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'fade',
    nameKey: 'filter_fade',
    defaultName: 'Fade',
    matrix: [
      0.82, 0.09, 0.09, 0, 0.1,
      0.09, 0.82, 0.09, 0, 0.1,
      0.09, 0.09, 0.82, 0, 0.1,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'noir',
    nameKey: 'filter_noir',
    defaultName: 'Noir',
    matrix: [
      0.4, 0.45, 0.15, 0, -0.06,
      0.4, 0.45, 0.15, 0, -0.06,
      0.4, 0.45, 0.15, 0, -0.06,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'bw',
    nameKey: 'filter_bw',
    defaultName: 'B&W',
    matrix: [
      0.33, 0.59, 0.11, 0, 0,
      0.33, 0.59, 0.11, 0, 0,
      0.33, 0.59, 0.11, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'sepia',
    nameKey: 'filter_sepia',
    defaultName: 'Sepia',
    matrix: [
      0.393, 0.769, 0.189, 0, 0,
      0.349, 0.686, 0.168, 0, 0,
      0.272, 0.534, 0.131, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'golden',
    nameKey: 'filter_golden',
    defaultName: 'Golden',
    matrix: [
      1.22, 0.06, -0.06, 0, 0.06,
      0.06, 1.12, -0.06, 0, 0.03,
      -0.12, -0.06, 0.78, 0, -0.06,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'moody',
    nameKey: 'filter_moody',
    defaultName: 'Moody',
    matrix: [
      0.88, 0.12, 0, 0, -0.03,
      0.06, 0.82, 0.06, 0, -0.03,
      0.06, 0.12, 0.82, 0, -0.02,
      0, 0, 0, 1, 0,
    ],
  },
];

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  vignette: 0,
};

// Interpolate between Identity matrix and target matrix based on intensity (0..1)
function interpolateMatrix(base: number[], target: number[], factor: number): number[] {
  if (factor <= 0) return [...base];
  if (factor >= 1) return [...target];

  return base.map((val, idx) => val + (target[idx] - val) * factor);
}

// Compute merged 4x5 ColorMatrix combining filter + intensity + brightness + contrast + saturation + temperature
export function buildCombinedColorMatrix(
  filterId: string,
  filterIntensity: number,
  adjustments: ImageAdjustments
): number[] {
  const preset = FILTER_PRESETS.find(p => p.id === filterId) || FILTER_PRESETS[0];
  const factor = Math.max(0, Math.min(100, filterIntensity)) / 100;

  // 1. Filter matrix with intensity lerp
  let m = interpolateMatrix(IDENTITY_MATRIX, preset.matrix, factor);

  // 2. Brightness (-100..+100 -> offset -0.35..+0.35)
  if (adjustments.brightness !== 0) {
    const bOffset = (adjustments.brightness / 100) * 0.35;
    m[4] += bOffset;
    m[9] += bOffset;
    m[14] += bOffset;
  }

  // 3. Contrast (-100..+100 -> scale 0.5..1.5)
  if (adjustments.contrast !== 0) {
    const cScale = 1 + (adjustments.contrast / 100) * 0.5;
    const cOffset = 0.5 * (1 - cScale);
    m[0] *= cScale;
    m[6] *= cScale;
    m[12] *= cScale;
    m[4] += cOffset;
    m[9] += cOffset;
    m[14] += cOffset;
  }

  // 4. Saturation (-100..+100 -> scale 0..2)
  if (adjustments.saturation !== 0) {
    const sat = 1 + adjustments.saturation / 100;
    const invSat = 1 - sat;
    const R = 0.213 * invSat;
    const G = 0.715 * invSat;
    const B = 0.072 * invSat;

    const satMat = [
      R + sat, G, B, 0, 0,
      R, G + sat, B, 0, 0,
      R, G, B + sat, 0, 0,
      0, 0, 0, 1, 0,
    ];

    // Multiply satMat * m (5x5 matrix product simplified for 4x5)
    const res = new Array(20).fill(0);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += satMat[r * 5 + k] * m[k * 5 + c];
        }
        if (c === 4) sum += satMat[r * 5 + 4];
        res[r * 5 + c] = sum;
      }
    }
    m = res;
  }

  // 5. Temperature (-100..+100 -> warm/cool offset)
  if (adjustments.temperature !== 0) {
    const tempOffset = (adjustments.temperature / 100) * 0.12;
    m[4] += tempOffset; // Red offset
    m[14] -= tempOffset; // Blue offset
  }

  return m;
}
