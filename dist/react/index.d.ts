import React from 'react';
import { AreaPixels, AreaPercent, CropMode, CropShape, Point } from '../core';
import { ExportOptions, CropResult } from '../exporter';
export interface OmniCropWebProps {
    image: string;
    cropMode?: CropMode;
    cropShape?: CropShape;
    aspect?: number | 'free';
    showGrid?: boolean;
    restrictPosition?: boolean;
    onCropChange?: (crop: Point) => void;
    onZoomChange?: (zoom: number) => void;
    onRotationChange?: (rotation: number) => void;
    onCropComplete?: (pixels: AreaPixels, percent: AreaPercent) => void;
    className?: string;
    style?: React.CSSProperties;
}
export interface OmniCropWebRef {
    rotate: (stepAngle?: number) => void;
    flipHorizontal: () => void;
    flipVertical: () => void;
    reset: () => void;
    exportCroppedImage: (options?: ExportOptions) => Promise<CropResult>;
}
export declare const OmniCrop: any;
//# sourceMappingURL=index.d.ts.map