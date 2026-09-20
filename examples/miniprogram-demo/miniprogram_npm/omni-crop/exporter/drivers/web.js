"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebCanvasDriver = void 0;
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
        const { imageSource, pixelCrop, rotation, flip, outputWidth, outputHeight } = params;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(outputWidth / 2, outputHeight / 2);
        if (rotation !== 0) {
            ctx.rotate((rotation * Math.PI) / 180);
        }
        ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
        ctx.drawImage(imageSource, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, -outputWidth / 2, -outputHeight / 2, outputWidth, outputHeight);
        ctx.restore();
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
}
exports.WebCanvasDriver = WebCanvasDriver;
//# sourceMappingURL=web.js.map