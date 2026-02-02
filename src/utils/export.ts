/**
 * Data export utilities for EarthPulse.
 * CSV generation and download for earthquake data.
 */

import type { GlobePoint } from '../types';
import { getMagnitudeDescription, getDepthDescription } from './formatting';

/** CSV column definitions */
const CSV_COLUMNS = [
  'ID',
  'Magnitude',
  'Magnitude Class',
  'Latitude',
  'Longitude',
  'Depth (km)',
  'Depth Class',
  'Location',
  'Time (UTC)',
  'Timestamp',
  'Felt Reports',
  'Tsunami Warning',
  'PAGER Alert',
  'Significance',
  'USGS URL',
] as const;

/**
 * Escape a CSV field value — wraps in quotes if it contains comma, quote, or newline.
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert a single earthquake to a CSV row.
 */
function quakeToRow(q: GlobePoint): string {
  const fields = [
    q.id,
    Number.isFinite(q.magnitude) ? q.magnitude.toFixed(1) : '0.0',
    getMagnitudeDescription(Number.isFinite(q.magnitude) ? q.magnitude : 0),
    Number.isFinite(q.lat) ? q.lat.toFixed(4) : '0',
    Number.isFinite(q.lng) ? q.lng.toFixed(4) : '0',
    Number.isFinite(q.depth) ? q.depth.toFixed(1) : '0',
    getDepthDescription(Number.isFinite(q.depth) ? q.depth : 0),
    q.place || 'Unknown',
    Number.isFinite(q.time) ? new Date(q.time).toISOString() : '',
    Number.isFinite(q.time) ? String(q.time) : '',
    String(q.felt ?? 0),
    q.tsunami ? 'Yes' : 'No',
    q.alert || 'None',
    String(Number.isFinite(q.sig) ? q.sig : 0),
    q.url || '',
  ];
  return fields.map(escapeCSV).join(',');
}

/**
 * Generate a CSV string from earthquake data.
 */
export function earthquakesToCSV(earthquakes: GlobePoint[]): string {
  const header = CSV_COLUMNS.join(',');
  const rows = earthquakes.map(quakeToRow);
  return [header, ...rows].join('\n');
}

/**
 * Trigger a browser download of the CSV data.
 */
export function downloadCSV(earthquakes: GlobePoint[], filename?: string): void {
  const csv = earthquakesToCSV(earthquakes);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const fname = filename || `earthpulse-${dateStr}-${earthquakes.length}quakes.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fname;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Calculate enhanced activity rate statistics.
 */
export interface ActivityRate {
  /** Quakes per hour */
  perHour: number;
  /** Quakes per day (projected) */
  perDay: number;
  /** Activity level label */
  level: 'quiet' | 'normal' | 'active' | 'elevated' | 'intense';
  /** Activity trend arrow */
  trend: 'rising' | 'falling' | 'stable';
  /** Trend description */
  trendDescription: string;
}

/**
 * Calculate the activity rate and trend for the current dataset.
 */
export function calculateActivityRate(earthquakes: GlobePoint[]): ActivityRate {
  if (earthquakes.length === 0) {
    return {
      perHour: 0,
      perDay: 0,
      level: 'quiet',
      trend: 'stable',
      trendDescription: 'No data available',
    };
  }

  // Sort by time
  const sorted = [...earthquakes].sort((a, b) => a.time - b.time);
  const earliest = sorted[0].time;
  const latest = sorted[sorted.length - 1].time;
  const spanHours = Math.max(1, (latest - earliest) / (1000 * 60 * 60));

  const perHour = earthquakes.length / spanHours;
  const perDay = perHour * 24;

  // Activity level
  let level: ActivityRate['level'];
  if (perHour < 2) level = 'quiet';
  else if (perHour < 5) level = 'normal';
  else if (perHour < 15) level = 'active';
  else if (perHour < 30) level = 'elevated';
  else level = 'intense';

  // Trend: compare first half vs second half
  const midpoint = earliest + (latest - earliest) / 2;
  const firstHalf = sorted.filter(q => q.time < midpoint).length;
  const secondHalf = sorted.filter(q => q.time >= midpoint).length;

  let trend: ActivityRate['trend'];
  let trendDescription: string;
  const ratio = secondHalf / Math.max(1, firstHalf);

  if (ratio > 1.3) {
    trend = 'rising';
    trendDescription = 'Activity is increasing';
  } else if (ratio < 0.7) {
    trend = 'falling';
    trendDescription = 'Activity is decreasing';
  } else {
    trend = 'stable';
    trendDescription = 'Activity is steady';
  }

  return { perHour, perDay, level, trend, trendDescription };
}
