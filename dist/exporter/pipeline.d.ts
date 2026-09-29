import { AreaPixels, Flip, CropShape } from '../core';
import { ICanvasDriver, ExportOptions, CropResult } from './drivers/types';
export interface CropExecutionOptions {
    imageSrc: string;
    pixelCrop: AreaPixels;
    rotation?: number;
    flip?: Flip;
    cropShape?: CropShape;
    output?: ExportOptions;
    driver: ICanvasDriver;
}
/**
 * High-level image cropping pipeline
 */
export declare function getCroppedImage(options: CropExecutionOptions): Promise<CropResult>;
//# sourceMappingURL=pipeline.d.ts.map