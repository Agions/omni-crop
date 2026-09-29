import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useImperativeHandle, useRef, useState, } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView, } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, } from 'react-native-reanimated';
import { OmniCropController, } from '../core/index.mjs';
export const OmniCropRN = forwardRef((props, ref) => {
    const { image, aspect = 4 / 3, cropShape = 'rect', showGrid = true, restrictPosition = true, onCropChange, onCropComplete, } = props;
    const controllerRef = useRef(new OmniCropController({ aspect, cropShape, restrictPosition }));
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
        async exportCroppedImage(_options) {
            const { croppedAreaPixels } = controller.computeResult();
            return {
                uri: image,
                width: croppedAreaPixels.width,
                height: croppedAreaPixels.height,
            };
        },
    }));
    const onLayout = (e) => {
        const { width, height } = e.nativeEvent.layout;
        Image.getSize(image, (imgW, imgH) => {
            controller.initDimensions({ width, height }, { width: imgW, height: imgH });
            const state = controller.getState();
            setCropBoxSize(state.cropSize);
        }, () => { });
    };
    return (_jsxs(GestureHandlerRootView, { style: styles.container, onLayout: onLayout, children: [_jsx(GestureDetector, { gesture: composedGesture, children: _jsx(View, { style: styles.mediaWrapper, children: _jsx(Animated.Image, { source: { uri: image }, resizeMode: "contain", style: [styles.media, animatedStyle] }) }) }), _jsx(View, { pointerEvents: "none", style: [
                    styles.cropBox,
                    {
                        width: cropBoxSize.width,
                        height: cropBoxSize.height,
                        borderRadius: cropShape === 'round' ? 9999 : 0,
                    },
                ], children: showGrid && (_jsxs(_Fragment, { children: [_jsx(View, { style: [styles.gridH, { top: '33.33%' }] }), _jsx(View, { style: [styles.gridH, { top: '66.66%' }] }), _jsx(View, { style: [styles.gridV, { left: '33.33%' }] }), _jsx(View, { style: [styles.gridV, { left: '66.66%' }] })] })) })] }));
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
