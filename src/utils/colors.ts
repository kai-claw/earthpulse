/**
 * Color and size mapping utilities for earthquake visualization.
 */

import { MAGNITUDE_SIZE_RANGE, MAGNITUDE_SIZE_SCALE } from './constants';

/** Map depth (km) to a color: shallow (red) → deep (blue) */
export function getDepthColor(depth: number): string {
  const d = Number.isFinite(depth) ? depth : 0;
  if (d < 35)  return '#ff4444';   // Shallow - Red
  if (d < 70)  return '#ff8800';   // Intermediate - Orange
  if (d < 150) return '#ffdd00';   // Medium - Yellow
  if (d < 300) return '#88ff00';   // Deep - Light Green
  if (d < 500) return '#0088ff';   // Very Deep - Blue
  return '#0044ff';                 // Extremely Deep - Dark Blue
}

/** Map magnitude to display size (clamped to MAGNITUDE_SIZE_RANGE) */
export function getMagnitudeSize(magnitude: number): number {
  const m = Number.isFinite(magnitude) ? magnitude : 0;
  return Math.max(
    MAGNITUDE_SIZE_RANGE[0],
    Math.min(MAGNITUDE_SIZE_RANGE[1], m * MAGNITUDE_SIZE_SCALE),
  );
}

/** Map magnitude to a color: low (green) → high (red) */
export function getMagnitudeColor(magnitude: number): string {
  const m = Number.isFinite(magnitude) ? magnitude : 0;
  if (m < 2) return '#00ff00';   // Green
  if (m < 3) return '#88ff00';   // Light Green
  if (m < 4) return '#ffff00';   // Yellow
  if (m < 5) return '#ff8800';   // Orange
  if (m < 6) return '#ff4400';   // Red-Orange
  if (m < 7) return '#ff0000';   // Red
  return '#cc0000';               // Dark Red
}
