import { Point, Size, CropBoundaries, ResizeHandle } from '../types';
/**
 * Calculates the bounding box limits for crop offset (x, y)
 * under `restrictPosition = true` for Mode A (moving image).
 */
export declare function getCropBoundaries(cropSize: Size, mediaSize: Size, rotation: number, zoom: number): CropBoundaries;
/**
 * Restricts a point within calculated boundaries
 */
export declare function clampPosition(point: Point, bounds: CropBoundaries): Point;
/**
 * Computes minimum zoom required to ensure rotated media fully covers crop size
 */
export declare function getMinZoom(cropSize: Size, mediaSize: Size, rotation: number): number;
/**
 * Calculates spring resistance when dragging outside bounds (elastic drag physics)
 */
export declare function applyDamping(offset: number, min: number, max: number, factor?: number): number;
export interface ResizeBoxOptions {
    handle: ResizeHandle;
    delta: Point;
    currentCropSize: Size;
    currentCrop?: Point;
    containerSize: Size;
    aspect?: number | 'free';
    minSize?: Size;
}
export interface ResizeBoxResult {
    cropSize: Size;
    crop: Point;
}
/**
 * Calculates resized crop box and center offset for Mode B 8-anchor handles
 */
export declare function resizeCropBox(options: ResizeBoxOptions): ResizeBoxResult;
/**
 * Calculates a spring animation step towards target value
 */
export declare function springStep(current: number, target: number, stiffness?: number): number;
//# sourceMappingURL=restrict.d.ts.map