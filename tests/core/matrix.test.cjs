const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  degreeToRadian,
  getRotatedSize,
  getInitialCropSize,
  computeCropArea,
  getCropBoundaries,
  clampPosition,
  resizeCropBox,
  springStep,
} = require('../../dist/core/index.js');

describe('Matrix & Geometry Calculations', () => {
  it('degreeToRadian converts correctly', () => {
    assert.ok(Math.abs(degreeToRadian(180) - Math.PI) < 1e-6);
    assert.ok(Math.abs(degreeToRadian(90) - Math.PI / 2) < 1e-6);
    assert.strictEqual(degreeToRadian(0), 0);
  });

  it('getRotatedSize calculates rotated rectangle bounding box', () => {
    const box = { width: 100, height: 200 };
    // 0 deg: same
    assert.ok(Math.abs(getRotatedSize(box.width, box.height, 0).width - 100) < 1e-6);
    assert.ok(Math.abs(getRotatedSize(box.width, box.height, 0).height - 200) < 1e-6);

    // 90 deg: width and height swap
    assert.ok(Math.abs(getRotatedSize(box.width, box.height, 90).width - 200) < 1e-6);
    assert.ok(Math.abs(getRotatedSize(box.width, box.height, 90).height - 100) < 1e-6);
  });

  it('getInitialCropSize calculates proper aspect ratio box', () => {
    const size = getInitialCropSize(400, 300, 1);
    assert.strictEqual(size.width, size.height);

    const size43 = getInitialCropSize(400, 300, 4 / 3);
    assert.ok(Math.abs(size43.width / size43.height - 4 / 3) < 1e-4);
  });

  it('computeCropArea calculates pixel crop correctly', () => {
    const result = computeCropArea(
      { x: 0, y: 0 },
      { width: 200, height: 200 },
      1,
      0,
      { horizontal: false, vertical: false },
      { width: 1000, height: 1000 },
      { width: 200, height: 200 }
    );

    assert.strictEqual(result.croppedAreaPixels.width, 1000);
    assert.strictEqual(result.croppedAreaPixels.height, 1000);
    assert.strictEqual(result.croppedAreaPercentages.width, 100);
  });

  it('getCropBoundaries restricts position', () => {
    const bounds = getCropBoundaries(
      { width: 200, height: 200 },
      { width: 300, height: 300 },
      0,
      1
    );

    assert.strictEqual(bounds.minX, -50);
    assert.strictEqual(bounds.maxX, 50);
    assert.strictEqual(bounds.minY, -50);
    assert.strictEqual(bounds.maxY, 50);

    const clamped = clampPosition({ x: 100, y: -80 }, bounds);
    assert.strictEqual(clamped.x, 50);
    assert.strictEqual(clamped.y, -50);
  });

  it('resizeCropBox right handle in free aspect expands width', () => {
    const res = resizeCropBox({
      handle: 'right',
      delta: { x: 30, y: 0 },
      currentCropSize: { width: 100, height: 100 },
      containerSize: { width: 400, height: 400 },
      aspect: 'free',
    });
    assert.strictEqual(res.cropSize.width, 130);
    assert.strictEqual(res.cropSize.height, 100);
  });

  it('resizeCropBox bottom-right handle preserves fixed aspect ratio', () => {
    const res = resizeCropBox({
      handle: 'bottom-right',
      delta: { x: 40, y: 0 },
      currentCropSize: { width: 200, height: 100 },
      containerSize: { width: 500, height: 500 },
      aspect: 2,
    });
    assert.strictEqual(res.cropSize.width, 240);
    assert.strictEqual(res.cropSize.height, 120);
  });

  it('resizeCropBox respects minSize bounds', () => {
    const res = resizeCropBox({
      handle: 'left',
      delta: { x: 100, y: 0 },
      currentCropSize: { width: 50, height: 50 },
      containerSize: { width: 400, height: 400 },
      aspect: 'free',
      minSize: { width: 40, height: 40 },
    });
    assert.strictEqual(res.cropSize.width, 40);
  });

  it('springStep moves smoothly towards target', () => {
    const next = springStep(100, 200, 0.2);
    assert.strictEqual(next, 120);
  });
});
