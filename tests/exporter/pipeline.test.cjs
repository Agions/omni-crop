const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getCroppedImage } = require('../../dist/exporter/index.js');

class MockCanvasDriver {
  constructor() {
    this.name = 'mock-driver';
    this.renderCalls = [];
    this.exportCalls = [];
    this.delay = 0;
  }

  async loadImage(source) {
    return {
      image: { src: source },
      width: 1000,
      height: 800,
    };
  }

  async createOffscreenCanvas(width, height, dpr = 1) {
    return {
      width,
      height,
      dpr,
      contexts: [],
    };
  }

  async render(canvas, params) {
    this.renderCalls.push({ canvas, params });
    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }
  }

  async export(canvas, options) {
    this.exportCalls.push({ canvas, options });
    return {
      uri: 'mock://cropped-output.' + (options.format || 'jpg'),
      width: canvas.width,
      height: canvas.height,
    };
  }
}

describe('Exporter Pipeline & Drivers', () => {
  it('correctly crops rect shape with default jpg format', async () => {
    const driver = new MockCanvasDriver();
    const result = await getCroppedImage({
      imageSrc: 'test.jpg',
      pixelCrop: { x: 10, y: 20, width: 200, height: 150 },
      rotation: 0,
      flip: { horizontal: false, vertical: false },
      cropShape: 'rect',
      driver,
    });

    assert.equal(result.width, 200);
    assert.equal(result.height, 150);
    assert.equal(driver.renderCalls.length, 1);
    assert.equal(driver.renderCalls[0].params.cropShape, 'rect');
    assert.equal(driver.exportCalls[0].options.format, 'jpg');
  });

  it('correctly defaults format to png when cropShape is round for transparency preservation', async () => {
    const driver = new MockCanvasDriver();
    const result = await getCroppedImage({
      imageSrc: 'avatar.jpg',
      pixelCrop: { x: 50, y: 50, width: 300, height: 300 },
      cropShape: 'round',
      driver,
    });

    assert.equal(result.width, 300);
    assert.equal(result.height, 300);
    assert.equal(driver.renderCalls[0].params.cropShape, 'round');
    // Transparency protection: must export as PNG
    assert.equal(driver.exportCalls[0].options.format, 'png');
    assert.equal(result.uri, 'mock://cropped-output.png');
  });

  it('applies maxResolution downsampling safely to avoid OOM memory crashes', async () => {
    const driver = new MockCanvasDriver();
    const result = await getCroppedImage({
      imageSrc: 'giant.jpg',
      pixelCrop: { x: 0, y: 0, width: 6000, height: 3000 },
      output: { maxResolution: 2000 },
      driver,
    });

    assert.equal(result.width, 2000);
    assert.equal(result.height, 1000);
  });

  it('enforces concurrency mutex lock on the driver to prevent race conditions', async () => {
    const driver = new MockCanvasDriver();
    driver.delay = 50; // Add simulated rendering latency

    const promise1 = getCroppedImage({
      imageSrc: 'test.jpg',
      pixelCrop: { x: 0, y: 0, width: 100, height: 100 },
      driver,
    });

    // Rapid concurrent second call while first is in progress
    await assert.rejects(
      async () => {
        await getCroppedImage({
          imageSrc: 'test.jpg',
          pixelCrop: { x: 0, y: 0, width: 100, height: 100 },
          driver,
        });
      },
      {
        message: /Export is already in progress/,
      }
    );

    // First call should resolve cleanly
    const res1 = await promise1;
    assert.equal(res1.width, 100);

    // Once done, mutex is released and next call succeeds
    const res2 = await getCroppedImage({
      imageSrc: 'test.jpg',
      pixelCrop: { x: 0, y: 0, width: 100, height: 100 },
      driver,
    });
    assert.equal(res2.width, 100);
  });
});
