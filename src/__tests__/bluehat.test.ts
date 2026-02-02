/**
 * Blue Hat — Architecture & Code Quality Tests
 *
 * Validates module structure, constant extraction, cross-module integration,
 * type completeness, and the barrel re-export pattern after the refactor.
 */
import { describe, it, expect } from 'vitest';

// ─── Direct Module Imports (verify modules exist and export correctly) ───

import * as constants from '../utils/constants';
import * as colors from '../utils/colors';
import * as formatting from '../utils/formatting';
import * as geo from '../utils/geo';
import * as statistics from '../utils/statistics';
import * as mood from '../utils/mood';
import * as seismic from '../utils/seismic';
import * as audio from '../utils/audio';
import * as barrel from '../utils/helpers';
import type { GlobePoint, SeismicMood } from '../types';

// ─── Test Helpers ───

function makeQuake(overrides: Partial<GlobePoint> = {}): GlobePoint {
  return {
    lat: 34.0, lng: -118.2, magnitude: 5.0, depth: 10, place: '10km NE of TestCity',
    time: Date.now() - 60_000, id: 'test1', color: '#ff4444', size: 1.5,
    tsunami: false, sig: 200, url: 'https://earthquake.usgs.gov', ...overrides,
  };
}

// ─── Constants Module ───

describe('Constants Module', () => {
  it('exports all timing constants as positive numbers', () => {
    const timings = [
      constants.AUTO_REFRESH_MS, constants.CINEMATIC_INTERVAL_MS,
      constants.TOUR_DWELL_MS, constants.INITIAL_FLY_DELAY_MS,
      constants.PROGRESS_TICK_MS,
    ];
    for (const t of timings) {
      expect(t).toBeGreaterThan(0);
      expect(Number.isFinite(t)).toBe(true);
    }
  });

  it('exports stop counts as positive integers', () => {
    expect(Number.isInteger(constants.CINEMATIC_STOP_COUNT)).toBe(true);
    expect(constants.CINEMATIC_STOP_COUNT).toBeGreaterThan(0);
    expect(Number.isInteger(constants.TOUR_STOP_COUNT)).toBe(true);
    expect(constants.TOUR_STOP_COUNT).toBeGreaterThan(0);
  });

  it('exports USGS and tectonic plate URLs', () => {
    expect(constants.USGS_BASE_URL).toContain('earthquake.usgs.gov');
    expect(constants.TECTONIC_PLATES_URL).toContain('tectonicplates');
  });

  it('exports EARTH_RADIUS_KM as ~6371', () => {
    expect(constants.EARTH_RADIUS_KM).toBe(6371);
  });

  it('exports valid MAGNITUDE_SIZE_RANGE', () => {
    expect(constants.MAGNITUDE_SIZE_RANGE[0]).toBeLessThan(constants.MAGNITUDE_SIZE_RANGE[1]);
    expect(constants.MAGNITUDE_SIZE_RANGE[0]).toBeGreaterThan(0);
  });

  it('exports DEFAULT_TIME_RANGE with Last Week', () => {
    expect(constants.DEFAULT_TIME_RANGE.label).toBe('Last Week');
    expect(constants.DEFAULT_TIME_RANGE.hours).toBe(168);
  });

  it('TIME_RANGES has ≥5 entries in ascending hour order', () => {
    expect(constants.TIME_RANGES.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < constants.TIME_RANGES.length; i++) {
      expect(constants.TIME_RANGES[i].hours).toBeGreaterThan(constants.TIME_RANGES[i - 1].hours);
    }
    for (const tr of constants.TIME_RANGES) {
      expect(tr.label.length).toBeGreaterThan(0);
    }
  });

  it('MOOD_DESCRIPTIONS has entries for all 6 moods', () => {
    const moods: SeismicMood[] = ['serene', 'quiet', 'stirring', 'restless', 'volatile', 'fierce'];
    for (const m of moods) {
      expect(constants.MOOD_DESCRIPTIONS[m].length).toBeGreaterThan(0);
      for (const desc of constants.MOOD_DESCRIPTIONS[m]) {
        expect(desc.length).toBeGreaterThan(5);
      }
    }
  });

  it('MOOD_COLORS has valid hex colors for all 6 moods', () => {
    const moods: SeismicMood[] = ['serene', 'quiet', 'stirring', 'restless', 'volatile', 'fierce'];
    for (const m of moods) {
      expect(constants.MOOD_COLORS[m]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('MOOD_KEYS lists all 6 moods', () => {
    expect(constants.MOOD_KEYS).toHaveLength(6);
    expect(new Set(constants.MOOD_KEYS).size).toBe(6);
  });

  it('MOOD_THRESHOLDS has expected shape', () => {
    expect(constants.MOOD_THRESHOLDS.fierce.minMag).toBeGreaterThanOrEqual(7);
    expect(constants.MOOD_THRESHOLDS.volatile.minMag).toBeGreaterThanOrEqual(5);
    expect(constants.MOOD_THRESHOLDS.volatile.minScore).toBeGreaterThan(0);
  });

  it('LOADING_POEMS are non-empty strings', () => {
    expect(constants.LOADING_POEMS.length).toBeGreaterThan(0);
    for (const p of constants.LOADING_POEMS) expect(p.length).toBeGreaterThan(10);
    for (const p of constants.LOADING_POEMS_NIGHT) expect(p.length).toBeGreaterThan(10);
    for (const p of constants.LOADING_POEMS_MORNING) expect(p.length).toBeGreaterThan(10);
  });

  it('audio constants are positive', () => {
    expect(constants.MAX_TONE_DURATION).toBeGreaterThan(0);
    expect(constants.BASE_TONE_DURATION).toBeGreaterThan(0);
    expect(constants.MAX_TONE_VOLUME).toBeGreaterThan(0);
    expect(constants.HARMONIC_MIN_MAG).toBeGreaterThan(0);
    expect(constants.CRACK_MIN_MAG).toBeGreaterThan(constants.HARMONIC_MIN_MAG);
  });
});

// ─── Module Exports Verification ───

describe('Module Exports', () => {
  it('colors module exports all color/size functions', () => {
    expect(typeof colors.getDepthColor).toBe('function');
    expect(typeof colors.getMagnitudeSize).toBe('function');
    expect(typeof colors.getMagnitudeColor).toBe('function');
  });

  it('formatting module exports all formatters', () => {
    expect(typeof formatting.formatDate).toBe('function');
    expect(typeof formatting.formatRelativeTime).toBe('function');
    expect(typeof formatting.getMagnitudeDescription).toBe('function');
    expect(typeof formatting.getDepthDescription).toBe('function');
    expect(typeof formatting.formatDistanceToUser).toBe('function');
    expect(typeof formatting.getFreshnessLabel).toBe('function');
    expect(typeof formatting.getHumanImpact).toBe('function');
  });

  it('geo module exports distance and conversion', () => {
    expect(typeof geo.calculateDistance).toBe('function');
    expect(typeof geo.convertEarthquakeToGlobePoint).toBe('function');
  });

  it('statistics module exports all stats functions', () => {
    expect(typeof statistics.calculateStatistics).toBe('function');
    expect(typeof statistics.filterEarthquakesByTimeRange).toBe('function');
    expect(typeof statistics.sortEarthquakesByTime).toBe('function');
  });

  it('mood module exports mood functions', () => {
    expect(typeof mood.calculateMood).toBe('function');
    expect(typeof mood.getEmotionalContext).toBe('function');
    expect(typeof mood.getLoadingPoem).toBe('function');
  });

  it('seismic module exports ring/tour functions', () => {
    expect(typeof seismic.generateSeismicRings).toBe('function');
    expect(typeof seismic.getTourStops).toBe('function');
  });

  it('audio module exports tone/haptic functions', () => {
    expect(typeof audio.playRichQuakeTone).toBe('function');
    expect(typeof audio.triggerHaptic).toBe('function');
  });
});

// ─── Barrel Re-export Verification ───

describe('Barrel Re-export (helpers.ts)', () => {
  it('re-exports all color functions', () => {
    expect(barrel.getDepthColor).toBe(colors.getDepthColor);
    expect(barrel.getMagnitudeSize).toBe(colors.getMagnitudeSize);
    expect(barrel.getMagnitudeColor).toBe(colors.getMagnitudeColor);
  });

  it('re-exports all formatting functions', () => {
    expect(barrel.formatDate).toBe(formatting.formatDate);
    expect(barrel.formatRelativeTime).toBe(formatting.formatRelativeTime);
    expect(barrel.getMagnitudeDescription).toBe(formatting.getMagnitudeDescription);
    expect(barrel.getDepthDescription).toBe(formatting.getDepthDescription);
    expect(barrel.formatDistanceToUser).toBe(formatting.formatDistanceToUser);
    expect(barrel.getFreshnessLabel).toBe(formatting.getFreshnessLabel);
    expect(barrel.getHumanImpact).toBe(formatting.getHumanImpact);
  });

  it('re-exports geo functions', () => {
    expect(barrel.calculateDistance).toBe(geo.calculateDistance);
    expect(barrel.convertEarthquakeToGlobePoint).toBe(geo.convertEarthquakeToGlobePoint);
  });

  it('re-exports statistics functions', () => {
    expect(barrel.calculateStatistics).toBe(statistics.calculateStatistics);
    expect(barrel.filterEarthquakesByTimeRange).toBe(statistics.filterEarthquakesByTimeRange);
    expect(barrel.sortEarthquakesByTime).toBe(statistics.sortEarthquakesByTime);
  });

  it('re-exports mood functions', () => {
    expect(barrel.calculateMood).toBe(mood.calculateMood);
    expect(barrel.getEmotionalContext).toBe(mood.getEmotionalContext);
    expect(barrel.getLoadingPoem).toBe(mood.getLoadingPoem);
  });

  it('re-exports seismic functions', () => {
    expect(barrel.generateSeismicRings).toBe(seismic.generateSeismicRings);
    expect(barrel.getTourStops).toBe(seismic.getTourStops);
  });

  it('re-exports audio functions', () => {
    expect(barrel.playRichQuakeTone).toBe(audio.playRichQuakeTone);
    expect(barrel.triggerHaptic).toBe(audio.triggerHaptic);
  });
});

// ─── Cross-Module Integration ───

describe('Cross-Module Integration', () => {
  it('geo.convertEarthquakeToGlobePoint uses colors module correctly', () => {
    const feature = {
      type: 'Feature' as const,
      properties: {
        mag: 5.5, place: 'Test', time: Date.now(), updated: Date.now(),
        url: '', detail: '', status: 'reviewed', tsunami: 0, sig: 300,
        net: 'us', code: 'test', ids: '', sources: '', types: '',
        magType: 'ml', type: 'earthquake', title: 'Test',
      },
      geometry: { type: 'Point' as const, coordinates: [-118.2, 34.0, 12.0] as [number, number, number] },
      id: 'test',
    };
    const point = geo.convertEarthquakeToGlobePoint(feature);
    expect(point.color).toBe(colors.getDepthColor(12.0));
    expect(point.size).toBe(colors.getMagnitudeSize(5.5));
  });

  it('mood.calculateMood uses constants for thresholds', () => {
    // Fierce earthquake should produce fierce mood
    const fierceQuake = makeQuake({ magnitude: 8.0, time: Date.now() - 3600_000 });
    const result = mood.calculateMood([fierceQuake]);
    expect(result.mood).toBe('fierce');
    expect(result.color).toBe(constants.MOOD_COLORS.fierce);
  });

  it('seismic.generateSeismicRings respects SEISMIC_RING_MIN_MAG', () => {
    const small = makeQuake({ magnitude: 1.5 });
    const big = makeQuake({ magnitude: 5.0, lat: 35, lng: -120 });
    const rings = seismic.generateSeismicRings([small, big]);
    expect(rings).toHaveLength(1); // Only the M5.0
    expect(rings[0].lat).toBe(35);
  });

  it('seismic.getTourStops sorts by magnitude descending', () => {
    const quakes = [
      makeQuake({ magnitude: 3.0, id: 'a' }),
      makeQuake({ magnitude: 7.0, id: 'b' }),
      makeQuake({ magnitude: 5.0, id: 'c' }),
    ];
    const stops = seismic.getTourStops(quakes, 3);
    expect(stops[0].magnitude).toBe(7.0);
    expect(stops[1].magnitude).toBe(5.0);
    expect(stops[2].magnitude).toBe(3.0);
  });

  it('statistics.calculateStatistics returns correct totals', () => {
    const quakes = [
      makeQuake({ magnitude: 5.0, depth: 20, felt: 100, tsunami: true, sig: 500 }),
      makeQuake({ magnitude: 3.0, depth: 80, felt: 10, tsunami: false, sig: 50, id: 'test2' }),
    ];
    const stats = statistics.calculateStatistics(quakes);
    expect(stats.totalEvents).toBe(2);
    expect(stats.largestMagnitude).toBe(5.0);
    expect(stats.totalFelt).toBe(110);
    expect(stats.tsunamiWarnings).toBe(1);
    expect(stats.significanceScore).toBe(550);
    expect(stats.averageDepth).toBe(50);
  });

  it('formatting.getHumanImpact assembles all impact fields', () => {
    const q = makeQuake({ felt: 5000, tsunami: true, alert: 'orange', cdi: 7 });
    const impact = formatting.getHumanImpact(q);
    expect(impact).toContain('5.0k');
    expect(impact).toContain('Tsunami');
    expect(impact).toContain('Significant impact');
    expect(impact).toContain('Strong shaking');
  });

  it('mood.getEmotionalContext returns context for M7.5+ with tsunami', () => {
    const q = makeQuake({ magnitude: 7.8, tsunami: true });
    const ctx = mood.getEmotionalContext(q);
    expect(ctx).not.toBeNull();
    expect(ctx!).toContain('tsunami');
  });

  it('formatting.getFreshnessLabel returns live/recent/fresh/null', () => {
    expect(formatting.getFreshnessLabel(Date.now() - 5 * 60_000)?.urgency).toBe('live');
    expect(formatting.getFreshnessLabel(Date.now() - 30 * 60_000)?.urgency).toBe('recent');
    expect(formatting.getFreshnessLabel(Date.now() - 120 * 60_000)?.urgency).toBe('fresh');
    expect(formatting.getFreshnessLabel(Date.now() - 24 * 60 * 60_000)).toBeNull();
  });
});

// ─── Type System Consistency ───

describe('Type System Consistency', () => {
  it('all MOOD_KEYS are valid SeismicMood values', () => {
    for (const key of constants.MOOD_KEYS) {
      expect(constants.MOOD_DESCRIPTIONS[key]).toBeDefined();
      expect(constants.MOOD_COLORS[key]).toBeDefined();
    }
  });

  it('DEFAULT_TIME_RANGE exists in TIME_RANGES', () => {
    const match = constants.TIME_RANGES.find(
      tr => tr.hours === constants.DEFAULT_TIME_RANGE.hours,
    );
    expect(match).toBeDefined();
    expect(match!.label).toBe(constants.DEFAULT_TIME_RANGE.label);
  });

  it('MAGNITUDE_SIZE_SCALE produces values within MAGNITUDE_SIZE_RANGE', () => {
    for (let mag = 0; mag <= 10; mag += 0.5) {
      const size = colors.getMagnitudeSize(mag);
      expect(size).toBeGreaterThanOrEqual(constants.MAGNITUDE_SIZE_RANGE[0]);
      expect(size).toBeLessThanOrEqual(constants.MAGNITUDE_SIZE_RANGE[1]);
    }
  });

  it('all depth color thresholds return valid hex colors', () => {
    const depths = [0, 10, 34, 35, 69, 70, 149, 150, 299, 300, 499, 500, 1000];
    for (const d of depths) {
      expect(colors.getDepthColor(d)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('all magnitude color thresholds return valid hex colors', () => {
    const mags = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (const m of mags) {
      expect(colors.getMagnitudeColor(m)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
