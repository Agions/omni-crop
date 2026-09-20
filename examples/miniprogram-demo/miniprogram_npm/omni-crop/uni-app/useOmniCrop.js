"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOmniCrop = useOmniCrop;
const vue_1 = require("vue");
const core_1 = require("../core");
const exporter_1 = require("../exporter");
function useOmniCrop(options) {
    const transformStyle = (0, vue_1.ref)('');
    const cropBoxSize = (0, vue_1.reactive)({ width: 0, height: 0 });
    const currentPixels = (0, vue_1.ref)(null);
    const controller = new core_1.OmniCropController({
        aspect: options.aspect,
        cropShape: options.cropShape,
        cropMode: options.cropMode,
        restrictPosition: options.restrictPosition,
    });
    let unbindChange = null;
    let unbindComplete = null;
    (0, vue_1.onMounted)(() => {
        unbindChange = controller.on('change', (state) => {
            transformStyle.value = controller.getTransformStyle();
            options.onCropChange?.(state.crop);
        });
        unbindComplete = controller.on('complete', (pixels, percent) => {
            currentPixels.value = pixels;
            options.onCropComplete?.(pixels, percent);
        });
    });
    (0, vue_1.onUnmounted)(() => {
        unbindChange?.();
        unbindComplete?.();
    });
    const initDimensions = (containerSize, naturalSize) => {
        controller.initDimensions(containerSize, naturalSize);
        const state = controller.getState();
        cropBoxSize.width = state.cropSize.width;
        cropBoxSize.height = state.cropSize.height;
        transformStyle.value = controller.getTransformStyle();
    };
    const rotate = (step = 90) => {
        controller.rotate(step);
        transformStyle.value = controller.getTransformStyle();
    };
    const flipHorizontal = () => {
        controller.flipHorizontal();
        transformStyle.value = controller.getTransformStyle();
    };
    const flipVertical = () => {
        controller.flipVertical();
        transformStyle.value = controller.getTransformStyle();
    };
    const reset = () => {
        controller.reset();
        transformStyle.value = controller.getTransformStyle();
    };
    const exportCroppedImage = async (exportOpts) => {
        if (!currentPixels.value) {
            throw new Error('Image not loaded or crop not ready');
        }
        const state = controller.getState();
        // Dynamically detect platform driver in uni-app
        // @ts-ignore
        const isWechat = typeof wx !== 'undefined' && typeof wx.createOffscreenCanvas === 'function';
        const driver = isWechat ? new exporter_1.WechatCanvas2DDriver() : new exporter_1.WebCanvasDriver();
        return (0, exporter_1.getCroppedImage)({
            imageSrc: options.image,
            pixelCrop: currentPixels.value,
            rotation: state.rotation,
            flip: state.flip,
            output: exportOpts,
            driver,
        });
    };
    return {
        controller,
        transformStyle,
        cropBoxSize,
        currentPixels,
        initDimensions,
        rotate,
        flipHorizontal,
        flipVertical,
        reset,
        exportCroppedImage,
    };
}
//# sourceMappingURL=useOmniCrop.js.map