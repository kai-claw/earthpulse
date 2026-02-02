/**
 * Blue Hat #2 — Final System Coherence Review (Pass 10/10)
 *
 * Integration-level tests verifying the entire codebase works as a cohesive whole:
 * - Module boundaries & barrel exports
 * - Type contracts across layers
 * - Hook return shape consistency
 * - Cross-module data flow
 * - Edge cases at boundaries
 * - Final statistics & invariants
 */
import { describe, it, expect } from 'vitest';

// ─── Barrel export verification (ensure no broken/missing exports) ───

import * as UtilIndex from '../utils/index';
import * as Colors from '../utils/colors';
import * as Formatting from '../utils/formatting';
import * as Geo from '../utils/geo';
import * as Statistics from '../utils/statistics';
import * as Mood from '../utils/mood';
import * as Seismic from '../utils/seismic';
import * as Audio from '../utils/audio';
import * as Constants from '../utils/constants';
import * as Energy from '../utils/energy';
import * as Historical from '../utils/historical';
import * as Clusters from '../utils/clusters';
import * as Export from '../utils/export';
import * as Api from '../utils/api';
import * as HookIndex from '../hooks/index';
import type { GlobePoint, FilterState, Statistics as StatsType, MoodState, SeismicMood } from '../types';

// Helper: create a realistic GlobePoint for cross-module tests
function makeQuake(overrides: Partial<GlobePoint> = {}): GlobePoint {
  return {
    lat: 37.7749, lng: -122.4194, magnitude: 4.5, depth: 10,
    place: '10km NW of San Francisco, CA', time: Date.now() - 3600000,
    id: 'test-quake-1', color: '#ef4444', size: 0.6,
    tsunami: false, sig: 450, url: 'https://earthquake.usgs.gov/earthquakes/eventpage/test',
    ...overrides,
  };
}

describe('Blue Hat #2 — System Coherence (Pass 10/10)', () => {
  // ─────────────────────────────────────────────────
  // Module Boundary Verification
  // ─────────────────────────────────────────────────

  describe('barrel exports — utils/index', () => {
    it('re-exports all color functions', () => {
      expect(UtilIndex.getDepthColor).toBe(Colors.getDepthColor);
      expect(UtilIndex.getMagnitudeSize).toBe(Colors.getMagnitudeSize);
      expect(UtilIndex.getMagnitudeColor).toBe(Colors.getMagnitudeColor);
    });

    it('re-exports all formatting functions', () => {
      expect(UtilIndex.formatDate).toBe(Formatting.formatDate);
      expect(UtilIndex.formatRelativeTime).toBe(Formatting.formatRelativeTime);
      expect(UtilIndex.getMagnitudeDescription).toBe(Formatting.getMagnitudeDescription);
      expect(UtilIndex.getDepthDescription).toBe(Formatting.getDepthDescription);
      expect(UtilIndex.getFreshnessLabel).toBe(Formatting.getFreshnessLabel);
      expect(UtilIndex.getHumanImpact).toBe(Formatting.getHumanImpact);
      expect(UtilIndex.formatDistanceToUser).toBe(Formatting.formatDistanceToUser);
    });

    it('re-exports all geo functions', () => {
      expect(UtilIndex.calculateDistance).toBe(Geo.calculateDistance);
      expect(UtilIndex.convertEarthquakeToGlobePoint).toBe(Geo.convertEarthquakeToGlobePoint);
    });

    it('re-exports all statistics functions', () => {
      expect(UtilIndex.calculateStatistics).toBe(Statistics.calculateStatistics);
      expect(UtilIndex.filterEarthquakesByTimeRange).toBe(Statistics.filterEarthquakesByTimeRange);
      expect(UtilIndex.sortEarthquakesByTime).toBe(Statistics.sortEarthquakesByTime);
    });

    it('re-exports all mood functions', () => {
      expect(UtilIndex.calculateMood).toBe(Mood.calculateMood);
      expect(UtilIndex.getEmotionalContext).toBe(Mood.getEmotionalContext);
      expect(UtilIndex.getLoadingPoem).toBe(Mood.getLoadingPoem);
    });

    it('re-exports all seismic functions', () => {
      expect(UtilIndex.generateSeismicRings).toBe(Seismic.generateSeismicRings);
      expect(UtilIndex.getTourStops).toBe(Seismic.getTourStops);
    });

    it('re-exports all audio functions', () => {
      expect(UtilIndex.playRichQuakeTone).toBe(Audio.playRichQuakeTone);
      expect(UtilIndex.triggerHaptic).toBe(Audio.triggerHaptic);
    });
  });

  describe('barrel exports — hooks/index', () => {
    it('exports all hook functions', () => {
      expect(typeof HookIndex.useEarthquakeData).toBe('function');
      expect(typeof HookIndex.useTour).toBe('function');
      expect(typeof HookIndex.useCinematic).toBe('function');
      expect(typeof HookIndex.useAudio).toBe('function');
      expect(typeof HookIndex.useKeyboardShortcuts).toBe('function');
      expect(typeof HookIndex.useUrlState).toBe('function');
      expect(typeof HookIndex.useAutoRefresh).toBe('function');
      expect(typeof HookIndex.useSearch).toBe('function');
      expect(typeof HookIndex.usePerformanceMonitor).toBe('function');
    });
  });

  // ─────────────────────────────────────────────────
  // Cross-Module Data Flow
  // ─────────────────────────────────────────────────

  describe('data flow: GlobePoint → statistics → mood', () => {
    it('statistics consume GlobePoint[] correctly', () => {
      const quakes = [
        makeQuake({ magnitude: 6.2, depth: 15, tsunami: true, sig: 800, place: 'Tonga' }),
        makeQuake({ magnitude: 3.1, depth: 50, sig: 100, id: 'q2', place: 'Alaska' }),
        makeQuake({ magnitude: 4.8, depth: 25, sig: 400, id: 'q3', place: 'Alaska' }),
      ];
      const stats = Statistics.calculateStatistics(quakes);
      expect(stats.totalEvents).toBe(3);
      expect(stats.largestMagnitude).toBe(6.2);
      expect(stats.tsunamiWarnings).toBe(1);
      expect(stats.averageDepth).toBeCloseTo(30, 0);
      expect(stats.significanceScore).toBeGreaterThan(0);
    });

    it('mood consumes GlobePoint[] and returns valid MoodState', () => {
      const quakes = [
        makeQuake({ magnitude: 7.0, time: Date.now() - 60000 }),
        makeQuake({ magnitude: 5.5, id: 'q2', time: Date.now() - 120000 }),
      ];
      const mood = Mood.calculateMood(quakes);
      expect(['serene', 'quiet', 'stirring', 'restless', 'volatile', 'fierce']).toContain(mood.mood);
      expect(mood.intensity).toBeGreaterThanOrEqual(0);
      expect(mood.intensity).toBeLessThanOrEqual(1);
      expect(typeof mood.description).toBe('string');
      expect(mood.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(mood.recentBiggest).toBeGreaterThanOrEqual(7.0);
    });

    it('empty data produces safe defaults', () => {
      const stats = Statistics.calculateStatistics([]);
      expect(stats.totalEvents).toBe(0);
      expect(stats.largestMagnitude).toBe(0);
      expect(Number.isNaN(stats.averageDepth)).toBe(false);

      const mood = Mood.calculateMood([]);
      expect(mood.mood).toBe('serene');
      expect(mood.intensity).toBe(0);
    });
  });

  describe('data flow: GlobePoint → visualization layers', () => {
    it('seismic rings only generate for M3+', () => {
      // Give each quake distinct coords so we can identify them
      const quakes = [
        makeQuake({ magnitude: 2.9, id: 'small', lat: 10, lng: 10 }),
        makeQuake({ magnitude: 3.0, id: 'threshold', lat: 20, lng: 20 }),
        makeQuake({ magnitude: 5.5, id: 'big', lat: 30, lng: 30 }),
      ];
      const rings = Seismic.generateSeismicRings(quakes);
      // M2.9 at (10,10) should not produce rings
      const hasSmall = rings.some(r => r.lat === 10 && r.lng === 10);
      // M5.5 at (30,30) should produce rings
      const hasBig = rings.some(r => r.lat === 30 && r.lng === 30);
      expect(hasSmall).toBe(false);
      expect(hasBig).toBe(true);
    });

    it('tour stops are sorted by magnitude descending', () => {
      const quakes = [
        makeQuake({ magnitude: 3.0, id: 'q1' }),
        makeQuake({ magnitude: 6.0, id: 'q2' }),
        makeQuake({ magnitude: 4.5, id: 'q3' }),
        makeQuake({ magnitude: 7.2, id: 'q4' }),
      ];
      const stops = Seismic.getTourStops(quakes);
      for (let i = 1; i < stops.length; i++) {
        expect(stops[i].magnitude).toBeLessThanOrEqual(stops[i - 1].magnitude);
      }
    });

    it('seismic arcs are symmetric (start≠end)', () => {
      const quakes = [
        makeQuake({ lat: 35.0, lng: 139.0, time: Date.now() - 1000, id: 'q1' }),
        makeQuake({ lat: 35.5, lng: 139.5, time: Date.now() - 2000, id: 'q2' }),
      ];
      const arcs = Clusters.generateSeismicArcs(quakes);
      for (const arc of arcs) {
        // Arcs should connect different points
        expect(arc.startLat !== arc.endLat || arc.startLng !== arc.endLng).toBe(true);
      }
    });

    it('energy heatmap produces positive weights', () => {
      const quakes = [
        makeQuake({ magnitude: 5.0, id: 'q1' }),
        makeQuake({ magnitude: 3.0, id: 'q2', lat: 38.0, lng: -121.0 }),
      ];
      const points = Clusters.generateHeatmapPoints(quakes);
      for (const p of points) {
        expect(p.weight).toBeGreaterThan(0);
        expect(Number.isNaN(p.weight)).toBe(false);
        expect(Number.isFinite(p.lat)).toBe(true);
        expect(Number.isFinite(p.lng)).toBe(true);
      }
    });
  });

  // ─────────────────────────────────────────────────
  // Formatting ↔ Display Contract
  // ─────────────────────────────────────────────────

  describe('formatting contract', () => {
    it('magnitude descriptions cover all ranges', () => {
      const ranges = [0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0];
      for (const mag of ranges) {
        const desc = Formatting.getMagnitudeDescription(mag);
        expect(typeof desc).toBe('string');
        expect(desc.length).toBeGreaterThan(0);
      }
    });

    it('depth descriptions cover all ranges', () => {
      const depths = [0, 5, 30, 70, 150, 400, 700];
      for (const d of depths) {
        const desc = Formatting.getDepthDescription(d);
        expect(typeof desc).toBe('string');
        expect(desc.length).toBeGreaterThan(0);
      }
    });

    it('freshness labels cover recent time spectrum', () => {
      const now = Date.now();
      // JUST NOW (< 10m)
      const justNow = Formatting.getFreshnessLabel(now - 60000);
      expect(justNow).not.toBeNull();
      expect(justNow!.label).toBe('JUST NOW');
      expect(justNow!.urgency).toBe('live');

      // Recent (10-60m)
      const recent = Formatting.getFreshnessLabel(now - 1800000); // 30m ago
      expect(recent).not.toBeNull();
      expect(recent!.urgency).toBe('recent');

      // Fresh (1-3h)
      const fresh = Formatting.getFreshnessLabel(now - 7200000); // 2h ago
      expect(fresh).not.toBeNull();
      expect(fresh!.urgency).toBe('fresh');

      // Null for old events (> 3h)
      const old = Formatting.getFreshnessLabel(now - 86400000); // 1 day
      expect(old).toBeNull();
    });

    it('human impact returns non-empty string when data is present', () => {
      // With felt reports
      const feltImpact = Formatting.getHumanImpact(makeQuake({ felt: 500 }));
      expect(feltImpact).toContain('felt this');

      // With tsunami warning
      const tsunamiImpact = Formatting.getHumanImpact(makeQuake({ tsunami: true }));
      expect(tsunamiImpact).toContain('Tsunami');

      // With no data — returns empty string (valid)
      const noData = Formatting.getHumanImpact(makeQuake());
      expect(typeof noData).toBe('string');
    });

    it('distance formatting handles antipodal points', () => {
      // San Francisco to approximately its antipode (Indian Ocean)
      const dist = Formatting.formatDistanceToUser(37.77, -122.42, -37.77, 57.58);
      expect(typeof dist).toBe('string');
      expect(dist).toMatch(/km|mi/);
    });
  });

  // ─────────────────────────────────────────────────
  // Color Contract (visual encoding consistency)
  // ─────────────────────────────────────────────────

  describe('visual encoding consistency', () => {
    it('depth colors are valid CSS colors', () => {
      const depths = [0, 10, 50, 100, 300, 700];
      for (const d of depths) {
        const color = Colors.getDepthColor(d);
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$|^rgba?\(/);
      }
    });

    it('magnitude colors are valid CSS colors', () => {
      const mags = [1, 3, 5, 7, 9];
      for (const m of mags) {
        const color = Colors.getMagnitudeColor(m);
        expect(typeof color).toBe('string');
        expect(color.length).toBeGreaterThan(0);
      }
    });

    it('magnitude sizes increase with magnitude', () => {
      const sizes = [1, 3, 5, 7].map(m => Colors.getMagnitudeSize(m));
      for (let i = 1; i < sizes.length; i++) {
        expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i - 1]);
      }
    });
  });

  // ─────────────────────────────────────────────────
  // Constants Integrity
  // ─────────────────────────────────────────────────

  describe('constants integrity', () => {
    it('all mood types defined in constants match SeismicMood union', () => {
      const validMoods: SeismicMood[] = ['serene', 'quiet', 'stirring', 'restless', 'volatile', 'fierce'];
      // Verify the mood system only produces valid moods
      const testCases = [
        [] as GlobePoint[],
        [makeQuake({ magnitude: 1.0 })],
        [makeQuake({ magnitude: 5.0 })],
        [makeQuake({ magnitude: 8.0 }), makeQuake({ magnitude: 7.5, id: 'q2' })],
      ];
      for (const quakes of testCases) {
        const mood = Mood.calculateMood(quakes);
        expect(validMoods).toContain(mood.mood);
      }
    });

    it('INITIAL_FLY_MIN_MAG is a reasonable threshold', () => {
      expect(Constants.INITIAL_FLY_MIN_MAG).toBeGreaterThanOrEqual(2);
      expect(Constants.INITIAL_FLY_MIN_MAG).toBeLessThanOrEqual(6);
    });

    it('DEFAULT_TIME_RANGE has valid hours', () => {
      expect(Constants.DEFAULT_TIME_RANGE.hours).toBeGreaterThan(0);
      expect(typeof Constants.DEFAULT_TIME_RANGE.label).toBe('string');
    });

    it('heatmap constants are physically reasonable', () => {
      expect(Clusters.HEATMAP_BANDWIDTH).toBeGreaterThan(0);
      expect(Clusters.HEATMAP_TOP_ALT).toBeGreaterThan(Clusters.HEATMAP_BASE_ALT);
    });
  });

  // ─────────────────────────────────────────────────
  // Export Utilities
  // ─────────────────────────────────────────────────

  describe('data export', () => {
    it('CSV export produces valid header + data rows', () => {
      const quakes = [
        makeQuake({ magnitude: 5.2 }),
        makeQuake({ magnitude: 3.1, id: 'q2', place: 'Location with, comma' }),
      ];
      const csv = Export.earthquakesToCSV(quakes);
      const lines = csv.split('\n').filter(l => l.trim());
      expect(lines.length).toBe(3); // header + 2 data rows
      // Header should contain key column names
      expect(lines[0]).toContain('Magnitude');
      expect(lines[0]).toContain('Latitude');
      expect(lines[0]).toContain('Location');
    });

    it('CSV handles special characters without breaking', () => {
      const quake = makeQuake({ place: 'Near "Somewhere", Province' });
      const csv = Export.earthquakesToCSV([quake]);
      // Should be parseable (no unescaped quotes/commas breaking rows)
      const lines = csv.split('\n').filter(l => l.trim());
      expect(lines.length).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────
  // Historical Data
  // ─────────────────────────────────────────────────

  describe('historical earthquake data', () => {
    it('all historical entries have required fields', () => {
      const entries = Historical.HISTORICAL_EARTHQUAKES;
      expect(entries.length).toBeGreaterThan(0);
      for (const entry of entries) {
        expect(typeof entry.name).toBe('string');
        expect(typeof entry.magnitude).toBe('number');
        expect(entry.magnitude).toBeGreaterThan(0);
        expect(typeof entry.year).toBe('number');
        expect(typeof entry.lat).toBe('number');
        expect(typeof entry.lng).toBe('number');
        expect(entry.lat).toBeGreaterThanOrEqual(-90);
        expect(entry.lat).toBeLessThanOrEqual(90);
        expect(entry.lng).toBeGreaterThanOrEqual(-180);
        expect(entry.lng).toBeLessThanOrEqual(180);
      }
    });
  });

  // ─────────────────────────────────────────────────
  // Energy Calculations
  // ─────────────────────────────────────────────────

  describe('energy calculations', () => {
    it('seismic energy increases exponentially with magnitude', () => {
      const e4 = Energy.magnitudeToJoules(4.0);
      const e5 = Energy.magnitudeToJoules(5.0);
      const e6 = Energy.magnitudeToJoules(6.0);
      // Each magnitude step ≈ 31.6x energy (10^1.5)
      expect(e5 / e4).toBeCloseTo(31.62, 0);
      expect(e6 / e5).toBeCloseTo(31.62, 0);
    });

    it('energy values are always positive and finite', () => {
      for (let mag = 0; mag <= 10; mag += 0.5) {
        const e = Energy.magnitudeToJoules(mag);
        expect(e).toBeGreaterThan(0);
        expect(Number.isFinite(e)).toBe(true);
      }
    });

    it('energy comparison returns meaningful comparisons', () => {
      const comp = Energy.getEnergyComparison(7.0);
      expect(comp.joules).toBeGreaterThan(0);
      expect(comp.tntTons).toBeGreaterThan(0);
      expect(Array.isArray(comp.comparisons)).toBe(true);
      expect(comp.comparisons.length).toBeGreaterThan(0);
      for (const c of comp.comparisons) {
        expect(typeof c.icon).toBe('string');
        expect(typeof c.label).toBe('string');
      }
    });
  });

  // ─────────────────────────────────────────────────
  // NaN Safety (cross-module boundary check)
  // ─────────────────────────────────────────────────

  describe('NaN safety across boundaries', () => {
    it('statistics handles NaN magnitude gracefully', () => {
      const quakes = [
        makeQuake({ magnitude: NaN }),
        makeQuake({ magnitude: 5.0, id: 'q2' }),
      ];
      const stats = Statistics.calculateStatistics(quakes);
      expect(Number.isNaN(stats.largestMagnitude)).toBe(false);
      expect(Number.isNaN(stats.averageDepth)).toBe(false);
    });

    it('mood handles NaN input gracefully', () => {
      const quakes = [makeQuake({ magnitude: NaN })];
      const mood = Mood.calculateMood(quakes);
      expect(Number.isNaN(mood.intensity)).toBe(false);
      expect(typeof mood.mood).toBe('string');
    });

    it('colors handle edge magnitudes', () => {
      expect(() => Colors.getDepthColor(-1)).not.toThrow();
      expect(() => Colors.getDepthColor(10000)).not.toThrow();
      expect(() => Colors.getMagnitudeSize(-1)).not.toThrow();
      expect(() => Colors.getMagnitudeSize(12)).not.toThrow();
    });

    it('distance handles same-point (zero distance)', () => {
      const dist = Formatting.formatDistanceToUser(37.77, -122.42, 37.77, -122.42);
      expect(typeof dist).toBe('string');
      // Should not be NaN or Infinity
      expect(dist).not.toContain('NaN');
      expect(dist).not.toContain('Infinity');
    });
  });

  // ─────────────────────────────────────────────────
  // Geo Module
  // ─────────────────────────────────────────────────

  describe('geo module integration', () => {
    it('convertEarthquakeToGlobePoint preserves all USGS fields', () => {
      const feature = {
        type: 'Feature' as const,
        properties: {
          mag: 6.1, place: 'Test Location', time: 1700000000000,
          updated: 1700000001000, url: 'https://example.com', detail: '',
          felt: 150, cdi: 5.0, tsunami: 1, sig: 600,
          status: 'reviewed', net: 'us', code: 'test', ids: ',test,',
          sources: ',us,', types: ',origin,', magType: 'mw', type: 'earthquake',
          title: 'M6.1 Test',
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [-122.42, 37.77, 10.5] as [number, number, number],
        },
        id: 'ustest001',
      };
      const point = Geo.convertEarthquakeToGlobePoint(feature);
      expect(point.lat).toBe(37.77);
      expect(point.lng).toBe(-122.42);
      expect(point.depth).toBe(10.5);
      expect(point.magnitude).toBe(6.1);
      expect(point.place).toBe('Test Location');
      expect(point.tsunami).toBe(true);
      expect(point.sig).toBe(600);
      expect(point.id).toBe('ustest001');
    });

    it('haversine distance is accurate for known pairs', () => {
      // New York (40.7128, -74.0060) to London (51.5074, -0.1278) ≈ 5,570 km
      const dist = Geo.calculateDistance(40.7128, -74.006, 51.5074, -0.1278);
      expect(dist).toBeGreaterThan(5500);
      expect(dist).toBeLessThan(5650);
    });
  });

  // ─────────────────────────────────────────────────
  // Final Project Statistics
  // ─────────────────────────────────────────────────

  describe('final project invariants', () => {
    it('all utility modules are importable without error', () => {
      expect(Colors).toBeDefined();
      expect(Formatting).toBeDefined();
      expect(Geo).toBeDefined();
      expect(Statistics).toBeDefined();
      expect(Mood).toBeDefined();
      expect(Seismic).toBeDefined();
      expect(Audio).toBeDefined();
      expect(Constants).toBeDefined();
      expect(Energy).toBeDefined();
      expect(Historical).toBeDefined();
      expect(Clusters).toBeDefined();
      expect(Export).toBeDefined();
      expect(Api).toBeDefined();
    });

    it('all hook modules are importable without error', () => {
      expect(HookIndex.useEarthquakeData).toBeDefined();
      expect(HookIndex.useTour).toBeDefined();
      expect(HookIndex.useCinematic).toBeDefined();
      expect(HookIndex.useAudio).toBeDefined();
      expect(HookIndex.useKeyboardShortcuts).toBeDefined();
      expect(HookIndex.useUrlState).toBeDefined();
      expect(HookIndex.useAutoRefresh).toBeDefined();
      expect(HookIndex.useSearch).toBeDefined();
      expect(HookIndex.usePerformanceMonitor).toBeDefined();
    });
  });
});
