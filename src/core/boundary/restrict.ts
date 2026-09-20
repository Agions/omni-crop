import { Point, Size, CropBoundaries } from '../types';
import { getRotatedSize } from '../matrix/affine';

/**
 * Calculates the bounding box limits for crop offset (x, y)
 * under `restrictPosition = true` for Mode A (moving image).
 */
export function getCropBoundaries(
  cropSize: Size,
  mediaSize: Size,
  rotation: number,
  zoom: number
): CropBoundaries {
  const scaledWidth = mediaSize.width * zoom;
  const scaledHeight = mediaSize.height * zoom;

  // Rotated bounding box of the media
  const { width: boundingWidth, height: boundingHeight } = getRotatedSize(
    scaledWidth,
    scaledHeight,
    rotation
  );

  // If bounding size is smaller than crop box, center it
  const maxHorizontalOffset = Math.max(0, (boundingWidth - cropSize.width) / 2);
  const maxVerticalOffset = Math.max(0, (boundingHeight - cropSize.height) / 2);

  return {
    minX: -maxHorizontalOffset,
    maxX: maxHorizontalOffset,
    minY: -maxVerticalOffset,
    maxY: maxVerticalOffset,
  };
}

/**
 * Restricts a point within calculated boundaries
 */
export function clampPosition(point: Point, bounds: CropBoundaries): Point {
  return {
    x: Math.min(Math.max(point.x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(point.y, bounds.minY), bounds.maxY),
  };
}

/**
 * Computes minimum zoom required to ensure rotated media fully covers crop size
 */
export function getMinZoom(
  cropSize: Size,
  mediaSize: Size,
  rotation: number
): number {
  if (mediaSize.width <= 0 || mediaSize.height <= 0) return 1;

  const rad = (Math.abs(rotation) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  // Required width/height of the unrotated media so its rotated projection covers cropSize
  const requiredW = cropSize.width * cos + cropSize.height * sin;
  const requiredH = cropSize.width * sin + cropSize.height * cos;

  const zoomX = requiredW / mediaSize.width;
  const zoomY = requiredH / mediaSize.height;

  return Math.max(zoomX, zoomY, 1);
}

/**
 * Calculates spring resistance when dragging outside bounds (elastic drag physics)
 */
export function applyDamping(offset: number, min: number, max: number, factor = 0.3): number {
  if (offset < min) {
    return min - Math.pow(min - offset, 0.85) * factor;
  }
  if (offset > max) {
    return max + Math.pow(offset - max, 0.85) * factor;
  }
  return offset;
}
