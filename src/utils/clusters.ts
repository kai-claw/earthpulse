/**
 * Earthquake clustering and connection arc generation.
 *
 * Detects spatially and temporally close earthquakes and produces
 * arcs that reveal cascading patterns along fault lines.
 */

import type { GlobePoint } from '../types';
import { EARTH_RADIUS_KM } from './constants';

// ─── Constants ───

/** Maximum distance (km) to connect two quakes */
export const ARC_MAX_DISTANCE_KM = 300;

/** Maximum time gap (hours) to connect two quakes */
export const ARC_MAX_TIME_GAP_H = 48;

/** Maximum arcs rendered (performance cap) */
export const MAX_ARCS = 120;

/** Minimum magnitude for arc participation */
export const ARC_MIN_MAG = 2.0;

/** Heatmap bandwidth (spread of each point, in degrees ~) */
export const HEATMAP_BANDWIDTH = 3.5;

/** Heatmap peak altitude above globe surface */
export const HEATMAP_TOP_ALT = 0.04;

/** Heatmap base altitude */
export const HEATMAP_BASE_ALT = 0.001;

// ─── Types ───

export interface SeismicArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string]; // gradient: [start, end]
  stroke: number;
  dashLength: number;
  dashGap: number;
  dashAnimateTime: number;
  altitude: number;
  label: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

// ─── Helpers ───

/**
 * Fast Haversine distance in km between two points.
 * Avoids trig where possible for the hot loop.
 */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLng = (lng2 - lng1) * toRad;
  const a =
    Math.sin(dLat * 0.5) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
    Math.sin(dLng * 0.5) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Map a magnitude to an arc color.
 * Low → cool blue, medium → amber, high → hot red.
 */
function arcColorForMag(mag: number, alpha: number): string {
  if (mag >= 6) return `rgba(239, 68, 68, ${alpha})`;   // red
  if (mag >= 5) return `rgba(245, 158, 11, ${alpha})`;  // amber
  if (mag >= 4) return `rgba(168, 85, 247, ${alpha})`;  // purple
  return `rgba(96, 165, 250, ${alpha})`;                 // blue
}

// ─── Public API ───

/**
 * Generate connection arcs between spatially/temporally close earthquakes.
 * Reveals cascading patterns along fault lines.
 */
export function generateSeismicArcs(earthquakes: GlobePoint[]): SeismicArc[] {
  // Filter to eligible quakes and sort by time (oldest first)
  const eligible = earthquakes
    .filter(q => q.magnitude >= ARC_MIN_MAG)
    .sort((a, b) => a.time - b.time);

  if (eligible.length < 2) return [];

  const arcs: SeismicArc[] = [];

  // For each pair, check if they're close enough in space + time
  // Use a sliding window approach: once time gap exceeds threshold, advance start
  for (let i = 0; i < eligible.length && arcs.length < MAX_ARCS; i++) {
    const a = eligible[i];
    for (let j = i + 1; j < eligible.length && arcs.length < MAX_ARCS; j++) {
      const b = eligible[j];

      // Time gap check (ms → hours)
      const timeGapH = (b.time - a.time) / (1000 * 60 * 60);
      if (timeGapH > ARC_MAX_TIME_GAP_H) break; // sorted by time, so all further are too far

      // Distance check
      const dist = haversineKm(a.lat, a.lng, b.lat, b.lng);
      if (dist > ARC_MAX_DISTANCE_KM) continue;

      // Compute visual properties
      const combinedMag = Math.max(a.magnitude, b.magnitude);
      const proximityFactor = 1 - dist / ARC_MAX_DISTANCE_KM; // 0→1, closer = stronger
      const alpha = 0.3 + proximityFactor * 0.5;
      const stroke = 0.3 + combinedMag * 0.15;
      const altitude = 0.02 + proximityFactor * 0.06;

      arcs.push({
        startLat: a.lat,
        startLng: a.lng,
        endLat: b.lat,
        endLng: b.lng,
        color: [
          arcColorForMag(a.magnitude, alpha),
          arcColorForMag(b.magnitude, alpha),
        ],
        stroke,
        dashLength: 0.4,
        dashGap: 0.2,
        dashAnimateTime: 2000 + Math.random() * 2000,
        altitude,
        label: `M${a.magnitude.toFixed(1)} → M${b.magnitude.toFixed(1)} · ${dist.toFixed(0)} km · ${timeGapH.toFixed(1)}h`,
      });
    }
  }

  return arcs;
}

/**
 * Generate heatmap points with energy-based weights.
 * Each earthquake contributes weight = 10^(1.5*mag) (seismic energy proxy).
 * Weights are log-normalized to [0, 1].
 */
export function generateHeatmapPoints(earthquakes: GlobePoint[]): HeatmapPoint[] {
  if (earthquakes.length === 0) return [];

  // Compute raw energy weights
  const raw = earthquakes.map(q => ({
    lat: q.lat,
    lng: q.lng,
    rawWeight: Math.pow(10, 1.5 * q.magnitude),
  }));

  // Log-normalize to [0, 1] range
  const logWeights = raw.map(r => Math.log10(r.rawWeight + 1));
  const maxLog = Math.max(...logWeights);
  const minLog = Math.min(...logWeights);
  const range = maxLog - minLog || 1;

  return raw.map((r, i) => ({
    lat: r.lat,
    lng: r.lng,
    weight: 0.1 + ((logWeights[i] - minLog) / range) * 0.9,
  }));
}
