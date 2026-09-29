import { OmniCropController } from '../core/index.mjs';
import { getCroppedImage, WechatCanvas2DDriver } from '../exporter/index.mjs';
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
            cropMode: 'transform-media',
            cropW: 0,
            cropH: 0,
            containerW: 0,
            containerH: 0,
            aspect: 4 / 3,
        },
    },
    observers: {
        'cropMode': function (cropMode) {
            if (this.controller) {
                this.controller.setCropMode(cropMode);
                this.syncStateToWxs();
            }
        },
        'aspect': function (aspect) {
            if (this.controller) {
                this.controller.setAspect(aspect);
                this.syncStateToWxs();
            }
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
            this.controller.on('complete', (pixels, percentages) => {
                this.currentPixels = pixels;
                this.triggerEvent('cropcomplete', {
                    croppedAreaPixels: pixels,
                    croppedAreaPercentages: percentages,
                });
            });
            this.controller.on('change', (state) => {
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
        onImageLoaded(e) {
            const { width, height } = e.detail;
            this.naturalSize = { width, height };
            const query = this.createSelectorQuery();
            query
                .select('.omni-crop-container')
                .boundingClientRect((res) => {
                if (!res)
                    return;
                const containerSize = { width: res.width, height: res.height };
                this.controller.initDimensions(containerSize, this.naturalSize);
                this.syncStateToWxs();
            })
                .exec();
        },
        onImageError(err) {
            this.triggerEvent('error', err);
        },
        onWxsResizeEnd(detail) {
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
        onWxsGestureEnd(detail) {
            this.controller.setCrop({ x: detail.x, y: detail.y });
            this.controller.setZoom(detail.scale);
            this.controller.setRotation(detail.rotation);
            this.controller.notifyComplete();
            this.syncStateToWxs();
        },
        /**
         * Imperative API: Rotate clockwise
         */
        rotate(stepAngle = 90) {
            this.controller.rotate(stepAngle);
            this.syncStateToWxs();
        },
        /**
         * Imperative API: Flip horizontally
         */
        flipHorizontal() {
            this.controller.flipHorizontal();
            this.syncStateToWxs();
        },
        /**
         * Imperative API: Flip vertically
         */
        flipVertical() {
            this.controller.flipVertical();
            this.syncStateToWxs();
        },
        /**
         * Imperative API: Reset transforms
         */
        reset() {
            this.controller.reset();
            this.syncStateToWxs();
        },
        /**
         * Imperative API: Zoom in
         */
        zoomIn(step = 0.25) {
            this.controller.zoomIn(step);
            this.syncStateToWxs();
        },
        /**
         * Imperative API: Zoom out
         */
        zoomOut(step = 0.25) {
            this.controller.zoomOut(step);
            this.syncStateToWxs();
        },
        /**
         * Imperative API: Set specific zoom level
         */
        setZoom(zoom) {
            this.controller.setZoom(zoom);
            this.syncStateToWxs();
            this.controller.notifyComplete();
        },
        /**
         * Imperative API: Set crop mode
         */
        setCropMode(mode) {
            this.setData({ cropMode: mode });
            this.controller.setCropMode(mode);
            this.syncStateToWxs();
        },
        /**
         * Imperative API: Set aspect ratio
         */
        setAspect(aspect) {
            this.setData({ aspect });
            this.controller.setAspect(aspect);
            this.syncStateToWxs();
        },
        /**
         * Imperative API: Export cropped image
         */
        async exportCroppedImage(options) {
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
                    rotation: state.rotation,
                    flip: state.flip,
                    cropShape: this.data.cropShape,
                    output: options,
                    driver: this.canvasDriver,
                });
            }
            finally {
                this._isExporting = false;
            }
        },
        syncStateToWxs() {
            if (!this.controller)
                return;
            const state = this.controller.getState();
            const containerSize = this.controller.getContainerSize();
            this.setData({
                cropSize: state.cropSize,
                wxsProps: {
                    scale: state.zoom,
                    rotation: state.rotation,
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
