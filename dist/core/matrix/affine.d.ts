import { Point, Size, AreaPixels, AreaPercent, Flip } from '../types';
/**
 * Converts degree to radian
 */
export declare function degreeToRadian(deg: number): number;
/**
 * Returns the bounding size of a rotated rectangle
 */
export declare function getRotatedSize(width: number, height: number, rotation: number): Size;
/**
 * Computes default crop container size given container dimensions and aspect ratio
 */
export declare function getInitialCropSize(containerWidth: number, containerHeight: number, aspect: number | 'free'): Size;
/**
 * Computes the scaled media dimensions inside container given fit mode
 */
export declare function getMediaBaseSize(mediaWidth: number, mediaHeight: number, cropWidth: number, cropHeight: number): Size;
/**
 * Rotates a 2D point around an origin
 */
export declare function rotatePoint(point: Point, origin: Point, rotation: number): Point;
/**
 * Computes actual cropped area in original image pixels and percentages
 */
export declare function computeCropArea(crop: Point, cropSize: Size, zoom: number, rotation: number, flip: Flip, naturalMediaSize: Size, renderedMediaSize: Size): {
    croppedAreaPixels: AreaPixels;
    croppedAreaPercentages: AreaPercent;
};
//# sourceMappingURL=affine.d.ts.map