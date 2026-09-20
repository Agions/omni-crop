declare const Component: any;
declare const wx: any;

import { OmniCropController, AreaPixels, AreaPercent } from '../core';
import { getCroppedImage, WechatCanvas2DDriver, ExportOptions, CropResult } from '../exporter';

Component({
  properties: {
    image: {
      type: String,
      value: '',
    },
    cropMode: {
      type: String,
      value: 'transform-media', // 'transform-media' | 'resize-box'
    },
    cropShape: {
      type: String,
      value: 'rect', // 'rect' | 'round'
    },
    aspect: {
      type: null,
      value: 4 / 3, // number or 'free'
    },
    showGrid: {
      type: Boolean,
      value: true,
    },
    restrictPosition: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    cropSize: { width: 0, height: 0 },
    wxsProps: {
      scale: 1,
      rotation: 0,
      x: 0,
      y: 0,
      flipH: false,
      flipV: false,
    },
  },

  lifetimes: {
    attached(this: any) {
      this.canvasDriver = new WechatCanvas2DDriver();
      this.controller = new OmniCropController({
        aspect: this.data.aspect,
        cropShape: this.data.cropShape,
        cropMode: this.data.cropMode,
        restrictPosition: this.data.restrictPosition,
      });

      this.controller.on('complete', (pixels: AreaPixels, percentages: AreaPercent) => {
        this.currentPixels = pixels;
        this.triggerEvent('cropcomplete', {
          croppedAreaPixels: pixels,
          croppedAreaPercentages: percentages,
        });
      });

      this.controller.on('change', (state: any) => {
        this.triggerEvent('zoomchange', {
          zoom: Number(state.zoom.toFixed(2)),
        });
        this.triggerEvent('cropchange', {
          x: Number(state.crop.x.toFixed(1)),
          y: Number(state.crop.y.toFixed(1)),
        });
      });
    },
  },

  methods: {
    onImageLoaded(this: any, e: any) {
      const { width, height } = e.detail;
      this.naturalSize = { width, height };

      const query = this.createSelectorQuery();
      query
        .select('.omni-crop-container')
        .boundingClientRect((res: any) => {
          if (!res) return;
          const containerSize = { width: res.width, height: res.height };
          this.controller.initDimensions(containerSize, this.naturalSize);

          const state = this.controller.getState();
          this.setData({
            cropSize: state.cropSize,
            wxsProps: {
              scale: state.zoom,
              rotation: state.rotation,
              x: state.crop.x,
              y: state.crop.y,
              flipH: state.flip.horizontal,
              flipV: state.flip.vertical,
            },
          });
        })
        .exec();
    },

    onImageError(this: any, err: any) {
      this.triggerEvent('error', err);
    },

    onWxsGestureEnd(this: any, detail: { x: number; y: number; scale: number; rotation: number }) {
      this.controller.setCrop({ x: detail.x, y: detail.y });
      this.controller.setZoom(detail.scale);
      this.controller.setRotation(detail.rotation);
      this.controller.notifyComplete();

      const state = this.controller.getState();
      // Sync back any clamped adjustments
      this.setData({
        wxsProps: {
          scale: state.zoom,
          rotation: state.rotation,
          x: state.crop.x,
          y: state.crop.y,
          flipH: state.flip.horizontal,
          flipV: state.flip.vertical,
        },
      });
    },

    /**
     * Imperative API: Rotate clockwise
     */
    rotate(this: any, stepAngle = 90) {
      this.controller.rotate(stepAngle);
      this.syncStateToWxs();
    },

    /**
     * Imperative API: Flip horizontally
     */
    flipHorizontal(this: any) {
      this.controller.flipHorizontal();
      this.syncStateToWxs();
    },

    /**
     * Imperative API: Flip vertically
     */
    flipVertical(this: any) {
      this.controller.flipVertical();
      this.syncStateToWxs();
    },

    /**
     * Imperative API: Reset transforms
     */
    reset(this: any) {
      this.controller.reset();
      this.syncStateToWxs();
    },

    /**
     * Imperative API: Zoom in
     */
    zoomIn(this: any, step = 0.25) {
      this.controller.zoomIn(step);
      this.syncStateToWxs();
    },

    /**
     * Imperative API: Zoom out
     */
    zoomOut(this: any, step = 0.25) {
      this.controller.zoomOut(step);
      this.syncStateToWxs();
    },

    /**
     * Imperative API: Set specific zoom level
     */
    setZoom(this: any, zoom: number) {
      this.controller.setZoom(zoom);
      this.syncStateToWxs();
      this.controller.notifyComplete();
    },

    /**
     * Imperative API: Export cropped image
     */
    async exportCroppedImage(this: any, options?: ExportOptions): Promise<CropResult> {
      if (!this.currentPixels) {
        throw new Error('Image dimensions not initialized or crop not ready');
      }

      const state = this.controller.getState();
      return getCroppedImage({
        imageSrc: this.data.image,
        pixelCrop: this.currentPixels,
        rotation: state.rotation,
        flip: state.flip,
        output: options,
        driver: this.canvasDriver,
      });
    },

    syncStateToWxs(this: any) {
      const state = this.controller.getState();
      this.setData({
        wxsProps: {
          scale: state.zoom,
          rotation: state.rotation,
          x: state.crop.x,
          y: state.crop.y,
          flipH: state.flip.horizontal,
          flipV: state.flip.vertical,
        },
      });
    },
  },
});
