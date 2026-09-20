const { getRotatedSize } = require('./matrix');

function getCropBoundaries(cropSize, mediaSize, rotation, zoom) {
  const scaledWidth = mediaSize.width * zoom;
  const scaledHeight = mediaSize.height * zoom;

  const { width: boundingWidth, height: boundingHeight } = getRotatedSize(
    scaledWidth,
    scaledHeight,
    rotation
  );

  const maxHorizontalOffset = Math.max(0, (boundingWidth - cropSize.width) / 2);
  const maxVerticalOffset = Math.max(0, (boundingHeight - cropSize.height) / 2);

  return {
    minX: -maxHorizontalOffset,
    maxX: maxHorizontalOffset,
    minY: -maxVerticalOffset,
    maxY: maxVerticalOffset,
  };
}

function clampPosition(point, bounds) {
  return {
    x: Math.min(Math.max(point.x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(point.y, bounds.minY), bounds.maxY),
  };
}

function getMinZoom(cropSize, mediaSize, rotation) {
  if (mediaSize.width <= 0 || mediaSize.height <= 0) return 1;

  const rad = (Math.abs(rotation) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const requiredW = cropSize.width * cos + cropSize.height * sin;
  const requiredH = cropSize.width * sin + cropSize.height * cos;

  const zoomX = requiredW / mediaSize.width;
  const zoomY = requiredH / mediaSize.height;

  return Math.max(zoomX, zoomY, 1);
}

module.exports = {
  getCropBoundaries,
  clampPosition,
  getMinZoom,
};
