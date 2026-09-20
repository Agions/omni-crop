Page({
  data: {
    imageUrl: '/assets/sample.png',
    cropMode: 'transform-media',
    cropShape: 'rect',
    showGrid: true,
    restrictPosition: true,
    aspectList: [
      { name: '1:1', value: 1 },
      { name: '4:3', value: 4 / 3 },
      { name: '16:9', value: 16 / 9 },
      { name: '自由', value: 'free' },
    ],
    aspectIndex: 1,
    currentAspect: 4 / 3,
    minZoom: 1,
    maxZoom: 5,
    currentZoom: 1,
    isExporting: false,
    resultDialogVisible: false,
    resultImageUrl: '',
    resultMeta: { width: 0, height: 0 },
  },

  onLoad() {
    console.log('OmniCrop Page loaded');
  },

  getCropper() {
    return this.selectComponent('#cropper');
  },

  // 1. 选择本地相册或拍摄图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          this.setData({
            imageUrl: res.tempFiles[0].tempFilePath,
          });
        }
      },
      fail: (err) => {
        console.warn('选择图片取消或失败', err);
      },
    });
  },

  // 2. 切换回预置示例图
  useSampleImage() {
    this.setData({
      imageUrl: '/assets/sample.png',
    });
  },

  // 3. 切换裁剪比例
  onSelectAspect(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({
      aspectIndex: index,
      currentAspect: this.data.aspectList[index].value,
    });
  },

  // 4. 切换裁剪框形状 (矩形 / 圆形)
  onSelectShape(e) {
    const shape = e.currentTarget.dataset.shape;
    this.setData({
      cropShape: shape,
    });
  },

  // 5. 缩放监听与滑块联动
  onZoomChange(e) {
    if (e.detail && e.detail.zoom) {
      this.setData({
        currentZoom: e.detail.zoom,
      });
    }
  },

  onZoomSliderChanging(e) {
    const zoom = Number(e.detail.value.toFixed(2));
    const cropper = this.getCropper();
    if (cropper) {
      cropper.setZoom(zoom);
    }
    this.setData({ currentZoom: zoom });
  },

  onZoomSliderChange(e) {
    const zoom = Number(e.detail.value.toFixed(2));
    const cropper = this.getCropper();
    if (cropper) {
      cropper.setZoom(zoom);
    }
    this.setData({ currentZoom: zoom });
  },

  // 6. 点击放大
  handleZoomIn() {
    const next = Math.min(this.data.maxZoom, Number((this.data.currentZoom + 0.2).toFixed(2)));
    const cropper = this.getCropper();
    if (cropper) cropper.setZoom(next);
    this.setData({ currentZoom: next });
  },

  // 7. 点击缩小
  handleZoomOut() {
    const next = Math.max(this.data.minZoom, Number((this.data.currentZoom - 0.2).toFixed(2)));
    const cropper = this.getCropper();
    if (cropper) cropper.setZoom(next);
    this.setData({ currentZoom: next });
  },

  // 8. 顺时针旋转90°
  handleRotate() {
    const cropper = this.getCropper();
    if (cropper) cropper.rotate(90);
  },

  // 9. 水平镜像翻转
  handleFlipH() {
    const cropper = this.getCropper();
    if (cropper) cropper.flipHorizontal();
  },

  // 10. 垂直镜像翻转
  handleFlipV() {
    const cropper = this.getCropper();
    if (cropper) cropper.flipVertical();
  },

  // 11. 重置变换
  handleReset() {
    const cropper = this.getCropper();
    if (cropper) cropper.reset();
    this.setData({ currentZoom: 1 });
  },

  // 12. 裁剪完成事件监听
  onCropComplete(e) {
    const { croppedAreaPixels, croppedAreaPercentages, zoom } = e.detail;
    this.lastCropPixels = croppedAreaPixels;
    if (zoom) {
      this.setData({ currentZoom: zoom });
    }
  },

  onCropError(err) {
    wx.showToast({
      title: '图片加载异常',
      icon: 'none',
    });
  },

  // 10. 执行 Canvas 2D 裁剪并导出
  async handleExport() {
    const cropper = this.getCropper();
    if (!cropper) return;

    this.setData({ isExporting: true });
    wx.showLoading({ title: '正在导出...', mask: true });

    try {
      const result = await cropper.exportCroppedImage({
        format: 'png',
        quality: 0.95,
        dpr: 2, // 2倍物理像素高清导出
      });

      wx.hideLoading();
      this.setData({
        isExporting: false,
        resultDialogVisible: true,
        resultImageUrl: result.uri,
        resultMeta: {
          width: result.width,
          height: result.height,
        },
      });
    } catch (err) {
      wx.hideLoading();
      this.setData({ isExporting: false });
      wx.showModal({
        title: '导出失败',
        content: err.message || 'Canvas 绘制或导出异常',
        showCancel: false,
      });
    }
  },

  // 保存图片到系统相册
  saveToAlbum() {
    if (!this.data.resultImageUrl) return;

    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultImageUrl,
      success: () => {
        wx.showToast({
          title: '已存入系统相册',
          icon: 'success',
        });
        this.closeResultDialog();
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('auth')) {
          wx.showModal({
            title: '授权提示',
            content: '需要获取保存到相册权限，请在设置中开启',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting();
              }
            },
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none',
          });
        }
      },
    });
  },

  closeResultDialog() {
    this.setData({
      resultDialogVisible: false,
    });
  },
});
