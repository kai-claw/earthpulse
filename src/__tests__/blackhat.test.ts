import { describe, it, expect } from 'vitest';
import {
  convertEarthquakeToGlobePoint,
  getDepthColor,
  getMagnitudeSize,
  getMagnitudeColor,
  calculateStatistics,
  filterEarthquakesByTimeRange,
  formatRelativeTime,
  calculateDistance,
  getMagnitudeDescription,
  getDepthDescription,
} from '../utils/helpers';
import type { EarthquakeFeature, GlobePoint } from '../types';

// Helper to create a minimal earthquake feature
function makeFeature(overrides: Partial<{
  mag: number; place: string; time: number; lng: number; lat: number; depth: number; id: string;
}> = {}): EarthquakeFeature {
  return {
    type: 'Feature',
    properties: {
      mag: overrides.mag ?? 5.0,
      place: overrides.place ?? '10km NE of Somewhere',
      time: overrides.time ?? Date.now(),
      updated: Date.now(),
      url: '',
      detail: '',
      status: 'reviewed',
      tsunami: 0,
      sig: 100,
      net: 'us',
      code: 'test',
      ids: ',test,',
      sources: ',us,',
      types: ',origin,',
      magType: 'ml',
      type: 'earthquake',
      title: 'M 5.0 - test',
    },
    geometry: {
      type: 'Point',
      coordinates: [overrides.lng ?? -117.5, overrides.lat ?? 34.0, overrides.depth ?? 10],
    },
    id: overrides.id ?? 'test1',
  };
}

function makeGlobePoint(overrides: Partial<GlobePoint> = {}): GlobePoint {
  return {
    lat: 34.0,
    lng: -117.5,
    magnitude: 5.0,
    depth: 10,
    place: '10km NE of Somewhere',
    time: Date.now(),
    id: 'test1',
    color: '#ff4444',
    size: 1.5,
    ...overrides,
  };
}

describe('Black Hat — Edge Cases & Error Handling', () => {
  describe('convertEarthquakeToGlobePoint edge cases', () => {
    it('handles null/zero magnitude gracefully', () => {
      const feature = makeFeature({ mag: 0 });
      // @ts-expect-error: simulate USGS returning null mag
      feature.properties.mag = null;
      const point = convertEarthquakeToGlobePoint(feature);
      expect(point.magnitude).toBe(0);
      expect(Number.isFinite(point.size)).toBe(true);
    });

    it('handles negative depth (above sea level)', () => {
      const feature = makeFeature({ depth: -5 });
      const point = convertEarthquakeToGlobePoint(feature);
      // Should take absolute value
      expect(point.depth).toBe(5);
      expect(point.depth).toBeGreaterThanOrEqual(0);
    });

    it('handles extremely large depth', () => {
      const feature = makeFeature({ depth: 700 });
      const point = convertEarthquakeToGlobePoint(feature);
      expect(point.depth).toBe(700);
      const color = getDepthColor(700);
      expect(color).toBeTruthy();
    });

    it('handles extreme coordinates', () => {
      const feature = makeFeature({ lat: 90, lng: 180 });
      const point = convertEarthquakeToGlobePoint(feature);
      expect(point.lat).toBe(90);
      expect(point.lng).toBe(180);
    });

    it('handles extreme coordinates negative', () => {
      const feature = makeFeature({ lat: -90, lng: -180 });
      const point = convertEarthquakeToGlobePoint(feature);
      expect(point.lat).toBe(-90);
      expect(point.lng).toBe(-180);
    });
  });

  describe('getMagnitudeSize clamping', () => {
    it('returns minimum for negative magnitude', () => {
      expect(getMagnitudeSize(-1)).toBe(0.1);
    });

    it('returns clamped max for extreme magnitude', () => {
      expect(getMagnitudeSize(100)).toBe(2.0);
    });

    it('returns finite for zero', () => {
      const size = getMagnitudeSize(0);
      expect(Number.isFinite(size)).toBe(true);
      expect(size).toBe(0.1);
    });
  });

  describe('getDepthColor exhaustive coverage', () => {
    it('covers all depth ranges without gaps', () => {
      const depths = [0, 10, 34, 35, 69, 70, 149, 150, 299, 300, 499, 500, 700];
      for (const d of depths) {
        const color = getDepthColor(d);
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });
  });

  describe('getMagnitudeColor exhaustive coverage', () => {
    it('covers all magnitude ranges', () => {
      const mags = [0, 1, 1.9, 2, 2.9, 3, 3.9, 4, 4.9, 5, 5.9, 6, 6.9, 7, 8, 9, 10];
      for (const m of mags) {
        const color = getMagnitudeColor(m);
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });
  });

  describe('calculateStatistics edge cases', () => {
    it('handles empty array', () => {
      const stats = calculateStatistics([]);
      expect(stats.totalEvents).toBe(0);
      expect(stats.largestMagnitude).toBe(0);
      expect(stats.averageDepth).toBe(0);
    });

    it('handles single earthquake', () => {
      const stats = calculateStatistics([makeGlobePoint()]);
      expect(stats.totalEvents).toBe(1);
      expect(stats.largestMagnitude).toBe(5.0);
    });

    it('handles all same magnitude', () => {
      const quakes = Array.from({ length: 5 }, () => makeGlobePoint({ magnitude: 3.0 }));
      const stats = calculateStatistics(quakes);
      expect(stats.largestMagnitude).toBe(3.0);
    });

    it('handles place without " of " delimiter', () => {
      const stats = calculateStatistics([makeGlobePoint({ place: 'Alaska' })]);
      expect(stats.mostActiveRegion).toBeTruthy();
    });
  });

  describe('filterEarthquakesByTimeRange edge cases', () => {
    it('returns empty for all-expired events', () => {
      const old = makeGlobePoint({ time: Date.now() - 48 * 60 * 60 * 1000 });
      const result = filterEarthquakesByTimeRange([old], 24);
      expect(result).toHaveLength(0);
    });

    it('returns all for very large time range', () => {
      const quakes = [
        makeGlobePoint({ time: Date.now() - 1000 }),
        makeGlobePoint({ time: Date.now() - 3600000 }),
      ];
      const result = filterEarthquakesByTimeRange(quakes, 999999);
      expect(result).toHaveLength(2);
    });

    it('handles zero hours gracefully', () => {
      // 0 hours back means cutoff = now; a point created at exactly now may pass (race)
      // But a point 1 second old definitely shouldn't pass
      const old = makeGlobePoint({ time: Date.now() - 1000 });
      const result = filterEarthquakesByTimeRange([old], 0);
      expect(result).toHaveLength(0);
    });
  });

  describe('formatRelativeTime edge cases', () => {
    it('handles future timestamps', () => {
      const futureTime = Date.now() + 60000;
      const result = formatRelativeTime(futureTime);
      // Should still return something without crashing
      expect(typeof result).toBe('string');
    });

    it('handles very old timestamps', () => {
      const result = formatRelativeTime(0); // epoch
      expect(result).toContain('days ago');
    });
  });

  describe('calculateDistance edge cases', () => {
    it('handles same point', () => {
      expect(calculateDistance(34, -117, 34, -117)).toBe(0);
    });

    it('handles poles', () => {
      const dist = calculateDistance(90, 0, -90, 0);
      expect(dist).toBeGreaterThan(19000); // ~20,000 km
      expect(dist).toBeLessThan(21000);
    });

    it('returns finite for all valid inputs', () => {
      const inputs: [number, number, number, number][] = [
        [0, 0, 0, 0],
        [90, 180, -90, -180],
        [45, 45, -45, -45],
      ];
      for (const args of inputs) {
        expect(Number.isFinite(calculateDistance(...args))).toBe(true);
      }
    });
  });

  describe('getMagnitudeDescription coverage', () => {
    it('covers all categories without gaps', () => {
      const expected = ['Micro', 'Minor', 'Light', 'Moderate', 'Strong', 'Major', 'Great', 'Historic'];
      const magnitudes = [0, 2, 3, 4, 5, 6, 7, 8.5];
      magnitudes.forEach((m, i) => {
        expect(getMagnitudeDescription(m)).toBe(expected[i]);
      });
    });
  });

  describe('getDepthDescription coverage', () => {
    it('covers all categories', () => {
      expect(getDepthDescription(0)).toBe('Shallow');
      expect(getDepthDescription(34)).toBe('Shallow');
      expect(getDepthDescription(35)).toBe('Intermediate');
      expect(getDepthDescription(69)).toBe('Intermediate');
      expect(getDepthDescription(70)).toBe('Deep');
      expect(getDepthDescription(299)).toBe('Deep');
      expect(getDepthDescription(300)).toBe('Very Deep');
      expect(getDepthDescription(700)).toBe('Very Deep');
    });
  });

  describe('Type safety checks', () => {
    it('GlobePoint has all required fields', () => {
      const point = makeGlobePoint();
      const requiredKeys: (keyof GlobePoint)[] = ['lat', 'lng', 'magnitude', 'depth', 'place', 'time', 'id', 'color', 'size'];
      for (const key of requiredKeys) {
        expect(point).toHaveProperty(key);
        expect(point[key]).not.toBeUndefined();
      }
    });
  });
});
