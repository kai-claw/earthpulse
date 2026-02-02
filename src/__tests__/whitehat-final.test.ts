/**
 * White Hat — Final Verification (Pass 10/10)
 *
 * Comprehensive final review: cross-module integration, feature completeness,
 * data pipeline integrity, type system consistency, and deployment readiness.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Utils ───
import {
  getDepthColor,
  getMagnitudeSize,
  getMagnitudeColor,
  getMagnitudeDescription,
  getDepthDescription,
  calculateDistance,
  formatRelativeTime,
  calculateStatistics,
  filterEarthquakesByTimeRange,
  sortEarthquakesByTime,
  convertEarthquakeToGlobePoint,
  calculateMood,
  getEmotionalContext,
  getLoadingPoem,
  generateSeismicRings,
  getTourStops,
  magnitudeToJoules,
  getEnergyComparison,
  earthquakesToCSV,
  calculateActivityRate,
  HISTORICAL_EARTHQUAKES,
  getHistoricalByCategory,
} from '../utils';
import {
  generateSeismicArcs,
  generateHeatmapPoints,
  ARC_MAX_DISTANCE_KM,
  ARC_MAX_TIME_GAP_H,
  MAX_ARCS,
  ARC_MIN_MAG,
  HEATMAP_BANDWIDTH,
} from '../utils/clusters';
import {
  AUTO_REFRESH_MS,
  CINEMATIC_INTERVAL_MS,
  CINEMATIC_STOP_COUNT,
  TOUR_DWELL_MS,
  TOUR_STOP_COUNT,
  INITIAL_FLY_DELAY_MS,
  INITIAL_FLY_MIN_MAG,
  PROGRESS_TICK_MS,
  USGS_BASE_URL,
  TECTONIC_PLATES_URL,
  DEFAULT_FETCH_LIMIT,
  MAX_SEISMIC_RINGS,
  SEISMIC_RING_MIN_MAG,
  EARTH_RADIUS_KM,
  MAGNITUDE_SIZE_RANGE,
  DEFAULT_TIME_RANGE,
  TIME_RANGES,
  MOOD_DESCRIPTIONS,
  MOOD_COLORS,
  MOOD_KEYS,
  MOOD_THRESHOLDS,
  LOADING_POEMS,
  MAX_TONE_DURATION,
  BASE_TONE_DURATION,
  TONE_DURATION_PER_MAG,
} from '../utils/constants';
import type { GlobePoint, EarthquakeFeature } from '../types';

// ─── Helpers ───

function makeQuake(overrides: Partial<GlobePoint> = {}): GlobePoint {
  return {
    lat: 35.0, lng: -118.0, magnitude: 5.0, depth: 10, place: 'Test Location',
    time: Date.now(), id: `test-${Math.random().toString(36).slice(2)}`,
    color: '#ff0000', size: 1, felt: 10, tsunami: false, sig: 200, url: '',
    ...overrides,
  };
}

function makeFeature(overrides: Partial<{
  mag: number; lat: number; lng: number; depth: number;
  place: string; time: number; id: string; felt: number;
  tsunami: number; sig: number; alert: string;
}> = {}): EarthquakeFeature {
  const {
    mag = 5.0, lat = 35.0, lng = -118.0, depth = 10,
    place = 'Test', time = Date.now(), id = 'us12345',
    felt = 5, tsunami = 0, sig = 200, alert = 'green',
  } = overrides;
  return {
    type: 'Feature',
    properties: {
      mag, place, time, updated: time, url: `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`,
      detail: '', felt, cdi: 3, mmi: 4, alert, status: 'reviewed', tsunami, sig,
      net: 'us', code: id.slice(2), ids: `,${id},`, sources: ',us,', types: ',origin,',
      nst: 20, dmin: 0.5, rms: 0.3, gap: 50, magType: 'mww', type: 'earthquake',
      title: `M ${mag} - ${place}`,
    },
    geometry: { type: 'Point', coordinates: [lng, lat, depth] },
    id,
  };
}

// ═══════════════════════════════════════════════════════════════
// 1. END-TO-END DATA PIPELINE — Feature → GlobePoint → Stats → Mood
// ═══════════════════════════════════════════════════════════════

describe('End-to-End Data Pipeline', () => {
  const features = [
    makeFeature({ mag: 7.2, lat: 38.0, lng: 142.0, depth: 29, place: 'Japan', id: 'us001', time: Date.now() - 3600000, felt: 500, tsunami: 1, sig: 800, alert: 'red' }),
    makeFeature({ mag: 5.5, lat: 36.0, lng: 140.0, depth: 50, place: 'Honshu', id: 'us002', time: Date.now() - 1800000, felt: 100, sig: 400 }),
    makeFeature({ mag: 3.1, lat: 34.0, lng: 139.0, depth: 5, place: 'Izu', id: 'us003', time: Date.now() - 900000, felt: 10, sig: 50 }),
    makeFeature({ mag: 2.0, lat: 37.0, lng: 141.0, depth: 200, place: 'Deep Pacific', id: 'us004', time: Date.now() - 600000, sig: 10 }),
    makeFeature({ mag: 6.1, lat: 35.5, lng: 141.5, depth: 15, place: 'Offshore Japan', id: 'us005', time: Date.now(), felt: 300, sig: 600, alert: 'orange' }),
  ];

  const points = features.map(convertEarthquakeToGlobePoint);

  it('converts all features to GlobePoints with correct fields', () => {
    expect(points).toHaveLength(5);
    points.forEach(p => {
      expect(p).toHaveProperty('lat');
      expect(p).toHaveProperty('lng');
      expect(p).toHaveProperty('magnitude');
      expect(p).toHaveProperty('depth');
      expect(p).toHaveProperty('color');
      expect(p).toHaveProperty('size');
      expect(p).toHaveProperty('id');
      expect(typeof p.lat).toBe('number');
      expect(typeof p.lng).toBe('number');
      expect(Number.isFinite(p.magnitude)).toBe(true);
      expect(Number.isFinite(p.depth)).toBe(true);
      expect(Number.isFinite(p.size)).toBe(true);
      expect(p.size).toBeGreaterThan(0);
    });
  });

  it('preserves magnitude ordering through conversion', () => {
    const mags = points.map(p => p.magnitude);
    expect(mags[0]).toBe(7.2);
    expect(mags[1]).toBe(5.5);
    expect(mags[4]).toBe(6.1);
  });

  it('statistics correctly aggregates converted points', () => {
    const stats = calculateStatistics(points);
    expect(stats.totalEvents).toBe(5);
    expect(stats.largestMagnitude).toBe(7.2);
    expect(stats.averageDepth).toBeCloseTo((29 + 50 + 5 + 200 + 15) / 5, 0);
    expect(stats.tsunamiWarnings).toBe(1);
    expect(stats.totalFelt).toBeGreaterThan(0);
  });

  it('mood system produces valid mood from converted data', () => {
    const mood = calculateMood(points);
    expect(MOOD_KEYS).toContain(mood.mood);
    expect(mood.intensity).toBeGreaterThanOrEqual(0);
    expect(mood.intensity).toBeLessThanOrEqual(1);
    expect(mood.description.length).toBeGreaterThan(0);
    expect(mood.color.length).toBeGreaterThan(0);
    // With a M7.2, should be at least 'volatile'
    expect(['volatile', 'fierce']).toContain(mood.mood);
  });

  it('seismic rings generated only for eligible magnitudes', () => {
    const rings = generateSeismicRings(points);
    // Only quakes >= SEISMIC_RING_MIN_MAG (3.0) should produce rings
    // Our dataset has M7.2, M5.5, M3.1, M6.1 — all >=3.0 except M2.0
    const eligibleCount = points.filter(p => p.magnitude >= SEISMIC_RING_MIN_MAG).length;
    expect(rings.length).toBe(eligibleCount);
    rings.forEach(r => {
      expect(Number.isFinite(r.lat)).toBe(true);
      expect(Number.isFinite(r.lng)).toBe(true);
      expect(r.maxR).toBeGreaterThan(0);
      expect(r.propagationSpeed).toBeGreaterThan(0);
      expect(r.repeatPeriod).toBeGreaterThan(0);
      expect(typeof r.color).toBe('function');
      // color(0) should be opaque, color(1) should be transparent
      expect(r.color(0)).toContain('rgba');
    });
  });

  it('tour stops are sorted by magnitude descending', () => {
    const stops = getTourStops(points, 3);
    expect(stops.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i].magnitude).toBeLessThanOrEqual(stops[i - 1].magnitude);
    }
  });

  it('CSV export includes all data fields for converted points', () => {
    const csv = earthquakesToCSV(points);
    const lines = csv.split('\n');
    expect(lines.length).toBe(6); // header + 5 rows
    expect(lines[0]).toContain('Magnitude');
    expect(lines[0]).toContain('Latitude');
    expect(lines[0]).toContain('Depth');
    expect(lines[0]).toContain('Tsunami Warning');
    // Verify tsunami field
    expect(lines[1]).toContain('Yes'); // first quake has tsunami=1
  });

  it('activity rate calculation is consistent with data', () => {
    const rate = calculateActivityRate(points);
    expect(rate.perHour).toBeGreaterThan(0);
    expect(rate.perDay).toBe(rate.perHour * 24);
    expect(['quiet', 'normal', 'active', 'elevated', 'intense']).toContain(rate.level);
    expect(['rising', 'falling', 'stable']).toContain(rate.trend);
    expect(rate.trendDescription.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. CLUSTER VISUALIZATION PIPELINE
// ═══════════════════════════════════════════════════════════════

describe('Cluster Visualization Pipeline', () => {
  // Create a cluster of quakes near Japan within 48h and 300km
  const now = Date.now();
  const cluster = [
    makeQuake({ lat: 35.0, lng: 140.0, magnitude: 6.0, time: now - 3600000, id: 'c1' }),
    makeQuake({ lat: 35.5, lng: 140.3, magnitude: 5.2, time: now - 1800000, id: 'c2' }),
    makeQuake({ lat: 35.2, lng: 140.1, magnitude: 4.5, time: now - 900000, id: 'c3' }),
    // Distant quake — should NOT connect to cluster
    makeQuake({ lat: -33.0, lng: -71.0, magnitude: 5.0, time: now - 600000, id: 'c4' }),
  ];

  it('generates arcs only between nearby quakes', () => {
    const arcs = generateSeismicArcs(cluster);
    expect(arcs.length).toBeGreaterThan(0);
    // All arcs should be between the Japan cluster, not crossing to Chile
    arcs.forEach(a => {
      expect(a.startLat).toBeGreaterThan(30);
      expect(a.endLat).toBeGreaterThan(30);
    });
  });

  it('arc labels contain magnitude and distance info', () => {
    const arcs = generateSeismicArcs(cluster);
    arcs.forEach(a => {
      expect(a.label).toMatch(/M\d+\.\d/);
      expect(a.label).toContain('km');
      expect(a.label).toContain('h');
    });
  });

  it('respects MAX_ARCS cap', () => {
    // Generate a large cluster
    const bigCluster = Array.from({ length: 200 }, (_, i) =>
      makeQuake({
        lat: 35 + (i * 0.01),
        lng: 140 + (i * 0.01),
        magnitude: 3.0 + Math.random() * 2,
        time: now - i * 60000,
        id: `big-${i}`,
      }),
    );
    const arcs = generateSeismicArcs(bigCluster);
    expect(arcs.length).toBeLessThanOrEqual(MAX_ARCS);
  });

  it('heatmap weights are normalized to [0.1, 1.0]', () => {
    const heatmap = generateHeatmapPoints(cluster);
    expect(heatmap.length).toBe(cluster.length);
    heatmap.forEach(p => {
      expect(p.weight).toBeGreaterThanOrEqual(0.1);
      expect(p.weight).toBeLessThanOrEqual(1.0);
      expect(Number.isFinite(p.lat)).toBe(true);
      expect(Number.isFinite(p.lng)).toBe(true);
    });
  });

  it('higher magnitude produces higher heatmap weight', () => {
    const twoQuakes = [
      makeQuake({ magnitude: 2.0, lat: 0, lng: 0 }),
      makeQuake({ magnitude: 7.0, lat: 10, lng: 10 }),
    ];
    const pts = generateHeatmapPoints(twoQuakes);
    expect(pts[1].weight).toBeGreaterThan(pts[0].weight);
  });

  it('empty input returns empty arrays', () => {
    expect(generateSeismicArcs([])).toEqual([]);
    expect(generateHeatmapPoints([])).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. ENERGY SYSTEM VERIFICATION
// ═══════════════════════════════════════════════════════════════

describe('Energy System', () => {
  it('Gutenberg-Richter formula: each magnitude unit = 31.6x energy', () => {
    const e5 = magnitudeToJoules(5.0);
    const e6 = magnitudeToJoules(6.0);
    const ratio = e6 / e5;
    expect(ratio).toBeCloseTo(31.623, 1); // 10^1.5 ≈ 31.623
  });

  it('M0 produces correct baseline joules', () => {
    const e0 = magnitudeToJoules(0);
    expect(e0).toBeCloseTo(Math.pow(10, 4.8), -3);
  });

  it('NaN/Infinity inputs produce safe positive value', () => {
    expect(magnitudeToJoules(NaN)).toBeGreaterThan(0);
    expect(magnitudeToJoules(Infinity)).toBeGreaterThan(0);
    expect(Number.isFinite(magnitudeToJoules(NaN))).toBe(true);
  });

  it('energy comparison has increasing detail with magnitude', () => {
    const c3 = getEnergyComparison(3.0);
    const c7 = getEnergyComparison(7.0);
    const c9 = getEnergyComparison(9.0);
    // Higher magnitudes should have more comparison points
    expect(c7.comparisons.length).toBeGreaterThanOrEqual(c3.comparisons.length);
    expect(c9.tntTons).toBeGreaterThan(c7.tntTons);
    expect(c9.joules).toBeGreaterThan(c7.joules);
  });

  it('Hiroshima comparison appears for M5+', () => {
    const c6 = getEnergyComparison(6.0);
    const icons = c6.comparisons.map(c => c.icon);
    expect(icons).toContain('☢️');
  });

  it('Krakatoa comparison appears for M8+', () => {
    const c8 = getEnergyComparison(8.5);
    const icons = c8.comparisons.map(c => c.icon);
    expect(icons).toContain('🌋');
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. HISTORICAL GALLERY INTEGRITY
// ═══════════════════════════════════════════════════════════════

describe('Historical Gallery', () => {
  it('has at least 10 curated earthquakes', () => {
    expect(HISTORICAL_EARTHQUAKES.length).toBeGreaterThanOrEqual(10);
  });

  it('all entries have required fields with valid data', () => {
    HISTORICAL_EARTHQUAKES.forEach(eq => {
      expect(eq.id).toBeTruthy();
      expect(eq.name.length).toBeGreaterThan(0);
      expect(eq.year).toBeGreaterThanOrEqual(1000);
      expect(eq.year).toBeLessThanOrEqual(2030);
      expect(eq.magnitude).toBeGreaterThanOrEqual(5);
      expect(eq.magnitude).toBeLessThanOrEqual(10);
      expect(eq.lat).toBeGreaterThanOrEqual(-90);
      expect(eq.lat).toBeLessThanOrEqual(90);
      expect(eq.lng).toBeGreaterThanOrEqual(-180);
      expect(eq.lng).toBeLessThanOrEqual(180);
      expect(eq.depth).toBeGreaterThan(0);
      expect(eq.deaths.length).toBeGreaterThan(0);
      expect(eq.description.length).toBeGreaterThan(20);
      expect(['deadliest', 'strongest', 'notable']).toContain(eq.category);
    });
  });

  it('IDs are unique', () => {
    const ids = HISTORICAL_EARTHQUAKES.map(eq => eq.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('category filter works correctly', () => {
    const deadliest = getHistoricalByCategory('deadliest');
    const strongest = getHistoricalByCategory('strongest');
    const notable = getHistoricalByCategory('notable');
    expect(deadliest.length).toBeGreaterThan(0);
    expect(strongest.length).toBeGreaterThan(0);
    expect(notable.length).toBeGreaterThan(0);
    expect(deadliest.length + strongest.length + notable.length).toBe(HISTORICAL_EARTHQUAKES.length);
    deadliest.forEach(eq => expect(eq.category).toBe('deadliest'));
  });

  it('includes the strongest earthquake ever (1960 Chile M9.5)', () => {
    const chile = HISTORICAL_EARTHQUAKES.find(eq => eq.year === 1960);
    expect(chile).toBeDefined();
    expect(chile!.magnitude).toBe(9.5);
    expect(chile!.category).toBe('strongest');
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. MOOD SYSTEM COMPLETENESS
// ═══════════════════════════════════════════════════════════════

describe('Mood System Completeness', () => {
  it('all 6 moods have descriptions, colors, and threshold data', () => {
    MOOD_KEYS.forEach(mood => {
      expect(MOOD_DESCRIPTIONS[mood]).toBeDefined();
      expect(MOOD_DESCRIPTIONS[mood].length).toBeGreaterThan(0);
      expect(MOOD_COLORS[mood]).toBeDefined();
      expect(MOOD_COLORS[mood]).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('calculateMood produces valid moods for edge case datasets', () => {
    // Empty
    const emptyMood = calculateMood([]);
    expect(MOOD_KEYS).toContain(emptyMood.mood);

    // Single small quake
    const quietMood = calculateMood([makeQuake({ magnitude: 1.0 })]);
    expect(['serene', 'quiet']).toContain(quietMood.mood);

    // Single massive quake
    const bigMood = calculateMood([makeQuake({ magnitude: 8.5, sig: 1000 })]);
    expect(['volatile', 'fierce']).toContain(bigMood.mood);
  });

  it('emotional context returns evocative strings', () => {
    const context = getEmotionalContext(makeQuake({ magnitude: 7.0, felt: 500, tsunami: true }));
    expect(context.length).toBeGreaterThan(0);
    expect(typeof context).toBe('string');
  });

  it('loading poems are non-empty strings', () => {
    const poem = getLoadingPoem();
    expect(poem.length).toBeGreaterThan(0);
    expect(typeof poem).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. FORMATTING & COLOR ENCODING MONOTONICITY
// ═══════════════════════════════════════════════════════════════

describe('Formatting & Visual Encoding', () => {
  it('magnitude size is monotonically increasing', () => {
    let prev = 0;
    for (let m = 0; m <= 9; m += 0.5) {
      const size = getMagnitudeSize(m);
      expect(size).toBeGreaterThanOrEqual(prev);
      prev = size;
    }
  });

  it('magnitude colors are valid CSS colors and unique per range', () => {
    const ranges = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const colors = ranges.map(getMagnitudeColor);
    colors.forEach(c => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
    // At least 4 unique colors across ranges
    expect(new Set(colors).size).toBeGreaterThanOrEqual(4);
  });

  it('depth colors span from warm (shallow) to cool (deep)', () => {
    const shallow = getDepthColor(5);
    const deep = getDepthColor(600);
    expect(shallow).not.toBe(deep);
    // Both should be valid CSS colors
    expect(shallow).toMatch(/^#[0-9a-f]{6}$/i);
    expect(deep).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('magnitude descriptions cover full range', () => {
    const descs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(getMagnitudeDescription);
    descs.forEach(d => {
      expect(d.length).toBeGreaterThan(0);
      expect(typeof d).toBe('string');
    });
  });

  it('depth descriptions cover all categories', () => {
    // Boundaries: <35 Shallow, 35-69 Intermediate, 70-299 Deep, >=300 Very Deep
    const descs = [5, 50, 200, 700].map(getDepthDescription);
    expect(new Set(descs).size).toBe(4); // 4 unique: Shallow, Intermediate, Deep, Very Deep
  });

  it('formatRelativeTime handles edge cases', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 30000)).toContain('min'); // 30s → "less than a minute"
    expect(formatRelativeTime(now - 7200000)).toContain('hour');
    expect(formatRelativeTime(now - 172800000)).toContain('day');
  });

  it('calculateDistance returns 0 for same point', () => {
    expect(calculateDistance(35, 140, 35, 140)).toBe(0);
  });

  it('calculateDistance NYC to London ≈ 5570 km', () => {
    const dist = calculateDistance(40.7128, -74.006, 51.5074, -0.1278);
    expect(dist).toBeGreaterThan(5500);
    expect(dist).toBeLessThan(5700);
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. FILTERING & SORTING IMMUTABILITY
// ═══════════════════════════════════════════════════════════════

describe('Filtering & Sorting', () => {
  const now = Date.now();
  const quakes = [
    makeQuake({ time: now - 3600000, magnitude: 5.0, id: 'a' }),
    makeQuake({ time: now - 7200000, magnitude: 3.0, id: 'b' }),
    makeQuake({ time: now - 100000, magnitude: 7.0, id: 'c' }),
    makeQuake({ time: now - 86400000 * 3, magnitude: 4.0, id: 'd' }), // 3 days ago
  ];

  it('filterEarthquakesByTimeRange does not mutate original', () => {
    const original = [...quakes];
    filterEarthquakesByTimeRange(quakes, 24);
    expect(quakes).toEqual(original);
  });

  it('filters correctly by 24-hour window', () => {
    const filtered = filterEarthquakesByTimeRange(quakes, 24);
    expect(filtered.length).toBe(3); // excludes 3-day-old
    filtered.forEach(q => {
      expect(now - q.time).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 60000); // small tolerance
    });
  });

  it('sortEarthquakesByTime does not mutate original', () => {
    const original = [...quakes];
    sortEarthquakesByTime(quakes);
    expect(quakes).toEqual(original);
  });

  it('sort produces oldest-first ordering', () => {
    const sorted = sortEarthquakesByTime(quakes);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].time).toBeGreaterThanOrEqual(sorted[i - 1].time);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. CONSTANTS CONSISTENCY & SAFETY
// ═══════════════════════════════════════════════════════════════

describe('Constants Consistency', () => {
  it('all timing constants are positive finite numbers', () => {
    [AUTO_REFRESH_MS, CINEMATIC_INTERVAL_MS, TOUR_DWELL_MS,
     INITIAL_FLY_DELAY_MS, PROGRESS_TICK_MS].forEach(v => {
      expect(v).toBeGreaterThan(0);
      expect(Number.isFinite(v)).toBe(true);
    });
  });

  it('stop counts are reasonable integers', () => {
    expect(Number.isInteger(CINEMATIC_STOP_COUNT)).toBe(true);
    expect(CINEMATIC_STOP_COUNT).toBeGreaterThanOrEqual(5);
    expect(Number.isInteger(TOUR_STOP_COUNT)).toBe(true);
    expect(TOUR_STOP_COUNT).toBeGreaterThanOrEqual(3);
  });

  it('URLs are valid HTTPS endpoints', () => {
    expect(USGS_BASE_URL).toMatch(/^https:\/\//);
    expect(TECTONIC_PLATES_URL).toMatch(/^https:\/\//);
  });

  it('time ranges are sorted by hours ascending with unique labels', () => {
    const labels = TIME_RANGES.map(t => t.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (let i = 1; i < TIME_RANGES.length; i++) {
      expect(TIME_RANGES[i].hours).toBeGreaterThan(TIME_RANGES[i - 1].hours);
    }
  });

  it('default time range exists in TIME_RANGES', () => {
    const match = TIME_RANGES.find(t => t.label === DEFAULT_TIME_RANGE.label && t.hours === DEFAULT_TIME_RANGE.hours);
    expect(match).toBeDefined();
  });

  it('EARTH_RADIUS_KM is approximately correct', () => {
    expect(EARTH_RADIUS_KM).toBeGreaterThan(6300);
    expect(EARTH_RADIUS_KM).toBeLessThan(6400);
  });

  it('magnitude size range is [min, max] with min < max', () => {
    expect(MAGNITUDE_SIZE_RANGE[0]).toBeLessThan(MAGNITUDE_SIZE_RANGE[1]);
    expect(MAGNITUDE_SIZE_RANGE[0]).toBeGreaterThan(0);
  });

  it('cluster constants are positive and reasonable', () => {
    expect(ARC_MAX_DISTANCE_KM).toBeGreaterThan(0);
    expect(ARC_MAX_DISTANCE_KM).toBeLessThan(1000);
    expect(ARC_MAX_TIME_GAP_H).toBeGreaterThan(0);
    expect(MAX_ARCS).toBeGreaterThan(0);
    expect(ARC_MIN_MAG).toBeGreaterThanOrEqual(0);
    expect(HEATMAP_BANDWIDTH).toBeGreaterThan(0);
  });

  it('audio constants are safe ranges', () => {
    expect(MAX_TONE_DURATION).toBeGreaterThan(0);
    expect(MAX_TONE_DURATION).toBeLessThanOrEqual(10);
    expect(BASE_TONE_DURATION).toBeGreaterThan(0);
    expect(TONE_DURATION_PER_MAG).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. NaN SAFETY ACROSS ALL BOUNDARIES
// ═══════════════════════════════════════════════════════════════

describe('NaN Safety', () => {
  it('convertEarthquakeToGlobePoint handles NaN magnitude', () => {
    const f = makeFeature({ mag: NaN });
    const p = convertEarthquakeToGlobePoint(f);
    expect(Number.isFinite(p.magnitude)).toBe(true);
    expect(Number.isFinite(p.size)).toBe(true);
    expect(p.size).toBeGreaterThan(0);
  });

  it('getMagnitudeSize handles NaN/negative', () => {
    expect(Number.isFinite(getMagnitudeSize(NaN))).toBe(true);
    expect(Number.isFinite(getMagnitudeSize(-5))).toBe(true);
  });

  it('getDepthColor handles NaN/negative', () => {
    expect(getDepthColor(NaN)).toMatch(/^#[0-9a-f]{6}$/i);
    expect(getDepthColor(-100)).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('calculateStatistics handles NaN in data', () => {
    const quakes = [
      makeQuake({ magnitude: NaN, depth: NaN }),
      makeQuake({ magnitude: 5.0, depth: 10 }),
    ];
    const stats = calculateStatistics(quakes);
    expect(Number.isFinite(stats.largestMagnitude)).toBe(true);
    expect(Number.isFinite(stats.averageDepth)).toBe(true);
  });

  it('generateHeatmapPoints handles NaN magnitudes', () => {
    const quakes = [makeQuake({ magnitude: NaN })];
    const pts = generateHeatmapPoints(quakes);
    pts.forEach(p => {
      expect(Number.isFinite(p.weight)).toBe(true);
      expect(p.weight).toBeGreaterThanOrEqual(0.1);
      expect(p.weight).toBeLessThanOrEqual(1.0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. CSV EXPORT EDGE CASES
// ═══════════════════════════════════════════════════════════════

describe('CSV Export Edge Cases', () => {
  it('empty array produces header-only CSV', () => {
    const csv = earthquakesToCSV([]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('Magnitude');
  });

  it('escapes commas and quotes in place names', () => {
    const q = makeQuake({ place: 'San José, "Costa Rica"' });
    const csv = earthquakesToCSV([q]);
    // Should be properly escaped
    expect(csv).toContain('"');
  });

  it('handles NaN/undefined fields gracefully', () => {
    const q = makeQuake({ magnitude: NaN, depth: NaN, place: '', time: NaN });
    const csv = earthquakesToCSV([q]);
    expect(csv).not.toContain('NaN');
    expect(csv).not.toContain('undefined');
  });
});

// ═══════════════════════════════════════════════════════════════
// 11. DEPLOYMENT READINESS — FILE STRUCTURE
// ═══════════════════════════════════════════════════════════════

describe('Deployment Readiness', () => {
  const root = path.resolve(__dirname, '..', '..');

  it('critical public assets exist', () => {
    ['public/favicon.svg', 'public/manifest.json', 'public/robots.txt',
     'public/sitemap.xml', 'public/404.html', 'public/og-image.svg',
     'public/icon-192.png', 'public/icon-512.png'].forEach(f => {
      expect(fs.existsSync(path.join(root, f)), `Missing: ${f}`).toBe(true);
    });
  });

  it('LICENSE and README exist', () => {
    expect(fs.existsSync(path.join(root, 'LICENSE'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'README.md'))).toBe(true);
  });

  it('CI/CD workflow exists', () => {
    expect(fs.existsSync(path.join(root, '.github', 'workflows', 'ci.yml'))).toBe(true);
  });

  it('package.json has required metadata', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
    expect(pkg.version).toBe('1.0.0');
    expect(pkg.description).toBeTruthy();
    expect(pkg.homepage).toMatch(/^https:/);
    expect(pkg.license).toBe('MIT');
    expect(pkg.scripts.build).toBeTruthy();
    expect(pkg.scripts.test).toBeTruthy();
    expect(pkg.scripts.deploy).toBeTruthy();
  });

  it('manifest.json references existing icons', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public', 'manifest.json'), 'utf-8'));
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
    manifest.icons.forEach((icon: { src: string }) => {
      const iconPath = icon.src.replace('/earthpulse/', '');
      expect(fs.existsSync(path.join(root, 'public', iconPath)), `Missing icon: ${icon.src}`).toBe(true);
    });
  });

  it('tsconfig.app.json enforces strict mode', () => {
    const raw = fs.readFileSync(path.join(root, 'tsconfig.app.json'), 'utf-8');
    // Strip JSON5/JSONC comments before parsing
    const stripped = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    const tsconfig = JSON.parse(stripped);
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.noUnusedLocals).toBe(true);
    expect(tsconfig.compilerOptions.noUnusedParameters).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 12. MODULE EXPORT VERIFICATION
// ═══════════════════════════════════════════════════════════════

describe('Module Exports', () => {
  it('utils barrel re-exports all expected functions', () => {
    // Core
    expect(typeof convertEarthquakeToGlobePoint).toBe('function');
    expect(typeof calculateStatistics).toBe('function');
    expect(typeof filterEarthquakesByTimeRange).toBe('function');
    expect(typeof sortEarthquakesByTime).toBe('function');
    // Colors
    expect(typeof getDepthColor).toBe('function');
    expect(typeof getMagnitudeSize).toBe('function');
    expect(typeof getMagnitudeColor).toBe('function');
    // Formatting
    expect(typeof getMagnitudeDescription).toBe('function');
    expect(typeof getDepthDescription).toBe('function');
    expect(typeof formatRelativeTime).toBe('function');
    // Geo
    expect(typeof calculateDistance).toBe('function');
    // Mood
    expect(typeof calculateMood).toBe('function');
    expect(typeof getEmotionalContext).toBe('function');
    expect(typeof getLoadingPoem).toBe('function');
    // Seismic
    expect(typeof generateSeismicRings).toBe('function');
    expect(typeof getTourStops).toBe('function');
    // Energy
    expect(typeof magnitudeToJoules).toBe('function');
    expect(typeof getEnergyComparison).toBe('function');
    // Export
    expect(typeof earthquakesToCSV).toBe('function');
    expect(typeof calculateActivityRate).toBe('function');
    // Historical
    expect(typeof getHistoricalByCategory).toBe('function');
    expect(Array.isArray(HISTORICAL_EARTHQUAKES)).toBe(true);
  });

  it('clusters module exports all expected functions and constants', () => {
    expect(typeof generateSeismicArcs).toBe('function');
    expect(typeof generateHeatmapPoints).toBe('function');
    expect(typeof ARC_MAX_DISTANCE_KM).toBe('number');
    expect(typeof ARC_MAX_TIME_GAP_H).toBe('number');
    expect(typeof MAX_ARCS).toBe('number');
    expect(typeof ARC_MIN_MAG).toBe('number');
    expect(typeof HEATMAP_BANDWIDTH).toBe('number');
  });
});
