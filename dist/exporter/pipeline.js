"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCroppedImage = getCroppedImage;
/**
 * High-level image cropping pipeline
 */
async function getCroppedImage(options) {
    const { imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }, output = {}, driver, } = options;
    if (!driver) {
        throw new Error('Platform driver is required to export cropped image.');
    }
    // 1. Preload image & inspect size
    const { image } = await driver.loadImage(imageSrc);
    // 2. Compute output dimensions based on pixelCrop and maxResolution
    let outW = Math.max(1, pixelCrop.width);
    let outH = Math.max(1, pixelCrop.height);
    const maxRes = output.maxResolution ?? 4096;
    const maxSide = Math.max(outW, outH);
    if (maxSide > maxRes) {
        const ratio = maxRes / maxSide;
        outW = Math.round(outW * ratio);
        outH = Math.round(outH * ratio);
    }
    // 3. Create offscreen canvas with target DPR
    const dpr = output.dpr ?? 1;
    const canvas = await driver.createOffscreenCanvas(outW, outH, dpr);
    // 4. Render transformed portion into canvas
    await driver.render(canvas, {
        imageSource: image,
        pixelCrop,
        rotation,
        flip,
        outputWidth: outW * dpr,
        outputHeight: outH * dpr,
    });
    // 5. Export canvas to file path or Base64
    return driver.export(canvas, output);
}
//# sourceMappingURL=pipeline.js.map