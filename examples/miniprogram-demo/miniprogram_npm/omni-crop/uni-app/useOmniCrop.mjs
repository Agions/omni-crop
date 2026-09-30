import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { OmniCropController, } from '../core/index.mjs';
import { getCroppedImage, WechatCanvas2DDriver, WebCanvasDriver, } from '../exporter/index.mjs';
export function useOmniCrop(options) {
    const transformStyle = ref('');
    const filterStyle = ref('');
    const cropBoxSize = reactive({ width: 0, height: 0 });
    const currentPixels = ref(null);
    const controller = new OmniCropController({
        aspect: options.aspect,
        cropShape: options.cropShape,
        cropMode: options.cropMode,
        restrictPosition: options.restrictPosition,
        autoZoomOnRotate: options.autoZoomOnRotate,
        initialFineAngle: options.fineAngle,
    });
    let unbindChange = null;
    let unbindComplete = null;
    let activeDriver = null;
    onMounted(() => {
        unbindChange = controller.on('change', (state) => {
            transformStyle.value = controller.getTransformStyle();
            filterStyle.value = controller.getFilterStyle();
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
        if (activeDriver && typeof activeDriver.destroy === 'function') {
            activeDriver.destroy();
            activeDriver = null;
        }
    });
    const initDimensions = (containerSize, naturalSize) => {
        controller.initDimensions(containerSize, naturalSize);
        const state = controller.getState();
        cropBoxSize.width = state.cropSize.width;
        cropBoxSize.height = state.cropSize.height;
        transformStyle.value = controller.getTransformStyle();
        filterStyle.value = controller.getFilterStyle();
    };
    const rotate = (step = 90) => {
        controller.rotate(step);
        transformStyle.value = controller.getTransformStyle();
    };
    const setFineAngle = (angle) => {
        controller.setFineAngle(angle);
        transformStyle.value = controller.getTransformStyle();
    };
    const setFilter = (filter) => {
        controller.setFilter(filter);
        filterStyle.value = controller.getFilterStyle();
    };
    const getCropData = () => {
        return controller.getCropData();
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
        filterStyle.value = controller.getFilterStyle();
    };
    const exportCroppedImage = async (exportOpts) => {
        if (!currentPixels.value) {
            throw new Error('Image not loaded or crop not ready');
        }
        const state = controller.getState();
        // Dynamically detect platform driver in uni-app
        // @ts-ignore
        const isWechat = typeof wx !== 'undefined' && typeof wx.createOffscreenCanvas === 'function';
        if (!activeDriver) {
            activeDriver = isWechat ? new WechatCanvas2DDriver() : new WebCanvasDriver();
        }
        return getCroppedImage({
            imageSrc: options.image,
            pixelCrop: currentPixels.value,
            rotation: controller.getTotalRotation(),
            flip: state.flip,
            cropShape: options.cropShape,
            filter: state.filter,
            output: exportOpts,
            driver: activeDriver,
        });
    };
    return {
        controller,
        transformStyle,
        filterStyle,
        cropBoxSize,
        currentPixels,
        initDimensions,
        rotate,
        setFineAngle,
        setFilter,
        getCropData,
        flipHorizontal,
        flipVertical,
        reset,
        exportCroppedImage,
    };
}
