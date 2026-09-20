"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistance = getDistance;
exports.getMidpoint = getMidpoint;
exports.getTouchAngle = getTouchAngle;
exports.getPinchZoom = getPinchZoom;
/**
 * Calculates Euclidean distance between two points
 */
function getDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}
/**
 * Calculates the midpoint between two touch points
 */
function getMidpoint(p1, p2) {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
    };
}
/**
 * Calculates angle in degrees between two touch points
 */
function getTouchAngle(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const rad = Math.atan2(dy, dx);
    return (rad * 180) / Math.PI;
}
/**
 * Calculates zoom factor change based on pinch gesture
 */
function getPinchZoom(initialDistance, currentDistance, initialZoom, minZoom, maxZoom) {
    if (initialDistance <= 0)
        return initialZoom;
    const ratio = currentDistance / initialDistance;
    const targetZoom = initialZoom * ratio;
    return Math.min(Math.max(targetZoom, minZoom), maxZoom);
}
//# sourceMappingURL=pinch.js.map