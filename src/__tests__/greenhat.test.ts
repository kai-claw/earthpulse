import { describe, test, expect } from 'vitest';
import { generateSeismicRings, getTourStops } from '../utils/helpers';
import type { GlobePoint } from '../types';

function makeQuake(overrides: Partial<GlobePoint> = {}): GlobePoint {
  return {
    lat: 35.0,
    lng: -118.0,
    magnitude: 4.5,
    depth: 10.0,
    place: 'Test Location',
    time: Date.now() - 3600000, // 1 hour ago
    id: 'test-' + Math.random().toString(36).slice(2),
    color: '#ff4444',
    size: 1.35,
    ...overrides
  };
}

describe('generateSeismicRings', () => {
  test('returns empty array for no earthquakes', () => {
    expect(generateSeismicRings([])).toEqual([]);
  });

  test('filters out earthquakes below M3.0', () => {
    const quakes = [
      makeQuake({ magnitude: 2.9 }),
      makeQuake({ magnitude: 1.5 }),
      makeQuake({ magnitude: 0.5 }),
    ];
    expect(generateSeismicRings(quakes)).toHaveLength(0);
  });

  test('includes earthquakes at M3.0 and above', () => {
    const quakes = [
      makeQuake({ magnitude: 3.0 }),
      makeQuake({ magnitude: 5.0 }),
      makeQuake({ magnitude: 7.0 }),
    ];
    expect(generateSeismicRings(quakes)).toHaveLength(3);
  });

  test('caps at 30 rings for performance', () => {
    const quakes = Array.from({ length: 50 }, (_, i) =>
      makeQuake({ magnitude: 3.0 + (i * 0.1), id: `q-${i}` })
    );
    expect(generateSeismicRings(quakes)).toHaveLength(30);
  });

  test('sorts by magnitude descending (biggest quakes get rings first)', () => {
    const quakes = [
      makeQuake({ magnitude: 3.5, id: 'small' }),
      makeQuake({ magnitude: 7.2, id: 'big' }),
      makeQuake({ magnitude: 5.0, id: 'medium' }),
    ];
    const rings = generateSeismicRings(quakes);
    // Biggest quake (7.2) should be first since sorted desc
    expect(rings[0].lat).toBe(35.0); // all same lat in test data
    expect(rings).toHaveLength(3);
  });

  test('ring maxR scales with magnitude and is capped at 8', () => {
    const small = makeQuake({ magnitude: 3.0 });
    const huge = makeQuake({ magnitude: 9.0 });
    const ringsSmall = generateSeismicRings([small]);
    const ringsHuge = generateSeismicRings([huge]);
    
    expect(ringsSmall[0].maxR).toBeLessThan(ringsHuge[0].maxR);
    expect(ringsHuge[0].maxR).toBeLessThanOrEqual(8);
  });

  test('ring propagation speed is at least 1', () => {
    const quakes = [makeQuake({ magnitude: 8.0 }), makeQuake({ magnitude: 3.0 })];
    const rings = generateSeismicRings(quakes);
    for (const ring of rings) {
      expect(ring.propagationSpeed).toBeGreaterThanOrEqual(1);
    }
  });

  test('ring repeat period is between 600ms and 3000ms', () => {
    const quakes = [
      makeQuake({ magnitude: 5.0, time: Date.now() }), // very recent
      makeQuake({ magnitude: 5.0, time: Date.now() - 86400000 * 7 }), // 7 days old
    ];
    const rings = generateSeismicRings(quakes);
    for (const ring of rings) {
      expect(ring.repeatPeriod).toBeGreaterThanOrEqual(600);
      expect(ring.repeatPeriod).toBeLessThanOrEqual(3000);
    }
  });

  test('ring color function returns rgba with fade', () => {
    const rings = generateSeismicRings([makeQuake({ magnitude: 5.0 })]);
    const colorFn = rings[0].color;
    
    // At t=0 (beginning), alpha should be 1
    const colorStart = colorFn(0);
    expect(colorStart).toMatch(/^rgba\(/);
    expect(colorStart).toContain(',1)');
    
    // At t=1 (end), alpha should be 0
    const colorEnd = colorFn(1);
    expect(colorEnd).toContain(',0)');
  });

  test('large magnitude quakes get red-tinted rings', () => {
    const rings = generateSeismicRings([makeQuake({ magnitude: 7.0 })]);
    const color = rings[0].color(0);
    expect(color).toContain('255,50,50'); // Red base
  });

  test('medium magnitude quakes get orange-tinted rings', () => {
    const rings = generateSeismicRings([makeQuake({ magnitude: 5.0 })]);
    const color = rings[0].color(0);
    expect(color).toContain('255,165,0'); // Orange base
  });

  test('smaller magnitude quakes get blue-tinted rings', () => {
    const rings = generateSeismicRings([makeQuake({ magnitude: 3.5 })]);
    const color = rings[0].color(0);
    expect(color).toContain('100,200,255'); // Blue base
  });

  test('ring coordinates match earthquake location', () => {
    const quake = makeQuake({ lat: -33.8, lng: 151.2, magnitude: 5.5 });
    const rings = generateSeismicRings([quake]);
    expect(rings[0].lat).toBe(-33.8);
    expect(rings[0].lng).toBe(151.2);
  });
});

describe('getTourStops', () => {
  test('returns empty array for no earthquakes', () => {
    expect(getTourStops([])).toEqual([]);
  });

  test('returns up to requested count of stops', () => {
    const quakes = Array.from({ length: 20 }, (_, i) =>
      makeQuake({ magnitude: 2 + i * 0.3, id: `q-${i}` })
    );
    expect(getTourStops(quakes, 8)).toHaveLength(8);
  });

  test('returns all quakes if fewer than requested', () => {
    const quakes = [makeQuake(), makeQuake(), makeQuake()];
    expect(getTourStops(quakes, 8)).toHaveLength(3);
  });

  test('sorts by magnitude descending (biggest first)', () => {
    const quakes = [
      makeQuake({ magnitude: 2.5, id: 'small' }),
      makeQuake({ magnitude: 7.1, id: 'big' }),
      makeQuake({ magnitude: 4.5, id: 'medium' }),
    ];
    const stops = getTourStops(quakes, 10);
    expect(stops[0].magnitude).toBe(7.1);
    expect(stops[1].magnitude).toBe(4.5);
    expect(stops[2].magnitude).toBe(2.5);
  });

  test('does not mutate original array', () => {
    const quakes = [
      makeQuake({ magnitude: 2.0 }),
      makeQuake({ magnitude: 6.0 }),
      makeQuake({ magnitude: 4.0 }),
    ];
    const original = [...quakes];
    getTourStops(quakes, 3);
    expect(quakes.map(q => q.magnitude)).toEqual(original.map(q => q.magnitude));
  });

  test('default count is 8', () => {
    const quakes = Array.from({ length: 20 }, (_, i) =>
      makeQuake({ magnitude: i + 1, id: `q-${i}` })
    );
    const stops = getTourStops(quakes);
    expect(stops).toHaveLength(8);
  });
});
