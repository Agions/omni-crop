"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../core");
const exporter_1 = require("../exporter");
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
        attached() {
            this.canvasDriver = new exporter_1.WechatCanvas2DDriver();
            this.controller = new core_1.OmniCropController({
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
        onImageError(err) {
            this.triggerEvent('error', err);
        },
        onWxsGestureEnd(detail) {
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
         * Imperative API: Export cropped image
         */
        async exportCroppedImage(options) {
            if (!this.currentPixels) {
                throw new Error('Image dimensions not initialized or crop not ready');
            }
            const state = this.controller.getState();
            return (0, exporter_1.getCroppedImage)({
                imageSrc: this.data.image,
                pixelCrop: this.currentPixels,
                rotation: state.rotation,
                flip: state.flip,
                output: options,
                driver: this.canvasDriver,
            });
        },
        syncStateToWxs() {
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
//# sourceMappingURL=index.js.map