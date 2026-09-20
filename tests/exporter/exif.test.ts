import { describe, it, expect } from 'vitest';
import { getExifCorrection } from '../src/exif';

describe('EXIF Parser & Correction', () => {
  it('correctly maps orientation flags to rotation & flip', () => {
    // Normal
    expect(getExifCorrection(1)).toEqual({ rotation: 0, flipHorizontal: false });

    // Flip horizontal
    expect(getExifCorrection(2)).toEqual({ rotation: 0, flipHorizontal: true });

    // Rotate 180
    expect(getExifCorrection(3)).toEqual({ rotation: 180, flipHorizontal: false });

    // Rotate 90 CW
    expect(getExifCorrection(6)).toEqual({ rotation: 90, flipHorizontal: false });

    // Rotate 270 CW
    expect(getExifCorrection(8)).toEqual({ rotation: 270, flipHorizontal: false });
  });
});
