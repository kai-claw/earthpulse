/**
 * Barrel re-export — all utilities are now in focused modules.
 *
 * Prefer importing directly from:
 *   ./colors      — getDepthColor, getMagnitudeSize, getMagnitudeColor
 *   ./formatting  — formatDate, formatRelativeTime, getMagnitudeDescription, etc.
 *   ./geo         — calculateDistance, convertEarthquakeToGlobePoint
 *   ./statistics  — calculateStatistics, filterEarthquakesByTimeRange, sortEarthquakesByTime
 *   ./mood        — calculateMood, getEmotionalContext, getLoadingPoem
 *   ./seismic     — generateSeismicRings, getTourStops
 *   ./audio       — playRichQuakeTone, triggerHaptic
 *   ./constants   — all magic numbers, mood data, timing values
 */

// Colors
export { getDepthColor, getMagnitudeSize, getMagnitudeColor } from './colors';

// Formatting & descriptions
export {
  formatDate,
  formatRelativeTime,
  getMagnitudeDescription,
  getDepthDescription,
  formatDistanceToUser,
  getFreshnessLabel,
  getHumanImpact,
} from './formatting';

// Geography & data conversion
export { calculateDistance, convertEarthquakeToGlobePoint } from './geo';

// Statistics
export { calculateStatistics, filterEarthquakesByTimeRange, sortEarthquakesByTime } from './statistics';

// Mood system
export { calculateMood, getEmotionalContext, getLoadingPoem } from './mood';

// Seismic visuals
export { generateSeismicRings, getTourStops } from './seismic';

// Audio & haptics
export { playRichQuakeTone, triggerHaptic } from './audio';
