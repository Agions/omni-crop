import { AreaPixels, AreaPercent, CropMode, CropShape, Point } from '../core';
import { ExportOptions, CropResult } from '../exporter';
export interface OmniCropRNProps {
    image: string;
    aspect?: number | 'free';
    cropMode?: CropMode;
    cropShape?: CropShape;
    showGrid?: boolean;
    restrictPosition?: boolean;
    onCropChange?: (crop: Point) => void;
    onCropComplete?: (pixels: AreaPixels, percent: AreaPercent) => void;
}
export interface OmniCropRNRef {
    rotate: (stepAngle?: number) => void;
    flipHorizontal: () => void;
    flipVertical: () => void;
    reset: () => void;
    exportCroppedImage: (options?: ExportOptions) => Promise<CropResult>;
}
export declare const OmniCropRN: any;
//# sourceMappingURL=index.d.ts.map