/**
 * Seismic ring generation and tour stop selection.
 */

import type { GlobePoint } from '../types';
import { MAX_SEISMIC_RINGS, SEISMIC_RING_MIN_MAG } from './constants';

/**
 * Generate seismic ring data from earthquake points.
 * Bigger quakes → bigger, slower rings. Recent quakes → faster repeat.
 */
export function generateSeismicRings(earthquakes: GlobePoint[]): {
  lat: number;
  lng: number;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
  color: (t: number) => string;
}[] {
  const significant = earthquakes
    .filter(q => q.magnitude >= SEISMIC_RING_MIN_MAG)
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, MAX_SEISMIC_RINGS);

  return significant.map(q => {
    const mag = q.magnitude;
    const maxR = Math.min(8, mag * 0.8);
    const speed = Math.max(1, 6 - mag * 0.5);
    const ageHours = (Date.now() - q.time) / (1000 * 60 * 60);
    const repeat = Math.max(600, Math.min(3000, ageHours * 200 + 400));

    const baseColor = mag >= 6 ? '255,50,50' : mag >= 4.5 ? '255,165,0' : '100,200,255';

    return {
      lat: q.lat,
      lng: q.lng,
      maxR,
      propagationSpeed: speed,
      repeatPeriod: repeat,
      color: (t: number) => `rgba(${baseColor},${1 - t})`,
    };
  });
}

/**
 * Get the top N earthquakes sorted by magnitude (for tours/cinematic).
 */
export function getTourStops(earthquakes: GlobePoint[], count = 8): GlobePoint[] {
  return [...earthquakes]
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, count);
}
