import { Point, Size, Area, ResizeHandle } from '../types';
/**
 * Computes updated crop box for Mode B (resizing crop box)
 */
export declare function updateCropBoxByHandle(initialBox: Area, handle: ResizeHandle, delta: Point, containerSize: Size, aspect: number | 'free', minBoxSize?: number): Area;
//# sourceMappingURL=drag.d.ts.map