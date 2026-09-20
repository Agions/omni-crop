/**
 * @omni-crop/core
 * Cross-platform image cropper types and geometry definitions
 */
export interface Point {
    x: number;
    y: number;
}
export interface Size {
    width: number;
    height: number;
}
export interface Area extends Point, Size {
}
/**
 * Cropped area expressed in percentages of the original image (0 - 100)
 */
export interface AreaPercent extends Area {
}
/**
 * Cropped area expressed in actual pixel coordinates on the source image
 */
export interface AreaPixels extends Area {
}
export type CropMode = 'transform-media' | 'resize-box';
export type CropShape = 'rect' | 'round';
export interface Flip {
    horizontal: boolean;
    vertical: boolean;
}
export interface CropBoundaries {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}
export interface TransformMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    tx: number;
    ty: number;
}
export interface CropState {
    crop: Point;
    zoom: number;
    rotation: number;
    flip: Flip;
    cropSize: Size;
    mediaSize: Size;
}
export interface ControllerOptions {
    cropMode?: CropMode;
    cropShape?: CropShape;
    aspect?: number | 'free';
    minZoom?: number;
    maxZoom?: number;
    zoomSpeed?: number;
    restrictPosition?: boolean;
    initialCrop?: Point;
    initialZoom?: number;
    initialRotation?: number;
    initialFlip?: Flip;
}
export type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right';
//# sourceMappingURL=types.d.ts.map