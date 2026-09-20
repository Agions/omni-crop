"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WechatCanvas2DDriver = void 0;
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
        const { imageSource, pixelCrop, rotation, flip, outputWidth, outputHeight } = params;
        return new Promise((resolve, reject) => {
            const img = canvas.createImage();
            img.onload = () => {
                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Translate to center
                ctx.translate(outputWidth / 2, outputHeight / 2);
                // Apply rotation
                if (rotation !== 0) {
                    ctx.rotate((rotation * Math.PI) / 180);
                }
                // Apply flip
                ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
                // Draw cropped portion
                ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, -outputWidth / 2, -outputHeight / 2, outputWidth, outputHeight);
                ctx.restore();
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
}
exports.WechatCanvas2DDriver = WechatCanvas2DDriver;
//# sourceMappingURL=wechat.js.map