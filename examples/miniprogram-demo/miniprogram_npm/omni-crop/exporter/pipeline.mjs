/**
 * High-level image cropping pipeline
 */
export async function getCroppedImage(options) {
    const { imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }, cropShape = 'rect', filter, output = {}, driver, } = options;
    if (!driver) {
        throw new Error('Platform driver is required to export cropped image.');
    }
    // Concurrency mutex check on driver
    if (driver._isExporting) {
        throw new Error('[omni-crop] Export is already in progress. Please wait for current export to finish.');
    }
    driver._isExporting = true;
    try {
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
        // Default to PNG when circular clipping is active to preserve transparent alpha background
        const effectiveOutput = {
            ...output,
            cropShape: output.cropShape ?? cropShape,
            format: output.format ?? (cropShape === 'round' ? 'png' : 'jpg'),
        };
        // 3. Create offscreen canvas with target DPR
        const dpr = effectiveOutput.dpr ?? 1;
        const canvas = await driver.createOffscreenCanvas(outW, outH, dpr);
        // 4. Render transformed portion into canvas
        await driver.render(canvas, {
            imageSource: image,
            pixelCrop,
            rotation,
            flip,
            cropShape,
            outputWidth: outW * dpr,
            outputHeight: outH * dpr,
            filter: effectiveOutput.filter ?? filter,
        });
        // 5. Export canvas to file path or Base64
        return await driver.export(canvas, effectiveOutput);
    }
    finally {
        driver._isExporting = false;
    }
}
