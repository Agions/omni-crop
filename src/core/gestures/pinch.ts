import { Point } from '../types';

export interface TouchPair {
  p1: Point;
  p2: Point;
}

/**
 * Calculates Euclidean distance between two points
 */
export function getDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the midpoint between two touch points
 */
export function getMidpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Calculates angle in degrees between two touch points
 */
export function getTouchAngle(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const rad = Math.atan2(dy, dx);
  return (rad * 180) / Math.PI;
}

/**
 * Calculates zoom factor change based on pinch gesture
 */
export function getPinchZoom(
  initialDistance: number,
  currentDistance: number,
  initialZoom: number,
  minZoom: number,
  maxZoom: number
): number {
  if (initialDistance <= 0) return initialZoom;
  const ratio = currentDistance / initialDistance;
  const targetZoom = initialZoom * ratio;
  return Math.min(Math.max(targetZoom, minZoom), maxZoom);
}
