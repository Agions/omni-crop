import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { OmniCropController, } from '../core/index.mjs';
import { getCroppedImage, WechatCanvas2DDriver, WebCanvasDriver, } from '../exporter/index.mjs';
export function useOmniCrop(options) {
    const transformStyle = ref('');
    const cropBoxSize = reactive({ width: 0, height: 0 });
    const currentPixels = ref(null);
    const controller = new OmniCropController({
        aspect: options.aspect,
        cropShape: options.cropShape,
        cropMode: options.cropMode,
        restrictPosition: options.restrictPosition,
    });
    let unbindChange = null;
    let unbindComplete = null;
    onMounted(() => {
        unbindChange = controller.on('change', (state) => {
            transformStyle.value = controller.getTransformStyle();
            options.onCropChange?.(state.crop);
        });
        unbindComplete = controller.on('complete', (pixels, percent) => {
            currentPixels.value = pixels;
            options.onCropComplete?.(pixels, percent);
        });
    });
    onUnmounted(() => {
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
        const driver = isWechat ? new WechatCanvas2DDriver() : new WebCanvasDriver();
        return getCroppedImage({
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
