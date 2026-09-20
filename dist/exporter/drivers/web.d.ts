import { ICanvasDriver, RenderParams, ExportOptions, CropResult } from './types';
export declare class WebCanvasDriver implements ICanvasDriver {
    name: string;
    loadImage(source: string): Promise<{
        image: HTMLImageElement;
        width: number;
        height: number;
    }>;
    createOffscreenCanvas(width: number, height: number, dpr?: number): Promise<HTMLCanvasElement>;
    render(canvas: HTMLCanvasElement, params: RenderParams): Promise<void>;
    export(canvas: HTMLCanvasElement, options: ExportOptions): Promise<CropResult>;
}
//# sourceMappingURL=web.d.ts.map