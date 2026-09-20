const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getExifCorrection } = require('../../dist/exporter/index.js');

describe('EXIF Parser & Correction', () => {
  it('correctly maps orientation flags to rotation & flip', () => {
    // Normal
    assert.deepStrictEqual(getExifCorrection(1), { rotation: 0, flipHorizontal: false });

    // Flip horizontal
    assert.deepStrictEqual(getExifCorrection(2), { rotation: 0, flipHorizontal: true });

    // Rotate 180
    assert.deepStrictEqual(getExifCorrection(3), { rotation: 180, flipHorizontal: false });

    // Rotate 90 CW
    assert.deepStrictEqual(getExifCorrection(6), { rotation: 90, flipHorizontal: false });

    // Rotate 270 CW
    assert.deepStrictEqual(getExifCorrection(8), { rotation: 270, flipHorizontal: false });
  });
});
