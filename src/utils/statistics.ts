/**
 * Earthquake statistics calculation, filtering, and sorting.
 */

import type { GlobePoint, Statistics } from '../types';

function extractRegion(place: string): string {
  const parts = place.split(' of ');
  if (parts.length > 1) {
    return parts[parts.length - 1].split(',')[0];
  }
  return place.split(',')[0];
}

export function calculateStatistics(earthquakes: GlobePoint[]): Statistics {
  if (earthquakes.length === 0) {
    return {
      totalEvents: 0,
      largestMagnitude: 0,
      largestQuake: 'None',
      mostActiveRegion: 'None',
      averageDepth: 0,
      totalFelt: 0,
      tsunamiWarnings: 0,
      significanceScore: 0,
    };
  }

  const largestQuake = earthquakes.reduce((max, quake) => {
    const mag = Number.isFinite(quake.magnitude) ? quake.magnitude : 0;
    const maxMag = Number.isFinite(max.magnitude) ? max.magnitude : 0;
    return mag > maxMag ? quake : max;
  });

  const totalDepth = earthquakes.reduce((sum, quake) => {
    const d = Number.isFinite(quake.depth) ? quake.depth : 0;
    return sum + d;
  }, 0);
  const averageDepth = totalDepth / earthquakes.length;

  // Group nearby earthquakes by extracted region name
  const regionCounts = new Map<string, number>();
  for (const quake of earthquakes) {
    const region = extractRegion(quake.place);
    regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
  }

  const mostActiveRegion = Array.from(regionCounts.entries())
    .reduce((max, [region, count]) =>
      count > max[1] ? [region, count] : max, ['', 0])[0];

  const totalFelt = earthquakes.reduce((sum, q) => sum + (q.felt || 0), 0);
  const tsunamiWarnings = earthquakes.filter(q => q.tsunami).length;
  const significanceScore = earthquakes.reduce((sum, q) => sum + q.sig, 0);

  const largestMag = Number.isFinite(largestQuake.magnitude) ? largestQuake.magnitude : 0;

  return {
    totalEvents: earthquakes.length,
    largestMagnitude: largestMag,
    largestQuake: largestQuake.place,
    mostActiveRegion: mostActiveRegion || 'Global',
    averageDepth: Math.round(averageDepth * 10) / 10,
    totalFelt,
    tsunamiWarnings,
    significanceScore,
  };
}

export function filterEarthquakesByTimeRange(
  earthquakes: GlobePoint[],
  hoursBack: number,
): GlobePoint[] {
  const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
  return earthquakes.filter(quake => quake.time >= cutoffTime);
}

export function sortEarthquakesByTime(earthquakes: GlobePoint[]): GlobePoint[] {
  return [...earthquakes].sort((a, b) => a.time - b.time);
}
