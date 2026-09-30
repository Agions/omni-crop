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

export interface Area extends Point, Size {}

/**
 * Cropped area expressed in percentages of the original image (0 - 100)
 */
export interface AreaPercent extends Area {}

/**
 * Cropped area expressed in actual pixel coordinates on the source image
 */
export interface AreaPixels extends Area {}

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
  brightness?: number; // 0.5 ~ 1.5, default 1.0
  contrast?: number;   // 0.5 ~ 1.5, default 1.0
  saturation?: number; // 0.0 ~ 2.0, default 1.0
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
  a: number; // scaleX / cos
  b: number; // skewY / sin
  c: number; // skewX / -sin
  d: number; // scaleY / cos
  tx: number; // translateX
  ty: number; // translateY
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

export type ResizeHandle =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right';
