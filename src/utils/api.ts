import type { EarthquakeCollection, TectonicPlateCollection } from '../types';
import { USGS_BASE_URL, TECTONIC_PLATES_URL, DEFAULT_FETCH_LIMIT } from './constants';

/** Active AbortController for earthquake fetches — allows cancelling stale requests */
let activeEqController: AbortController | null = null;

/**
 * Validate that the API response has the expected GeoJSON structure.
 * Silently strips malformed features rather than rejecting the whole response.
 */
export function validateEarthquakeResponse(data: unknown): EarthquakeCollection {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid API response: not an object');
  }
  const obj = data as Record<string, unknown>;
  if (obj.type !== 'FeatureCollection' || !Array.isArray(obj.features)) {
    throw new Error('Invalid API response: missing FeatureCollection structure');
  }

  // Filter out malformed features instead of crashing
  const validFeatures = (obj.features as unknown[]).filter((f) => {
    if (!f || typeof f !== 'object') return false;
    const feat = f as Record<string, unknown>;
    if (!feat.properties || typeof feat.properties !== 'object') return false;
    if (!feat.geometry || typeof feat.geometry !== 'object') return false;
    const geom = feat.geometry as Record<string, unknown>;
    if (!Array.isArray(geom.coordinates) || geom.coordinates.length < 3) return false;
    // Ensure coordinates are finite numbers
    const [lng, lat, depth] = geom.coordinates as number[];
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || !Number.isFinite(depth)) return false;
    return true;
  });

  return {
    ...obj,
    type: 'FeatureCollection',
    features: validFeatures,
  } as EarthquakeCollection;
}

export async function fetchEarthquakes(
  limit = DEFAULT_FETCH_LIMIT,
  minMagnitude = 0,
  hoursBack = 24,
): Promise<EarthquakeCollection> {
  // Abort any in-flight earthquake request (prevents stale data races)
  if (activeEqController) {
    activeEqController.abort();
  }
  activeEqController = new AbortController();
  const { signal } = activeEqController;

  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - (hoursBack * 60 * 60 * 1000));

  const params = new URLSearchParams({
    format: 'geojson',
    limit: limit.toString(),
    minmagnitude: minMagnitude.toString(),
    starttime: startTime.toISOString(),
    endtime: endTime.toISOString(),
    orderby: 'time-asc',
  });

  try {
    const response = await fetch(`${USGS_BASE_URL}?${params}`, { signal });
    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`);
    }
    const raw = await response.json();
    return validateEarthquakeResponse(raw);
  } catch (error) {
    // Don't log or re-throw abort errors — they're intentional
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { type: 'FeatureCollection', features: [], metadata: {} } as unknown as EarthquakeCollection;
    }
    console.error('Failed to fetch earthquake data:', error);
    throw error;
  } finally {
    activeEqController = null;
  }
}

// Simplified fallback in case the live fetch fails
const FALLBACK_PLATES: TectonicPlateCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { Name: 'Pacific Plate' }, geometry: { type: 'LineString', coordinates: [[-180,45],[-170,50],[-160,55],[-150,60],[-140,65],[-130,60],[-120,55],[-110,50],[-100,45],[-90,40]] } },
    { type: 'Feature', properties: { Name: 'North American Plate' }, geometry: { type: 'LineString', coordinates: [[-130,55],[-120,50],[-110,45],[-100,40],[-90,45],[-80,50],[-70,55],[-60,50],[-50,45]] } },
    { type: 'Feature', properties: { Name: 'Eurasian Plate' }, geometry: { type: 'LineString', coordinates: [[-10,60],[0,65],[10,70],[20,65],[30,60],[40,55],[50,50],[60,45],[70,40],[80,35],[90,30],[100,25]] } },
    { type: 'Feature', properties: { Name: 'African Plate' }, geometry: { type: 'LineString', coordinates: [[-20,35],[-10,30],[0,25],[10,20],[20,15],[30,10],[40,5],[50,0],[40,-10],[30,-20],[20,-30],[10,-35]] } },
    { type: 'Feature', properties: { Name: 'South American Plate' }, geometry: { type: 'LineString', coordinates: [[-80,10],[-70,5],[-60,0],[-50,-5],[-40,-10],[-35,-20],[-40,-30],[-45,-40],[-50,-50],[-55,-55]] } },
    { type: 'Feature', properties: { Name: 'Indo-Australian Plate' }, geometry: { type: 'LineString', coordinates: [[90,10],[100,5],[110,0],[120,-5],[130,-10],[140,-15],[150,-20],[160,-25],[150,-35],[140,-40],[130,-45]] } },
    { type: 'Feature', properties: { Name: 'Antarctic Plate' }, geometry: { type: 'LineString', coordinates: [[-180,-60],[-120,-65],[-60,-70],[0,-65],[60,-60],[120,-65],[180,-60]] } },
  ],
};

export async function fetchTectonicPlates(): Promise<TectonicPlateCollection> {
  try {
    const response = await fetch(TECTONIC_PLATES_URL);
    if (!response.ok) throw new Error(`Plates fetch: ${response.status}`);
    const data = await response.json() as TectonicPlateCollection;
    // Flatten MultiLineString features into individual LineStrings
    const flattened: TectonicPlateCollection = {
      type: 'FeatureCollection',
      features: data.features.flatMap(f => {
        if (f.geometry.type === 'MultiLineString') {
          return (f.geometry.coordinates as number[][][]).map(coords => ({
            type: 'Feature' as const,
            properties: f.properties,
            geometry: { type: 'LineString' as const, coordinates: coords },
          }));
        }
        return [f];
      }),
    };
    return flattened;
  } catch {
    console.warn('Using fallback tectonic plate data');
    return FALLBACK_PLATES;
  }
}
