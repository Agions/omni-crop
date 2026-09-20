import { AreaPixels, Flip } from '../../core';
export type ImageOutputFormat = 'jpg' | 'png' | 'webp';
export type ImageOutputType = 'tempFilePath' | 'base64' | 'blob';
export interface ExportOptions {
    format?: ImageOutputFormat;
    quality?: number;
    type?: ImageOutputType;
    maxResolution?: number;
    dpr?: number;
}
export interface CropResult {
    uri?: string;
    base64?: string;
    blob?: any;
    width: number;
    height: number;
}
export interface RenderParams {
    imageSource: any;
    pixelCrop: AreaPixels;
    rotation: number;
    flip: Flip;
    outputWidth: number;
    outputHeight: number;
}
export interface ICanvasDriver {
    name: string;
    loadImage(source: string): Promise<{
        image: any;
        width: number;
        height: number;
    }>;
    createOffscreenCanvas(width: number, height: number, dpr?: number): Promise<any>;
    render(canvas: any, params: RenderParams): Promise<void>;
    export(canvas: any, options: ExportOptions): Promise<CropResult>;
}
//# sourceMappingURL=types.d.ts.map