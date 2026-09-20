import { OmniCropController, AreaPixels, AreaPercent, CropMode, CropShape, Point, Size } from '../core';
import { ExportOptions, CropResult } from '../exporter';
export interface UseOmniCropOptions {
    image: string;
    cropMode?: CropMode;
    cropShape?: CropShape;
    aspect?: number | 'free';
    restrictPosition?: boolean;
    onCropChange?: (crop: Point) => void;
    onCropComplete?: (pixels: AreaPixels, percent: AreaPercent) => void;
}
export declare function useOmniCrop(options: UseOmniCropOptions): {
    controller: OmniCropController;
    transformStyle: {
        value: string;
    };
    cropBoxSize: Size;
    currentPixels: {
        value: AreaPixels;
    };
    initDimensions: (containerSize: Size, naturalSize: Size) => void;
    rotate: (step?: number) => void;
    flipHorizontal: () => void;
    flipVertical: () => void;
    reset: () => void;
    exportCroppedImage: (exportOpts?: ExportOptions) => Promise<CropResult>;
};
//# sourceMappingURL=useOmniCrop.d.ts.map