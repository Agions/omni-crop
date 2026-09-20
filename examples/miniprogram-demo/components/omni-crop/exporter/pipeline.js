async function getCroppedImage(options) {
  const {
    imageSrc,
    pixelCrop,
    rotation = 0,
    flip = { horizontal: false, vertical: false },
    output = {},
    driver,
  } = options;

  if (!driver) {
    throw new Error('导出图片需要传入平台驱动实例 (driver)');
  }

  // 1. 预加载图片并读取真实尺寸
  const { image } = await driver.loadImage(imageSrc);

  // 2. 依据原图裁剪区域与最大分辨率约束计算最终输出尺寸
  let outW = Math.max(1, pixelCrop.width);
  let outH = Math.max(1, pixelCrop.height);

  const maxRes = output.maxResolution || 4096;
  const maxSide = Math.max(outW, outH);
  if (maxSide > maxRes) {
    const ratio = maxRes / maxSide;
    outW = Math.round(outW * ratio);
    outH = Math.round(outH * ratio);
  }

  // 3. 创建离屏 Canvas (支持 DPR 高清适配)
  const dpr = output.dpr || 1;
  const canvas = await driver.createOffscreenCanvas(outW, outH, dpr);

  // 4. 绘制变换内容到 Canvas
  await driver.render(canvas, {
    imageSource: image,
    pixelCrop,
    rotation,
    flip,
    outputWidth: outW * dpr,
    outputHeight: outH * dpr,
  });

  // 5. 导出文件路径或数据
  return driver.export(canvas, output);
}

module.exports = {
  getCroppedImage,
};
