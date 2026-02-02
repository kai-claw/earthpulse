import { describe, it, expect } from 'vitest';
import {
  convertEarthquakeToGlobePoint,
  getDepthColor,
  getMagnitudeSize,
  getMagnitudeColor,
  calculateDistance,
  formatRelativeTime,
  calculateStatistics,
  filterEarthquakesByTimeRange,
  sortEarthquakesByTime,
  getMagnitudeDescription,
  getDepthDescription,
} from '../utils/helpers';
import type { EarthquakeFeature, GlobePoint } from '../types';

// --- Test Fixtures ---

function makeFeature(overrides: Partial<{
  mag: number; place: string; time: number; lng: number; lat: number; depth: number; id: string;
}> = {}): EarthquakeFeature {
  return {
    type: 'Feature',
    properties: {
      mag: overrides.mag ?? 4.5,
      place: overrides.place ?? '10km NE of Tokyo, Japan',
      time: overrides.time ?? Date.now(),
      updated: Date.now(),
      url: '',
      detail: '',
      status: 'reviewed',
      tsunami: 0,
      sig: 100,
      net: 'us',
      code: 'abc',
      ids: ',usabc,',
      sources: ',us,',
      types: ',origin,',
      magType: 'ml',
      type: 'earthquake',
      title: `M ${overrides.mag ?? 4.5} - ${overrides.place ?? 'Test'}`,
    },
    geometry: {
      type: 'Point',
      coordinates: [overrides.lng ?? 139.7, overrides.lat ?? 35.7, overrides.depth ?? 25],
    },
    id: overrides.id ?? 'test1',
  };
}

function makeGlobePoint(overrides: Partial<GlobePoint> = {}): GlobePoint {
  return {
    lat: overrides.lat ?? 35.7,
    lng: overrides.lng ?? 139.7,
    magnitude: overrides.magnitude ?? 4.5,
    depth: overrides.depth ?? 25,
    place: overrides.place ?? '10km NE of Tokyo, Japan',
    time: overrides.time ?? Date.now(),
    id: overrides.id ?? 'test1',
    color: overrides.color ?? '#ff4444',
    size: overrides.size ?? 1.35,
  };
}

// --- convertEarthquakeToGlobePoint ---

describe('convertEarthquakeToGlobePoint', () => {
  it('extracts lat/lng/depth from geometry coordinates', () => {
    const feature = makeFeature({ lat: 40.0, lng: -120.0, depth: 50 });
    const point = convertEarthquakeToGlobePoint(feature);
    expect(point.lat).toBe(40.0);
    expect(point.lng).toBe(-120.0);
    expect(point.depth).toBe(50);
  });

  it('uses absolute depth value', () => {
    const feature = makeFeature({ depth: -10 });
    const point = convertEarthquakeToGlobePoint(feature);
    expect(point.depth).toBe(10);
  });

  it('defaults null magnitude to 0', () => {
    const feature = makeFeature();
    feature.properties.mag = null as any;
    const point = convertEarthquakeToGlobePoint(feature);
    expect(point.magnitude).toBe(0);
  });

  it('assigns color based on depth', () => {
    const shallow = convertEarthquakeToGlobePoint(makeFeature({ depth: 10 }));
    const deep = convertEarthquakeToGlobePoint(makeFeature({ depth: 400 }));
    expect(shallow.color).toBe('#ff4444');
    expect(deep.color).toBe('#0088ff');
  });

  it('assigns size based on magnitude', () => {
    const small = convertEarthquakeToGlobePoint(makeFeature({ mag: 1.0 }));
    const large = convertEarthquakeToGlobePoint(makeFeature({ mag: 7.0 }));
    expect(large.size).toBeGreaterThan(small.size);
  });
});

// --- getDepthColor ---

describe('getDepthColor', () => {
  it('returns red for shallow (<35km)', () => {
    expect(getDepthColor(10)).toBe('#ff4444');
  });
  it('returns orange for intermediate (35-70km)', () => {
    expect(getDepthColor(50)).toBe('#ff8800');
  });
  it('returns yellow for medium (70-150km)', () => {
    expect(getDepthColor(100)).toBe('#ffdd00');
  });
  it('returns light green for deep (150-300km)', () => {
    expect(getDepthColor(200)).toBe('#88ff00');
  });
  it('returns blue for very deep (300-500km)', () => {
    expect(getDepthColor(400)).toBe('#0088ff');
  });
  it('returns dark blue for extremely deep (>500km)', () => {
    expect(getDepthColor(600)).toBe('#0044ff');
  });
});

// --- getMagnitudeSize ---

describe('getMagnitudeSize', () => {
  it('clamps minimum to 0.1', () => {
    expect(getMagnitudeSize(0)).toBe(0.1);
    expect(getMagnitudeSize(-1)).toBe(0.1);
  });
  it('clamps maximum to 2.0', () => {
    expect(getMagnitudeSize(10)).toBe(2.0);
  });
  it('scales linearly by 0.3', () => {
    expect(getMagnitudeSize(5)).toBeCloseTo(1.5);
  });
});

// --- getMagnitudeColor ---

describe('getMagnitudeColor', () => {
  it('returns green for micro (<2)', () => {
    expect(getMagnitudeColor(1)).toBe('#00ff00');
  });
  it('returns dark red for great (7+)', () => {
    expect(getMagnitudeColor(8)).toBe('#cc0000');
  });
  it('covers all magnitude ranges', () => {
    const colors = [0, 2, 3, 4, 5, 6, 7].map(getMagnitudeColor);
    const unique = new Set(colors);
    expect(unique.size).toBe(7);
  });
});

// --- getMagnitudeDescription ---

describe('getMagnitudeDescription', () => {
  const cases: [number, string][] = [
    [0.5, 'Micro'], [2.5, 'Minor'], [3.5, 'Light'],
    [4.5, 'Moderate'], [5.5, 'Strong'], [6.5, 'Major'],
    [7.5, 'Great'], [9.0, 'Historic'],
  ];
  cases.forEach(([mag, desc]) => {
    it(`returns "${desc}" for magnitude ${mag}`, () => {
      expect(getMagnitudeDescription(mag)).toBe(desc);
    });
  });
});

// --- getDepthDescription ---

describe('getDepthDescription', () => {
  it('classifies shallow correctly', () => {
    expect(getDepthDescription(20)).toBe('Shallow');
  });
  it('classifies intermediate correctly', () => {
    expect(getDepthDescription(50)).toBe('Intermediate');
  });
  it('classifies deep correctly', () => {
    expect(getDepthDescription(200)).toBe('Deep');
  });
  it('classifies very deep correctly', () => {
    expect(getDepthDescription(400)).toBe('Very Deep');
  });
});

// --- calculateDistance ---

describe('calculateDistance', () => {
  it('returns 0 for same point', () => {
    expect(calculateDistance(0, 0, 0, 0)).toBe(0);
  });
  it('calculates correct great-circle distance', () => {
    // New York to London ≈ 5570 km
    const dist = calculateDistance(40.7128, -74.006, 51.5074, -0.1278);
    expect(dist).toBeGreaterThan(5500);
    expect(dist).toBeLessThan(5600);
  });
  it('handles antipodal points (~20000km)', () => {
    const dist = calculateDistance(0, 0, 0, 180);
    expect(dist).toBeGreaterThan(19900);
    expect(dist).toBeLessThan(20100);
  });
});

// --- formatRelativeTime ---

describe('formatRelativeTime', () => {
  it('formats minutes correctly', () => {
    const time = Date.now() - 30 * 60 * 1000;
    expect(formatRelativeTime(time)).toBe('30 minutes ago');
  });
  it('formats hours correctly', () => {
    const time = Date.now() - 5 * 60 * 60 * 1000;
    expect(formatRelativeTime(time)).toBe('5 hours ago');
  });
  it('formats days correctly', () => {
    const time = Date.now() - 3 * 24 * 60 * 60 * 1000;
    expect(formatRelativeTime(time)).toBe('3 days ago');
  });
});

// --- calculateStatistics ---

describe('calculateStatistics', () => {
  it('returns zeros for empty array', () => {
    const stats = calculateStatistics([]);
    expect(stats.totalEvents).toBe(0);
    expect(stats.largestMagnitude).toBe(0);
    expect(stats.largestQuake).toBe('None');
    expect(stats.averageDepth).toBe(0);
  });

  it('finds largest earthquake', () => {
    const quakes = [
      makeGlobePoint({ magnitude: 2.0, place: 'Place A' }),
      makeGlobePoint({ magnitude: 6.5, place: 'Place B' }),
      makeGlobePoint({ magnitude: 3.0, place: 'Place C' }),
    ];
    const stats = calculateStatistics(quakes);
    expect(stats.largestMagnitude).toBe(6.5);
    expect(stats.largestQuake).toBe('Place B');
    expect(stats.totalEvents).toBe(3);
  });

  it('computes average depth', () => {
    const quakes = [
      makeGlobePoint({ depth: 10 }),
      makeGlobePoint({ depth: 30 }),
      makeGlobePoint({ depth: 50 }),
    ];
    const stats = calculateStatistics(quakes);
    expect(stats.averageDepth).toBe(30);
  });

  it('identifies most active region', () => {
    const quakes = [
      makeGlobePoint({ place: '10km NE of Tokyo, Japan' }),
      makeGlobePoint({ place: '5km S of Tokyo, Japan' }),
      makeGlobePoint({ place: '20km W of Osaka, Japan' }),
    ];
    const stats = calculateStatistics(quakes);
    expect(stats.mostActiveRegion).toBe('Tokyo');
  });
});

// --- filterEarthquakesByTimeRange ---

describe('filterEarthquakesByTimeRange', () => {
  it('filters out old earthquakes', () => {
    const now = Date.now();
    const quakes = [
      makeGlobePoint({ time: now - 1 * 60 * 60 * 1000 }),  // 1h ago
      makeGlobePoint({ time: now - 25 * 60 * 60 * 1000 }), // 25h ago
    ];
    const filtered = filterEarthquakesByTimeRange(quakes, 24);
    expect(filtered.length).toBe(1);
  });

  it('keeps all within range', () => {
    const now = Date.now();
    const quakes = [
      makeGlobePoint({ time: now - 10 * 60 * 1000 }),
      makeGlobePoint({ time: now - 30 * 60 * 1000 }),
    ];
    const filtered = filterEarthquakesByTimeRange(quakes, 1);
    expect(filtered.length).toBe(2);
  });
});

// --- sortEarthquakesByTime ---

describe('sortEarthquakesByTime', () => {
  it('sorts by time ascending', () => {
    const quakes = [
      makeGlobePoint({ time: 3000 }),
      makeGlobePoint({ time: 1000 }),
      makeGlobePoint({ time: 2000 }),
    ];
    const sorted = sortEarthquakesByTime(quakes);
    expect(sorted[0].time).toBe(1000);
    expect(sorted[1].time).toBe(2000);
    expect(sorted[2].time).toBe(3000);
  });

  it('does not mutate original array', () => {
    const quakes = [
      makeGlobePoint({ time: 3000 }),
      makeGlobePoint({ time: 1000 }),
    ];
    sortEarthquakesByTime(quakes);
    expect(quakes[0].time).toBe(3000);
  });
});

// --- Type system ---

describe('type system', () => {
  it('GlobePoint has all required fields', () => {
    const point = makeGlobePoint();
    expect(point).toHaveProperty('lat');
    expect(point).toHaveProperty('lng');
    expect(point).toHaveProperty('magnitude');
    expect(point).toHaveProperty('depth');
    expect(point).toHaveProperty('place');
    expect(point).toHaveProperty('time');
    expect(point).toHaveProperty('id');
    expect(point).toHaveProperty('color');
    expect(point).toHaveProperty('size');
  });
});
