<template>
  <view
    :id="containerId"
    class="omni-crop-container"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <!-- Target media image -->
    <view class="omni-crop-media-wrapper">
      <image
        :src="image"
        mode="aspectFit"
        class="omni-crop-media"
        :style="{ transform: transformStyle }"
        @load="onImageLoad"
        @error="$emit('error', $event)"
      />
    </view>

    <!-- Crop Overlay -->
    <view
      class="omni-crop-overlay"
      :class="{ 'is-round': cropShape === 'round' }"
      :style="{
        width: `${cropBoxSize.width}px`,
        height: `${cropBoxSize.height}px`
      }"
    >
      <template v-if="showGrid">
        <view class="omni-crop-grid-line line-horizontal line-h-1" />
        <view class="omni-crop-grid-line line-horizontal line-h-2" />
        <view class="omni-crop-grid-line line-vertical line-v-1" />
        <view class="omni-crop-grid-line line-vertical line-v-2" />
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useOmniCrop } from './useOmniCrop';
import type { CropMode, CropShape, AreaPixels, AreaPercent } from '../core';
import type { ExportOptions, CropResult } from '../exporter';

declare const uni: any;

const props = withDefaults(
  defineProps<{
    image: string;
    cropMode?: CropMode;
    cropShape?: CropShape;
    aspect?: number | 'free';
    showGrid?: boolean;
    restrictPosition?: boolean;
  }>(),
  {
    cropMode: 'transform-media',
    cropShape: 'rect',
    aspect: 4 / 3,
    showGrid: true,
    restrictPosition: true,
  }
);

const emit = defineEmits<{
  (e: 'cropChange', crop: { x: number; y: number }): void;
  (e: 'cropComplete', pixels: AreaPixels, percent: AreaPercent): void;
  (e: 'error', error: any): void;
}>();

const containerId = `omni_crop_uni_${Math.random().toString(36).substring(2, 9)}`;

const {
  controller,
  transformStyle,
  cropBoxSize,
  initDimensions,
  rotate,
  flipHorizontal,
  flipVertical,
  reset,
  exportCroppedImage,
} = useOmniCrop({
  image: props.image,
  cropMode: props.cropMode,
  cropShape: props.cropShape,
  aspect: props.aspect,
  restrictPosition: props.restrictPosition,
  onCropChange: (c) => emit('cropChange', c),
  onCropComplete: (pix, pct) => emit('cropComplete', pix, pct),
});

const touchState = ref({
  startX: 0,
  startY: 0,
  initialCrop: { x: 0, y: 0 },
  initialDist: 0,
  initialZoom: 1,
});

const onImageLoad = (e: any) => {
  const { width, height } = e.detail;
  uni.createSelectorQuery()
    .select(`#${containerId}`)
    .boundingClientRect((res: any) => {
      if (!res) return;
      initDimensions({ width: res.width, height: res.height }, { width, height });
    })
    .exec();
};

const onTouchStart = (e: any) => {
  const touches = e.touches;
  if (touches.length === 1) {
    touchState.value.startX = touches[0].clientX;
    touchState.value.startY = touches[0].clientY;
    touchState.value.initialCrop = { ...controller.getState().crop };
  } else if (touches.length >= 2) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    touchState.value.initialDist = Math.sqrt(dx * dx + dy * dy);
    touchState.value.initialZoom = controller.getState().zoom;
  }
};

const onTouchMove = (e: any) => {
  const touches = e.touches;
  if (touches.length === 1) {
    const deltaX = touches[0].clientX - touchState.value.startX;
    const deltaY = touches[0].clientY - touchState.value.startY;
    controller.setCrop({
      x: touchState.value.initialCrop.x + deltaX,
      y: touchState.value.initialCrop.y + deltaY,
    });
  } else if (touches.length >= 2 && touchState.value.initialDist > 0) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    controller.setZoom(touchState.value.initialZoom * (dist / touchState.value.initialDist));
  }
};

const onTouchEnd = () => {
  controller.notifyComplete();
};

defineExpose({
  rotate,
  flipHorizontal,
  flipVertical,
  reset,
  exportCroppedImage,
});
</script>

<style scoped>
.omni-crop-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

.omni-crop-media-wrapper {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.omni-crop-media {
  will-change: transform;
  transform-origin: center center;
}

.omni-crop-overlay {
  position: absolute;
  box-sizing: border-box;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65);
  pointer-events: none;
}

.omni-crop-overlay.is-round {
  border-radius: 50%;
}

.omni-crop-grid-line {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.35);
}

.line-horizontal {
  width: 100%;
  height: 1px;
}
.line-h-1 { top: 33.33%; }
.line-h-2 { top: 66.66%; }

.line-vertical {
  height: 100%;
  width: 1px;
}
.line-v-1 { left: 33.33%; }
.line-v-2 { left: 66.66%; }
</style>
