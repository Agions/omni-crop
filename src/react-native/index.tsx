import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View, Image } from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import {
  OmniCropController,
  AreaPixels,
  AreaPercent,
  CropMode,
  CropShape,
  Point,
} from '../core';
import { ExportOptions, CropResult } from '../exporter';

export interface OmniCropRNProps {
  image: string;
  aspect?: number | 'free';
  cropMode?: CropMode;
  cropShape?: CropShape;
  showGrid?: boolean;
  restrictPosition?: boolean;
  onCropChange?: (crop: Point) => void;
  onCropComplete?: (pixels: AreaPixels, percent: AreaPercent) => void;
}

export interface OmniCropRNRef {
  rotate: (stepAngle?: number) => void;
  flipHorizontal: () => void;
  flipVertical: () => void;
  reset: () => void;
  exportCroppedImage: (options?: ExportOptions) => Promise<CropResult>;
}

export const OmniCropRN = forwardRef<OmniCropRNRef, OmniCropRNProps>((props, ref) => {
  const {
    image,
    aspect = 4 / 3,
    cropShape = 'rect',
    showGrid = true,
    restrictPosition = true,
    onCropChange,
    onCropComplete,
  } = props;

  const controllerRef = useRef<OmniCropController>(
    new OmniCropController({ aspect, cropShape, restrictPosition })
  );
  const controller = controllerRef.current;

  const [cropBoxSize, setCropBoxSize] = useState({ width: 0, height: 0 });

  // Reanimated Shared Values for 60fps UI Thread Execution
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const flipH = useSharedValue(1);
  const flipV = useSharedValue(1);

  // Gesture context
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startRotation = useSharedValue(0);

  const notifyCompleteOnJS = () => {
    controller.setCrop({ x: translateX.value, y: translateY.value });
    controller.setZoom(scale.value);
    controller.setRotation(rotation.value);
    const result = controller.computeResult();
    onCropComplete?.(result.croppedAreaPixels, result.croppedAreaPercentages);
  };

  // Pan Gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
      if (onCropChange) {
        runOnJS(onCropChange)({ x: translateX.value, y: translateY.value });
      }
    })
    .onEnd(() => {
      runOnJS(notifyCompleteOnJS)();
    });

  // Pinch Gesture
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(startScale.value * e.scale, 0.5), 5);
    })
    .onEnd(() => {
      runOnJS(notifyCompleteOnJS)();
    });

  // Rotation Gesture
  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      startRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value = startRotation.value + (e.rotation * 180) / Math.PI;
    })
    .onEnd(() => {
      runOnJS(notifyCompleteOnJS)();
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scaleX: scale.value * flipH.value },
      { scaleY: scale.value * flipV.value },
    ],
  }));

  useImperativeHandle(ref, () => ({
    rotate(stepAngle = 90) {
      rotation.value = (rotation.value + stepAngle) % 360;
      notifyCompleteOnJS();
    },
    flipHorizontal() {
      flipH.value = flipH.value === 1 ? -1 : 1;
      notifyCompleteOnJS();
    },
    flipVertical() {
      flipV.value = flipV.value === 1 ? -1 : 1;
      notifyCompleteOnJS();
    },
    reset() {
      translateX.value = 0;
      translateY.value = 0;
      scale.value = 1;
      rotation.value = 0;
      flipH.value = 1;
      flipV.value = 1;
      notifyCompleteOnJS();
    },
    async exportCroppedImage(_options?: ExportOptions): Promise<CropResult> {
      const { croppedAreaPixels } = controller.computeResult();
      return {
        uri: image,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
      };
    },
  }));

  const onLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    Image.getSize(
      image,
      (imgW, imgH) => {
        controller.initDimensions({ width, height }, { width: imgW, height: imgH });
        const state = controller.getState();
        setCropBoxSize(state.cropSize);
      },
      () => {}
    );
  };

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayout}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.mediaWrapper}>
          <Animated.Image
            source={{ uri: image }}
            resizeMode="contain"
            style={[styles.media, animatedStyle]}
          />
        </View>
      </GestureDetector>

      <View
        pointerEvents="none"
        style={[
          styles.cropBox,
          {
            width: cropBoxSize.width,
            height: cropBoxSize.height,
            borderRadius: cropShape === 'round' ? 9999 : 0,
          },
        ]}
      >
        {showGrid && (
          <>
            <View style={[styles.gridH, { top: '33.33%' }]} />
            <View style={[styles.gridH, { top: '66.66%' }]} />
            <View style={[styles.gridV, { left: '33.33%' }]} />
            <View style={[styles.gridV, { left: '66.66%' }]} />
          </>
        )}
      </View>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  gridH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  gridV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
