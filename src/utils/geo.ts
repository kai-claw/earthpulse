/**
 * Geographic calculations and earthquake data conversion.
 */

import type { EarthquakeFeature, GlobePoint } from '../types';
import { EARTH_RADIUS_KM } from './constants';
import { getDepthColor } from './colors';
import { getMagnitudeSize } from './colors';

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Haversine distance between two lat/lng points (km) */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** Convert a USGS EarthquakeFeature into a GlobePoint for rendering */
export function convertEarthquakeToGlobePoint(feature: EarthquakeFeature): GlobePoint {
  const [lng, lat, depth] = feature.geometry.coordinates;
  const magnitude = feature.properties.mag || 0;

  return {
    lat,
    lng,
    magnitude,
    depth: Math.abs(depth),
    place: feature.properties.place,
    time: feature.properties.time,
    id: feature.id,
    color: getDepthColor(Math.abs(depth)),
    size: getMagnitudeSize(magnitude),
    felt: feature.properties.felt ?? undefined,
    cdi: feature.properties.cdi ?? undefined,
    tsunami: feature.properties.tsunami === 1,
    alert: feature.properties.alert ?? undefined,
    sig: feature.properties.sig ?? 0,
    url: feature.properties.url ?? '',
  };
}
