import { Point, Size, AreaPixels, AreaPercent, ControllerOptions, CropState } from './types';
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
    setCrop(crop: Point): void;
    setZoom(zoom: number): void;
    setRotation(rotation: number): void;
    rotate(stepAngle?: number): void;
    flipHorizontal(): void;
    flipVertical(): void;
    reset(): void;
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
    notifyComplete(): void;
    on(event: 'change', fn: ChangeCallback): () => void;
    on(event: 'complete', fn: CompleteCallback): () => void;
    private clampAndNotify;
}
//# sourceMappingURL=controller.d.ts.map