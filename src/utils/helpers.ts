import { EarthquakeFeature, GlobePoint, Statistics, SeismicMood, MoodState } from '../types';
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
    size: getMagnitudeSize(magnitude),
    // Emotional / human-impact data
    felt: feature.properties.felt ?? undefined,
    cdi: feature.properties.cdi ?? undefined,
    tsunami: feature.properties.tsunami === 1,
    alert: feature.properties.alert ?? undefined,
    sig: feature.properties.sig ?? 0,
    url: feature.properties.url ?? ''
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
      averageDepth: 0,
      totalFelt: 0,
      tsunamiWarnings: 0,
      significanceScore: 0
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

  // Emotional stats
  const totalFelt = earthquakes.reduce((sum, q) => sum + (q.felt || 0), 0);
  const tsunamiWarnings = earthquakes.filter(q => q.tsunami).length;
  const significanceScore = earthquakes.reduce((sum, q) => sum + q.sig, 0);

  return {
    totalEvents: earthquakes.length,
    largestMagnitude: largestQuake.magnitude,
    largestQuake: largestQuake.place,
    mostActiveRegion: mostActiveRegion || 'Global',
    averageDepth: Math.round(averageDepth * 10) / 10,
    totalFelt,
    tsunamiWarnings,
    significanceScore
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

// ─── Emotional / Red Hat Systems ───

const MOOD_DESCRIPTIONS: Record<SeismicMood, string[]> = {
  serene: [
    'The Earth rests easy.',
    'Quiet beneath our feet.',
    'A peaceful day on our planet.',
    'The ground holds still.',
  ],
  quiet: [
    'Gentle murmurs deep below.',
    'Small tremors, nothing more.',
    'The planet shifts in its sleep.',
    'A few whispers in the crust.',
  ],
  stirring: [
    'Something is building.',
    'The plates are talking.',
    'More movement than usual.',
    'Earth stretches and groans.',
  ],
  restless: [
    'The Earth is restless today.',
    'Significant activity detected.',
    'The crust won\'t stay still.',
    'People felt the ground move.',
  ],
  volatile: [
    'A powerful event shook the planet.',
    'The Earth released enormous energy.',
    'Major seismic activity — stay alert.',
    'Strong forces at work beneath us.',
  ],
  fierce: [
    'A historic-level event.',
    'Immense forces have been unleashed.',
    'The planet shuddered.',
    'Extraordinary seismic energy released.',
  ]
};

const MOOD_COLORS: Record<SeismicMood, string> = {
  serene:   '#60a5fa',  // Calm blue
  quiet:    '#818cf8',  // Soft indigo
  stirring: '#a78bfa',  // Warm violet
  restless: '#f59e0b',  // Amber
  volatile: '#ef4444',  // Red
  fierce:   '#dc2626',  // Deep red
};

/**
 * Calculate the emotional "mood" of current seismic activity.
 * Uses magnitude distribution, felt reports, and recency to derive a gut feeling.
 */
export function calculateMood(earthquakes: GlobePoint[]): MoodState {
  if (earthquakes.length === 0) {
    return {
      mood: 'serene',
      intensity: 0,
      description: MOOD_DESCRIPTIONS.serene[0],
      color: MOOD_COLORS.serene,
      recentBiggest: 0
    };
  }

  // Weight recent quakes more heavily
  const now = Date.now();
  let weightedScore = 0;
  let recentBiggest = 0;
  const totalFelt = earthquakes.reduce((s, q) => s + (q.felt || 0), 0);

  for (const q of earthquakes) {
    const ageHours = (now - q.time) / (1000 * 60 * 60);
    const recencyWeight = Math.max(0.1, 1 - ageHours / 168); // Fade over a week
    // Exponential magnitude weighting — M7 is 1000x more than M4
    const magEnergy = Math.pow(10, q.magnitude * 0.5);
    weightedScore += magEnergy * recencyWeight;

    if (q.magnitude > recentBiggest && ageHours < 48) {
      recentBiggest = q.magnitude;
    }
  }

  // Felt reports add to emotional weight
  weightedScore += totalFelt * 0.5;

  // Map score to mood
  let mood: SeismicMood;
  let intensity: number;

  if (recentBiggest >= 7.5) {
    mood = 'fierce';
    intensity = Math.min(1, 0.85 + recentBiggest / 50);
  } else if (recentBiggest >= 6.0 || weightedScore > 50000) {
    mood = 'volatile';
    intensity = Math.min(1, 0.65 + weightedScore / 200000);
  } else if (recentBiggest >= 5.0 || weightedScore > 10000) {
    mood = 'restless';
    intensity = Math.min(1, 0.45 + weightedScore / 80000);
  } else if (weightedScore > 3000 || earthquakes.length > 100) {
    mood = 'stirring';
    intensity = Math.min(1, 0.3 + weightedScore / 30000);
  } else if (earthquakes.length > 10) {
    mood = 'quiet';
    intensity = Math.min(0.3, 0.1 + earthquakes.length / 200);
  } else {
    mood = 'serene';
    intensity = Math.max(0, 0.05);
  }

  // Pick a random description for variety
  const descriptions = MOOD_DESCRIPTIONS[mood];
  const desc = descriptions[Math.floor(hashCode(now.toString()) % descriptions.length)];

  return {
    mood,
    intensity,
    description: desc,
    color: MOOD_COLORS[mood],
    recentBiggest
  };
}

/** Simple deterministic hash for consistent description selection */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Get freshness label for a quake based on how recent it is.
 * Returns null if not notably fresh.
 */
export function getFreshnessLabel(time: number): { label: string; urgency: 'live' | 'recent' | 'fresh' } | null {
  const ageMinutes = (Date.now() - time) / (1000 * 60);
  if (ageMinutes < 10) return { label: 'JUST NOW', urgency: 'live' };
  if (ageMinutes < 60) return { label: `${Math.floor(ageMinutes)}m ago`, urgency: 'recent' };
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
      green: 'Low impact expected',
      yellow: 'Limited impact expected',
      orange: 'Significant impact likely',
      red: 'Severe impact expected'
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

/**
 * Get emotional intensity description for an earthquake detail view.
 * Uses multiple description variants and contextual details for emotional richness.
 */
export function getEmotionalContext(quake: GlobePoint): string | null {
  const ageHours = (Date.now() - quake.time) / (1000 * 60 * 60);
  const isRecent = ageHours < 6;
  const isVeryRecent = ageHours < 1;
  const isDeep = quake.depth > 300;
  const isShallow = quake.depth < 20;

  if (quake.magnitude >= 7.5) {
    const variants = [
      'An event of staggering power. The energy released could level cities and reshape landscapes. This is the planet reminding us who\'s in charge.',
      'Historic-class energy release. Somewhere on Earth, the ground opened and the world shook for minutes. Lives changed in seconds.',
      'The kind of earthquake that makes the news worldwide. Entire regions feel it. The ocean may have surged.',
    ];
    const base = variants[Math.floor(hashCode(quake.id) % variants.length)];
    if (quake.tsunami) return base + ' ⚠️ A tsunami warning was issued — waves may already be traveling.';
    return base;
  }
  if (quake.magnitude >= 6) {
    const variants = [
      'A major earthquake. Near the epicenter, buildings cracked. People ran outside. The shaking lasted long enough to feel eternal.',
      'Strong enough to cause serious structural damage. The ground moved in ways you could see — not just feel.',
      'At this magnitude, the earthquake has a sound. A deep, guttural roar from below. People don\'t forget it.',
    ];
    const base = variants[Math.floor(hashCode(quake.id) % variants.length)];
    if (isShallow) return base + ' Being shallow makes it worse — the energy hits the surface harder.';
    return base;
  }
  if (quake.magnitude >= 5) {
    if (isVeryRecent) return 'This just happened. Right now, people near the epicenter are checking on each other. Some are standing outside, hearts pounding.';
    if (isRecent) return 'Felt over a wide area. Buildings shook. Objects fell off shelves. For a few seconds, everyone stopped what they were doing.';
    return 'Strong enough to wake you from sleep. The kind of quake that makes you grab a doorframe and wonder "is this the big one?"';
  }
  if (quake.magnitude >= 4) {
    if (isShallow) return 'Shallow and noticeable — dishes rattled, dogs barked, and for a moment everyone looked at each other with the same question in their eyes.';
    if (isDeep) return 'A deep rumble from far below. You might feel a gentle, rolling motion — eerie because it comes from so far down.';
    return 'The kind of quake that pauses conversations. Hanging lights sway. A low rumble passes through the walls.';
  }
  if (quake.felt && quake.felt > 1000) {
    return `Over ${quake.felt.toLocaleString()} people reported feeling this one. That\'s a whole city pausing to wonder what just happened.`;
  }
  if (quake.felt && quake.felt > 100) {
    return `${quake.felt.toLocaleString()} people reported feeling this. Somewhere, strangers looked at each other and shared a moment of "did you feel that?"`;
  }
  if (quake.magnitude >= 3 && isVeryRecent) {
    return 'Small but recent — someone near the epicenter probably just felt a gentle shudder pass through their floor.';
  }
  return null;
}

/**
 * Get an evocative one-liner for the loading screen based on time of day.
 */
export function getLoadingPoem(): string {
  const hour = new Date().getUTCHours();
  const poems = [
    'Listening to the planet…',
    'Tuning into Earth\'s frequency…',
    'Feeling for tremors in the data…',
    'The ground beneath us is always moving…',
    'Somewhere right now, the Earth just shifted…',
  ];
  // Time-aware variants
  if (hour >= 0 && hour < 6) poems.push('While you sleep, the planet breathes…');
  if (hour >= 18 || hour < 4) poems.push('The Earth doesn\'t rest at night…');
  if (hour >= 6 && hour < 12) poems.push('A new day. The plates keep their own schedule…');
  return poems[Math.floor(Math.random() * poems.length)];
}

/**
 * Calculate distance in km between a point and the user's geolocation.
 * Returns a human-friendly string.
 */
export function formatDistanceToUser(
  quakeLat: number, quakeLng: number,
  userLat: number, userLng: number
): string {
  const km = calculateDistance(quakeLat, quakeLng, userLat, userLng);
  if (km < 50) return `${Math.round(km)} km from you — that\'s close`;
  if (km < 200) return `${Math.round(km)} km from you`;
  if (km < 1000) return `${Math.round(km)} km away`;
  return `${(km / 1000).toFixed(1)}k km away`;
}

/**
 * Create a rich multi-oscillator earthquake tone for the Web Audio API.
 * Returns a cleanup function.
 */
export function playRichQuakeTone(
  ctx: AudioContext,
  magnitude: number
): () => void {
  const now = ctx.currentTime;
  const duration = Math.min(3.5, 0.4 + magnitude * 0.35);
  const volume = Math.min(0.3, 0.03 + magnitude * 0.035);

  // Master gain with fade-out
  const master = ctx.createGain();
  master.gain.setValueAtTime(volume, now);
  master.gain.exponentialRampToValueAtTime(0.001, now + duration);
  master.connect(ctx.destination);

  const oscillators: OscillatorNode[] = [];

  // 1. Sub-bass rumble (very low)
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.frequency.value = Math.max(25, 60 - magnitude * 5);
  sub.type = 'sine';
  subGain.gain.setValueAtTime(0.6, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);
  sub.connect(subGain).connect(master);
  sub.start(now);
  sub.stop(now + duration);
  oscillators.push(sub);

  // 2. Fundamental tone
  const fund = ctx.createOscillator();
  const fundGain = ctx.createGain();
  fund.frequency.value = Math.max(35, 180 - magnitude * 20);
  fund.type = 'triangle';
  fundGain.gain.setValueAtTime(0.4, now);
  fundGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  fund.connect(fundGain).connect(master);
  fund.start(now);
  fund.stop(now + duration);
  oscillators.push(fund);

  // 3. Harmonic overtone for color (only for bigger quakes)
  if (magnitude >= 4) {
    const harm = ctx.createOscillator();
    const harmGain = ctx.createGain();
    harm.frequency.value = Math.max(70, 360 - magnitude * 30);
    harm.type = 'sawtooth';
    harmGain.gain.setValueAtTime(0.08, now);
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);
    harm.connect(harmGain).connect(master);
    harm.start(now);
    harm.stop(now + duration);
    oscillators.push(harm);
  }

  // 4. For major quakes (M6+), add a "crack" transient — short noise burst
  if (magnitude >= 6) {
    const bufferSize = ctx.sampleRate * 0.08;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noise.connect(noiseGain).connect(master);
    noise.start(now);
  }

  return () => {
    oscillators.forEach(o => { try { o.stop(); } catch { /* already stopped */ } });
  };
}

/**
 * Trigger haptic feedback via the Vibration API (mobile).
 * Pattern scales with magnitude.
 */
export function triggerHaptic(magnitude: number): void {
  if (!navigator.vibrate) return;
  if (magnitude >= 6) {
    navigator.vibrate([100, 50, 200, 50, 300]);
  } else if (magnitude >= 4) {
    navigator.vibrate([50, 30, 100]);
  } else if (magnitude >= 2) {
    navigator.vibrate(40);
  }
}