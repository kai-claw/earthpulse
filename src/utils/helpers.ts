import { EarthquakeFeature, GlobePoint, Statistics } from '../types';
import { format } from 'date-fns';

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
    size: getMagnitudeSize(magnitude)
  };
}

export function getDepthColor(depth: number): string {
  // Color by depth: shallow (red) -> intermediate (orange/yellow) -> deep (green/blue)
  if (depth < 35) return '#ff4444';      // Shallow - Red
  if (depth < 70) return '#ff8800';      // Intermediate - Orange  
  if (depth < 150) return '#ffdd00';     // Medium - Yellow
  if (depth < 300) return '#88ff00';     // Deep - Light Green
  if (depth < 500) return '#0088ff';     // Very Deep - Blue
  return '#0044ff';                      // Extremely Deep - Dark Blue
}

export function getMagnitudeSize(magnitude: number): number {
  // Scale size from 0.1 to 2.0 based on magnitude
  return Math.max(0.1, Math.min(2.0, magnitude * 0.3));
}

export function getMagnitudeColor(magnitude: number): string {
  // Color by magnitude: low (green) -> high (red)
  if (magnitude < 2) return '#00ff00';   // Green
  if (magnitude < 3) return '#88ff00';   // Light Green
  if (magnitude < 4) return '#ffff00';   // Yellow
  if (magnitude < 5) return '#ff8800';   // Orange
  if (magnitude < 6) return '#ff4400';   // Red-Orange
  if (magnitude < 7) return '#ff0000';   // Red
  return '#cc0000';                      // Dark Red
}

export function calculateDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

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

export function calculateStatistics(earthquakes: GlobePoint[]): Statistics {
  if (earthquakes.length === 0) {
    return {
      totalEvents: 0,
      largestMagnitude: 0,
      largestQuake: 'None',
      mostActiveRegion: 'None',
      averageDepth: 0
    };
  }

  const largestQuake = earthquakes.reduce((max, quake) => 
    quake.magnitude > max.magnitude ? quake : max
  );

  const totalDepth = earthquakes.reduce((sum, quake) => sum + quake.depth, 0);
  const averageDepth = totalDepth / earthquakes.length;

  // Find most active region by grouping nearby earthquakes
  const regionCounts = new Map<string, number>();
  earthquakes.forEach(quake => {
    const region = extractRegion(quake.place);
    regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
  });

  const mostActiveRegion = Array.from(regionCounts.entries())
    .reduce((max, [region, count]) => 
      count > max[1] ? [region, count] : max, ['', 0])[0];

  return {
    totalEvents: earthquakes.length,
    largestMagnitude: largestQuake.magnitude,
    largestQuake: largestQuake.place,
    mostActiveRegion: mostActiveRegion || 'Global',
    averageDepth: Math.round(averageDepth * 10) / 10
  };
}

function extractRegion(place: string): string {
  // Extract region from place string (e.g., "10km NE of Los Angeles" -> "Los Angeles")
  const parts = place.split(' of ');
  if (parts.length > 1) {
    return parts[parts.length - 1].split(',')[0];
  }
  return place.split(',')[0];
}

export function filterEarthquakesByTimeRange(
  earthquakes: GlobePoint[], 
  hoursBack: number
): GlobePoint[] {
  const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
  return earthquakes.filter(quake => quake.time >= cutoffTime);
}

export function sortEarthquakesByTime(earthquakes: GlobePoint[]): GlobePoint[] {
  return [...earthquakes].sort((a, b) => a.time - b.time);
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
  if (depth < 35) return 'Shallow';
  if (depth < 70) return 'Intermediate';
  if (depth < 300) return 'Deep';
  return 'Very Deep';
}

/**
 * Generate seismic ring data from earthquake points.
 * Bigger quakes get bigger, slower rings. Recent quakes get faster repeat.
 */
export function generateSeismicRings(earthquakes: GlobePoint[]): {
  lat: number;
  lng: number;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
  color: (t: number) => string;
}[] {
  // Show rings for significant quakes (M3+) to avoid visual clutter
  const significant = earthquakes
    .filter(q => q.magnitude >= 3.0)
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 30); // Cap at 30 rings for performance

  return significant.map(q => {
    const mag = q.magnitude;
    // Bigger quakes = bigger rings, slower propagation (feels more massive)
    const maxR = Math.min(8, mag * 0.8);
    const speed = Math.max(1, 6 - mag * 0.5);
    // Recent quakes repeat faster (they're still "active")
    const ageHours = (Date.now() - q.time) / (1000 * 60 * 60);
    const repeat = Math.max(600, Math.min(3000, ageHours * 200 + 400));

    // Color based on magnitude with alpha fade
    const baseColor = mag >= 6 ? '255,50,50' : mag >= 4.5 ? '255,165,0' : '100,200,255';

    return {
      lat: q.lat,
      lng: q.lng,
      maxR,
      propagationSpeed: speed,
      repeatPeriod: repeat,
      color: (t: number) => `rgba(${baseColor},${1 - t})`
    };
  });
}

/**
 * Get the top N earthquakes sorted by magnitude for cinematic tour.
 */
export function getTourStops(earthquakes: GlobePoint[], count = 8): GlobePoint[] {
  return [...earthquakes]
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, count);
}