Page({
  data: {
    imageUrl: '/assets/sample.png',
    cropMode: 'transform-media',
    cropShape: 'rect',
    showGrid: 'touch', // 'touch' | true | false
    restrictPosition: true,
    autoZoomOnRotate: true,
    enableHaptic: true,
    aspectList: [
      { name: '1:1', value: 1 },
      { name: '4:3', value: 4 / 3 },
      { name: '16:9', value: 16 / 9 },
      { name: '4:5', value: 4 / 5 },
      { name: '9:16', value: 9 / 16 },
      { name: '3:2', value: 3 / 2 },
      { name: '自由', value: 'free' },
    ],
    aspectIndex: 1,
    currentAspect: 4 / 3,
    minZoom: 1,
    maxZoom: 5,
    currentZoom: 1,
    currentFineAngle: 0,
    filterList: [
      { name: '原图', key: 'normal' },
      { name: '黑白', key: 'bw' },
      { name: '胶片', key: 'vintage' },
      { name: '鲜艳', key: 'vivid' },
      { name: '冷调', key: 'cool' },
      { name: '暖色', key: 'warm' },
    ],
    currentFilterKey: 'normal',
    currentFilterName: '原图',
    isExporting: false,
    resultDialogVisible: false,
    resultImageUrl: '',
    resultMeta: { width: 0, height: 0 },
    cloudDialogVisible: false,
    cloudData: null,
  },

  onLoad() {
    console.log('OmniCrop 2.0 Page loaded');
  },

  getCropper() {
    return this.selectComponent('#cropper');
  },

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

  useSampleImage() {
    this.setData({
      imageUrl: '/assets/sample.png',
    });
  },

  onSelectMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ cropMode: mode });
    const cropper = this.getCropper();
    if (cropper && cropper.setCropMode) {
      cropper.setCropMode(mode);
    }
  },

  onSelectAspect(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({
      aspectIndex: index,
      currentAspect: this.data.aspectList[index].value,
    });
  },

  onSelectShape(e) {
    const shape = e.currentTarget.dataset.shape;
    this.setData({ cropShape: shape });
  },

  onSelectGrid(e) {
    const grid = e.currentTarget.dataset.grid;
    let showGrid = true;
    if (grid === 'touch') showGrid = 'touch';
    else if (grid === 'none') showGrid = false;
    this.setData({ showGrid });
  },

  onSelectFilter(e) {
    const key = e.currentTarget.dataset.key;
    const filter = this.data.filterList.find((f) => f.key === key);
    this.setData({
      currentFilterKey: key,
      currentFilterName: filter ? filter.name : '原图',
    });
    const cropper = this.getCropper();
    if (cropper && cropper.setFilter) {
      cropper.setFilter({ preset: key });
    }
  },

  onFineAngleSliderChanging(e) {
    const angle = Number(e.detail.value.toFixed(1));
    this.setData({ currentFineAngle: angle });
    const cropper = this.getCropper();
    if (cropper && cropper.setFineAngle) {
      cropper.setFineAngle(angle);
    }
  },

  onFineAngleSliderChange(e) {
    const angle = Number(e.detail.value.toFixed(1));
    this.setData({ currentFineAngle: angle });
    const cropper = this.getCropper();
    if (cropper && cropper.setFineAngle) {
      cropper.setFineAngle(angle);
    }
  },

  handleResetAngle() {
    this.setData({ currentFineAngle: 0 });
    const cropper = this.getCropper();
    if (cropper && cropper.setFineAngle) {
      cropper.setFineAngle(0);
    }
  },

  onFineAngleChange(e) {
    if (e.detail && typeof e.detail.fineAngle === 'number') {
      this.setData({ currentFineAngle: e.detail.fineAngle });
    }
  },

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

  handleZoomIn() {
    const next = Math.min(this.data.maxZoom, Number((this.data.currentZoom + 0.2).toFixed(2)));
    const cropper = this.getCropper();
    if (cropper) cropper.setZoom(next);
    this.setData({ currentZoom: next });
  },

  handleZoomOut() {
    const next = Math.max(this.data.minZoom, Number((this.data.currentZoom - 0.2).toFixed(2)));
    const cropper = this.getCropper();
    if (cropper) cropper.setZoom(next);
    this.setData({ currentZoom: next });
  },

  handleRotate() {
    const cropper = this.getCropper();
    if (cropper) cropper.rotate(90);
  },

  handleFlipH() {
    const cropper = this.getCropper();
    if (cropper) cropper.flipHorizontal();
  },

  handleFlipV() {
    const cropper = this.getCropper();
    if (cropper) cropper.flipVertical();
  },

  handleReset() {
    const cropper = this.getCropper();
    if (cropper) {
      cropper.reset();
      cropper.setFineAngle(0);
      cropper.setFilter({ preset: 'normal' });
    }
    this.setData({
      currentZoom: 1,
      currentFineAngle: 0,
      currentFilterKey: 'normal',
      currentFilterName: '原图',
    });
  },

  onCropComplete(e) {
    const { croppedAreaPixels, zoom } = e.detail;
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

  handleOpenCloudParams() {
    const cropper = this.getCropper();
    if (!cropper || !cropper.getCropData) return;
    const cropData = cropper.getCropData();
    this.setData({
      cloudData: cropData,
      cloudDialogVisible: true,
    });
  },

  closeCloudDialog() {
    this.setData({ cloudDialogVisible: false });
  },

  copyText(e) {
    const text = e.currentTarget.dataset.text;
    if (text) {
      wx.setClipboardData({
        data: text,
        success: () => {
          wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
        },
      });
    }
  },

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
