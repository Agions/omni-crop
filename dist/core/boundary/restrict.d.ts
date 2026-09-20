import { Point, Size, CropBoundaries } from '../types';
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
//# sourceMappingURL=restrict.d.ts.map