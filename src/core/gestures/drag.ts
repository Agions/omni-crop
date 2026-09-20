import { Point, Size, Area, ResizeHandle } from '../types';

/**
 * Computes updated crop box for Mode B (resizing crop box)
 */
export function updateCropBoxByHandle(
  initialBox: Area,
  handle: ResizeHandle,
  delta: Point,
  containerSize: Size,
  aspect: number | 'free',
  minBoxSize = 50
): Area {
  let { x, y, width, height } = initialBox;
  const maxWidth = containerSize.width;
  const maxHeight = containerSize.height;

  switch (handle) {
    case 'top-left': {
      const newW = Math.max(minBoxSize, Math.min(width - delta.x, x + width));
      const newH =
        aspect === 'free'
          ? Math.max(minBoxSize, Math.min(height - delta.y, y + height))
          : newW / aspect;
      x = x + (width - newW);
      y = y + (height - newH);
      width = newW;
      height = newH;
      break;
    }
    case 'top-right': {
      const newW = Math.max(minBoxSize, Math.min(width + delta.x, maxWidth - x));
      const newH =
        aspect === 'free'
          ? Math.max(minBoxSize, Math.min(height - delta.y, y + height))
          : newW / aspect;
      y = y + (height - newH);
      width = newW;
      height = newH;
      break;
    }
    case 'bottom-left': {
      const newW = Math.max(minBoxSize, Math.min(width - delta.x, x + width));
      const newH =
        aspect === 'free'
          ? Math.max(minBoxSize, Math.min(height + delta.y, maxHeight - y))
          : newW / aspect;
      x = x + (width - newW);
      width = newW;
      height = newH;
      break;
    }
    case 'bottom-right': {
      const newW = Math.max(minBoxSize, Math.min(width + delta.x, maxWidth - x));
      const newH =
        aspect === 'free'
          ? Math.max(minBoxSize, Math.min(height + delta.y, maxHeight - y))
          : newW / aspect;
      width = newW;
      height = newH;
      break;
    }
    case 'left': {
      const newW = Math.max(minBoxSize, Math.min(width - delta.x, x + width));
      x = x + (width - newW);
      width = newW;
      if (aspect !== 'free') {
        height = newW / aspect;
      }
      break;
    }
    case 'right': {
      width = Math.max(minBoxSize, Math.min(width + delta.x, maxWidth - x));
      if (aspect !== 'free') {
        height = width / aspect;
      }
      break;
    }
    case 'top': {
      const newH = Math.max(minBoxSize, Math.min(height - delta.y, y + height));
      y = y + (height - newH);
      height = newH;
      if (aspect !== 'free') {
        width = newH * aspect;
      }
      break;
    }
    case 'bottom': {
      height = Math.max(minBoxSize, Math.min(height + delta.y, maxHeight - y));
      if (aspect !== 'free') {
        width = height * aspect;
      }
      break;
    }
  }

  // Ensure box remains within container bounds
  x = Math.max(0, Math.min(x, maxWidth - width));
  y = Math.max(0, Math.min(y, maxHeight - height));

  return { x, y, width, height };
}
