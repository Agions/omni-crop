import { CropFilterOptions } from '../types';
export interface FilterValues {
    brightness: number;
    contrast: number;
    saturation: number;
    grayscale: number;
    sepia: number;
    hueRotate: number;
}
/**
 * Resolves combined filter parameters from preset and manual adjustments
 */
export declare function resolveFilterValues(options?: CropFilterOptions): FilterValues;
/**
 * Formats a CSS filter string for GPU-composited 60FPS real-time preview
 */
export declare function getFilterCss(options?: CropFilterOptions): string;
/**
 * Pixel-level color grading shader for Canvas 2D when ctx.filter is unavailable
 */
export declare function applyFilterToImageData(data: Uint8ClampedArray, width: number, height: number, options?: CropFilterOptions): void;
//# sourceMappingURL=presets.d.ts.map