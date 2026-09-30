declare const Component: any;
declare const wx: any;

import {
  OmniCropController,
  AreaPixels,
  AreaPercent,
  CropFilterOptions,
  CropDataResult,
} from '../core/index';
import {
  getCroppedImage,
  WechatCanvas2DDriver,
  ExportOptions,
  CropResult,
} from '../exporter/index';

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
      type: null,
      value: true, // boolean | 'touch'
    },
    restrictPosition: {
      type: Boolean,
      value: true,
    },
    autoZoomOnRotate: {
      type: Boolean,
      value: true,
    },
    enableHaptic: {
      type: Boolean,
      value: true,
    },
    fineAngle: {
      type: Number,
      value: 0,
    },
  },

  data: {
    cropSize: { width: 0, height: 0 },
    filterStyle: '',
    isGridTouching: false,
    wxsProps: {
      scale: 1,
      rotation: 0,
      fineAngle: 0,
      x: 0,
      y: 0,
      flipH: false,
      flipV: false,
      cropMode: 'transform-media',
      cropW: 0,
      cropH: 0,
      containerW: 0,
      containerH: 0,
      aspect: 4 / 3,
    },
  },

  observers: {
    'cropMode': function (this: any, cropMode: string) {
      if (this.controller) {
        this.controller.setCropMode(cropMode);
        this.syncStateToWxs();
      }
    },
    'aspect': function (this: any, aspect: any) {
      if (this.controller) {
        this.controller.setAspect(aspect);
        this.syncStateToWxs();
      }
    },
    'fineAngle': function (this: any, fineAngle: number) {
      if (this.controller && this.controller.getState().fineAngle !== fineAngle) {
        this.setFineAngle(fineAngle);
      }
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
        autoZoomOnRotate: this.data.autoZoomOnRotate,
        initialFineAngle: this.data.fineAngle,
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

    detached(this: any) {
      // Memory lifecycle governance: destroy canvas and cleanup references
      if (this.canvasDriver && typeof this.canvasDriver.destroy === 'function') {
        this.canvasDriver.destroy();
      }
      this.canvasDriver = null;
      this.controller = null;
      if (this.gridTouchTimer) {
        clearTimeout(this.gridTouchTimer);
        this.gridTouchTimer = null;
      }
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
          this.syncStateToWxs();
        })
        .exec();
    },

    onImageError(this: any, err: any) {
      this.triggerEvent('error', err);
    },

    onWxsTouchStart(this: any) {
      if (this.data.showGrid === 'touch') {
        if (this.gridTouchTimer) {
          clearTimeout(this.gridTouchTimer);
          this.gridTouchTimer = null;
        }
        this.setData({ isGridTouching: true });
      }
    },

    onWxsTouchEnd(this: any) {
      if (this.data.showGrid === 'touch') {
        if (this.gridTouchTimer) {
          clearTimeout(this.gridTouchTimer);
        }
        this.gridTouchTimer = setTimeout(() => {
          this.setData({ isGridTouching: false });
          this.gridTouchTimer = null;
        }, 400);
      }
    },

    onWxsResizeEnd(this: any, detail: { width: number; height: number }) {
      this.controller.setCropSize({ width: detail.width, height: detail.height });
      const state = this.controller.getState();
      this.setData({
        cropSize: state.cropSize,
      });
      this.triggerEvent('cropsizechange', {
        width: state.cropSize.width,
        height: state.cropSize.height,
      });
      this.syncStateToWxs();
    },

    onWxsGestureEnd(this: any, detail: { x: number; y: number; scale: number; rotation: number }) {
      this.controller.setCrop({ x: detail.x, y: detail.y });
      this.controller.setZoom(detail.scale);
      this.controller.setRotation(detail.rotation);
      this.controller.notifyComplete();
      this.syncStateToWxs();
    },

    /**
     * Imperative API: Set fine rotation angle (-45° ~ +45°) with smart auto-zoom
     */
    setFineAngle(this: any, angle: number) {
      const oldAngle = this.controller.getState().fineAngle;
      this.controller.setFineAngle(angle);
      const newAngle = this.controller.getState().fineAngle;

      if (this.data.enableHaptic && oldAngle !== 0 && newAngle === 0) {
        try {
          wx.vibrateShort({ type: 'light' });
        } catch (_e) {}
      }

      this.syncStateToWxs();
      this.triggerEvent('fineanglechange', {
        fineAngle: newAngle,
        totalRotation: this.controller.getTotalRotation(),
      });
    },

    /**
     * Imperative API: Set real-time filter (GPU preview + Canvas shader)
     */
    setFilter(this: any, filter: Partial<CropFilterOptions>) {
      this.controller.setFilter(filter);
      const filterStyle = this.controller.getFilterStyle();
      this.setData({ filterStyle });
      this.triggerEvent('filterchange', {
        filter: this.controller.getState().filter,
      });
    },

    /**
     * Imperative API: Get full mathematical crop dataset and CDN query params
     */
    getCropData(this: any): CropDataResult {
      return this.controller.getCropData();
    },

    /**
     * Imperative API: Rotate clockwise
     */
    rotate(this: any, stepAngle = 90) {
      if (this.data.enableHaptic) {
        try {
          wx.vibrateShort({ type: 'light' });
        } catch (_e) {}
      }
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
      this.setData({
        filterStyle: this.controller.getFilterStyle(),
      });
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
     * Imperative API: Set crop mode
     */
    setCropMode(this: any, mode: 'transform-media' | 'resize-box') {
      this.setData({ cropMode: mode });
      this.controller.setCropMode(mode);
      this.syncStateToWxs();
    },

    /**
     * Imperative API: Set aspect ratio
     */
    setAspect(this: any, aspect: number | 'free') {
      this.setData({ aspect });
      this.controller.setAspect(aspect);
      this.syncStateToWxs();
    },

    /**
     * Imperative API: Export cropped image
     */
    async exportCroppedImage(this: any, options?: ExportOptions): Promise<CropResult> {
      if (this._isExporting) {
        throw new Error('Export is already in progress');
      }
      if (!this.currentPixels) {
        throw new Error('Image dimensions not initialized or crop not ready');
      }

      this._isExporting = true;
      try {
        const state = this.controller.getState();
        return await getCroppedImage({
          imageSrc: this.data.image,
          pixelCrop: this.currentPixels,
          rotation: this.controller.getTotalRotation(),
          flip: state.flip,
          cropShape: this.data.cropShape,
          filter: state.filter,
          output: options,
          driver: this.canvasDriver,
        });
      } finally {
        this._isExporting = false;
      }
    },

    syncStateToWxs(this: any) {
      if (!this.controller) return;
      const state = this.controller.getState();
      const containerSize = this.controller.getContainerSize();
      this.setData({
        cropSize: state.cropSize,
        wxsProps: {
          scale: state.zoom,
          rotation: state.rotation,
          fineAngle: state.fineAngle,
          x: state.crop.x,
          y: state.crop.y,
          flipH: state.flip.horizontal,
          flipV: state.flip.vertical,
          cropMode: this.data.cropMode,
          cropW: state.cropSize.width,
          cropH: state.cropSize.height,
          containerW: containerSize.width,
          containerH: containerSize.height,
          aspect: this.data.aspect,
        },
      });
    },
  },
});
