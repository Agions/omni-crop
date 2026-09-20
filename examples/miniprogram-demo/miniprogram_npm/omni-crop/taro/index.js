"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmniCrop = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const components_1 = require("@tarojs/components");
const taro_1 = __importDefault(require("@tarojs/taro"));
const core_1 = require("../core");
const exporter_1 = require("../exporter");
exports.OmniCrop = (0, react_1.forwardRef)((props, ref) => {
    const { image, cropMode = 'transform-media', cropShape = 'rect', aspect = 4 / 3, showGrid = true, restrictPosition = true, onCropChange, onZoomChange, onCropComplete, onError, className = '', style = {}, } = props;
    const containerId = (0, react_1.useRef)(`omni_crop_${Math.random().toString(36).substring(2, 9)}`).current;
    const controllerRef = (0, react_1.useRef)(null);
    const [transformStyle, setTransformStyle] = (0, react_1.useState)('');
    const [cropBoxSize, setCropBoxSize] = (0, react_1.useState)({ width: 0, height: 0 });
    const touchState = (0, react_1.useRef)({
        startX: 0,
        startY: 0,
        initialCrop: { x: 0, y: 0 },
        initialDist: 0,
        initialZoom: 1,
    });
    if (!controllerRef.current) {
        controllerRef.current = new core_1.OmniCropController({
            aspect,
            cropShape,
            cropMode,
            restrictPosition,
        });
    }
    const controller = controllerRef.current;
    // Initialize listeners
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useImperativeHandle)(ref, () => ({
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
        async exportCroppedImage(options) {
            const { croppedAreaPixels } = controller.computeResult();
            const state = controller.getState();
            const driver = taro_1.default.getEnv() === taro_1.default.ENV_TYPE.WEAPP
                ? new exporter_1.WechatCanvas2DDriver()
                : new exporter_1.WebCanvasDriver();
            return (0, exporter_1.getCroppedImage)({
                imageSrc: image,
                pixelCrop: croppedAreaPixels,
                rotation: state.rotation,
                flip: state.flip,
                output: options,
                driver,
            });
        },
    }));
    const onImageLoad = (0, react_1.useCallback)((e) => {
        const { width, height } = e.detail;
        const query = taro_1.default.createSelectorQuery();
        query
            .select(`#${containerId}`)
            .boundingClientRect((res) => {
            if (!res)
                return;
            controller.initDimensions({ width: res.width, height: res.height }, { width, height });
            const state = controller.getState();
            setCropBoxSize(state.cropSize);
            setTransformStyle(controller.getTransformStyle());
        })
            .exec();
    }, [containerId, controller]);
    const onTouchStart = (e) => {
        const touches = e.touches;
        if (touches.length === 1) {
            touchState.current.startX = touches[0].clientX;
            touchState.current.startY = touches[0].clientY;
            touchState.current.initialCrop = { ...controller.getState().crop };
        }
        else if (touches.length >= 2) {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            touchState.current.initialDist = Math.sqrt(dx * dx + dy * dy);
            touchState.current.initialZoom = controller.getState().zoom;
        }
    };
    const onTouchMove = (e) => {
        const touches = e.touches;
        if (touches.length === 1) {
            const deltaX = touches[0].clientX - touchState.current.startX;
            const deltaY = touches[0].clientY - touchState.current.startY;
            controller.setCrop({
                x: touchState.current.initialCrop.x + deltaX,
                y: touchState.current.initialCrop.y + deltaY,
            });
        }
        else if (touches.length >= 2 && touchState.current.initialDist > 0) {
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
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { id: containerId, className: `omni-crop-container ${className}`, style: {
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
        }, onTouchStart: onTouchStart, onTouchMove: onTouchMove, onTouchEnd: onTouchEnd, onTouchCancel: onTouchEnd, children: [(0, jsx_runtime_1.jsx)(components_1.View, { style: {
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }, children: (0, jsx_runtime_1.jsx)(components_1.Image, { src: image, mode: "aspectFit", onLoad: onImageLoad, onError: onError, style: {
                        transform: transformStyle,
                        transformOrigin: 'center center',
                    } }) }), (0, jsx_runtime_1.jsx)(components_1.View, { style: {
                    position: 'absolute',
                    boxSizing: 'border-box',
                    width: `${cropBoxSize.width}px`,
                    height: `${cropBoxSize.height}px`,
                    border: '1.5px solid rgba(255,255,255,0.85)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
                    borderRadius: cropShape === 'round' ? '50%' : '0',
                    pointerEvents: 'none',
                }, children: showGrid && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(components_1.View, { style: { position: 'absolute', width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)', top: '33.33%' } }), (0, jsx_runtime_1.jsx)(components_1.View, { style: { position: 'absolute', width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)', top: '66.66%' } }), (0, jsx_runtime_1.jsx)(components_1.View, { style: { position: 'absolute', height: '100%', width: '1px', backgroundColor: 'rgba(255,255,255,0.3)', left: '33.33%' } }), (0, jsx_runtime_1.jsx)(components_1.View, { style: { position: 'absolute', height: '100%', width: '1px', backgroundColor: 'rgba(255,255,255,0.3)', left: '66.66%' } })] })) })] }));
});
exports.OmniCrop.displayName = 'OmniCrop';
//# sourceMappingURL=index.js.map