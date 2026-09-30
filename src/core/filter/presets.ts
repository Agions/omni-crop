import { CropFilterOptions, CropFilterPreset } from '../types';

export interface FilterValues {
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
}

const PRESET_MAP: Record<CropFilterPreset, Partial<FilterValues>> = {
  normal: {
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
  },
  bw: {
    brightness: 1.0,
    contrast: 1.1,
    saturation: 0,
    grayscale: 1.0,
    sepia: 0,
    hueRotate: 0,
  },
  vintage: {
    brightness: 0.95,
    contrast: 0.95,
    saturation: 1.2,
    grayscale: 0,
    sepia: 0.6,
    hueRotate: 0,
  },
  vivid: {
    brightness: 1.05,
    contrast: 1.15,
    saturation: 1.4,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
  },
  cool: {
    brightness: 1.0,
    contrast: 1.05,
    saturation: 1.15,
    grayscale: 0,
    sepia: 0.15,
    hueRotate: 180,
  },
  warm: {
    brightness: 1.05,
    contrast: 1.05,
    saturation: 1.3,
    grayscale: 0,
    sepia: 0.3,
    hueRotate: 0,
  },
};

/**
 * Resolves combined filter parameters from preset and manual adjustments
 */
export function resolveFilterValues(options: CropFilterOptions = {}): FilterValues {
  const preset = options.preset || 'normal';
  const base = PRESET_MAP[preset] || PRESET_MAP.normal;

  const brightness = (base.brightness ?? 1.0) * (options.brightness ?? 1.0);
  const contrast = (base.contrast ?? 1.0) * (options.contrast ?? 1.0);
  const saturation = (base.saturation ?? 1.0) * (options.saturation ?? 1.0);
  const grayscale = base.grayscale ?? 0;
  const sepia = base.sepia ?? 0;
  const hueRotate = base.hueRotate ?? 0;

  return {
    brightness: Math.max(0, Math.min(3, brightness)),
    contrast: Math.max(0, Math.min(3, contrast)),
    saturation: Math.max(0, Math.min(3, saturation)),
    grayscale: Math.max(0, Math.min(1, grayscale)),
    sepia: Math.max(0, Math.min(1, sepia)),
    hueRotate,
  };
}

/**
 * Formats a CSS filter string for GPU-composited 60FPS real-time preview
 */
export function getFilterCss(options: CropFilterOptions = {}): string {
  const v = resolveFilterValues(options);
  const parts: string[] = [];

  if (v.grayscale > 0) parts.push(`grayscale(${(v.grayscale * 100).toFixed(0)}%)`);
  if (v.sepia > 0) parts.push(`sepia(${(v.sepia * 100).toFixed(0)}%)`);
  if (v.hueRotate !== 0) parts.push(`hue-rotate(${v.hueRotate}deg)`);
  if (Math.abs(v.brightness - 1) > 0.001) parts.push(`brightness(${v.brightness.toFixed(2)})`);
  if (Math.abs(v.contrast - 1) > 0.001) parts.push(`contrast(${v.contrast.toFixed(2)})`);
  if (Math.abs(v.saturation - 1) > 0.001) parts.push(`saturate(${v.saturation.toFixed(2)})`);

  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Pixel-level color grading shader for Canvas 2D when ctx.filter is unavailable
 */
export function applyFilterToImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: CropFilterOptions = {}
): void {
  const v = resolveFilterValues(options);
  const isNoop =
    Math.abs(v.brightness - 1) < 0.001 &&
    Math.abs(v.contrast - 1) < 0.001 &&
    Math.abs(v.saturation - 1) < 0.001 &&
    v.grayscale === 0 &&
    v.sepia === 0;

  if (isNoop) return;

  const b = v.brightness;
  const c = v.contrast;
  const s = v.saturation;
  const g = v.grayscale;
  const sep = v.sepia;

  const totalPixels = width * height * 4;
  for (let i = 0; i < totalPixels; i += 4) {
    let r = data[i];
    let gr = data[i + 1];
    let bl = data[i + 2];

    // 1. Grayscale
    if (g > 0) {
      const gray = 0.299 * r + 0.587 * gr + 0.114 * bl;
      r = r * (1 - g) + gray * g;
      gr = gr * (1 - g) + gray * g;
      bl = bl * (1 - g) + gray * g;
    }

    // 2. Sepia
    if (sep > 0) {
      const sr = 0.393 * r + 0.769 * gr + 0.189 * bl;
      const sg = 0.349 * r + 0.686 * gr + 0.168 * bl;
      const sb = 0.272 * r + 0.534 * gr + 0.131 * bl;
      r = r * (1 - sep) + sr * sep;
      gr = gr * (1 - sep) + sg * sep;
      bl = bl * (1 - sep) + sb * sep;
    }

    // 3. Brightness
    if (b !== 1.0) {
      r *= b;
      gr *= b;
      bl *= b;
    }

    // 4. Contrast
    if (c !== 1.0) {
      r = (r - 128) * c + 128;
      gr = (gr - 128) * c + 128;
      bl = (bl - 128) * c + 128;
    }

    // 5. Saturation
    if (s !== 1.0) {
      const gray = 0.299 * r + 0.587 * gr + 0.114 * bl;
      r = gray + (r - gray) * s;
      gr = gray + (gr - gray) * s;
      bl = gray + (bl - gray) * s;
    }

    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(gr)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(bl)));
  }
}
