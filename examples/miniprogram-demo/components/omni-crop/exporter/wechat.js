class WechatCanvas2DDriver {
  constructor() {
    this.name = 'wechat-canvas-2d';
  }

  loadImage(source) {
    return new Promise((resolve, reject) => {
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
            } else {
              reject(new Error(`下载图片失败，状态码: ${res.statusCode}`));
            }
          },
          fail: reject,
        });
      } else {
        load(source);
      }
    });
  }

  createOffscreenCanvas(width, height, dpr = 1) {
    if (typeof wx.createOffscreenCanvas === 'function') {
      const canvas = wx.createOffscreenCanvas({
        type: '2d',
        width: Math.round(width * dpr),
        height: Math.round(height * dpr),
      });
      return Promise.resolve(canvas);
    }
    return Promise.reject(new Error('当前微信基础库不支持 wx.createOffscreenCanvas'));
  }

  render(canvas, params) {
    const ctx = canvas.getContext('2d');
    const { imageSource, pixelCrop, rotation, flip, outputWidth, outputHeight } = params;

    return new Promise((resolve, reject) => {
      const img = canvas.createImage();
      img.onload = () => {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 移至画布中心点
        ctx.translate(outputWidth / 2, outputHeight / 2);

        // 应用旋转
        if (rotation !== 0) {
          ctx.rotate((rotation * Math.PI) / 180);
        }

        // 应用水平与垂直翻转
        ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);

        // 绘制裁剪区域
        ctx.drawImage(
          img,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          -outputWidth / 2,
          -outputHeight / 2,
          outputWidth,
          outputHeight
        );

        ctx.restore();
        resolve();
      };
      img.onerror = reject;
      img.src = imageSource;
    });
  }

  export(canvas, options = {}) {
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

module.exports = {
  WechatCanvas2DDriver,
};
