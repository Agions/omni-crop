"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WechatCanvas2DDriver = void 0;
const core_1 = require("../../core");
class WechatCanvas2DDriver {
    constructor() {
        this.name = 'wechat-canvas-2d';
    }
    /**
     * Preloads image via wx.downloadFile or wx.getImageInfo
     */
    async loadImage(source) {
        return new Promise((resolve, reject) => {
            // 1. If remote URL, ensure downloaded to local temp file
            const load = (filePath) => {
                wx.getImageInfo({
                    src: filePath,
                    success: (res) => {
                        resolve({
                            image: filePath,
                            width: res.width,
                            height: res.height,
                        });
                    },
                    fail: reject,
                });
            };
            if (/^https?:\/\//i.test(source)) {
                wx.downloadFile({
                    url: source,
                    success: (res) => {
                        if (res.statusCode === 200) {
                            load(res.tempFilePath);
                        }
                        else {
                            reject(new Error(`Failed to download image, status code: ${res.statusCode}`));
                        }
                    },
                    fail: reject,
                });
            }
            else {
                load(source);
            }
        });
    }
    async createOffscreenCanvas(width, height, dpr = 1) {
        if (typeof wx.createOffscreenCanvas === 'function') {
            const canvas = wx.createOffscreenCanvas({
                type: '2d',
                width: Math.round(width * dpr),
                height: Math.round(height * dpr),
            });
            return canvas;
        }
        throw new Error('wx.createOffscreenCanvas is not supported in current Wechat base library');
    }
    async render(canvas, params) {
        const ctx = canvas.getContext('2d');
        const { imageSource, pixelCrop, rotation, flip, cropShape, outputWidth, outputHeight, filter } = params;
        return new Promise((resolve, reject) => {
            const img = canvas.createImage();
            img.onload = () => {
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
                // Translate to center
                ctx.translate(outputWidth / 2, outputHeight / 2);
                // Apply rotation
                if (rotation !== 0) {
                    ctx.rotate((rotation * Math.PI) / 180);
                }
                // Apply flip
                ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
                // Apply filter if supported by 2D canvas context
                let filterApplied = false;
                if (filter) {
                    const cssFilter = (0, core_1.getFilterCss)(filter);
                    if (cssFilter !== 'none' && typeof ctx.filter === 'string') {
                        ctx.filter = cssFilter;
                        filterApplied = true;
                    }
                }
                // Draw cropped portion
                ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, -outputWidth / 2, -outputHeight / 2, outputWidth, outputHeight);
                ctx.restore();
                // If ctx.filter was not supported and filter is specified, fallback to getImageData
                if (filter && !filterApplied) {
                    try {
                        const imgData = ctx.getImageData(0, 0, outputWidth, outputHeight);
                        if (imgData && imgData.data) {
                            (0, core_1.applyFilterToImageData)(imgData.data, outputWidth, outputHeight, filter);
                            ctx.putImageData(imgData, 0, 0);
                        }
                    }
                    catch (_e) {
                        // Context may disallow getImageData in certain sandbox modes
                    }
                }
                resolve();
            };
            img.onerror = reject;
            img.src = imageSource;
        });
    }
    async export(canvas, options) {
        const format = options.format === 'png' ? 'png' : 'jpg';
        const quality = options.quality ?? 0.9;
        return new Promise((resolve, reject) => {
            wx.canvasToTempFilePath({
                canvas,
                fileType: format,
                quality,
                success: (res) => {
                    resolve({
                        uri: res.tempFilePath,
                        width: canvas.width,
                        height: canvas.height,
                    });
                },
                fail: reject,
            });
        });
    }
    destroy() {
        // Explicit cleanup for memory lifecycle governance
    }
}
exports.WechatCanvas2DDriver = WechatCanvas2DDriver;
//# sourceMappingURL=wechat.js.map