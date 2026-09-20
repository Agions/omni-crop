/**
 * Lightweight EXIF orientation parser for JPEG buffers
 * Reads tag 0x0112 (Orientation)
 */
export declare function getOrientationFromBuffer(buffer: ArrayBuffer): number;
export interface ExifCorrection {
    rotation: number;
    flipHorizontal: boolean;
}
/**
 * Maps EXIF orientation (1-8) to rotation angle and horizontal flip
 */
export declare function getExifCorrection(orientation: number): ExifCorrection;
//# sourceMappingURL=exif.d.ts.map