import { ICanvasDriver, RenderParams, ExportOptions, CropResult } from './types';
export declare class WechatCanvas2DDriver implements ICanvasDriver {
    name: string;
    /**
     * Preloads image via wx.downloadFile or wx.getImageInfo
     */
    loadImage(source: string): Promise<{
        image: any;
        width: number;
        height: number;
    }>;
    createOffscreenCanvas(width: number, height: number, dpr?: number): Promise<any>;
    render(canvas: any, params: RenderParams): Promise<void>;
    export(canvas: any, options: ExportOptions): Promise<CropResult>;
}
//# sourceMappingURL=wechat.d.ts.map