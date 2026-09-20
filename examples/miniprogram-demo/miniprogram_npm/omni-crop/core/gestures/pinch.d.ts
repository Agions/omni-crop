import { Point } from '../types';
export interface TouchPair {
    p1: Point;
    p2: Point;
}
/**
 * Calculates Euclidean distance between two points
 */
export declare function getDistance(p1: Point, p2: Point): number;
/**
 * Calculates the midpoint between two touch points
 */
export declare function getMidpoint(p1: Point, p2: Point): Point;
/**
 * Calculates angle in degrees between two touch points
 */
export declare function getTouchAngle(p1: Point, p2: Point): number;
/**
 * Calculates zoom factor change based on pinch gesture
 */
export declare function getPinchZoom(initialDistance: number, currentDistance: number, initialZoom: number, minZoom: number, maxZoom: number): number;
//# sourceMappingURL=pinch.d.ts.map