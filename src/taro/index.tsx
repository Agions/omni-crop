import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { View, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  OmniCropController,
  AreaPixels,
  AreaPercent,
  CropMode,
  CropShape,
  Flip,
  Point,
} from '../core';
import {
  getCroppedImage,
  WechatCanvas2DDriver,
  WebCanvasDriver,
  ExportOptions,
  CropResult,
} from '../exporter';

export interface OmniCropProps {
  image: string;
  cropMode?: CropMode;
  cropShape?: CropShape;
  aspect?: number | 'free';
  showGrid?: boolean;
  restrictPosition?: boolean;
  onCropChange?: (crop: Point) => void;
  onZoomChange?: (zoom: number) => void;
  onCropComplete?: (pixels: AreaPixels, percent: AreaPercent) => void;
  onError?: (err: any) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface OmniCropRef {
  rotate: (stepAngle?: number) => void;
  flipHorizontal: () => void;
  flipVertical: () => void;
  reset: () => void;
  exportCroppedImage: (options?: ExportOptions) => Promise<CropResult>;
}

export const OmniCrop = forwardRef<OmniCropRef, OmniCropProps>((props, ref) => {
  const {
    image,
    cropMode = 'transform-media',
    cropShape = 'rect',
    aspect = 4 / 3,
    showGrid = true,
    restrictPosition = true,
    onCropChange,
    onZoomChange,
    onCropComplete,
    onError,
    className = '',
    style = {},
  } = props;

  const containerId = useRef(`omni_crop_${Math.random().toString(36).substring(2, 9)}`).current;
  const controllerRef = useRef<OmniCropController | null>(null);
  const [transformStyle, setTransformStyle] = useState('');
  const [cropBoxSize, setCropBoxSize] = useState({ width: 0, height: 0 });
  const touchState = useRef({
    startX: 0,
    startY: 0,
    initialCrop: { x: 0, y: 0 },
    initialDist: 0,
    initialZoom: 1,
  });

  if (!controllerRef.current) {
    controllerRef.current = new OmniCropController({
      aspect,
      cropShape,
      cropMode,
      restrictPosition,
    });
  }

  const controller = controllerRef.current;

  // Initialize listeners
  useEffect(() => {
    const unbindChange = controller.on('change', (state) => {
      setTransformStyle(controller.getTransformStyle());
      onCropChange?.(state.crop);
      onZoomChange?.(state.zoom);
    });

    const unbindComplete = controller.on('complete', (pixels, percent) => {
      onCropComplete?.(pixels, percent);
    });

    return () => {
      unbindChange();
      unbindComplete();
    };
  }, [controller, onCropChange, onZoomChange, onCropComplete]);

  // Expose methods via Ref
  useImperativeHandle(ref, () => ({
    rotate(stepAngle = 90) {
      controller.rotate(stepAngle);
      setTransformStyle(controller.getTransformStyle());
    },
    flipHorizontal() {
      controller.flipHorizontal();
      setTransformStyle(controller.getTransformStyle());
    },
    flipVertical() {
      controller.flipVertical();
      setTransformStyle(controller.getTransformStyle());
    },
    reset() {
      controller.reset();
      setTransformStyle(controller.getTransformStyle());
    },
    async exportCroppedImage(options?: ExportOptions): Promise<CropResult> {
      const { croppedAreaPixels } = controller.computeResult();
      const state = controller.getState();

      const driver =
        Taro.getEnv() === Taro.ENV_TYPE.WEAPP
          ? new WechatCanvas2DDriver()
          : new WebCanvasDriver();

      return getCroppedImage({
        imageSrc: image,
        pixelCrop: croppedAreaPixels,
        rotation: state.rotation,
        flip: state.flip,
        output: options,
        driver,
      });
    },
  }));

  const onImageLoad = useCallback(
    (e: any) => {
      const { width, height } = e.detail;
      const query = Taro.createSelectorQuery();
      query
        .select(`#${containerId}`)
        .boundingClientRect((res: any) => {
          if (!res) return;
          controller.initDimensions(
            { width: res.width, height: res.height },
            { width, height }
          );
          const state = controller.getState();
          setCropBoxSize(state.cropSize);
          setTransformStyle(controller.getTransformStyle());
        })
        .exec();
    },
    [containerId, controller]
  );

  const onTouchStart = (e: any) => {
    const touches = e.touches;
    if (touches.length === 1) {
      touchState.current.startX = touches[0].clientX;
      touchState.current.startY = touches[0].clientY;
      touchState.current.initialCrop = { ...controller.getState().crop };
    } else if (touches.length >= 2) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      touchState.current.initialDist = Math.sqrt(dx * dx + dy * dy);
      touchState.current.initialZoom = controller.getState().zoom;
    }
  };

  const onTouchMove = (e: any) => {
    const touches = e.touches;
    if (touches.length === 1) {
      const deltaX = touches[0].clientX - touchState.current.startX;
      const deltaY = touches[0].clientY - touchState.current.startY;
      controller.setCrop({
        x: touchState.current.initialCrop.x + deltaX,
        y: touchState.current.initialCrop.y + deltaY,
      });
    } else if (touches.length >= 2 && touchState.current.initialDist > 0) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const factor = currentDist / touchState.current.initialDist;
      controller.setZoom(touchState.current.initialZoom * factor);
    }
  };

  const onTouchEnd = () => {
    controller.notifyComplete();
  };

  return (
    <View
      id={containerId}
      className={`omni-crop-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          src={image}
          mode="aspectFit"
          onLoad={onImageLoad}
          onError={onError}
          style={{
            transform: transformStyle,
            transformOrigin: 'center center',
          }}
        />
      </View>

      <View
        style={{
          position: 'absolute',
          boxSizing: 'border-box',
          width: `${cropBoxSize.width}px`,
          height: `${cropBoxSize.height}px`,
          border: '1.5px solid rgba(255,255,255,0.85)',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          borderRadius: cropShape === 'round' ? '50%' : '0',
          pointerEvents: 'none',
        }}
      >
        {showGrid && (
          <>
            <View style={{ position: 'absolute', width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)', top: '33.33%' }} />
            <View style={{ position: 'absolute', width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)', top: '66.66%' }} />
            <View style={{ position: 'absolute', height: '100%', width: '1px', backgroundColor: 'rgba(255,255,255,0.3)', left: '33.33%' }} />
            <View style={{ position: 'absolute', height: '100%', width: '1px', backgroundColor: 'rgba(255,255,255,0.3)', left: '66.66%' }} />
          </>
        )}
      </View>
    </View>
  );
});

OmniCrop.displayName = 'OmniCrop';
