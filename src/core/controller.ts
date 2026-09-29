import {
  Point,
  Size,
  AreaPixels,
  AreaPercent,
  Flip,
  CropMode,
  CropShape,
  ControllerOptions,
  CropState,
  ResizeHandle,
} from './types';
import {
  getInitialCropSize,
  getMediaBaseSize,
  computeCropArea,
} from './matrix/affine';
import {
  getCropBoundaries,
  clampPosition,
  getMinZoom,
  resizeCropBox,
} from './boundary/restrict';

export type ChangeCallback = (state: CropState) => void;
export type CompleteCallback = (
  pixels: AreaPixels,
  percentages: AreaPercent
) => void;

export class OmniCropController {
  private options: Required<ControllerOptions>;
  private state: CropState;
  private containerSize: Size = { width: 0, height: 0 };
  private naturalMediaSize: Size = { width: 0, height: 0 };
  private renderedMediaSize: Size = { width: 0, height: 0 };

  private changeListeners: Set<ChangeCallback> = new Set();
  private completeListeners: Set<CompleteCallback> = new Set();

  constructor(options: ControllerOptions = {}) {
    this.options = {
      cropMode: options.cropMode || 'transform-media',
      cropShape: options.cropShape || 'rect',
      aspect: options.aspect !== undefined ? options.aspect : 4 / 3,
      minZoom: options.minZoom || 1,
      maxZoom: options.maxZoom || 3,
      zoomSpeed: options.zoomSpeed || 1,
      restrictPosition:
        options.restrictPosition !== undefined ? options.restrictPosition : true,
      initialCrop: options.initialCrop || { x: 0, y: 0 },
      initialZoom: options.initialZoom || 1,
      initialRotation: options.initialRotation || 0,
      initialFlip: options.initialFlip || { horizontal: false, vertical: false },
    };

    this.state = {
      crop: { ...this.options.initialCrop },
      zoom: this.options.initialZoom,
      rotation: this.options.initialRotation,
      flip: { ...this.options.initialFlip },
      cropSize: { width: 0, height: 0 },
      mediaSize: { width: 0, height: 0 },
    };
  }

  /**
   * Initializes or updates container & media dimensions
   */
  public initDimensions(containerSize: Size, naturalMediaSize: Size): void {
    this.containerSize = { ...containerSize };
    this.naturalMediaSize = { ...naturalMediaSize };

    // 1. Calculate Crop Box Size
    this.state.cropSize = getInitialCropSize(
      containerSize.width,
      containerSize.height,
      this.options.aspect
    );

    // 2. Calculate Base Rendered Media Size
    this.renderedMediaSize = getMediaBaseSize(
      naturalMediaSize.width,
      naturalMediaSize.height,
      this.state.cropSize.width,
      this.state.cropSize.height
    );
    this.state.mediaSize = { ...this.renderedMediaSize };

    // 3. Ensure minimum zoom covers crop box if restricted
    if (this.options.restrictPosition) {
      const minRequired = getMinZoom(
        this.state.cropSize,
        this.state.mediaSize,
        this.state.rotation
      );
      this.options.minZoom = Math.max(this.options.minZoom, minRequired);
      if (this.state.zoom < this.options.minZoom) {
        this.state.zoom = this.options.minZoom;
      }
    }

    this.clampAndNotify();
    this.notifyComplete();
  }

  public setCrop(crop: Point): void {
    this.state.crop = { ...crop };
    this.clampAndNotify();
  }

  public setZoom(zoom: number): void {
    this.state.zoom = Math.min(Math.max(zoom, this.options.minZoom), this.options.maxZoom);
    this.clampAndNotify();
  }

  public setRotation(rotation: number): void {
    this.state.rotation = (rotation % 360 + 360) % 360;
    this.clampAndNotify();
  }

  public rotate(stepAngle = 90): void {
    this.setRotation(this.state.rotation + stepAngle);
    this.notifyComplete();
  }

  public flipHorizontal(): void {
    this.state.flip.horizontal = !this.state.flip.horizontal;
    this.clampAndNotify();
    this.notifyComplete();
  }

  public flipVertical(): void {
    this.state.flip.vertical = !this.state.flip.vertical;
    this.clampAndNotify();
    this.notifyComplete();
  }

  public reset(): void {
    this.state.crop = { ...this.options.initialCrop };
    this.state.zoom = this.options.initialZoom;
    this.state.rotation = this.options.initialRotation;
    this.state.flip = { ...this.options.initialFlip };
    this.clampAndNotify();
    this.notifyComplete();
  }

  public setCropMode(cropMode: CropMode): void {
    this.options.cropMode = cropMode;
    this.clampAndNotify();
    this.notifyComplete();
  }

  public setAspect(aspect: number | 'free'): void {
    this.options.aspect = aspect;
    if (this.containerSize.width > 0 && this.containerSize.height > 0) {
      this.state.cropSize = getInitialCropSize(
        this.containerSize.width,
        this.containerSize.height,
        aspect
      );
      this.clampAndNotify();
      this.notifyComplete();
    }
  }

  public resizeCropBox(handle: ResizeHandle, delta: Point): void {
    const result = resizeCropBox({
      handle,
      delta,
      currentCropSize: this.state.cropSize,
      currentCrop: this.state.crop,
      containerSize: this.containerSize,
      aspect: this.options.aspect,
    });
    this.state.cropSize = result.cropSize;
    if (result.crop) {
      this.state.crop = result.crop;
    }
    this.clampAndNotify();
    this.notifyComplete();
  }

  public setCropSize(size: Size): void {
    this.state.cropSize = {
      width: Math.max(10, Math.round(size.width)),
      height: Math.max(10, Math.round(size.height)),
    };
    this.clampAndNotify();
    this.notifyComplete();
  }

  public getContainerSize(): Size {
    return { ...this.containerSize };
  }

  public zoomIn(step = 0.25): void {
    this.setZoom(this.state.zoom + step);
    this.notifyComplete();
  }

  public zoomOut(step = 0.25): void {
    this.setZoom(this.state.zoom - step);
    this.notifyComplete();
  }

  public getState(): Readonly<CropState> {
    return { ...this.state };
  }

  /**
   * Generates CSS/WXS transformation string
   */
  public getTransformStyle(): string {
    const { crop, zoom, rotation, flip } = this.state;
    const scaleX = (flip.horizontal ? -1 : 1) * zoom;
    const scaleY = (flip.vertical ? -1 : 1) * zoom;
    return `translate3d(${crop.x}px, ${crop.y}px, 0) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
  }

  /**
   * Computes the current crop area in pixels & percentages
   */
  public computeResult(): {
    croppedAreaPixels: AreaPixels;
    croppedAreaPercentages: AreaPercent;
  } {
    return computeCropArea(
      this.state.crop,
      this.state.cropSize,
      this.state.zoom,
      this.state.rotation,
      this.state.flip,
      this.naturalMediaSize,
      this.renderedMediaSize
    );
  }

  public notifyComplete(): void {
    const { croppedAreaPixels, croppedAreaPercentages } = this.computeResult();
    this.completeListeners.forEach((fn) => fn(croppedAreaPixels, croppedAreaPercentages));
  }

  public on(event: 'change', fn: ChangeCallback): () => void;
  public on(event: 'complete', fn: CompleteCallback): () => void;
  public on(event: string, fn: any): () => void {
    if (event === 'change') {
      this.changeListeners.add(fn);
      return () => this.changeListeners.delete(fn);
    }
    if (event === 'complete') {
      this.completeListeners.add(fn);
      return () => this.completeListeners.delete(fn);
    }
    return () => {};
  }

  private clampAndNotify(): void {
    if (this.options.restrictPosition && this.state.cropSize.width > 0) {
      const bounds = getCropBoundaries(
        this.state.cropSize,
        this.state.mediaSize,
        this.state.rotation,
        this.state.zoom
      );
      this.state.crop = clampPosition(this.state.crop, bounds);
    }
    this.changeListeners.forEach((fn) => fn({ ...this.state }));
  }
}
