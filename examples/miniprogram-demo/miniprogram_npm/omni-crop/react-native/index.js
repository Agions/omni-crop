"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmniCropRN = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_gesture_handler_1 = require("react-native-gesture-handler");
const react_native_reanimated_1 = __importStar(require("react-native-reanimated"));
const core_1 = require("../core");
exports.OmniCropRN = (0, react_1.forwardRef)((props, ref) => {
    const { image, aspect = 4 / 3, cropShape = 'rect', showGrid = true, restrictPosition = true, onCropChange, onCropComplete, } = props;
    const controllerRef = (0, react_1.useRef)(new core_1.OmniCropController({ aspect, cropShape, restrictPosition }));
    const controller = controllerRef.current;
    const [cropBoxSize, setCropBoxSize] = (0, react_1.useState)({ width: 0, height: 0 });
    // Reanimated Shared Values for 60fps UI Thread Execution
    const translateX = (0, react_native_reanimated_1.useSharedValue)(0);
    const translateY = (0, react_native_reanimated_1.useSharedValue)(0);
    const scale = (0, react_native_reanimated_1.useSharedValue)(1);
    const rotation = (0, react_native_reanimated_1.useSharedValue)(0);
    const flipH = (0, react_native_reanimated_1.useSharedValue)(1);
    const flipV = (0, react_native_reanimated_1.useSharedValue)(1);
    // Gesture context
    const startX = (0, react_native_reanimated_1.useSharedValue)(0);
    const startY = (0, react_native_reanimated_1.useSharedValue)(0);
    const startScale = (0, react_native_reanimated_1.useSharedValue)(1);
    const startRotation = (0, react_native_reanimated_1.useSharedValue)(0);
    const notifyCompleteOnJS = () => {
        controller.setCrop({ x: translateX.value, y: translateY.value });
        controller.setZoom(scale.value);
        controller.setRotation(rotation.value);
        const result = controller.computeResult();
        onCropComplete?.(result.croppedAreaPixels, result.croppedAreaPercentages);
    };
    // Pan Gesture
    const panGesture = react_native_gesture_handler_1.Gesture.Pan()
        .onStart(() => {
        startX.value = translateX.value;
        startY.value = translateY.value;
    })
        .onUpdate((e) => {
        translateX.value = startX.value + e.translationX;
        translateY.value = startY.value + e.translationY;
        if (onCropChange) {
            (0, react_native_reanimated_1.runOnJS)(onCropChange)({ x: translateX.value, y: translateY.value });
        }
    })
        .onEnd(() => {
        (0, react_native_reanimated_1.runOnJS)(notifyCompleteOnJS)();
    });
    // Pinch Gesture
    const pinchGesture = react_native_gesture_handler_1.Gesture.Pinch()
        .onStart(() => {
        startScale.value = scale.value;
    })
        .onUpdate((e) => {
        scale.value = Math.min(Math.max(startScale.value * e.scale, 0.5), 5);
    })
        .onEnd(() => {
        (0, react_native_reanimated_1.runOnJS)(notifyCompleteOnJS)();
    });
    // Rotation Gesture
    const rotationGesture = react_native_gesture_handler_1.Gesture.Rotation()
        .onStart(() => {
        startRotation.value = rotation.value;
    })
        .onUpdate((e) => {
        rotation.value = startRotation.value + (e.rotation * 180) / Math.PI;
    })
        .onEnd(() => {
        (0, react_native_reanimated_1.runOnJS)(notifyCompleteOnJS)();
    });
    const composedGesture = react_native_gesture_handler_1.Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture);
    const animatedStyle = (0, react_native_reanimated_1.useAnimatedStyle)(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotate: `${rotation.value}deg` },
            { scaleX: scale.value * flipH.value },
            { scaleY: scale.value * flipV.value },
        ],
    }));
    (0, react_1.useImperativeHandle)(ref, () => ({
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
        react_native_1.Image.getSize(image, (imgW, imgH) => {
            controller.initDimensions({ width, height }, { width: imgW, height: imgH });
            const state = controller.getState();
            setCropBoxSize(state.cropSize);
        }, () => { });
    };
    return ((0, jsx_runtime_1.jsxs)(react_native_gesture_handler_1.GestureHandlerRootView, { style: styles.container, onLayout: onLayout, children: [(0, jsx_runtime_1.jsx)(react_native_gesture_handler_1.GestureDetector, { gesture: composedGesture, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.mediaWrapper, children: (0, jsx_runtime_1.jsx)(react_native_reanimated_1.default.Image, { source: { uri: image }, resizeMode: "contain", style: [styles.media, animatedStyle] }) }) }), (0, jsx_runtime_1.jsx)(react_native_1.View, { pointerEvents: "none", style: [
                    styles.cropBox,
                    {
                        width: cropBoxSize.width,
                        height: cropBoxSize.height,
                        borderRadius: cropShape === 'round' ? 9999 : 0,
                    },
                ], children: showGrid && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.gridH, { top: '33.33%' }] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.gridH, { top: '66.66%' }] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.gridV, { left: '33.33%' }] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.gridV, { left: '66.66%' }] })] })) })] }));
});
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    mediaWrapper: {
        ...react_native_1.StyleSheet.absoluteFillObject,
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
//# sourceMappingURL=index.js.map