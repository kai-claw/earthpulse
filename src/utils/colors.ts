/**
 * Color and size mapping utilities for earthquake visualization.
 */

import { MAGNITUDE_SIZE_RANGE, MAGNITUDE_SIZE_SCALE } from './constants';

/** Map depth (km) to a color: shallow (red) → deep (blue) */
export function getDepthColor(depth: number): string {
  if (depth < 35)  return '#ff4444';   // Shallow - Red
  if (depth < 70)  return '#ff8800';   // Intermediate - Orange
  if (depth < 150) return '#ffdd00';   // Medium - Yellow
  if (depth < 300) return '#88ff00';   // Deep - Light Green
  if (depth < 500) return '#0088ff';   // Very Deep - Blue
  return '#0044ff';                     // Extremely Deep - Dark Blue
}

/** Map magnitude to display size (clamped to MAGNITUDE_SIZE_RANGE) */
export function getMagnitudeSize(magnitude: number): number {
  return Math.max(
    MAGNITUDE_SIZE_RANGE[0],
    Math.min(MAGNITUDE_SIZE_RANGE[1], magnitude * MAGNITUDE_SIZE_SCALE),
  );
}

/** Map magnitude to a color: low (green) → high (red) */
export function getMagnitudeColor(magnitude: number): string {
  if (magnitude < 2) return '#00ff00';   // Green
  if (magnitude < 3) return '#88ff00';   // Light Green
  if (magnitude < 4) return '#ffff00';   // Yellow
  if (magnitude < 5) return '#ff8800';   // Orange
  if (magnitude < 6) return '#ff4400';   // Red-Orange
  if (magnitude < 7) return '#ff0000';   // Red
  return '#cc0000';                      // Dark Red
}
