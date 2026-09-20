/**
 * 仿射变换与几何计算矩阵
 */
function degreeToRadian(deg) {
  return (deg * Math.PI) / 180;
}

function getRotatedSize(width, height, rotation) {
  const rad = degreeToRadian(rotation);
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
}

function getInitialCropSize(containerWidth, containerHeight, aspect) {
  const padding = 32;
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

function getMediaBaseSize(mediaWidth, mediaHeight, cropWidth, cropHeight) {
  if (mediaWidth <= 0 || mediaHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const mediaAspect = mediaWidth / mediaHeight;
  const cropAspect = cropWidth / cropHeight;

  if (mediaAspect > cropAspect) {
    return {
      width: cropHeight * mediaAspect,
      height: cropHeight,
    };
  }

  return {
    width: cropWidth,
    height: cropWidth / mediaAspect,
  };
}

function computeCropArea(crop, cropSize, zoom, rotation, flip, naturalMediaSize, renderedMediaSize) {
  const origW = naturalMediaSize.width;
  const origH = naturalMediaSize.height;

  if (origW <= 0 || origH <= 0 || renderedMediaSize.width <= 0 || renderedMediaSize.height <= 0) {
    const zeroArea = { x: 0, y: 0, width: 0, height: 0 };
    return { croppedAreaPixels: zeroArea, croppedAreaPercentages: zeroArea };
  }

  const scaleRatio = (renderedMediaSize.width * zoom) / origW;
  const rad = degreeToRadian(-rotation);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const cx = -crop.x;
  const cy = -crop.y;

  let unrotatedX = cx * cos - cy * sin;
  let unrotatedY = cx * sin + cy * cos;

  if (flip.horizontal) unrotatedX = -unrotatedX;
  if (flip.vertical) unrotatedY = -unrotatedY;

  const cropWInImage = cropSize.width / scaleRatio;
  const cropHInImage = cropSize.height / scaleRatio;

  const imageCenterX = origW / 2;
  const imageCenterY = origH / 2;

  const pixelX = Math.round(imageCenterX + unrotatedX / scaleRatio - cropWInImage / 2);
  const pixelY = Math.round(imageCenterY + unrotatedY / scaleRatio - cropHInImage / 2);
  const pixelW = Math.round(cropWInImage);
  const pixelH = Math.round(cropHInImage);

  const croppedAreaPixels = {
    x: pixelX,
    y: pixelY,
    width: pixelW,
    height: pixelH,
  };

  const croppedAreaPercentages = {
    x: Number(((pixelX / origW) * 100).toFixed(4)),
    y: Number(((pixelY / origH) * 100).toFixed(4)),
    width: Number(((pixelW / origW) * 100).toFixed(4)),
    height: Number(((pixelH / origH) * 100).toFixed(4)),
  };

  return { croppedAreaPixels, croppedAreaPercentages };
}

module.exports = {
  degreeToRadian,
  getRotatedSize,
  getInitialCropSize,
  getMediaBaseSize,
  computeCropArea,
};
