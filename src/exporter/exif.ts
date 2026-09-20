/**
 * Lightweight EXIF orientation parser for JPEG buffers
 * Reads tag 0x0112 (Orientation)
 */
export function getOrientationFromBuffer(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.getUint16(0, false) !== 0xffd8) {
    return 1; // Not a valid JPEG
  }

  const length = view.byteLength;
  let offset = 2;

  while (offset < length) {
    if (view.getUint16(offset + 2, false) <= 8) return 1;
    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xffe1) {
      if (view.getUint32((offset += 2), false) !== 0x45786966) {
        return 1;
      }

      const little = view.getUint16((offset += 6), false) === 0x4949;
      offset += view.getUint32(offset + 4, little);
      const tags = view.getUint16(offset, little);
      offset += 2;

      for (let i = 0; i < tags; i++) {
        if (view.getUint16(offset + i * 12, little) === 0x0112) {
          return view.getUint16(offset + i * 12 + 8, little);
        }
      }
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      offset += view.getUint16(offset, false);
    }
  }

  return 1;
}

export interface ExifCorrection {
  rotation: number;
  flipHorizontal: boolean;
}

/**
 * Maps EXIF orientation (1-8) to rotation angle and horizontal flip
 */
export function getExifCorrection(orientation: number): ExifCorrection {
  switch (orientation) {
    case 2:
      return { rotation: 0, flipHorizontal: true };
    case 3:
      return { rotation: 180, flipHorizontal: false };
    case 4:
      return { rotation: 180, flipHorizontal: true };
    case 5:
      return { rotation: 90, flipHorizontal: true };
    case 6:
      return { rotation: 90, flipHorizontal: false };
    case 7:
      return { rotation: 270, flipHorizontal: true };
    case 8:
      return { rotation: 270, flipHorizontal: false };
    case 1:
    default:
      return { rotation: 0, flipHorizontal: false };
  }
}
