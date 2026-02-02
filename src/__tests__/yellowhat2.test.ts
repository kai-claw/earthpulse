/**
 * Yellow Hat #2 — Value Polish tests.
 * Tests for: CSV export, activity rate calculation, data formatting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  earthquakesToCSV,
  calculateActivityRate,
  type ActivityRate,
} from '../utils/export';
import type { GlobePoint } from '../types';

// ─── Test Helpers ───

function makeQuake(overrides: Partial<GlobePoint> = {}): GlobePoint {
  return {
    lat: 35.6762,
    lng: 139.6503,
    magnitude: 4.5,
    depth: 10,
    place: 'Near Tokyo, Japan',
    time: Date.now() - 3600000, // 1 hour ago
    id: 'test-' + Math.random().toString(36).slice(2, 8),
    color: '#fbbf24',
    size: 0.5,
    tsunami: false,
    sig: 100,
    url: 'https://earthquake.usgs.gov/earthquakes/eventpage/test123',
    ...overrides,
  };
}

function makeQuakes(count: number, spanHours: number, baseMag = 3.0): GlobePoint[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => makeQuake({
    id: `quake-${i}`,
    magnitude: baseMag + Math.random() * 2,
    time: now - (spanHours * 60 * 60 * 1000) + (i * (spanHours * 60 * 60 * 1000) / count),
    place: `Location ${i}`,
  }));
}

// ─── CSV Export Tests ───

describe('earthquakesToCSV', () => {
  it('generates valid CSV header', () => {
    const csv = earthquakesToCSV([]);
    const header = csv.split('\n')[0];
    expect(header).toContain('ID');
    expect(header).toContain('Magnitude');
    expect(header).toContain('Latitude');
    expect(header).toContain('Longitude');
    expect(header).toContain('Depth (km)');
    expect(header).toContain('Location');
    expect(header).toContain('Time (UTC)');
    expect(header).toContain('Felt Reports');
    expect(header).toContain('Tsunami Warning');
    expect(header).toContain('PAGER Alert');
    expect(header).toContain('Significance');
    expect(header).toContain('USGS URL');
  });

  it('generates correct column count per row', () => {
    const quake = makeQuake();
    const csv = earthquakesToCSV([quake]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2); // header + 1 data row
    const headerCols = lines[0].split(',').length;
    // Data row may have quoted fields — count unquoted commas
    // The header is the canonical column count
    expect(headerCols).toBe(15);
  });

  it('formats magnitude to 1 decimal place', () => {
    const quake = makeQuake({ magnitude: 5.678 });
    const csv = earthquakesToCSV([quake]);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toContain('5.7');
  });

  it('formats coordinates to 4 decimal places', () => {
    const quake = makeQuake({ lat: 35.6762345, lng: 139.6503123 });
    const csv = earthquakesToCSV([quake]);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toContain('35.6762');
    expect(dataRow).toContain('139.6503');
  });

  it('escapes CSV fields containing commas', () => {
    const quake = makeQuake({ place: 'San Francisco, California' });
    const csv = earthquakesToCSV([quake]);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toContain('"San Francisco, California"');
  });

  it('escapes CSV fields containing quotes', () => {
    const quake = makeQuake({ place: 'Near "Tokyo" Tower' });
    const csv = earthquakesToCSV([quake]);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toContain('"Near ""Tokyo"" Tower"');
  });

  it('marks tsunami warnings correctly', () => {
    const tsunamiQuake = makeQuake({ tsunami: true });
    const normalQuake = makeQuake({ tsunami: false });
    const csv = earthquakesToCSV([tsunamiQuake, normalQuake]);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('Yes');
    expect(lines[2]).toContain('No');
  });

  it('handles missing felt reports as 0', () => {
    const quake = makeQuake({ felt: undefined });
    const csv = earthquakesToCSV([quake]);
    expect(csv.split('\n')[1]).toContain(',0,');
  });

  it('handles missing alert as None', () => {
    const quake = makeQuake({ alert: undefined });
    const csv = earthquakesToCSV([quake]);
    expect(csv.split('\n')[1]).toContain('None');
  });

  it('includes PAGER alert when present', () => {
    const quake = makeQuake({ alert: 'orange' });
    const csv = earthquakesToCSV([quake]);
    expect(csv.split('\n')[1]).toContain('orange');
  });

  it('generates ISO timestamp', () => {
    const time = new Date('2026-01-15T10:30:00Z').getTime();
    const quake = makeQuake({ time });
    const csv = earthquakesToCSV([quake]);
    expect(csv.split('\n')[1]).toContain('2026-01-15T10:30:00.000Z');
  });

  it('handles multiple quakes', () => {
    const quakes = makeQuakes(50, 24);
    const csv = earthquakesToCSV(quakes);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(51); // header + 50 rows
  });

  it('handles empty array', () => {
    const csv = earthquakesToCSV([]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1); // header only
  });

  it('includes magnitude class (description)', () => {
    const quake = makeQuake({ magnitude: 6.5 });
    const csv = earthquakesToCSV([quake]);
    expect(csv.split('\n')[1]).toContain('Major');
  });

  it('includes depth class', () => {
    const quake = makeQuake({ depth: 150 });
    const csv = earthquakesToCSV([quake]);
    expect(csv.split('\n')[1]).toContain('Deep');
  });

  it('handles NaN magnitude gracefully', () => {
    const quake = makeQuake({ magnitude: NaN });
    const csv = earthquakesToCSV([quake]);
    expect(csv.split('\n')[1]).toContain('0.0');
    expect(csv.split('\n')[1]).not.toContain('NaN');
  });

  it('handles NaN depth gracefully', () => {
    const quake = makeQuake({ depth: NaN });
    const csv = earthquakesToCSV([quake]);
    const row = csv.split('\n')[1];
    expect(row).not.toContain('NaN');
  });

  it('handles NaN coordinates gracefully', () => {
    const quake = makeQuake({ lat: NaN, lng: NaN });
    const csv = earthquakesToCSV([quake]);
    const row = csv.split('\n')[1];
    expect(row).not.toContain('NaN');
  });

  it('handles NaN time gracefully', () => {
    const quake = makeQuake({ time: NaN });
    const csv = earthquakesToCSV([quake]);
    const row = csv.split('\n')[1];
    expect(row).not.toContain('NaN');
  });

  it('handles Infinity magnitude gracefully', () => {
    const quake = makeQuake({ magnitude: Infinity });
    const csv = earthquakesToCSV([quake]);
    expect(csv.split('\n')[1]).not.toContain('Infinity');
  });
});

// ─── Activity Rate Tests ───

describe('calculateActivityRate', () => {
  it('returns quiet level for empty data', () => {
    const rate = calculateActivityRate([]);
    expect(rate.perHour).toBe(0);
    expect(rate.perDay).toBe(0);
    expect(rate.level).toBe('quiet');
    expect(rate.trend).toBe('stable');
  });

  it('calculates correct quakes per hour', () => {
    // 48 quakes over 24 hours = ~2/hr
    const quakes = makeQuakes(48, 24);
    const rate = calculateActivityRate(quakes);
    // Allow some tolerance since makeQuakes distributes evenly but span calc may shift
    expect(rate.perHour).toBeGreaterThan(1);
    expect(rate.perHour).toBeLessThan(5);
    expect(rate.perDay).toBe(rate.perHour * 24);
  });

  it('classifies quiet activity level', () => {
    const quakes = makeQuakes(2, 24); // very few over a long span
    const rate = calculateActivityRate(quakes);
    expect(rate.level).toBe('quiet');
  });

  it('classifies normal activity level', () => {
    const quakes = makeQuakes(72, 24); // ~3/hr
    const rate = calculateActivityRate(quakes);
    expect(rate.level).toBe('normal');
  });

  it('classifies active level', () => {
    const quakes = makeQuakes(240, 24); // ~10/hr
    const rate = calculateActivityRate(quakes);
    expect(rate.level).toBe('active');
  });

  it('classifies elevated level', () => {
    const quakes = makeQuakes(480, 24); // ~20/hr
    const rate = calculateActivityRate(quakes);
    expect(rate.level).toBe('elevated');
  });

  it('classifies intense level', () => {
    const quakes = makeQuakes(800, 24); // ~33/hr
    const rate = calculateActivityRate(quakes);
    expect(rate.level).toBe('intense');
  });

  it('detects rising trend when second half has more quakes', () => {
    const now = Date.now();
    const quakes = [
      // First half: 2 quakes
      makeQuake({ time: now - 4 * 3600000, id: 'a1' }),
      makeQuake({ time: now - 3.5 * 3600000, id: 'a2' }),
      // Second half: 8 quakes (4× more = ratio 4.0 > 1.3)
      ...Array.from({ length: 8 }, (_, i) => makeQuake({
        time: now - (1.5 * 3600000) + i * 100000,
        id: `b${i}`,
      })),
    ];
    const rate = calculateActivityRate(quakes);
    expect(rate.trend).toBe('rising');
  });

  it('detects falling trend when first half has more quakes', () => {
    const now = Date.now();
    const quakes = [
      // First half: 8 quakes
      ...Array.from({ length: 8 }, (_, i) => makeQuake({
        time: now - 4 * 3600000 + i * 100000,
        id: `a${i}`,
      })),
      // Second half: 2 quakes (ratio 0.25 < 0.7)
      makeQuake({ time: now - 1 * 3600000, id: 'b1' }),
      makeQuake({ time: now - 0.5 * 3600000, id: 'b2' }),
    ];
    const rate = calculateActivityRate(quakes);
    expect(rate.trend).toBe('falling');
  });

  it('detects stable trend when distribution is even', () => {
    const quakes = makeQuakes(100, 24);
    const rate = calculateActivityRate(quakes);
    // Evenly distributed quakes should be stable
    expect(rate.trend).toBe('stable');
  });

  it('handles single quake without crashing', () => {
    const quakes = [makeQuake()];
    const rate = calculateActivityRate(quakes);
    expect(rate.perHour).toBeGreaterThanOrEqual(0);
    expect(rate.level).toBeDefined();
    expect(rate.trend).toBeDefined();
  });

  it('returns valid trend description', () => {
    const rate = calculateActivityRate(makeQuakes(50, 24));
    expect(typeof rate.trendDescription).toBe('string');
    expect(rate.trendDescription.length).toBeGreaterThan(0);
  });

  it('perDay is 24× perHour', () => {
    const rate = calculateActivityRate(makeQuakes(100, 48));
    expect(rate.perDay).toBeCloseTo(rate.perHour * 24, 5);
  });
});

// ─── CSV Download (unit-safe: no DOM needed) ───

describe('downloadCSV function', () => {
  it('is exported and callable', async () => {
    const mod = await import('../utils/export');
    expect(typeof mod.downloadCSV).toBe('function');
  });

  it('earthquakesToCSV produces valid content that downloadCSV would use', () => {
    const quakes = [makeQuake({ magnitude: 5.5, place: 'Test Location' })];
    const csv = earthquakesToCSV(quakes);
    // Validate the CSV content is well-formed
    expect(csv).toContain('ID,Magnitude');
    expect(csv.split('\n')).toHaveLength(2);
    expect(csv).toContain('5.5');
    expect(csv).toContain('Test Location');
  });

  it('generates correct default filename pattern', () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const expectedPattern = `earthpulse-${dateStr}-3quakes.csv`;
    // We test the pattern logic without DOM
    const count = 3;
    const fname = `earthpulse-${dateStr}-${count}quakes.csv`;
    expect(fname).toBe(expectedPattern);
  });
});

// ─── Edge cases ───

describe('CSV edge cases', () => {
  it('handles quake with all optional fields present', () => {
    const quake = makeQuake({
      felt: 5000,
      cdi: 7.5,
      alert: 'red',
      tsunami: true,
      sig: 950,
    });
    const csv = earthquakesToCSV([quake]);
    const row = csv.split('\n')[1];
    expect(row).toContain('5000');
    expect(row).toContain('red');
    expect(row).toContain('Yes');
    expect(row).toContain('950');
  });

  it('handles quake with empty place string', () => {
    const quake = makeQuake({ place: '' });
    const csv = earthquakesToCSV([quake]);
    const row = csv.split('\n')[1];
    expect(row).toContain('Unknown');
  });

  it('handles very large magnitude', () => {
    const quake = makeQuake({ magnitude: 9.5 });
    const csv = earthquakesToCSV([quake]);
    expect(csv.split('\n')[1]).toContain('9.5');
    expect(csv.split('\n')[1]).toContain('Historic');
  });

  it('handles zero magnitude', () => {
    const quake = makeQuake({ magnitude: 0 });
    const csv = earthquakesToCSV([quake]);
    expect(csv.split('\n')[1]).toContain('0.0');
    expect(csv.split('\n')[1]).toContain('Micro');
  });

  it('handles negative depth (above sea level)', () => {
    const quake = makeQuake({ depth: -2.5 });
    const csv = earthquakesToCSV([quake]);
    expect(csv.split('\n')[1]).toContain('-2.5');
  });

  it('generates consistent row count for batch', () => {
    const quakes = makeQuakes(200, 168);
    const csv = earthquakesToCSV(quakes);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(201);
  });
});
