import { OmniCropController, AreaPixels, AreaPercent, CropMode, CropShape, CropFilterOptions, CropDataResult, Point, Size } from '../core';
import { ExportOptions, CropResult } from '../exporter';
export interface UseOmniCropOptions {
    image: string;
    cropMode?: CropMode;
    cropShape?: CropShape;
    aspect?: number | 'free';
    restrictPosition?: boolean;
    autoZoomOnRotate?: boolean;
    fineAngle?: number;
    onCropChange?: (crop: Point) => void;
    onCropComplete?: (pixels: AreaPixels, percent: AreaPercent) => void;
}
export declare function useOmniCrop(options: UseOmniCropOptions): {
    controller: OmniCropController;
    transformStyle: {
        value: string;
    };
    filterStyle: {
        value: string;
    };
    cropBoxSize: Size;
    currentPixels: {
        value: AreaPixels;
    };
    initDimensions: (containerSize: Size, naturalSize: Size) => void;
    rotate: (step?: number) => void;
    setFineAngle: (angle: number) => void;
    setFilter: (filter: Partial<CropFilterOptions>) => void;
    getCropData: () => CropDataResult;
    flipHorizontal: () => void;
    flipVertical: () => void;
    reset: () => void;
    exportCroppedImage: (exportOpts?: ExportOptions) => Promise<CropResult>;
};
//# sourceMappingURL=useOmniCrop.d.ts.map