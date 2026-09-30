"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../core/index.js");
const index_2 = require("../exporter/index.js");
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
        'fineAngle': function (fineAngle) {
            if (this.controller && this.controller.getState().fineAngle !== fineAngle) {
                this.setFineAngle(fineAngle);
            }
        },
    },
    lifetimes: {
        attached() {
            this.canvasDriver = new index_2.WechatCanvas2DDriver();
            this.controller = new index_1.OmniCropController({
                aspect: this.data.aspect,
                cropShape: this.data.cropShape,
                cropMode: this.data.cropMode,
                restrictPosition: this.data.restrictPosition,
                autoZoomOnRotate: this.data.autoZoomOnRotate,
                initialFineAngle: this.data.fineAngle,
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
        detached() {
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
        onWxsTouchStart() {
            if (this.data.showGrid === 'touch') {
                if (this.gridTouchTimer) {
                    clearTimeout(this.gridTouchTimer);
                    this.gridTouchTimer = null;
                }
                this.setData({ isGridTouching: true });
            }
        },
        onWxsTouchEnd() {
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
         * Imperative API: Set fine rotation angle (-45° ~ +45°) with smart auto-zoom
         */
        setFineAngle(angle) {
            const oldAngle = this.controller.getState().fineAngle;
            this.controller.setFineAngle(angle);
            const newAngle = this.controller.getState().fineAngle;
            if (this.data.enableHaptic && oldAngle !== 0 && newAngle === 0) {
                try {
                    wx.vibrateShort({ type: 'light' });
                }
                catch (_e) { }
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
        setFilter(filter) {
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
        getCropData() {
            return this.controller.getCropData();
        },
        /**
         * Imperative API: Rotate clockwise
         */
        rotate(stepAngle = 90) {
            if (this.data.enableHaptic) {
                try {
                    wx.vibrateShort({ type: 'light' });
                }
                catch (_e) { }
            }
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
            this.setData({
                filterStyle: this.controller.getFilterStyle(),
            });
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
                return await (0, index_2.getCroppedImage)({
                    imageSrc: this.data.image,
                    pixelCrop: this.currentPixels,
                    rotation: this.controller.getTotalRotation(),
                    flip: state.flip,
                    cropShape: this.data.cropShape,
                    filter: state.filter,
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
//# sourceMappingURL=index.js.map