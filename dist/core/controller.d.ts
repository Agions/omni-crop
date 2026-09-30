import { Point, Size, AreaPixels, AreaPercent, CropMode, CropFilterOptions, CropDataResult, ControllerOptions, CropState, ResizeHandle } from './types';
export type ChangeCallback = (state: CropState) => void;
export type CompleteCallback = (pixels: AreaPixels, percentages: AreaPercent) => void;
export declare class OmniCropController {
    private options;
    private state;
    private containerSize;
    private naturalMediaSize;
    private renderedMediaSize;
    private changeListeners;
    private completeListeners;
    constructor(options?: ControllerOptions);
    /**
     * Initializes or updates container & media dimensions
     */
    initDimensions(containerSize: Size, naturalMediaSize: Size): void;
    getTotalRotation(): number;
    setCrop(crop: Point): void;
    setZoom(zoom: number): void;
    setRotation(rotation: number): void;
    setFineAngle(angle: number): void;
    setFilter(filter: Partial<CropFilterOptions>): void;
    getFilterStyle(): string;
    rotate(stepAngle?: number): void;
    flipHorizontal(): void;
    flipVertical(): void;
    reset(): void;
    setCropMode(cropMode: CropMode): void;
    setAspect(aspect: number | 'free'): void;
    resizeCropBox(handle: ResizeHandle, delta: Point): void;
    setCropSize(size: Size): void;
    getContainerSize(): Size;
    zoomIn(step?: number): void;
    zoomOut(step?: number): void;
    getState(): Readonly<CropState>;
    /**
     * Generates CSS/WXS transformation string
     */
    getTransformStyle(): string;
    /**
     * Computes the current crop area in pixels & percentages
     */
    computeResult(): {
        croppedAreaPixels: AreaPixels;
        croppedAreaPercentages: AreaPercent;
    };
    /**
     * Returns complete crop parameters including pixel/percent coordinates and CDN query params
     */
    getCropData(): CropDataResult;
    notifyComplete(): void;
    on(event: 'change', fn: ChangeCallback): () => void;
    on(event: 'complete', fn: CompleteCallback): () => void;
    private clampAndNotify;
}
//# sourceMappingURL=controller.d.ts.map