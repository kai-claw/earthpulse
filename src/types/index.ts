export interface EarthquakeFeature {
  type: 'Feature';
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    detail: string;
    felt?: number;
    cdi?: number;
    mmi?: number;
    alert?: string;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst?: number;
    dmin?: number;
    rms?: number;
    gap?: number;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
  id: string;
}

export interface EarthquakeCollection {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: EarthquakeFeature[];
}

export interface TectonicPlate {
  type: 'Feature';
  properties: {
    Name: string;
    PlateName?: string;
  };
  geometry: {
    type: 'LineString' | 'MultiLineString';
    coordinates: number[][] | number[][][];
  };
}

export interface TectonicPlateCollection {
  type: 'FeatureCollection';
  features: TectonicPlate[];
}

export interface GlobePoint {
  lat: number;
  lng: number;
  magnitude: number;
  depth: number;
  place: string;
  time: number;
  id: string;
  color: string;
  size: number;
  // Emotional / human-impact fields from USGS
  felt?: number;        // Number of people who reported feeling it
  cdi?: number;         // Community Decimal Intensity (1-12 scale)
  tsunami: boolean;     // Tsunami warning issued
  alert?: string;       // PAGER alert level (green/yellow/orange/red)
  sig: number;          // USGS significance score (0-1000+)
  url: string;          // USGS event page
}

/** Emotional mood of seismic activity */
export type SeismicMood = 'serene' | 'quiet' | 'stirring' | 'restless' | 'volatile' | 'fierce';

export interface MoodState {
  mood: SeismicMood;
  intensity: number;      // 0-1 normalized
  description: string;    // Poetic human-readable
  color: string;          // Mood accent color
  recentBiggest: number;  // Largest recent magnitude
}

export interface TimeRange {
  label: string;
  hours: number;
}

export interface FilterState {
  minMagnitude: number;
  timeRange: TimeRange;
  showHeatmap: boolean;
  showTectonicPlates: boolean;
}

export interface Statistics {
  totalEvents: number;
  largestMagnitude: number;
  largestQuake: string;
  mostActiveRegion: string;
  averageDepth: number;
  totalFelt: number;          // Total felt reports across all quakes
  tsunamiWarnings: number;    // Count of tsunami-flagged events
  significanceScore: number;  // Cumulative significance
}

export interface SeismicRing {
  lat: number;
  lng: number;
  maxRadius: number;
  propagationSpeed: number;
  repeatPeriod: number;
  color: string;
  magnitude: number;
}

export interface TourStop {
  earthquake: GlobePoint;
  index: number;
  total: number;
}