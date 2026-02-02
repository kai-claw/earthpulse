/**
 * Date, time, distance formatting, and descriptive label utilities.
 */

import { format } from 'date-fns';
import { GlobePoint } from '../types';
import { calculateDistance } from './geo';

export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));

  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

export function getMagnitudeDescription(magnitude: number): string {
  if (magnitude < 2.0) return 'Micro';
  if (magnitude < 3.0) return 'Minor';
  if (magnitude < 4.0) return 'Light';
  if (magnitude < 5.0) return 'Moderate';
  if (magnitude < 6.0) return 'Strong';
  if (magnitude < 7.0) return 'Major';
  if (magnitude < 8.0) return 'Great';
  return 'Historic';
}

export function getDepthDescription(depth: number): string {
  if (depth < 35)  return 'Shallow';
  if (depth < 70)  return 'Intermediate';
  if (depth < 300) return 'Deep';
  return 'Very Deep';
}

/**
 * Format distance between a quake and the user's geolocation.
 * Returns a human-friendly string with emotional distance context.
 */
export function formatDistanceToUser(
  quakeLat: number, quakeLng: number,
  userLat: number, userLng: number,
): string {
  const km = calculateDistance(quakeLat, quakeLng, userLat, userLng);
  if (km < 50)   return `${Math.round(km)} km from you — that's close`;
  if (km < 200)  return `${Math.round(km)} km from you`;
  if (km < 1000) return `${Math.round(km)} km away`;
  return `${(km / 1000).toFixed(1)}k km away`;
}

/**
 * Get freshness label for a quake based on recency.
 */
export function getFreshnessLabel(
  time: number,
): { label: string; urgency: 'live' | 'recent' | 'fresh' } | null {
  const ageMinutes = (Date.now() - time) / (1000 * 60);
  if (ageMinutes < 10)  return { label: 'JUST NOW',                          urgency: 'live' };
  if (ageMinutes < 60)  return { label: `${Math.floor(ageMinutes)}m ago`,    urgency: 'recent' };
  if (ageMinutes < 180) return { label: `${Math.floor(ageMinutes / 60)}h ago`, urgency: 'fresh' };
  return null;
}

/**
 * Get a human-impact description for an earthquake.
 */
export function getHumanImpact(quake: GlobePoint): string {
  const parts: string[] = [];

  if (quake.felt && quake.felt > 0) {
    const feltStr = quake.felt >= 1000
      ? `${(quake.felt / 1000).toFixed(1)}k`
      : quake.felt.toString();
    parts.push(`${feltStr} ${quake.felt === 1 ? 'person' : 'people'} felt this`);
  }

  if (quake.tsunami) {
    parts.push('⚠️ Tsunami warning');
  }

  if (quake.alert) {
    const alertLabels: Record<string, string> = {
      green:  'Low impact expected',
      yellow: 'Limited impact expected',
      orange: 'Significant impact likely',
      red:    'Severe impact expected',
    };
    parts.push(alertLabels[quake.alert] || `Alert: ${quake.alert}`);
  }

  if (quake.cdi && quake.cdi > 0) {
    const intensityDesc = quake.cdi >= 8 ? 'Severe shaking'
      : quake.cdi >= 6 ? 'Strong shaking'
      : quake.cdi >= 4 ? 'Light shaking'
      : 'Barely felt';
    parts.push(intensityDesc);
  }

  return parts.join(' · ');
}
