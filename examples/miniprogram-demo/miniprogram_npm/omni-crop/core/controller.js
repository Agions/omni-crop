"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmniCropController = void 0;
const affine_1 = require("./matrix/affine");
const restrict_1 = require("./boundary/restrict");
class OmniCropController {
    constructor(options = {}) {
        this.containerSize = { width: 0, height: 0 };
        this.naturalMediaSize = { width: 0, height: 0 };
        this.renderedMediaSize = { width: 0, height: 0 };
        this.changeListeners = new Set();
        this.completeListeners = new Set();
        this.options = {
            cropMode: options.cropMode || 'transform-media',
            cropShape: options.cropShape || 'rect',
            aspect: options.aspect !== undefined ? options.aspect : 4 / 3,
            minZoom: options.minZoom || 1,
            maxZoom: options.maxZoom || 3,
            zoomSpeed: options.zoomSpeed || 1,
            restrictPosition: options.restrictPosition !== undefined ? options.restrictPosition : true,
            initialCrop: options.initialCrop || { x: 0, y: 0 },
            initialZoom: options.initialZoom || 1,
            initialRotation: options.initialRotation || 0,
            initialFlip: options.initialFlip || { horizontal: false, vertical: false },
        };
        this.state = {
            crop: { ...this.options.initialCrop },
            zoom: this.options.initialZoom,
            rotation: this.options.initialRotation,
            flip: { ...this.options.initialFlip },
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
            const minRequired = (0, restrict_1.getMinZoom)(this.state.cropSize, this.state.mediaSize, this.state.rotation);
            this.options.minZoom = Math.max(this.options.minZoom, minRequired);
            if (this.state.zoom < this.options.minZoom) {
                this.state.zoom = this.options.minZoom;
            }
        }
        this.clampAndNotify();
        this.notifyComplete();
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
        this.clampAndNotify();
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
        this.state.flip = { ...this.options.initialFlip };
        this.clampAndNotify();
        this.notifyComplete();
    }
    getState() {
        return { ...this.state };
    }
    /**
     * Generates CSS/WXS transformation string
     */
    getTransformStyle() {
        const { crop, zoom, rotation, flip } = this.state;
        const scaleX = (flip.horizontal ? -1 : 1) * zoom;
        const scaleY = (flip.vertical ? -1 : 1) * zoom;
        return `translate3d(${crop.x}px, ${crop.y}px, 0) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
    }
    /**
     * Computes the current crop area in pixels & percentages
     */
    computeResult() {
        return (0, affine_1.computeCropArea)(this.state.crop, this.state.cropSize, this.state.zoom, this.state.rotation, this.state.flip, this.naturalMediaSize, this.renderedMediaSize);
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
            const bounds = (0, restrict_1.getCropBoundaries)(this.state.cropSize, this.state.mediaSize, this.state.rotation, this.state.zoom);
            this.state.crop = (0, restrict_1.clampPosition)(this.state.crop, bounds);
        }
        this.changeListeners.forEach((fn) => fn({ ...this.state }));
    }
}
exports.OmniCropController = OmniCropController;
//# sourceMappingURL=controller.js.map