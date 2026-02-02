import { describe, it, expect } from 'vitest';
import type {
  EarthquakeFeature,
  EarthquakeCollection,
  TectonicPlate,
  TimeRange,
  FilterState,
  Statistics,
} from '../types';

describe('Type Definitions', () => {
  it('EarthquakeFeature has correct shape', () => {
    const feature: EarthquakeFeature = {
      type: 'Feature',
      properties: {
        mag: 5.0,
        place: 'Test',
        time: Date.now(),
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
        title: 'M5.0 - Test',
      },
      geometry: {
        type: 'Point',
        coordinates: [0, 0, 10],
      },
      id: 'test',
    };
    expect(feature.type).toBe('Feature');
    expect(feature.geometry.coordinates).toHaveLength(3);
  });

  it('EarthquakeCollection has correct shape', () => {
    const collection: EarthquakeCollection = {
      type: 'FeatureCollection',
      metadata: {
        generated: Date.now(),
        url: '',
        title: 'Test',
        status: 200,
        api: '1.0',
        count: 0,
      },
      features: [],
    };
    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(0);
  });

  it('TectonicPlate supports LineString', () => {
    const plate: TectonicPlate = {
      type: 'Feature',
      properties: { Name: 'Pacific' },
      geometry: {
        type: 'LineString',
        coordinates: [[0, 0], [1, 1]],
      },
    };
    expect(plate.geometry.type).toBe('LineString');
  });

  it('TectonicPlate supports MultiLineString', () => {
    const plate: TectonicPlate = {
      type: 'Feature',
      properties: { Name: 'Pacific' },
      geometry: {
        type: 'MultiLineString',
        coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]],
      },
    };
    expect(plate.geometry.type).toBe('MultiLineString');
  });

  it('TimeRange has label and hours', () => {
    const range: TimeRange = { label: 'Last Hour', hours: 1 };
    expect(range.label).toBeTruthy();
    expect(range.hours).toBeGreaterThan(0);
  });

  it('FilterState has all required fields', () => {
    const state: FilterState = {
      minMagnitude: 0,
      timeRange: { label: 'Last Day', hours: 24 },
      showHeatmap: false,
      showTectonicPlates: true,
    };
    expect(state).toHaveProperty('minMagnitude');
    expect(state).toHaveProperty('timeRange');
    expect(state).toHaveProperty('showHeatmap');
    expect(state).toHaveProperty('showTectonicPlates');
  });

  it('Statistics has all required fields', () => {
    const stats: Statistics = {
      totalEvents: 0,
      largestMagnitude: 0,
      largestQuake: 'None',
      mostActiveRegion: 'None',
      averageDepth: 0,
    };
    expect(stats).toHaveProperty('totalEvents');
    expect(stats).toHaveProperty('largestMagnitude');
    expect(stats).toHaveProperty('largestQuake');
    expect(stats).toHaveProperty('mostActiveRegion');
    expect(stats).toHaveProperty('averageDepth');
  });
});
