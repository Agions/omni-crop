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
});
