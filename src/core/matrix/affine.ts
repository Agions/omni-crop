import { Point, Size, AreaPixels, AreaPercent, Flip } from '../types';

/**
 * Converts degree to radian
 */
export function degreeToRadian(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Returns the bounding size of a rotated rectangle
 */
export function getRotatedSize(width: number, height: number, rotation: number): Size {
  const rad = degreeToRadian(rotation);
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
}

/**
 * Computes default crop container size given container dimensions and aspect ratio
 */
export function getInitialCropSize(
  containerWidth: number,
  containerHeight: number,
  aspect: number | 'free'
): Size {
  const padding = 40; // Default inner padding
  const maxWidth = Math.max(0, containerWidth - padding * 2);
  const maxHeight = Math.max(0, containerHeight - padding * 2);

  if (aspect === 'free' || !aspect || aspect <= 0) {
    const size = Math.min(maxWidth, maxHeight);
    return { width: size, height: size };
  }

  if (maxWidth / maxHeight > aspect) {
    return {
      width: maxHeight * aspect,
      height: maxHeight,
    };
  }

  return {
    width: maxWidth,
    height: maxWidth / aspect,
  };
}

/**
 * Computes the scaled media dimensions inside container given fit mode
 */
export function getMediaBaseSize(
  mediaWidth: number,
  mediaHeight: number,
  cropWidth: number,
  cropHeight: number
): Size {
  if (mediaWidth <= 0 || mediaHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const mediaAspect = mediaWidth / mediaHeight;
  const cropAspect = cropWidth / cropHeight;

  if (mediaAspect > cropAspect) {
    // Media is wider than crop box: fit height to crop box height
    return {
      width: cropHeight * mediaAspect,
      height: cropHeight,
    };
  }

  // Media is taller than crop box: fit width to crop box width
  return {
    width: cropWidth,
    height: cropWidth / mediaAspect,
  };
}

/**
 * Rotates a 2D point around an origin
 */
export function rotatePoint(point: Point, origin: Point, rotation: number): Point {
  const rad = degreeToRadian(rotation);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = point.x - origin.x;
  const dy = point.y - origin.y;

  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

/**
 * Computes actual cropped area in original image pixels and percentages
 */
export function computeCropArea(
  crop: Point,
  cropSize: Size,
  zoom: number,
  rotation: number,
  flip: Flip,
  naturalMediaSize: Size,
  renderedMediaSize: Size
): { croppedAreaPixels: AreaPixels; croppedAreaPercentages: AreaPercent } {
  const { width: origW, height: origH } = naturalMediaSize;
  if (origW <= 0 || origH <= 0 || renderedMediaSize.width <= 0 || renderedMediaSize.height <= 0) {
    const zeroArea = { x: 0, y: 0, width: 0, height: 0 };
    return { croppedAreaPixels: zeroArea, croppedAreaPercentages: zeroArea };
  }

  // Effective rendered scale relative to natural image
  const scaleRatio = (renderedMediaSize.width * zoom) / origW;

  // Unrotated center offset
  const rad = degreeToRadian(-rotation);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Crop center relative to media center
  const cx = -crop.x;
  const cy = -crop.y;

  // Counter-rotate the offset
  let unrotatedX = cx * cos - cy * sin;
  let unrotatedY = cx * sin + cy * cos;

  // Handle flips
  if (flip.horizontal) {
    unrotatedX = -unrotatedX;
  }
  if (flip.vertical) {
    unrotatedY = -unrotatedY;
  }

  // Crop box dimensions in original image coordinates
  const cropWInImage = cropSize.width / scaleRatio;
  const cropHInImage = cropSize.height / scaleRatio;

  // Center of image in natural coords
  const imageCenterX = origW / 2;
  const imageCenterY = origH / 2;

  // Top-left of crop box on the natural image
  const pixelX = Math.round(imageCenterX + unrotatedX / scaleRatio - cropWInImage / 2);
  const pixelY = Math.round(imageCenterY + unrotatedY / scaleRatio - cropHInImage / 2);
  const pixelW = Math.round(cropWInImage);
  const pixelH = Math.round(cropHInImage);

  const croppedAreaPixels: AreaPixels = {
    x: pixelX,
    y: pixelY,
    width: pixelW,
    height: pixelH,
  };

  const croppedAreaPercentages: AreaPercent = {
    x: Number(((pixelX / origW) * 100).toFixed(4)),
    y: Number(((pixelY / origH) * 100).toFixed(4)),
    width: Number(((pixelW / origW) * 100).toFixed(4)),
    height: Number(((pixelH / origH) * 100).toFixed(4)),
  };

  return { croppedAreaPixels, croppedAreaPercentages };
}
