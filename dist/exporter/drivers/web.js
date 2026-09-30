"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebCanvasDriver = void 0;
const core_1 = require("../../core");
class WebCanvasDriver {
    constructor() {
        this.name = 'web-html5-canvas';
    }
    async loadImage(source) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                resolve({
                    image: img,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                });
            };
            img.onerror = reject;
            img.src = source;
        });
    }
    async createOffscreenCanvas(width, height, dpr = 1) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        return canvas;
    }
    async render(canvas, params) {
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Failed to get 2d context on canvas');
        const { imageSource, pixelCrop, rotation, flip, cropShape, outputWidth, outputHeight, filter } = params;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Circular clipping when cropShape === 'round'
        if (cropShape === 'round') {
            const radius = Math.min(outputWidth, outputHeight) / 2;
            ctx.beginPath();
            ctx.arc(outputWidth / 2, outputHeight / 2, radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
        }
        ctx.translate(outputWidth / 2, outputHeight / 2);
        if (rotation !== 0) {
            ctx.rotate((rotation * Math.PI) / 180);
        }
        ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
        let filterApplied = false;
        if (filter) {
            const cssFilter = (0, core_1.getFilterCss)(filter);
            if (cssFilter !== 'none' && 'filter' in ctx) {
                ctx.filter = cssFilter;
                filterApplied = true;
            }
        }
        ctx.drawImage(imageSource, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, -outputWidth / 2, -outputHeight / 2, outputWidth, outputHeight);
        ctx.restore();
        if (filter && !filterApplied) {
            try {
                const imgData = ctx.getImageData(0, 0, outputWidth, outputHeight);
                if (imgData && imgData.data) {
                    (0, core_1.applyFilterToImageData)(imgData.data, outputWidth, outputHeight, filter);
                    ctx.putImageData(imgData, 0, 0);
                }
            }
            catch (_e) {
                // Fallback gracefully if getImageData throws (e.g. tainted canvas)
            }
        }
    }
    async export(canvas, options) {
        const mimeType = options.format === 'png' ? 'image/png' : options.format === 'webp' ? 'image/webp' : 'image/jpeg';
        const quality = options.quality ?? 0.9;
        if (options.type === 'blob') {
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
            return {
                blob,
                width: canvas.width,
                height: canvas.height,
            };
        }
        // Default base64 data url
        const base64 = canvas.toDataURL(mimeType, quality);
        return {
            base64,
            uri: base64,
            width: canvas.width,
            height: canvas.height,
        };
    }
    destroy() {
        // Explicit cleanup for memory lifecycle governance
    }
}
exports.WebCanvasDriver = WebCanvasDriver;
//# sourceMappingURL=web.js.map