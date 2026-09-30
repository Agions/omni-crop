import { getRotatedSize, getAutoZoomRatio } from '../matrix/affine.mjs';
/**
 * Calculates the bounding box limits for crop offset (x, y)
 * under `restrictPosition = true` for Mode A (moving image).
 */
export function getCropBoundaries(cropSize, mediaSize, rotation, zoom) {
    const scaledWidth = mediaSize.width * zoom;
    const scaledHeight = mediaSize.height * zoom;
    // Rotated bounding box of the media
    const { width: boundingWidth, height: boundingHeight } = getRotatedSize(scaledWidth, scaledHeight, rotation);
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
export function clampPosition(point, bounds) {
    return {
        x: Math.min(Math.max(point.x, bounds.minX), bounds.maxX),
        y: Math.min(Math.max(point.y, bounds.minY), bounds.maxY),
    };
}
/**
 * Computes minimum zoom required to ensure rotated media fully covers crop size
 */
export function getMinZoom(cropSize, mediaSize, rotation) {
    return getAutoZoomRatio(cropSize, mediaSize, rotation);
}
/**
 * Calculates spring resistance when dragging outside bounds (elastic drag physics)
 */
export function applyDamping(offset, min, max, factor = 0.3) {
    if (offset < min) {
        return min - Math.pow(min - offset, 0.85) * factor;
    }
    if (offset > max) {
        return max + Math.pow(offset - max, 0.85) * factor;
    }
    return offset;
}
/**
 * Calculates resized crop box and center offset for Mode B 8-anchor handles
 */
export function resizeCropBox(options) {
    const { handle, delta, currentCropSize, currentCrop = { x: 0, y: 0 }, containerSize, aspect = 'free', minSize = { width: 40, height: 40 }, } = options;
    let newWidth = currentCropSize.width;
    let newHeight = currentCropSize.height;
    let newCropX = currentCrop.x;
    let newCropY = currentCrop.y;
    const dx = delta.x;
    const dy = delta.y;
    switch (handle) {
        case 'right':
            newWidth = currentCropSize.width + dx;
            if (typeof aspect === 'number' && aspect > 0) {
                newHeight = newWidth / aspect;
            }
            break;
        case 'left':
            newWidth = currentCropSize.width - dx;
            if (typeof aspect === 'number' && aspect > 0) {
                newHeight = newWidth / aspect;
            }
            newCropX = currentCrop.x + dx / 2;
            break;
        case 'bottom':
            newHeight = currentCropSize.height + dy;
            if (typeof aspect === 'number' && aspect > 0) {
                newWidth = newHeight * aspect;
            }
            break;
        case 'top':
            newHeight = currentCropSize.height - dy;
            if (typeof aspect === 'number' && aspect > 0) {
                newWidth = newHeight * aspect;
            }
            newCropY = currentCrop.y + dy / 2;
            break;
        case 'bottom-right':
            if (typeof aspect === 'number' && aspect > 0) {
                const effectiveDelta = Math.abs(dx) > Math.abs(dy * aspect) ? dx : dy * aspect;
                newWidth = currentCropSize.width + effectiveDelta;
                newHeight = newWidth / aspect;
            }
            else {
                newWidth = currentCropSize.width + dx;
                newHeight = currentCropSize.height + dy;
            }
            break;
        case 'bottom-left':
            if (typeof aspect === 'number' && aspect > 0) {
                const effectiveDelta = Math.abs(dx) > Math.abs(dy * aspect) ? -dx : dy * aspect;
                newWidth = currentCropSize.width + effectiveDelta;
                newHeight = newWidth / aspect;
                newCropX = currentCrop.x - effectiveDelta / 2;
            }
            else {
                newWidth = currentCropSize.width - dx;
                newHeight = currentCropSize.height + dy;
                newCropX = currentCrop.x + dx / 2;
            }
            break;
        case 'top-right':
            if (typeof aspect === 'number' && aspect > 0) {
                const effectiveDelta = Math.abs(dx) > Math.abs(-dy * aspect) ? dx : -dy * aspect;
                newWidth = currentCropSize.width + effectiveDelta;
                newHeight = newWidth / aspect;
                newCropY = currentCrop.y - (newHeight - currentCropSize.height) / 2;
            }
            else {
                newWidth = currentCropSize.width + dx;
                newHeight = currentCropSize.height - dy;
                newCropY = currentCrop.y + dy / 2;
            }
            break;
        case 'top-left':
            if (typeof aspect === 'number' && aspect > 0) {
                const effectiveDelta = Math.abs(-dx) > Math.abs(-dy * aspect) ? -dx : -dy * aspect;
                newWidth = currentCropSize.width + effectiveDelta;
                newHeight = newWidth / aspect;
                newCropX = currentCrop.x - effectiveDelta / 2;
                newCropY = currentCrop.y - (newHeight - currentCropSize.height) / 2;
            }
            else {
                newWidth = currentCropSize.width - dx;
                newHeight = currentCropSize.height - dy;
                newCropX = currentCrop.x + dx / 2;
                newCropY = currentCrop.y + dy / 2;
            }
            break;
    }
    const maxW = containerSize.width > 0 ? containerSize.width : 2000;
    const maxH = containerSize.height > 0 ? containerSize.height : 2000;
    newWidth = Math.max(minSize.width, Math.min(newWidth, maxW));
    newHeight = Math.max(minSize.height, Math.min(newHeight, maxH));
    if (typeof aspect === 'number' && aspect > 0) {
        if (Math.abs(newWidth / newHeight - aspect) > 0.01) {
            newHeight = newWidth / aspect;
            if (newHeight > maxH) {
                newHeight = maxH;
                newWidth = newHeight * aspect;
            }
        }
    }
    return {
        cropSize: {
            width: Math.round(newWidth),
            height: Math.round(newHeight),
        },
        crop: {
            x: Math.round(newCropX),
            y: Math.round(newCropY),
        },
    };
}
/**
 * Calculates a spring animation step towards target value
 */
export function springStep(current, target, stiffness = 0.25) {
    return current + (target - current) * stiffness;
}
