"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmniCrop = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const core_1 = require("../core");
const exporter_1 = require("../exporter");
exports.OmniCrop = (0, react_1.forwardRef)((props, ref) => {
    const { image, cropMode = 'transform-media', cropShape = 'rect', aspect = 4 / 3, showGrid = true, restrictPosition = true, onCropChange, onZoomChange, onRotationChange, onCropComplete, className = '', style = {}, } = props;
    const containerRef = (0, react_1.useRef)(null);
    const controllerRef = (0, react_1.useRef)(null);
    const [transformStyle, setTransformStyle] = (0, react_1.useState)('');
    const [cropBoxSize, setCropBoxSize] = (0, react_1.useState)({ width: 0, height: 0 });
    const dragRef = (0, react_1.useRef)({
        isDragging: false,
        startX: 0,
        startY: 0,
        cropStart: { x: 0, y: 0 },
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
    (0, react_1.useEffect)(() => {
        const unbindChange = controller.on('change', (state) => {
            setTransformStyle(controller.getTransformStyle());
            onCropChange?.(state.crop);
            onZoomChange?.(state.zoom);
            onRotationChange?.(state.rotation);
        });
        const unbindComplete = controller.on('complete', (pix, pct) => {
            onCropComplete?.(pix, pct);
        });
        return () => {
            unbindChange();
            unbindComplete();
        };
    }, [controller, onCropChange, onZoomChange, onRotationChange, onCropComplete]);
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
            return (0, exporter_1.getCroppedImage)({
                imageSrc: image,
                pixelCrop: croppedAreaPixels,
                rotation: state.rotation,
                flip: state.flip,
                output: options,
                driver: new exporter_1.WebCanvasDriver(),
            });
        },
    }));
    const handleImageLoad = (e) => {
        const img = e.currentTarget;
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            controller.initDimensions({ width: rect.width, height: rect.height }, { width: img.naturalWidth, height: img.naturalHeight });
            const state = controller.getState();
            setCropBoxSize(state.cropSize);
            setTransformStyle(controller.getTransformStyle());
        }
    };
    const handleMouseDown = (e) => {
        e.preventDefault();
        dragRef.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            cropStart: { ...controller.getState().crop },
        };
    };
    const handleMouseMove = (0, react_1.useCallback)((e) => {
        if (!dragRef.current.isDragging)
            return;
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        controller.setCrop({
            x: dragRef.current.cropStart.x + deltaX,
            y: dragRef.current.cropStart.y + deltaY,
        });
    }, [controller]);
    const handleMouseUp = (0, react_1.useCallback)(() => {
        if (dragRef.current.isDragging) {
            dragRef.current.isDragging = false;
            controller.notifyComplete();
        }
    }, [controller]);
    const handleWheel = (e) => {
        e.preventDefault();
        const currentZoom = controller.getState().zoom;
        const delta = -e.deltaY * 0.002;
        controller.setZoom(currentZoom + delta);
        controller.notifyComplete();
    };
    (0, react_1.useEffect)(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);
    return ((0, jsx_runtime_1.jsxs)("div", { ref: containerRef, className: `omni-crop-container ${className}`, onMouseDown: handleMouseDown, onWheel: handleWheel, style: {
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            touchAction: 'none',
            cursor: 'grab',
            ...style,
        }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }, children: (0, jsx_runtime_1.jsx)("img", { src: image, alt: "Cropped Media", onLoad: handleImageLoad, draggable: false, style: {
                        transform: transformStyle,
                        transformOrigin: 'center center',
                        willChange: 'transform',
                        pointerEvents: 'none',
                        maxWidth: '100%',
                        maxHeight: '100%',
                    } }) }), (0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'absolute',
                    boxSizing: 'border-box',
                    width: `${cropBoxSize.width}px`,
                    height: `${cropBoxSize.height}px`,
                    border: '1.5px solid rgba(255,255,255,0.85)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
                    borderRadius: cropShape === 'round' ? '50%' : '0',
                    pointerEvents: 'none',
                }, children: showGrid && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: { position: 'absolute', width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)', top: '33.33%' } }), (0, jsx_runtime_1.jsx)("div", { style: { position: 'absolute', width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)', top: '66.66%' } }), (0, jsx_runtime_1.jsx)("div", { style: { position: 'absolute', height: '100%', width: '1px', backgroundColor: 'rgba(255,255,255,0.3)', left: '33.33%' } }), (0, jsx_runtime_1.jsx)("div", { style: { position: 'absolute', height: '100%', width: '1px', backgroundColor: 'rgba(255,255,255,0.3)', left: '66.66%' } })] })) })] }));
});
exports.OmniCrop.displayName = 'OmniCrop';
//# sourceMappingURL=index.js.map