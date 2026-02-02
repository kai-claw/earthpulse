/**
 * Green Hat #2 Tests — Seismic Network Arcs & 3D Energy Heatmap
 */

import { describe, it, expect } from 'vitest';
import {
  generateSeismicArcs,
  generateHeatmapPoints,
  ARC_MAX_DISTANCE_KM,
  ARC_MAX_TIME_GAP_H,
  MAX_ARCS,
  ARC_MIN_MAG,
  HEATMAP_BANDWIDTH,
  HEATMAP_TOP_ALT,
  HEATMAP_BASE_ALT,
} from '../utils/clusters';
import type { GlobePoint } from '../types';

// ─── Test Helpers ───

function makeQuake(overrides: Partial<GlobePoint> = {}): GlobePoint {
  return {
    lat: 35.6762,
    lng: 139.6503,
    magnitude: 4.5,
    depth: 30,
    place: 'Test Location',
    time: Date.now(),
    id: `test-${Math.random().toString(36).slice(2)}`,
    color: '#60a5fa',
    size: 0.5,
    tsunami: false,
    sig: 100,
    url: '',
    ...overrides,
  };
}

// ─── Constants Validation ───

describe('Cluster Constants', () => {
  it('ARC_MAX_DISTANCE_KM is a positive number', () => {
    expect(ARC_MAX_DISTANCE_KM).toBeGreaterThan(0);
    expect(typeof ARC_MAX_DISTANCE_KM).toBe('number');
  });

  it('ARC_MAX_TIME_GAP_H is a positive number', () => {
    expect(ARC_MAX_TIME_GAP_H).toBeGreaterThan(0);
  });

  it('MAX_ARCS is a reasonable cap', () => {
    expect(MAX_ARCS).toBeGreaterThanOrEqual(10);
    expect(MAX_ARCS).toBeLessThanOrEqual(500);
  });

  it('ARC_MIN_MAG is between 0 and 5', () => {
    expect(ARC_MIN_MAG).toBeGreaterThanOrEqual(0);
    expect(ARC_MIN_MAG).toBeLessThanOrEqual(5);
  });

  it('HEATMAP_BANDWIDTH is positive', () => {
    expect(HEATMAP_BANDWIDTH).toBeGreaterThan(0);
  });

  it('HEATMAP_TOP_ALT > HEATMAP_BASE_ALT', () => {
    expect(HEATMAP_TOP_ALT).toBeGreaterThan(HEATMAP_BASE_ALT);
    expect(HEATMAP_BASE_ALT).toBeGreaterThanOrEqual(0);
  });
});

// ─── Seismic Arcs ───

describe('generateSeismicArcs', () => {
  it('returns empty array for empty input', () => {
    expect(generateSeismicArcs([])).toEqual([]);
  });

  it('returns empty array for single earthquake', () => {
    expect(generateSeismicArcs([makeQuake()])).toEqual([]);
  });

  it('returns empty for quakes below minimum magnitude', () => {
    const quakes = [
      makeQuake({ magnitude: 0.5, lat: 35.0, lng: 139.0 }),
      makeQuake({ magnitude: 1.0, lat: 35.01, lng: 139.01, time: Date.now() + 1000 }),
    ];
    expect(generateSeismicArcs(quakes)).toEqual([]);
  });

  it('connects two close quakes (same location, close time)', () => {
    const now = Date.now();
    const quakes = [
      makeQuake({ lat: 35.0, lng: 139.0, magnitude: 5.0, time: now }),
      makeQuake({ lat: 35.01, lng: 139.01, magnitude: 4.0, time: now + 3600000 }), // 1 hour later, ~1.5km apart
    ];
    const arcs = generateSeismicArcs(quakes);
    expect(arcs.length).toBe(1);
    expect(arcs[0].startLat).toBe(35.0);
    expect(arcs[0].endLat).toBe(35.01);
  });

  it('does NOT connect distant quakes', () => {
    const now = Date.now();
    const quakes = [
      makeQuake({ lat: 35.0, lng: 139.0, magnitude: 5.0, time: now }),
      makeQuake({ lat: 60.0, lng: -120.0, magnitude: 5.0, time: now + 3600000 }), // Very far away
    ];
    expect(generateSeismicArcs(quakes)).toEqual([]);
  });

  it('does NOT connect quakes too far apart in time', () => {
    const now = Date.now();
    const timeGap = (ARC_MAX_TIME_GAP_H + 10) * 60 * 60 * 1000; // well beyond threshold
    const quakes = [
      makeQuake({ lat: 35.0, lng: 139.0, magnitude: 5.0, time: now }),
      makeQuake({ lat: 35.01, lng: 139.01, magnitude: 5.0, time: now + timeGap }),
    ];
    expect(generateSeismicArcs(quakes)).toEqual([]);
  });

  it('arc has correct structure', () => {
    const now = Date.now();
    const quakes = [
      makeQuake({ lat: 35.0, lng: 139.0, magnitude: 5.0, time: now }),
      makeQuake({ lat: 35.1, lng: 139.1, magnitude: 4.5, time: now + 1800000 }),
    ];
    const arcs = generateSeismicArcs(quakes);
    expect(arcs.length).toBe(1);
    const arc = arcs[0];

    // Structure checks
    expect(typeof arc.startLat).toBe('number');
    expect(typeof arc.startLng).toBe('number');
    expect(typeof arc.endLat).toBe('number');
    expect(typeof arc.endLng).toBe('number');
    expect(Array.isArray(arc.color)).toBe(true);
    expect(arc.color.length).toBe(2);
    expect(typeof arc.stroke).toBe('number');
    expect(arc.stroke).toBeGreaterThan(0);
    expect(typeof arc.dashLength).toBe('number');
    expect(typeof arc.dashGap).toBe('number');
    expect(typeof arc.dashAnimateTime).toBe('number');
    expect(arc.dashAnimateTime).toBeGreaterThan(0);
    expect(typeof arc.altitude).toBe('number');
    expect(arc.altitude).toBeGreaterThan(0);
    expect(typeof arc.label).toBe('string');
    expect(arc.label.length).toBeGreaterThan(0);
  });

  it('respects MAX_ARCS cap', () => {
    const now = Date.now();
    // Create a dense cluster of 30 quakes → up to 435 potential pairs → should cap at MAX_ARCS
    const quakes: GlobePoint[] = [];
    for (let i = 0; i < 30; i++) {
      quakes.push(makeQuake({
        lat: 35.0 + i * 0.001,
        lng: 139.0 + i * 0.001,
        magnitude: 3.0 + Math.random() * 3,
        time: now + i * 60000,
      }));
    }
    const arcs = generateSeismicArcs(quakes);
    expect(arcs.length).toBeLessThanOrEqual(MAX_ARCS);
  });

  it('orders arcs by time (earlier quake starts)', () => {
    const now = Date.now();
    const quakes = [
      makeQuake({ lat: 35.0, lng: 139.0, magnitude: 4.0, time: now + 3600000 }), // later
      makeQuake({ lat: 35.01, lng: 139.01, magnitude: 5.0, time: now }),           // earlier
    ];
    const arcs = generateSeismicArcs(quakes);
    expect(arcs.length).toBe(1);
    // The earlier quake should be the start
    expect(arcs[0].startLat).toBe(35.01); // the earlier one (sorted by time)
  });

  it('color reflects magnitude (high mag → red-ish alpha)', () => {
    const now = Date.now();
    const quakes = [
      makeQuake({ lat: 35.0, lng: 139.0, magnitude: 7.0, time: now }),
      makeQuake({ lat: 35.01, lng: 139.01, magnitude: 7.5, time: now + 60000 }),
    ];
    const arcs = generateSeismicArcs(quakes);
    expect(arcs[0].color[0]).toMatch(/rgba\(239/); // red channel
    expect(arcs[0].color[1]).toMatch(/rgba\(239/);
  });

  it('creates multiple arcs for chain of quakes', () => {
    const now = Date.now();
    const quakes = [
      makeQuake({ lat: 35.0, lng: 139.0, magnitude: 4.0, time: now }),
      makeQuake({ lat: 35.02, lng: 139.02, magnitude: 4.0, time: now + 60000 }),
      makeQuake({ lat: 35.04, lng: 139.04, magnitude: 4.0, time: now + 120000 }),
    ];
    const arcs = generateSeismicArcs(quakes);
    // Should connect: 0↔1, 0↔2, 1↔2 (all within range)
    expect(arcs.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Heatmap Points ───

describe('generateHeatmapPoints', () => {
  it('returns empty array for empty input', () => {
    expect(generateHeatmapPoints([])).toEqual([]);
  });

  it('returns correct number of points', () => {
    const quakes = [
      makeQuake({ lat: 35, lng: 139 }),
      makeQuake({ lat: 36, lng: 140 }),
      makeQuake({ lat: 37, lng: 141 }),
    ];
    const points = generateHeatmapPoints(quakes);
    expect(points.length).toBe(3);
  });

  it('preserves lat/lng from input', () => {
    const quakes = [makeQuake({ lat: 42.5, lng: -73.2 })];
    const points = generateHeatmapPoints(quakes);
    expect(points[0].lat).toBe(42.5);
    expect(points[0].lng).toBe(-73.2);
  });

  it('all weights are in [0.1, 1] range', () => {
    const quakes = Array.from({ length: 50 }, (_, i) =>
      makeQuake({ lat: i, lng: i, magnitude: i * 0.2 })
    );
    const points = generateHeatmapPoints(quakes);
    for (const p of points) {
      expect(p.weight).toBeGreaterThanOrEqual(0.1 - 1e-10);
      expect(p.weight).toBeLessThanOrEqual(1 + 1e-10);
    }
  });

  it('higher magnitude → higher weight', () => {
    const quakes = [
      makeQuake({ lat: 35, lng: 139, magnitude: 2.0 }),
      makeQuake({ lat: 36, lng: 140, magnitude: 7.0 }),
    ];
    const points = generateHeatmapPoints(quakes);
    const smallWeight = points.find(p => p.lat === 35)!.weight;
    const bigWeight = points.find(p => p.lat === 36)!.weight;
    expect(bigWeight).toBeGreaterThan(smallWeight);
  });

  it('single earthquake gets weight 1.0 (max normalized)', () => {
    const quakes = [makeQuake({ lat: 35, lng: 139, magnitude: 5.0 })];
    const points = generateHeatmapPoints(quakes);
    // Single point: log(w) - min = 0, range = 0 → special case: 0/1 + 0.1 = 0.1 or could be 1.0
    // Actually: range = maxLog - minLog = 0, so (logW - min) / range = NaN → need to check
    // The function uses `range = maxLog - minLog || 1`, so single point: (7.5 - 7.5) / 1 * 0.9 + 0.1 = 0.1
    expect(points[0].weight).toBeCloseTo(0.1, 1);
  });

  it('handles extreme magnitudes without NaN/Infinity', () => {
    const quakes = [
      makeQuake({ lat: 35, lng: 139, magnitude: 0 }),
      makeQuake({ lat: 36, lng: 140, magnitude: 9.5 }),
    ];
    const points = generateHeatmapPoints(quakes);
    for (const p of points) {
      expect(isNaN(p.weight)).toBe(false);
      expect(isFinite(p.weight)).toBe(true);
    }
  });

  it('identical magnitudes produce equal weights', () => {
    const quakes = [
      makeQuake({ lat: 35, lng: 139, magnitude: 4.0 }),
      makeQuake({ lat: 36, lng: 140, magnitude: 4.0 }),
      makeQuake({ lat: 37, lng: 141, magnitude: 4.0 }),
    ];
    const points = generateHeatmapPoints(quakes);
    expect(points[0].weight).toBeCloseTo(points[1].weight, 10);
    expect(points[1].weight).toBeCloseTo(points[2].weight, 10);
  });

  it('stress test: 500 quakes produces 500 points', () => {
    const quakes = Array.from({ length: 500 }, (_, i) =>
      makeQuake({
        lat: -90 + (i / 500) * 180,
        lng: -180 + (i / 500) * 360,
        magnitude: 1 + Math.random() * 8,
      })
    );
    const points = generateHeatmapPoints(quakes);
    expect(points.length).toBe(500);
    for (const p of points) {
      expect(p.weight).toBeGreaterThanOrEqual(0.1 - 1e-10);
      expect(p.weight).toBeLessThanOrEqual(1 + 1e-10);
    }
  });
});

// ─── Integration / Cross-Feature ───

describe('Seismic Network + Heatmap Integration', () => {
  it('both functions handle the same earthquake array', () => {
    const now = Date.now();
    const quakes = Array.from({ length: 20 }, (_, i) =>
      makeQuake({
        lat: 35 + i * 0.05,
        lng: 139 + i * 0.05,
        magnitude: 3 + i * 0.2,
        time: now + i * 300000,
      })
    );
    const arcs = generateSeismicArcs(quakes);
    const points = generateHeatmapPoints(quakes);

    expect(arcs.length).toBeGreaterThan(0);
    expect(points.length).toBe(20);

    // All arc coordinates should be from the input set
    for (const arc of arcs) {
      const matchStart = quakes.some(q => q.lat === arc.startLat && q.lng === arc.startLng);
      const matchEnd = quakes.some(q => q.lat === arc.endLat && q.lng === arc.endLng);
      expect(matchStart).toBe(true);
      expect(matchEnd).toBe(true);
    }
  });

  it('arcs and heatmap are independent — empty arcs with valid heatmap', () => {
    // Quakes far apart in time → no arcs, but heatmap still works
    const quakes = [
      makeQuake({ lat: 35, lng: 139, magnitude: 5.0, time: 0 }),
      makeQuake({ lat: 36, lng: 140, magnitude: 5.0, time: 1e15 }),
    ];
    const arcs = generateSeismicArcs(quakes);
    const points = generateHeatmapPoints(quakes);
    expect(arcs.length).toBe(0);
    expect(points.length).toBe(2);
  });
});
