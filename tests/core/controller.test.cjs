const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { OmniCropController } = require('../../dist/core/index.js');

describe('OmniCropController State Machine', () => {
  it('initializes dimensions and applies clamping', () => {
    const controller = new OmniCropController({
      aspect: 1,
      restrictPosition: true,
    });

    let completed = false;
    controller.on('complete', (pixels, percentages) => {
      completed = true;
      assert.ok(pixels.width > 0);
      assert.ok(percentages.width > 0);
    });

    controller.initDimensions(
      { width: 400, height: 400 },
      { width: 800, height: 600 }
    );

    const state = controller.getState();
    assert.ok(state.cropSize.width > 0);
    assert.strictEqual(state.cropSize.width, state.cropSize.height);
    assert.strictEqual(completed, true);
  });

  it('rotates and flips correctly', () => {
    const controller = new OmniCropController({ aspect: 1 });
    controller.initDimensions(
      { width: 400, height: 400 },
      { width: 800, height: 800 }
    );

    assert.strictEqual(controller.getState().rotation, 0);

    controller.rotate(90);
    assert.strictEqual(controller.getState().rotation, 90);

    controller.rotate(270);
    assert.strictEqual(controller.getState().rotation, 0);

    assert.strictEqual(controller.getState().flip.horizontal, false);
    controller.flipHorizontal();
    assert.strictEqual(controller.getState().flip.horizontal, true);
    controller.flipHorizontal();
    assert.strictEqual(controller.getState().flip.horizontal, false);
  });

  it('generates proper transform CSS string', () => {
    const controller = new OmniCropController();
    controller.initDimensions(
      { width: 400, height: 400 },
      { width: 800, height: 800 }
    );

    controller.setZoom(1.5);
    controller.setCrop({ x: 10, y: 20 });
    controller.setRotation(45);

    const style = controller.getTransformStyle();
    assert.ok(style.includes('translate3d(10px, 20px, 0)'));
    assert.ok(style.includes('rotate(45deg)'));
    assert.ok(style.includes('scale(1.5, 1.5)'));
  });

  it('supports Mode B resizeCropBox and mode switching', () => {
    const controller = new OmniCropController({ aspect: 'free' });
    controller.initDimensions(
      { width: 400, height: 400 },
      { width: 800, height: 800 }
    );

    const initialSize = controller.getState().cropSize;
    controller.setCropMode('resize-box');
    controller.resizeCropBox('right', { x: 50, y: 0 });

    const newSize = controller.getState().cropSize;
    assert.strictEqual(newSize.width, initialSize.width + 50);
  });

  it('supports fineAngle micro-adjustments with auto-zoom and magnetic snap', () => {
    const controller = new OmniCropController({ aspect: 1, autoZoomOnRotate: true });
    controller.initDimensions(
      { width: 400, height: 400 },
      { width: 300, height: 300 }
    );

    assert.strictEqual(controller.getState().fineAngle, 0);

    // Micro-adjust to 15 degrees
    controller.setFineAngle(15);
    assert.strictEqual(controller.getState().fineAngle, 15);
    // Auto-zoom should scale up from 1.0 to prevent black borders
    assert.ok(controller.getState().zoom > 1.0);

    // Micro-adjust to 45 degrees
    controller.setFineAngle(45);
    assert.strictEqual(controller.getState().fineAngle, 45);
    assert.ok(controller.getState().zoom >= Math.SQRT2 - 0.01);

    // Magnetic snap within [-1.0, 1.0]
    controller.setFineAngle(0.6);
    assert.strictEqual(controller.getState().fineAngle, 0);

    // Clamps beyond [-45, 45]
    controller.setFineAngle(60);
    assert.strictEqual(controller.getState().fineAngle, 45);
  });

  it('supports filters and generates correct CSS filter string', () => {
    const controller = new OmniCropController();
    assert.strictEqual(controller.getFilterStyle(), 'none');

    controller.setFilter({ preset: 'bw' });
    const bwStyle = controller.getFilterStyle();
    assert.ok(bwStyle.includes('grayscale(100%)'));
    assert.ok(bwStyle.includes('contrast(1.10)'));

    controller.setFilter({ preset: 'vintage', brightness: 1.1 });
    const vintageStyle = controller.getFilterStyle();
    assert.ok(vintageStyle.includes('sepia(60%)'));
    assert.ok(vintageStyle.includes('brightness('));
    assert.ok(vintageStyle.includes('contrast(0.95)'));
    assert.ok(vintageStyle.includes('saturate(1.20)'));
  });

  it('getCropData returns precise pixelCrop, percentCrop and cloud crop query strings', () => {
    const controller = new OmniCropController({ aspect: 1 });
    controller.initDimensions(
      { width: 400, height: 400 },
      { width: 800, height: 800 }
    );

    const cropData = controller.getCropData();
    assert.ok(cropData.pixelCrop.width > 0);
    assert.ok(cropData.pixelCrop.height > 0);
    assert.strictEqual(cropData.fineAngle, 0);
    assert.strictEqual(cropData.rotation, 0);
    assert.strictEqual(cropData.totalRotation, 0);

    // Cloud query strings
    assert.ok(cropData.cloudParams.aliyunOss.startsWith('?x-oss-process=image/crop,'));
    assert.ok(cropData.cloudParams.aliyunOss.includes(`w_${cropData.pixelCrop.width}`));
    assert.ok(cropData.cloudParams.tencentCos.startsWith('?imageMogr2/cut/'));
    assert.ok(cropData.cloudParams.tencentCos.includes(`${cropData.pixelCrop.width}x${cropData.pixelCrop.height}`));
    assert.ok(cropData.cloudParams.qiniu.startsWith('?imageMogr2/crop/!'));
    assert.ok(cropData.cloudParams.qiniu.includes(`${cropData.pixelCrop.width}x${cropData.pixelCrop.height}`));
  });
});
