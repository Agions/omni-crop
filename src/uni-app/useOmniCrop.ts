import { ref, reactive, onMounted, onUnmounted } from 'vue';
import {
  OmniCropController,
  AreaPixels,
  AreaPercent,
  CropMode,
  CropShape,
  Point,
  Size,
} from '../core';
import {
  getCroppedImage,
  WechatCanvas2DDriver,
  WebCanvasDriver,
  ExportOptions,
  CropResult,
} from '../exporter';

export interface UseOmniCropOptions {
  image: string;
  cropMode?: CropMode;
  cropShape?: CropShape;
  aspect?: number | 'free';
  restrictPosition?: boolean;
  onCropChange?: (crop: Point) => void;
  onCropComplete?: (pixels: AreaPixels, percent: AreaPercent) => void;
}

export function useOmniCrop(options: UseOmniCropOptions) {
  const transformStyle = ref('');
  const cropBoxSize = reactive<Size>({ width: 0, height: 0 });
  const currentPixels = ref<AreaPixels | null>(null);

  const controller = new OmniCropController({
    aspect: options.aspect,
    cropShape: options.cropShape,
    cropMode: options.cropMode,
    restrictPosition: options.restrictPosition,
  });

  let unbindChange: (() => void) | null = null;
  let unbindComplete: (() => void) | null = null;

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

  const initDimensions = (containerSize: Size, naturalSize: Size) => {
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

  const exportCroppedImage = async (exportOpts?: ExportOptions): Promise<CropResult> => {
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
