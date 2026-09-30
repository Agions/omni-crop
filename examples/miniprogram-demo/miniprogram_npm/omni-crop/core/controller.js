"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmniCropController = void 0;
const affine_1 = require("./matrix/affine");
const restrict_1 = require("./boundary/restrict");
const presets_1 = require("./filter/presets");
class OmniCropController {
    constructor(options = {}) {
        this.containerSize = { width: 0, height: 0 };
        this.naturalMediaSize = { width: 0, height: 0 };
        this.renderedMediaSize = { width: 0, height: 0 };
        this.changeListeners = new Set();
        this.completeListeners = new Set();
        const defaultFilter = {
            preset: 'normal',
            brightness: 1,
            contrast: 1,
            saturation: 1,
        };
        this.options = {
            cropMode: options.cropMode || 'transform-media',
            cropShape: options.cropShape || 'rect',
            aspect: options.aspect !== undefined ? options.aspect : 4 / 3,
            minZoom: options.minZoom || 1,
            maxZoom: options.maxZoom || 3,
            zoomSpeed: options.zoomSpeed || 1,
            restrictPosition: options.restrictPosition !== undefined ? options.restrictPosition : true,
            autoZoomOnRotate: options.autoZoomOnRotate !== undefined ? options.autoZoomOnRotate : true,
            initialCrop: options.initialCrop || { x: 0, y: 0 },
            initialZoom: options.initialZoom || 1,
            initialRotation: options.initialRotation || 0,
            initialFineAngle: options.initialFineAngle || 0,
            initialFlip: options.initialFlip || { horizontal: false, vertical: false },
            initialFilter: options.initialFilter || defaultFilter,
        };
        this.state = {
            crop: { ...this.options.initialCrop },
            zoom: this.options.initialZoom,
            rotation: this.options.initialRotation,
            fineAngle: this.options.initialFineAngle,
            flip: { ...this.options.initialFlip },
            filter: { ...this.options.initialFilter },
            cropSize: { width: 0, height: 0 },
            mediaSize: { width: 0, height: 0 },
        };
    }
    /**
     * Initializes or updates container & media dimensions
     */
    initDimensions(containerSize, naturalMediaSize) {
        this.containerSize = { ...containerSize };
        this.naturalMediaSize = { ...naturalMediaSize };
        // 1. Calculate Crop Box Size
        this.state.cropSize = (0, affine_1.getInitialCropSize)(containerSize.width, containerSize.height, this.options.aspect);
        // 2. Calculate Base Rendered Media Size
        this.renderedMediaSize = (0, affine_1.getMediaBaseSize)(naturalMediaSize.width, naturalMediaSize.height, this.state.cropSize.width, this.state.cropSize.height);
        this.state.mediaSize = { ...this.renderedMediaSize };
        // 3. Ensure minimum zoom covers crop box if restricted
        if (this.options.restrictPosition) {
            const minRequired = (0, affine_1.getAutoZoomRatio)(this.state.cropSize, this.state.mediaSize, this.getTotalRotation());
            this.options.minZoom = Math.max(this.options.minZoom, minRequired);
            if (this.state.zoom < this.options.minZoom) {
                this.state.zoom = this.options.minZoom;
            }
        }
        this.clampAndNotify();
        this.notifyComplete();
    }
    getTotalRotation() {
        const rot = (this.state.rotation + this.state.fineAngle) % 360;
        return rot >= 0 ? rot : rot + 360;
    }
    setCrop(crop) {
        this.state.crop = { ...crop };
        this.clampAndNotify();
    }
    setZoom(zoom) {
        this.state.zoom = Math.min(Math.max(zoom, this.options.minZoom), this.options.maxZoom);
        this.clampAndNotify();
    }
    setRotation(rotation) {
        this.state.rotation = (rotation % 360 + 360) % 360;
        if (this.options.autoZoomOnRotate && this.state.cropSize.width > 0) {
            const minZoom = (0, affine_1.getAutoZoomRatio)(this.state.cropSize, this.state.mediaSize, this.getTotalRotation());
            if (this.state.zoom < minZoom) {
                this.state.zoom = Number(minZoom.toFixed(4));
            }
        }
        this.clampAndNotify();
    }
    setFineAngle(angle) {
        let clamped = Math.max(-45, Math.min(45, angle));
        if (Math.abs(clamped) < 1.0) {
            clamped = 0;
        }
        this.state.fineAngle = Number(clamped.toFixed(2));
        if (this.options.autoZoomOnRotate && this.state.cropSize.width > 0) {
            const minZoom = (0, affine_1.getAutoZoomRatio)(this.state.cropSize, this.state.mediaSize, this.getTotalRotation());
            if (this.state.zoom < minZoom) {
                this.state.zoom = Number(minZoom.toFixed(4));
            }
        }
        this.clampAndNotify();
        this.notifyComplete();
    }
    setFilter(filter) {
        this.state.filter = {
            ...this.state.filter,
            ...filter,
        };
        this.clampAndNotify();
    }
    getFilterStyle() {
        return (0, presets_1.getFilterCss)(this.state.filter);
    }
    rotate(stepAngle = 90) {
        this.setRotation(this.state.rotation + stepAngle);
        this.notifyComplete();
    }
    flipHorizontal() {
        this.state.flip.horizontal = !this.state.flip.horizontal;
        this.clampAndNotify();
        this.notifyComplete();
    }
    flipVertical() {
        this.state.flip.vertical = !this.state.flip.vertical;
        this.clampAndNotify();
        this.notifyComplete();
    }
    reset() {
        this.state.crop = { ...this.options.initialCrop };
        this.state.zoom = this.options.initialZoom;
        this.state.rotation = this.options.initialRotation;
        this.state.fineAngle = this.options.initialFineAngle;
        this.state.flip = { ...this.options.initialFlip };
        this.state.filter = { ...this.options.initialFilter };
        this.clampAndNotify();
        this.notifyComplete();
    }
    setCropMode(cropMode) {
        this.options.cropMode = cropMode;
        this.clampAndNotify();
        this.notifyComplete();
    }
    setAspect(aspect) {
        this.options.aspect = aspect;
        if (this.containerSize.width > 0 && this.containerSize.height > 0) {
            this.state.cropSize = (0, affine_1.getInitialCropSize)(this.containerSize.width, this.containerSize.height, aspect);
            this.clampAndNotify();
            this.notifyComplete();
        }
    }
    resizeCropBox(handle, delta) {
        const result = (0, restrict_1.resizeCropBox)({
            handle,
            delta,
            currentCropSize: this.state.cropSize,
            currentCrop: this.state.crop,
            containerSize: this.containerSize,
            aspect: this.options.aspect,
        });
        this.state.cropSize = result.cropSize;
        if (result.crop) {
            this.state.crop = result.crop;
        }
        this.clampAndNotify();
        this.notifyComplete();
    }
    setCropSize(size) {
        this.state.cropSize = {
            width: Math.max(10, Math.round(size.width)),
            height: Math.max(10, Math.round(size.height)),
        };
        this.clampAndNotify();
        this.notifyComplete();
    }
    getContainerSize() {
        return { ...this.containerSize };
    }
    zoomIn(step = 0.25) {
        this.setZoom(this.state.zoom + step);
        this.notifyComplete();
    }
    zoomOut(step = 0.25) {
        this.setZoom(this.state.zoom - step);
        this.notifyComplete();
    }
    getState() {
        return { ...this.state };
    }
    /**
     * Generates CSS/WXS transformation string
     */
    getTransformStyle() {
        const { crop, zoom, flip } = this.state;
        const totalRotation = this.state.rotation + this.state.fineAngle;
        const scaleX = (flip.horizontal ? -1 : 1) * zoom;
        const scaleY = (flip.vertical ? -1 : 1) * zoom;
        return `translate3d(${crop.x}px, ${crop.y}px, 0) rotate(${totalRotation}deg) scale(${scaleX}, ${scaleY})`;
    }
    /**
     * Computes the current crop area in pixels & percentages
     */
    computeResult() {
        return (0, affine_1.computeCropArea)(this.state.crop, this.state.cropSize, this.state.zoom, this.getTotalRotation(), this.state.flip, this.naturalMediaSize, this.renderedMediaSize);
    }
    /**
     * Returns complete crop parameters including pixel/percent coordinates and CDN query params
     */
    getCropData() {
        const { croppedAreaPixels, croppedAreaPercentages } = this.computeResult();
        const safeX = Math.max(0, croppedAreaPixels.x);
        const safeY = Math.max(0, croppedAreaPixels.y);
        const w = Math.max(1, croppedAreaPixels.width);
        const h = Math.max(1, croppedAreaPixels.height);
        return {
            pixelCrop: { ...croppedAreaPixels },
            percentCrop: { ...croppedAreaPercentages },
            rotation: this.state.rotation,
            fineAngle: this.state.fineAngle,
            totalRotation: Number(((this.state.rotation + this.state.fineAngle) % 360).toFixed(2)),
            flip: { ...this.state.flip },
            filter: { ...this.state.filter },
            cloudParams: {
                aliyunOss: `?x-oss-process=image/crop,x_${safeX},y_${safeY},w_${w},h_${h}`,
                tencentCos: `?imageMogr2/cut/${w}x${h}x${safeX}x${safeY}`,
                qiniu: `?imageMogr2/crop/!${w}x${h}a${safeX}a${safeY}`,
            },
        };
    }
    notifyComplete() {
        const { croppedAreaPixels, croppedAreaPercentages } = this.computeResult();
        this.completeListeners.forEach((fn) => fn(croppedAreaPixels, croppedAreaPercentages));
    }
    on(event, fn) {
        if (event === 'change') {
            this.changeListeners.add(fn);
            return () => this.changeListeners.delete(fn);
        }
        if (event === 'complete') {
            this.completeListeners.add(fn);
            return () => this.completeListeners.delete(fn);
        }
        return () => { };
    }
    clampAndNotify() {
        if (this.options.restrictPosition && this.state.cropSize.width > 0) {
            const bounds = (0, restrict_1.getCropBoundaries)(this.state.cropSize, this.state.mediaSize, this.getTotalRotation(), this.state.zoom);
            this.state.crop = (0, restrict_1.clampPosition)(this.state.crop, bounds);
        }
        this.changeListeners.forEach((fn) => fn({ ...this.state }));
    }
}
exports.OmniCropController = OmniCropController;
//# sourceMappingURL=controller.js.map