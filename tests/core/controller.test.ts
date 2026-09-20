import { describe, it, expect, vi } from 'vitest';
import { OmniCropController } from '../src/controller';

describe('OmniCropController State Machine', () => {
  it('initializes dimensions and applies clamping', () => {
    const controller = new OmniCropController({
      aspect: 1,
      restrictPosition: true,
    });

    const completeCallback = vi.fn();
    controller.on('complete', completeCallback);

    controller.initDimensions(
      { width: 400, height: 400 },
      { width: 800, height: 600 }
    );

    const state = controller.getState();
    expect(state.cropSize.width).toBeGreaterThan(0);
    expect(state.cropSize.width).toBe(state.cropSize.height);
    expect(completeCallback).toHaveBeenCalledTimes(1);
  });

  it('rotates and flips correctly', () => {
    const controller = new OmniCropController({ aspect: 1 });
    controller.initDimensions(
      { width: 400, height: 400 },
      { width: 800, height: 800 }
    );

    expect(controller.getState().rotation).toBe(0);

    controller.rotate(90);
    expect(controller.getState().rotation).toBe(90);

    controller.rotate(270);
    expect(controller.getState().rotation).toBe(0);

    expect(controller.getState().flip.horizontal).toBe(false);
    controller.flipHorizontal();
    expect(controller.getState().flip.horizontal).toBe(true);
    controller.flipHorizontal();
    expect(controller.getState().flip.horizontal).toBe(false);
  });

  it('generates proper transform CSS string', () => {
    const controller = new OmniCropController();
    controller.initDimensions(
      { width: 400, height: 400 },
      { width: 800, height: 800 }
    );

    controller.setCrop({ x: 10, y: 20 });
    controller.setZoom(1.5);
    controller.setRotation(45);

    const style = controller.getTransformStyle();
    expect(style).toContain('translate3d(10px, 20px, 0)');
    expect(style).toContain('rotate(45deg)');
    expect(style).toContain('scale(1.5, 1.5)');
  });
});
