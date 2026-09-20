const { OmniCropController } = require('./core/controller');
const { WechatCanvas2DDriver } = require('./exporter/wechat');
const { getCroppedImage } = require('./exporter/pipeline');

Component({
  properties: {
    image: {
      type: String,
      value: '',
      observer(newVal) {
        if (newVal && this.controller) {
          // If image changes, re-init
          this.naturalSize = null;
        }
      },
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
      observer(newVal) {
        if (this.controller) {
          this.controller.setAspect(newVal);
          this.syncStateToView();
        }
      },
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
    attached() {
      this.canvasDriver = new WechatCanvas2DDriver();
      this.controller = new OmniCropController({
        aspect: this.data.aspect,
        cropShape: this.data.cropShape,
        cropMode: this.data.cropMode,
        restrictPosition: this.data.restrictPosition,
      });

      this.controller.on('change', (state) => {
        this.triggerEvent('zoomchange', {
          zoom: Number(state.zoom.toFixed(2)),
        });
      });

      this.controller.on('complete', (pixels, percentages) => {
        const state = this.controller.getState();
        this.currentPixels = pixels;
        this.triggerEvent('cropcomplete', {
          croppedAreaPixels: pixels,
          croppedAreaPercentages: percentages,
          zoom: Number(state.zoom.toFixed(2)),
        });
      });
    },
  },

  methods: {
    onImageLoaded(e) {
      const { width, height } = e.detail;
      this.naturalSize = { width, height };

      const query = this.createSelectorQuery();
      query
        .select('.omni-crop-container')
        .boundingClientRect((res) => {
          if (!res) return;
          const containerSize = { width: res.width, height: res.height };
          this.controller.initDimensions(containerSize, this.naturalSize);
          this.syncStateToView();

          const state = this.controller.getState();
          this.triggerEvent('zoomchange', {
            zoom: Number(state.zoom.toFixed(2)),
          });
        })
        .exec();
    },

    onImageError(err) {
      this.triggerEvent('error', err);
    },

    onWxsGestureEnd(detail) {
      this.controller.setCrop({ x: detail.x, y: detail.y });
      this.controller.setZoom(detail.scale);
      this.controller.setRotation(detail.rotation);
      this.controller.notifyComplete();

      this.syncStateToView();
    },

    /**
     * 命令式 API：顺时针旋转指定角度
     */
    rotate(stepAngle = 90) {
      this.controller.rotate(stepAngle);
      this.syncStateToView();
    },

    /**
     * 命令式 API：水平镜像翻转
     */
    flipHorizontal() {
      this.controller.flipHorizontal();
      this.syncStateToView();
    },

    /**
     * 命令式 API：垂直镜像翻转
     */
    flipVertical() {
      this.controller.flipVertical();
      this.syncStateToView();
    },

    /**
     * 命令式 API：重置所有缩放与位移
     */
    reset() {
      this.controller.reset();
      this.syncStateToView();
    },

    /**
     * 命令式 API：放大
     */
    zoomIn(step = 0.25) {
      this.controller.zoomIn(step);
      this.syncStateToView();
    },

    /**
     * 命令式 API：缩小
     */
    zoomOut(step = 0.25) {
      this.controller.zoomOut(step);
      this.syncStateToView();
    },

    /**
     * 命令式 API：设置指定缩放比例
     */
    setZoom(zoom) {
      this.controller.setZoom(zoom);
      this.syncStateToView();
      this.controller.notifyComplete();
    },

    /**
     * 命令式 API：导出裁剪后的图片
     */
    async exportCroppedImage(options = {}) {
      if (!this.currentPixels) {
        throw new Error('图片尚未加载完成或裁剪尺寸未就绪');
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

    syncStateToView() {
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
          minZoom: 0.2,
          maxZoom: 8.0,
        },
      });
    },
  },
});
