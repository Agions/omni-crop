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
export type CropFilterPreset = 'normal' | 'bw' | 'vintage' | 'vivid' | 'cool' | 'warm';
export interface CropFilterOptions {
    preset?: CropFilterPreset;
    brightness?: number;
    contrast?: number;
    saturation?: number;
}
export interface CloudCropParams {
    aliyunOss: string;
    tencentCos: string;
    qiniu: string;
}
export interface CropDataResult {
    pixelCrop: AreaPixels;
    percentCrop: AreaPercent;
    rotation: number;
    fineAngle: number;
    totalRotation: number;
    flip: Flip;
    filter: CropFilterOptions;
    cloudParams: CloudCropParams;
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
    fineAngle: number;
    flip: Flip;
    filter: CropFilterOptions;
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
    autoZoomOnRotate?: boolean;
    initialCrop?: Point;
    initialZoom?: number;
    initialRotation?: number;
    initialFineAngle?: number;
    initialFlip?: Flip;
    initialFilter?: CropFilterOptions;
}
export type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right';
//# sourceMappingURL=types.d.ts.map