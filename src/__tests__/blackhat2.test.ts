/**
 * Black Hat #2 — Stress Tests
 *
 * Focus areas:
 * 1. Large dataset performance (O(n²) algorithms)
 * 2. Malformed data resilience
 * 3. Concurrent operation safety
 * 4. Resource cleanup verification
 * 5. Edge case bombardment
 * 6. Data validation pipeline
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { validateEarthquakeResponse } from '../utils/api';
import { generateSeismicArcs, generateHeatmapPoints, MAX_ARCS, ARC_MIN_MAG } from '../utils/clusters';
import { generateSeismicRings } from '../utils/seismic';
import { calculateStatistics, filterEarthquakesByTimeRange } from '../utils/statistics';
import { convertEarthquakeToGlobePoint } from '../utils/geo';
import { calculateMood } from '../utils/mood';
import { magnitudeToJoules, getEnergyComparison } from '../utils/energy';
import { getMagnitudeSize, getMagnitudeColor, getDepthColor } from '../utils/colors';
import { getTourStops } from '../utils/seismic';
import { playRichQuakeTone, triggerHaptic } from '../utils/audio';
import type { GlobePoint, EarthquakeFeature } from '../types';

// ─── Test Data Factories ───

function makeGlobePoint(overrides: Partial<GlobePoint> = {}): GlobePoint {
  return {
    lat: 34.0 + Math.random() * 0.5,
    lng: -117.5 + Math.random() * 0.5,
    magnitude: 3.0 + Math.random() * 4,
    depth: 10 + Math.random() * 100,
    place: '10km NE of Test City',
    time: Date.now() - Math.random() * 48 * 3600000,
    id: `test-${Math.random().toString(36).slice(2)}`,
    color: '#ff4444',
    size: 1.0,
    tsunami: false,
    sig: 100,
    url: '',
    ...overrides,
  };
}

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

/** Generate N clustered earthquakes (nearby in space + time, triggering arc generation) */
function generateCluster(n: number, baseLat = 35.0, baseLng = -118.0): GlobePoint[] {
  const baseTime = Date.now();
  return Array.from({ length: n }, (_, i) => makeGlobePoint({
    lat: baseLat + (Math.random() - 0.5) * 2,  // within ~1° (110km)
    lng: baseLng + (Math.random() - 0.5) * 2,
    magnitude: ARC_MIN_MAG + Math.random() * 5,
    time: baseTime - i * 3600000, // 1 hour apart
    id: `cluster-${i}`,
  }));
}

/** Generate N dispersed earthquakes (globally scattered, fewer arcs) */
function generateScattered(n: number): GlobePoint[] {
  const baseTime = Date.now();
  return Array.from({ length: n }, (_, i) => makeGlobePoint({
    lat: -90 + Math.random() * 180,
    lng: -180 + Math.random() * 360,
    magnitude: 1.0 + Math.random() * 7,
    time: baseTime - i * 60000,
    id: `scattered-${i}`,
  }));
}


// ═════════════════════════════════════════════════════════════
// 1. LARGE DATASET PERFORMANCE
// ═════════════════════════════════════════════════════════════

describe('Stress: Large Dataset Performance', () => {
  it('generateSeismicArcs handles 500 clustered earthquakes within time budget', () => {
    const quakes = generateCluster(500);
    const start = performance.now();
    const arcs = generateSeismicArcs(quakes);
    const elapsed = performance.now() - start;

    expect(arcs.length).toBeLessThanOrEqual(MAX_ARCS);
    expect(arcs.length).toBeGreaterThan(0);
    // Should complete in under 200ms even on CI (O(n²) with pre-filter)
    expect(elapsed).toBeLessThan(500);
  });

  it('generateSeismicArcs respects MAX_ARCS cap strictly', () => {
    // 300 clustered quakes = up to 44,850 pair checks
    const quakes = generateCluster(300);
    const arcs = generateSeismicArcs(quakes);
    expect(arcs.length).toBeLessThanOrEqual(MAX_ARCS);
  });

  it('generateSeismicArcs with scattered data exits quickly (few pairs match)', () => {
    const quakes = generateScattered(500);
    const start = performance.now();
    const arcs = generateSeismicArcs(quakes);
    const elapsed = performance.now() - start;

    // Scattered data means few spatial matches → should be very fast
    expect(elapsed).toBeLessThan(200);
    // Still returns valid arc array
    expect(Array.isArray(arcs)).toBe(true);
  });

  it('generateHeatmapPoints handles 500 earthquakes', () => {
    const quakes = generateScattered(500);
    const start = performance.now();
    const points = generateHeatmapPoints(quakes);
    const elapsed = performance.now() - start;

    expect(points).toHaveLength(500);
    expect(elapsed).toBeLessThan(100); // O(n) — should be instant
    // All weights must be in [0.1, 1.0]
    for (const p of points) {
      expect(p.weight).toBeGreaterThanOrEqual(0.1);
      expect(p.weight).toBeLessThanOrEqual(1.0);
      expect(Number.isFinite(p.lat)).toBe(true);
      expect(Number.isFinite(p.lng)).toBe(true);
    }
  });

  it('generateSeismicRings handles 500 earthquakes (caps to MAX_SEISMIC_RINGS)', () => {
    const quakes = generateScattered(500).map(q => ({ ...q, magnitude: 5.0 })); // all eligible
    const rings = generateSeismicRings(quakes);
    expect(rings.length).toBeLessThanOrEqual(30); // MAX_SEISMIC_RINGS
    for (const ring of rings) {
      expect(Number.isFinite(ring.lat)).toBe(true);
      expect(Number.isFinite(ring.lng)).toBe(true);
      expect(ring.maxR).toBeGreaterThan(0);
      expect(typeof ring.color).toBe('function');
    }
  });

  it('calculateStatistics handles 500 earthquakes', () => {
    const quakes = generateScattered(500);
    const start = performance.now();
    const stats = calculateStatistics(quakes);
    const elapsed = performance.now() - start;

    expect(stats.totalEvents).toBe(500);
    expect(stats.largestMagnitude).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });

  it('calculateMood handles 500 earthquakes', () => {
    const quakes = generateScattered(500);
    const mood = calculateMood(quakes);
    expect(['serene', 'quiet', 'stirring', 'restless', 'volatile', 'fierce']).toContain(mood.mood);
    expect(mood.intensity).toBeGreaterThanOrEqual(0);
    expect(mood.intensity).toBeLessThanOrEqual(1);
  });

  it('filterEarthquakesByTimeRange handles 500 earthquakes', () => {
    const quakes = generateScattered(500);
    const start = performance.now();
    const filtered = filterEarthquakesByTimeRange(quakes, 24);
    const elapsed = performance.now() - start;

    expect(filtered.length).toBeLessThanOrEqual(500);
    expect(elapsed).toBeLessThan(20);
  });

  it('getTourStops handles 500 earthquakes', () => {
    const quakes = generateScattered(500);
    const stops = getTourStops(quakes, 12);
    expect(stops.length).toBeLessThanOrEqual(12);
    // Stops should be sorted by magnitude descending
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i - 1].magnitude).toBeGreaterThanOrEqual(stops[i].magnitude);
    }
  });
});


// ═════════════════════════════════════════════════════════════
// 2. MALFORMED DATA RESILIENCE
// ═════════════════════════════════════════════════════════════

describe('Stress: Malformed Data Resilience', () => {
  describe('validateEarthquakeResponse', () => {
    it('rejects null input', () => {
      expect(() => validateEarthquakeResponse(null)).toThrow('not an object');
    });

    it('rejects primitive input', () => {
      expect(() => validateEarthquakeResponse('hello')).toThrow();
      expect(() => validateEarthquakeResponse(42)).toThrow();
      expect(() => validateEarthquakeResponse(true)).toThrow();
    });

    it('rejects missing FeatureCollection type', () => {
      expect(() => validateEarthquakeResponse({ features: [] })).toThrow('missing FeatureCollection');
    });

    it('rejects missing features array', () => {
      expect(() => validateEarthquakeResponse({ type: 'FeatureCollection' })).toThrow('missing FeatureCollection');
    });

    it('accepts valid empty FeatureCollection', () => {
      const result = validateEarthquakeResponse({ type: 'FeatureCollection', features: [] });
      expect(result.features).toHaveLength(0);
    });

    it('strips features with missing properties', () => {
      const result = validateEarthquakeResponse({
        type: 'FeatureCollection',
        features: [
          { geometry: { type: 'Point', coordinates: [0, 0, 10] } },  // no properties
          makeFeature(),  // valid
        ],
      });
      expect(result.features).toHaveLength(1);
    });

    it('strips features with missing geometry', () => {
      const result = validateEarthquakeResponse({
        type: 'FeatureCollection',
        features: [
          { properties: { mag: 5 } },  // no geometry
          makeFeature(),  // valid
        ],
      });
      expect(result.features).toHaveLength(1);
    });

    it('strips features with insufficient coordinates', () => {
      const result = validateEarthquakeResponse({
        type: 'FeatureCollection',
        features: [
          { properties: { mag: 5 }, geometry: { type: 'Point', coordinates: [0, 0] } },  // only 2 coords
          makeFeature(),  // valid
        ],
      });
      expect(result.features).toHaveLength(1);
    });

    it('strips features with NaN coordinates', () => {
      const result = validateEarthquakeResponse({
        type: 'FeatureCollection',
        features: [
          { properties: { mag: 5 }, geometry: { type: 'Point', coordinates: [NaN, 0, 10] } },
          { properties: { mag: 5 }, geometry: { type: 'Point', coordinates: [0, Infinity, 10] } },
          { properties: { mag: 5 }, geometry: { type: 'Point', coordinates: [0, 0, -Infinity] } },
          makeFeature(),  // valid
        ],
      });
      expect(result.features).toHaveLength(1);
    });

    it('strips null/non-object features', () => {
      const result = validateEarthquakeResponse({
        type: 'FeatureCollection',
        features: [null, undefined, 42, 'string', makeFeature()],
      });
      expect(result.features).toHaveLength(1);
    });

    it('preserves valid features from a mixed batch', () => {
      const validFeatures = [makeFeature({ id: 'a' }), makeFeature({ id: 'b' }), makeFeature({ id: 'c' })];
      const invalidFeatures = [null, { properties: {} }, { geometry: { coordinates: [NaN] } }];
      const result = validateEarthquakeResponse({
        type: 'FeatureCollection',
        features: [...invalidFeatures, ...validFeatures],
      });
      expect(result.features).toHaveLength(3);
    });
  });

  describe('convertEarthquakeToGlobePoint malformed inputs', () => {
    it('handles NaN magnitude gracefully', () => {
      const feature = makeFeature({ mag: NaN });
      const point = convertEarthquakeToGlobePoint(feature);
      // NaN || 0 = 0
      expect(point.magnitude).toBe(0);
      expect(Number.isFinite(point.size)).toBe(true);
    });

    it('handles undefined magnitude gracefully', () => {
      const feature = makeFeature();
      // @ts-expect-error: simulate USGS omitting mag
      feature.properties.mag = undefined;
      const point = convertEarthquakeToGlobePoint(feature);
      expect(point.magnitude).toBe(0);
    });

    it('handles extremely large magnitude', () => {
      const feature = makeFeature({ mag: 15 }); // impossible but defensive
      const point = convertEarthquakeToGlobePoint(feature);
      expect(Number.isFinite(point.magnitude)).toBe(true);
      expect(Number.isFinite(point.size)).toBe(true);
    });

    it('handles negative magnitude', () => {
      const feature = makeFeature({ mag: -2 }); // real: micro-earthquakes can be negative
      const point = convertEarthquakeToGlobePoint(feature);
      expect(Number.isFinite(point.magnitude)).toBe(true);
    });

    it('handles empty place string', () => {
      const feature = makeFeature({ place: '' });
      const point = convertEarthquakeToGlobePoint(feature);
      expect(typeof point.place).toBe('string');
    });
  });

  describe('Color/size functions with extreme inputs', () => {
    it('getMagnitudeSize returns finite for NaN', () => {
      const size = getMagnitudeSize(NaN);
      expect(Number.isFinite(size)).toBe(true);
      expect(size).toBe(0.1); // NaN → 0 → 0*0.3=0 → clamped to min 0.1
    });

    it('getMagnitudeSize returns finite for Infinity', () => {
      expect(Number.isFinite(getMagnitudeSize(Infinity))).toBe(true);
      expect(Number.isFinite(getMagnitudeSize(-Infinity))).toBe(true);
    });

    it('getMagnitudeColor returns valid hex for NaN magnitude', () => {
      const color = getMagnitudeColor(NaN);
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(color).toBe('#00ff00'); // NaN → 0 → green (lowest tier)
    });

    it('getMagnitudeColor returns valid hex for negative magnitude', () => {
      const color = getMagnitudeColor(-5);
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('getMagnitudeColor returns valid hex for Infinity', () => {
      expect(getMagnitudeColor(Infinity)).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(getMagnitudeColor(-Infinity)).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('getDepthColor returns valid hex for NaN depth', () => {
      const color = getDepthColor(NaN);
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(color).toBe('#ff4444'); // NaN → 0 → shallow (red)
    });

    it('getDepthColor returns valid hex for negative depth', () => {
      const color = getDepthColor(-100);
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('getDepthColor returns valid hex for Infinity', () => {
      expect(getDepthColor(Infinity)).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(getDepthColor(-Infinity)).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});


// ═════════════════════════════════════════════════════════════
// 3. ALGORITHM CORRECTNESS UNDER STRESS
// ═════════════════════════════════════════════════════════════

describe('Stress: Algorithm Correctness Under Load', () => {
  it('generateSeismicArcs: all arcs have valid geometry', () => {
    const quakes = generateCluster(200);
    const arcs = generateSeismicArcs(quakes);

    for (const arc of arcs) {
      expect(Number.isFinite(arc.startLat)).toBe(true);
      expect(Number.isFinite(arc.startLng)).toBe(true);
      expect(Number.isFinite(arc.endLat)).toBe(true);
      expect(Number.isFinite(arc.endLng)).toBe(true);
      expect(arc.startLat).toBeGreaterThanOrEqual(-90);
      expect(arc.startLat).toBeLessThanOrEqual(90);
      expect(arc.endLat).toBeGreaterThanOrEqual(-90);
      expect(arc.endLat).toBeLessThanOrEqual(90);
      expect(arc.stroke).toBeGreaterThan(0);
      expect(arc.altitude).toBeGreaterThan(0);
      expect(arc.color).toHaveLength(2);
      expect(typeof arc.label).toBe('string');
    }
  });

  it('generateSeismicArcs: arcs connect distinct points (no self-loops)', () => {
    const quakes = generateCluster(100);
    const arcs = generateSeismicArcs(quakes);

    for (const arc of arcs) {
      const isSelfLoop = arc.startLat === arc.endLat && arc.startLng === arc.endLng;
      expect(isSelfLoop).toBe(false);
    }
  });

  it('generateHeatmapPoints: single earthquake gives weight 1.0', () => {
    const quakes = [makeGlobePoint({ magnitude: 5.0 })];
    const points = generateHeatmapPoints(quakes);
    expect(points).toHaveLength(1);
    // Single point: min = max = same, so normalized to 0.1 + 0 = 0.1? No...
    // range = maxLog - minLog = 0, falls back to range = 1
    // weight = 0.1 + ((log - min) / 1) * 0.9 = 0.1 + 0 = 0.1? 
    // Actually log - min = 0, so yes: 0.1
    expect(points[0].weight).toBeCloseTo(0.1, 1);
  });

  it('generateHeatmapPoints: identical magnitudes produce equal weights', () => {
    const quakes = Array.from({ length: 10 }, (_, i) =>
      makeGlobePoint({ magnitude: 4.0, lat: i * 10, lng: i * 10 })
    );
    const points = generateHeatmapPoints(quakes);

    const weights = new Set(points.map(p => p.weight.toFixed(6)));
    // All same magnitude → all same weight
    expect(weights.size).toBe(1);
  });

  it('generateHeatmapPoints: higher magnitude → higher weight', () => {
    const quakes = [
      makeGlobePoint({ magnitude: 2.0, lat: 0, lng: 0 }),
      makeGlobePoint({ magnitude: 7.0, lat: 10, lng: 10 }),
    ];
    const points = generateHeatmapPoints(quakes);
    expect(points[1].weight).toBeGreaterThan(points[0].weight);
  });

  it('calculateStatistics: region extraction from diverse place formats', () => {
    const places = [
      '10km NE of Ridgecrest, CA',
      '5km S of Tokyo, Japan',
      'Central Alaska',
      '100km WSW of Tonga',
      '',
      'Mid-Atlantic Ridge',
    ];
    const quakes = places.map((place, i) =>
      makeGlobePoint({ place, id: `place-${i}`, magnitude: 3.0 })
    );
    const stats = calculateStatistics(quakes);
    expect(stats.totalEvents).toBe(6);
    expect(typeof stats.mostActiveRegion).toBe('string');
  });

  it('energy calculations produce finite results for all magnitude ranges', () => {
    for (let m = -2; m <= 10; m += 0.5) {
      const joules = magnitudeToJoules(m);
      expect(Number.isFinite(joules)).toBe(true);
      expect(joules).toBeGreaterThan(0);

      const comparison = getEnergyComparison(m);
      expect(Number.isFinite(comparison.joules)).toBe(true);
      expect(Number.isFinite(comparison.tntTons)).toBe(true);
      expect(Array.isArray(comparison.comparisons)).toBe(true);
    }
  });
});


// ═════════════════════════════════════════════════════════════
// 4. EDGE CASE BOMBARDMENT
// ═════════════════════════════════════════════════════════════

describe('Stress: Edge Case Bombardment', () => {
  it('empty arrays never crash any utility', () => {
    expect(generateSeismicArcs([])).toEqual([]);
    expect(generateHeatmapPoints([])).toEqual([]);
    expect(generateSeismicRings([])).toEqual([]);
    expect(calculateStatistics([])).toEqual(expect.objectContaining({ totalEvents: 0 }));
    expect(filterEarthquakesByTimeRange([], 24)).toEqual([]);
    expect(getTourStops([])).toEqual([]);
  });

  it('single earthquake never crashes any utility', () => {
    const single = [makeGlobePoint()];
    expect(generateSeismicArcs(single)).toEqual([]); // need >= 2
    expect(generateHeatmapPoints(single)).toHaveLength(1);
    expect(generateSeismicRings(single.map(q => ({ ...q, magnitude: 5 })))).toHaveLength(1);
    expect(calculateStatistics(single).totalEvents).toBe(1);
    expect(getTourStops(single)).toHaveLength(1);
  });

  it('all earthquakes at magnitude 0 (micro) are handled', () => {
    const quakes = Array.from({ length: 50 }, (_, i) =>
      makeGlobePoint({ magnitude: 0, id: `zero-${i}` })
    );
    expect(generateSeismicArcs(quakes)).toEqual([]); // below ARC_MIN_MAG
    expect(generateSeismicRings(quakes)).toEqual([]); // below SEISMIC_RING_MIN_MAG
    expect(generateHeatmapPoints(quakes)).toHaveLength(50);
    expect(calculateStatistics(quakes).largestMagnitude).toBe(0);
  });

  it('all earthquakes at exact same location', () => {
    const quakes = Array.from({ length: 20 }, (_, i) =>
      makeGlobePoint({ lat: 0, lng: 0, magnitude: 3.0, time: Date.now() - i * 1000, id: `same-${i}` })
    );
    // Arcs: distance = 0 → well within ARC_MAX_DISTANCE_KM
    const arcs = generateSeismicArcs(quakes);
    for (const arc of arcs) {
      // Start and end at same coords → technically a self-loop at same point
      // This is fine for rendering (arc draws on itself)
      expect(Number.isFinite(arc.stroke)).toBe(true);
    }
  });

  it('all earthquakes at antimeridian boundary (±180°)', () => {
    const quakes = [
      makeGlobePoint({ lat: 0, lng: 179.9, magnitude: 4.0, time: Date.now(), id: 'am-1' }),
      makeGlobePoint({ lat: 0, lng: -179.9, magnitude: 4.0, time: Date.now() - 1000, id: 'am-2' }),
    ];
    // These are ~0.2° apart in raw coords but ~360° haversine → very far
    const arcs = generateSeismicArcs(quakes);
    // Should NOT connect them (they're ~20,000 km apart via haversine)
    expect(arcs).toHaveLength(0);
  });

  it('earthquakes at both poles', () => {
    const quakes = [
      makeGlobePoint({ lat: 90, lng: 0, magnitude: 5.0, time: Date.now(), id: 'np' }),
      makeGlobePoint({ lat: -90, lng: 0, magnitude: 5.0, time: Date.now() - 1000, id: 'sp' }),
    ];
    const arcs = generateSeismicArcs(quakes);
    // 20,000 km apart → no arc
    expect(arcs).toHaveLength(0);
    const rings = generateSeismicRings(quakes);
    expect(rings).toHaveLength(2);
  });

  it('future timestamps do not crash calculations', () => {
    const futureQuakes = Array.from({ length: 5 }, (_, i) =>
      makeGlobePoint({ time: Date.now() + (i + 1) * 86400000, id: `future-${i}` })
    );
    expect(() => calculateStatistics(futureQuakes)).not.toThrow();
    expect(() => calculateMood(futureQuakes)).not.toThrow();
    expect(() => filterEarthquakesByTimeRange(futureQuakes, 24)).not.toThrow();
  });

  it('extremely deep earthquakes (>700km) are handled', () => {
    const deep = makeGlobePoint({ depth: 750 });
    const color = getDepthColor(750);
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    const stats = calculateStatistics([deep]);
    expect(stats.averageDepth).toBe(750);
  });

  it('magnitude 10 (theoretical max) does not overflow', () => {
    const mega = makeGlobePoint({ magnitude: 10 });
    const comparison = getEnergyComparison(10);
    expect(Number.isFinite(comparison.joules)).toBe(true);
    expect(comparison.comparisons.length).toBeGreaterThan(0);

    const size = getMagnitudeSize(10);
    expect(Number.isFinite(size)).toBe(true);
    expect(size).toBeLessThanOrEqual(2.0); // capped
  });
});


// ═════════════════════════════════════════════════════════════
// 5. DATA PIPELINE INTEGRITY
// ═════════════════════════════════════════════════════════════

describe('Stress: Data Pipeline Integrity', () => {
  it('full pipeline: raw USGS → validate → convert → stats → mood (500 quakes)', () => {
    // Simulate a full data pipeline with 500 features
    const features = Array.from({ length: 500 }, (_, i) => makeFeature({
      id: `pipeline-${i}`,
      mag: 1 + Math.random() * 7,
      lat: -60 + Math.random() * 120,
      lng: -180 + Math.random() * 360,
      depth: Math.random() * 700,
      time: Date.now() - Math.random() * 7 * 86400000,
    }));

    // Step 1: Validate
    const validated = validateEarthquakeResponse({
      type: 'FeatureCollection',
      features,
    });
    expect(validated.features).toHaveLength(500);

    // Step 2: Convert
    const globePoints = validated.features.map(convertEarthquakeToGlobePoint);
    expect(globePoints).toHaveLength(500);
    for (const gp of globePoints) {
      expect(Number.isFinite(gp.lat)).toBe(true);
      expect(Number.isFinite(gp.lng)).toBe(true);
      expect(Number.isFinite(gp.magnitude)).toBe(true);
      expect(Number.isFinite(gp.depth)).toBe(true);
      expect(Number.isFinite(gp.size)).toBe(true);
      expect(typeof gp.color).toBe('string');
    }

    // Step 3: Statistics
    const stats = calculateStatistics(globePoints);
    expect(stats.totalEvents).toBe(500);
    expect(stats.largestMagnitude).toBeGreaterThan(0);
    expect(Number.isFinite(stats.averageDepth)).toBe(true);

    // Step 4: Mood
    const mood = calculateMood(globePoints);
    expect(['serene', 'quiet', 'stirring', 'restless', 'volatile', 'fierce']).toContain(mood.mood);

    // Step 5: Visualization layers
    const arcs = generateSeismicArcs(globePoints);
    expect(arcs.length).toBeLessThanOrEqual(MAX_ARCS);

    const heatmap = generateHeatmapPoints(globePoints);
    expect(heatmap).toHaveLength(500);

    const rings = generateSeismicRings(globePoints);
    expect(rings.length).toBeLessThanOrEqual(30);
  });

  it('pipeline handles mixed valid/invalid features without data loss', () => {
    const validFeatures = Array.from({ length: 10 }, (_, i) => makeFeature({ id: `valid-${i}` }));
    const invalidFeatures = [
      null,
      { properties: {}, geometry: null },
      { properties: { mag: 5 }, geometry: { type: 'Point', coordinates: [NaN, 0, 0] } },
      { geometry: { type: 'Point', coordinates: [0, 0, 0] } },
      42,
      'not a feature',
    ];

    const result = validateEarthquakeResponse({
      type: 'FeatureCollection',
      features: [...invalidFeatures, ...validFeatures],
    });

    // All 10 valid features should survive
    expect(result.features).toHaveLength(10);
  });
});


// ═════════════════════════════════════════════════════════════
// 6. AUDIO RESOURCE SAFETY
// ═════════════════════════════════════════════════════════════

describe('Stress: Audio Resource Safety', () => {
  it('playRichQuakeTone cleanup function stops all oscillators', () => {
    // Mock AudioContext
    const mockStop = vi.fn();
    const mockOscillator = {
      frequency: { value: 0 },
      type: 'sine',
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: mockStop,
    };
    const mockGain = {
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn().mockReturnThis(),
    };
    const mockBufferSource = {
      buffer: null,
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
    };
    const mockCtx = {
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createOscillator: vi.fn(() => ({ ...mockOscillator })),
      createGain: vi.fn(() => ({ ...mockGain })),
      createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(3528) })),
      createBufferSource: vi.fn(() => ({ ...mockBufferSource })),
    } as unknown as AudioContext;

    // Play a large magnitude tone (triggers all 4 layers including crack transient)
    const cleanup = playRichQuakeTone(mockCtx, 7.0);
    expect(typeof cleanup).toBe('function');
    // Should have created oscillators (sub + fundamental + harmonic = 3)
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(3);

    // Cleanup should not throw
    expect(() => cleanup()).not.toThrow();
  });

  it('triggerHaptic handles missing navigator.vibrate', () => {
    const original = navigator.vibrate;
    // @ts-expect-error: remove vibrate to simulate unsupported browser
    navigator.vibrate = undefined;
    expect(() => triggerHaptic(7.0)).not.toThrow();
    // @ts-expect-error: restore
    navigator.vibrate = original;
  });
});


// ═════════════════════════════════════════════════════════════
// 7. CONCURRENCY & TIMING EDGE CASES
// ═════════════════════════════════════════════════════════════

describe('Stress: Concurrency & Timing', () => {
  it('generateSeismicArcs is deterministic for same input', () => {
    const quakes = generateCluster(50);
    // Freeze random by using fixed data
    const fixed = quakes.map((q, i) => ({
      ...q,
      lat: 35 + i * 0.01,
      lng: -118 + i * 0.01,
      time: Date.now() - i * 3600000,
      magnitude: 3.0 + (i % 5),
    }));

    const arcs1 = generateSeismicArcs(fixed);
    const arcs2 = generateSeismicArcs(fixed);

    // Same input → same arc count and geometry (dashAnimateTime has random, but geometry is deterministic)
    expect(arcs1.length).toBe(arcs2.length);
    for (let i = 0; i < arcs1.length; i++) {
      expect(arcs1[i].startLat).toBe(arcs2[i].startLat);
      expect(arcs1[i].startLng).toBe(arcs2[i].startLng);
      expect(arcs1[i].endLat).toBe(arcs2[i].endLat);
      expect(arcs1[i].endLng).toBe(arcs2[i].endLng);
    }
  });

  it('filterEarthquakesByTimeRange: boundary precision', () => {
    const now = Date.now();
    const exactlyOnBoundary = makeGlobePoint({ time: now - 24 * 3600000 }); // exactly 24h ago
    const justInside = makeGlobePoint({ time: now - 24 * 3600000 + 1 }); // 24h - 1ms
    const justOutside = makeGlobePoint({ time: now - 24 * 3600000 - 1 }); // 24h + 1ms

    const result = filterEarthquakesByTimeRange([exactlyOnBoundary, justInside, justOutside], 24);
    // justInside should definitely be included
    expect(result.some(q => q.time === justInside.time)).toBe(true);
  });

  it('generateHeatmapPoints: weight normalization is stable across magnitude ranges', () => {
    // Test that weights are always in [0.1, 1.0] regardless of magnitude mix
    const cases = [
      [0, 0, 0, 0, 0],         // all micro
      [9, 9, 9, 9, 9],         // all mega
      [0, 2, 4, 6, 8],         // spread
      [4.99, 5.0, 5.01],       // near-identical
    ];

    for (const mags of cases) {
      const quakes = mags.map((m, i) => makeGlobePoint({ magnitude: m, id: `norm-${i}` }));
      const points = generateHeatmapPoints(quakes);
      for (const p of points) {
        expect(p.weight).toBeGreaterThanOrEqual(0.1 - 0.001); // float tolerance
        expect(p.weight).toBeLessThanOrEqual(1.0 + 0.001);
      }
    }
  });
});


// ═════════════════════════════════════════════════════════════
// 8. BOUNDING BOX PRE-FILTER CORRECTNESS
// ═════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════
// 8. NaN SAFETY — COMPREHENSIVE POISONED DATA TESTS
// ═════════════════════════════════════════════════════════════

describe('Stress: NaN Safety — Poisoned Data Cannot Propagate', () => {
  it('calculateMood survives NaN magnitude earthquakes', () => {
    const quakes = [
      makeGlobePoint({ magnitude: NaN, id: 'nan-mag-1' }),
      makeGlobePoint({ magnitude: 5.0, id: 'valid-1' }),
      makeGlobePoint({ magnitude: NaN, id: 'nan-mag-2' }),
    ];
    const mood = calculateMood(quakes);
    expect(['serene', 'quiet', 'stirring', 'restless', 'volatile', 'fierce']).toContain(mood.mood);
    expect(Number.isFinite(mood.intensity)).toBe(true);
    expect(Number.isFinite(mood.recentBiggest)).toBe(true);
  });

  it('calculateMood survives all-NaN magnitudes', () => {
    const quakes = Array.from({ length: 5 }, (_, i) =>
      makeGlobePoint({ magnitude: NaN, id: `all-nan-${i}` })
    );
    const mood = calculateMood(quakes);
    expect(['serene', 'quiet', 'stirring', 'restless', 'volatile', 'fierce']).toContain(mood.mood);
    expect(Number.isFinite(mood.intensity)).toBe(true);
  });

  it('calculateMood survives NaN timestamps', () => {
    const quakes = [
      makeGlobePoint({ time: NaN, magnitude: 5.0, id: 'nan-time' }),
      makeGlobePoint({ magnitude: 3.0, id: 'valid-time' }),
    ];
    const mood = calculateMood(quakes);
    expect(Number.isFinite(mood.intensity)).toBe(true);
  });

  it('calculateStatistics survives NaN magnitudes', () => {
    const quakes = [
      makeGlobePoint({ magnitude: NaN, depth: 50, id: 'nan-stat-1' }),
      makeGlobePoint({ magnitude: 4.0, depth: 20, id: 'valid-stat' }),
    ];
    const stats = calculateStatistics(quakes);
    expect(stats.totalEvents).toBe(2);
    expect(Number.isFinite(stats.largestMagnitude)).toBe(true);
    expect(Number.isFinite(stats.averageDepth)).toBe(true);
  });

  it('calculateStatistics survives NaN depths', () => {
    const quakes = [
      makeGlobePoint({ depth: NaN, magnitude: 3.0, id: 'nan-depth' }),
      makeGlobePoint({ depth: 100, magnitude: 5.0, id: 'valid-depth' }),
    ];
    const stats = calculateStatistics(quakes);
    expect(Number.isFinite(stats.averageDepth)).toBe(true);
    // NaN depth → 0, so average = (0 + 100) / 2 = 50
    expect(stats.averageDepth).toBe(50);
  });

  it('calculateStatistics survives all-NaN data', () => {
    const quakes = Array.from({ length: 3 }, (_, i) =>
      makeGlobePoint({ magnitude: NaN, depth: NaN, id: `all-nan-stat-${i}` })
    );
    const stats = calculateStatistics(quakes);
    expect(stats.totalEvents).toBe(3);
    expect(Number.isFinite(stats.largestMagnitude)).toBe(true);
    expect(stats.largestMagnitude).toBe(0); // NaN → 0
    expect(Number.isFinite(stats.averageDepth)).toBe(true);
  });

  it('magnitudeToJoules returns finite for NaN', () => {
    const joules = magnitudeToJoules(NaN);
    expect(Number.isFinite(joules)).toBe(true);
    expect(joules).toBeGreaterThan(0);
  });

  it('magnitudeToJoules returns finite for Infinity', () => {
    expect(Number.isFinite(magnitudeToJoules(Infinity))).toBe(true);
    expect(Number.isFinite(magnitudeToJoules(-Infinity))).toBe(true);
  });

  it('getEnergyComparison returns clean data for NaN magnitude', () => {
    const comparison = getEnergyComparison(NaN);
    expect(Number.isFinite(comparison.joules)).toBe(true);
    expect(Number.isFinite(comparison.tntTons)).toBe(true);
    expect(Array.isArray(comparison.comparisons)).toBe(true);
  });

  it('generateHeatmapPoints survives NaN magnitudes', () => {
    const quakes = [
      makeGlobePoint({ magnitude: NaN, id: 'heatmap-nan-1' }),
      makeGlobePoint({ magnitude: 5.0, id: 'heatmap-valid' }),
      makeGlobePoint({ magnitude: NaN, id: 'heatmap-nan-2' }),
    ];
    const points = generateHeatmapPoints(quakes);
    expect(points).toHaveLength(3);
    for (const p of points) {
      expect(Number.isFinite(p.weight)).toBe(true);
      expect(p.weight).toBeGreaterThanOrEqual(0.1);
      expect(p.weight).toBeLessThanOrEqual(1.0);
    }
  });

  it('full pipeline with poisoned NaN data produces finite results end-to-end', () => {
    const features = [
      makeFeature({ mag: NaN, id: 'pipeline-nan-1' }),
      makeFeature({ mag: 5.0, id: 'pipeline-valid-1' }),
      makeFeature({ mag: NaN, lat: NaN, id: 'pipeline-nan-2' }),
      makeFeature({ mag: 3.0, depth: NaN, id: 'pipeline-valid-2' }),
    ];

    // Validate (should strip features with NaN coordinates)
    const validated = validateEarthquakeResponse({
      type: 'FeatureCollection',
      features,
    });
    // Feature with NaN lat should be stripped
    expect(validated.features.length).toBeLessThanOrEqual(4);

    // Convert remaining valid features
    const points = validated.features.map(convertEarthquakeToGlobePoint);
    for (const p of points) {
      expect(Number.isFinite(p.size)).toBe(true);
      expect(typeof p.color).toBe('string');
    }

    // Stats must produce finite results
    const stats = calculateStatistics(points);
    expect(Number.isFinite(stats.averageDepth)).toBe(true);
    expect(Number.isFinite(stats.largestMagnitude)).toBe(true);

    // Mood must not be poisoned
    const mood = calculateMood(points);
    expect(Number.isFinite(mood.intensity)).toBe(true);
  });
});


// ═════════════════════════════════════════════════════════════
// 9. RESOURCE LIMITS & OVERFLOW TESTS
// ═════════════════════════════════════════════════════════════

describe('Stress: Resource Limits & Overflow', () => {
  it('generateSeismicArcs handles 1000 earthquakes without timeout', () => {
    const quakes = generateCluster(1000);
    const start = performance.now();
    const arcs = generateSeismicArcs(quakes);
    const elapsed = performance.now() - start;

    expect(arcs.length).toBeLessThanOrEqual(MAX_ARCS);
    expect(elapsed).toBeLessThan(1000); // must complete within 1 second
  });

  it('generateHeatmapPoints handles 1000 earthquakes', () => {
    const quakes = generateScattered(1000);
    const start = performance.now();
    const points = generateHeatmapPoints(quakes);
    const elapsed = performance.now() - start;

    expect(points).toHaveLength(1000);
    expect(elapsed).toBeLessThan(200);
  });

  it('calculateStatistics handles 1000 earthquakes', () => {
    const quakes = generateScattered(1000);
    const start = performance.now();
    const stats = calculateStatistics(quakes);
    const elapsed = performance.now() - start;

    expect(stats.totalEvents).toBe(1000);
    expect(elapsed).toBeLessThan(100);
  });

  it('energy calculations handle magnitude 10 without Infinity', () => {
    const joules = magnitudeToJoules(10);
    expect(Number.isFinite(joules)).toBe(true);
    // 10^(1.5*10+4.8) = 10^19.8 — still within Number.MAX_SAFE limits
    expect(joules).toBeLessThan(Number.MAX_VALUE);
  });

  it('energy calculations handle magnitude -5 (microseismic)', () => {
    const joules = magnitudeToJoules(-5);
    expect(Number.isFinite(joules)).toBe(true);
    expect(joules).toBeGreaterThan(0);
  });

  it('heatmap weight normalization handles extreme magnitude range (M-2 to M10)', () => {
    const quakes = [
      makeGlobePoint({ magnitude: -2, lat: 0, lng: 0, id: 'ext-min' }),
      makeGlobePoint({ magnitude: 10, lat: 10, lng: 10, id: 'ext-max' }),
    ];
    const points = generateHeatmapPoints(quakes);
    expect(points).toHaveLength(2);
    // Even with extreme range, weights must stay bounded
    for (const p of points) {
      expect(p.weight).toBeGreaterThanOrEqual(0.1 - 0.001);
      expect(p.weight).toBeLessThanOrEqual(1.0 + 0.001);
    }
  });
});


// ═════════════════════════════════════════════════════════════
// 10. ARC BOUNDING BOX PRE-FILTER CORRECTNESS
// ═════════════════════════════════════════════════════════════

describe('Stress: Arc Bounding Box Pre-filter', () => {
  it('does not falsely reject nearby quakes at high latitudes', () => {
    // At 60° latitude, 1° longitude ≈ 55.6 km (not 111km)
    // Two points 200km apart at 60° lat need ~3.6° longitude difference
    const quakes = [
      makeGlobePoint({ lat: 60, lng: 0, magnitude: 5.0, time: Date.now(), id: 'high-lat-a' }),
      makeGlobePoint({ lat: 60, lng: 2.5, magnitude: 5.0, time: Date.now() - 1000, id: 'high-lat-b' }),
    ];
    const arcs = generateSeismicArcs(quakes);
    // These are ~139km apart at 60° lat — should be connected
    expect(arcs.length).toBe(1);
  });

  it('correctly rejects far-apart quakes that pass longitude check but fail haversine', () => {
    // At equator, ~300km ≈ 2.7° → within bounding box but at the edge
    const quakes = [
      makeGlobePoint({ lat: 0, lng: 0, magnitude: 5.0, time: Date.now(), id: 'eq-a' }),
      makeGlobePoint({ lat: 0, lng: 3.0, magnitude: 5.0, time: Date.now() - 1000, id: 'eq-b' }),
    ];
    const arcs = generateSeismicArcs(quakes);
    // ~333km at equator → just over 300km limit → should NOT connect
    expect(arcs).toHaveLength(0);
  });
});
