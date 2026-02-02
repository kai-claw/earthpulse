/**
 * Seismic mood system — emotional interpretation of earthquake activity.
 */

import type { GlobePoint, SeismicMood, MoodState } from '../types';
import {
  MOOD_DESCRIPTIONS,
  MOOD_COLORS,
  MOOD_THRESHOLDS,
  LOADING_POEMS,
  LOADING_POEMS_NIGHT,
  LOADING_POEMS_MORNING,
} from './constants';

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
 * Calculate the emotional "mood" of current seismic activity.
 * Uses magnitude distribution, felt reports, and recency.
 */
export function calculateMood(earthquakes: GlobePoint[]): MoodState {
  if (earthquakes.length === 0) {
    return {
      mood: 'serene',
      intensity: 0,
      description: MOOD_DESCRIPTIONS.serene[0],
      color: MOOD_COLORS.serene,
      recentBiggest: 0,
    };
  }

  const now = Date.now();
  let weightedScore = 0;
  let recentBiggest = 0;
  const totalFelt = earthquakes.reduce((s, q) => s + (q.felt || 0), 0);

  for (const q of earthquakes) {
    const mag = Number.isFinite(q.magnitude) ? q.magnitude : 0;
    const time = Number.isFinite(q.time) ? q.time : now;
    const ageHours = (now - time) / (1000 * 60 * 60);
    const recencyWeight = Math.max(0.1, 1 - ageHours / 168); // Fade over a week
    const magEnergy = Math.pow(10, mag * 0.5);
    weightedScore += magEnergy * recencyWeight;

    if (mag > recentBiggest && ageHours < 48) {
      recentBiggest = mag;
    }
  }

  weightedScore += totalFelt * 0.5;

  let mood: SeismicMood;
  let intensity: number;

  if (recentBiggest >= MOOD_THRESHOLDS.fierce.minMag) {
    mood = 'fierce';
    intensity = Math.min(1, 0.85 + recentBiggest / 50);
  } else if (recentBiggest >= MOOD_THRESHOLDS.volatile.minMag || weightedScore > MOOD_THRESHOLDS.volatile.minScore) {
    mood = 'volatile';
    intensity = Math.min(1, 0.65 + weightedScore / 200_000);
  } else if (recentBiggest >= MOOD_THRESHOLDS.restless.minMag || weightedScore > MOOD_THRESHOLDS.restless.minScore) {
    mood = 'restless';
    intensity = Math.min(1, 0.45 + weightedScore / 80_000);
  } else if (weightedScore > MOOD_THRESHOLDS.stirring.minScore || earthquakes.length > MOOD_THRESHOLDS.stirring.minCount) {
    mood = 'stirring';
    intensity = Math.min(1, 0.3 + weightedScore / 30_000);
  } else if (earthquakes.length > MOOD_THRESHOLDS.quiet.minCount) {
    mood = 'quiet';
    intensity = Math.min(0.3, 0.1 + earthquakes.length / 200);
  } else {
    mood = 'serene';
    intensity = Math.max(0, 0.05);
  }

  const descriptions = MOOD_DESCRIPTIONS[mood];
  const desc = descriptions[Math.floor(hashCode(now.toString()) % descriptions.length)];

  return { mood, intensity, description: desc, color: MOOD_COLORS[mood], recentBiggest };
}

/**
 * Emotional intensity description for an earthquake detail view.
 * Uses multiple description variants for richness.
 */
export function getEmotionalContext(quake: GlobePoint): string | null {
  const ageHours = (Date.now() - quake.time) / (1000 * 60 * 60);
  const isRecent = ageHours < 6;
  const isVeryRecent = ageHours < 1;
  const isDeep = quake.depth > 300;
  const isShallow = quake.depth < 20;

  if (quake.magnitude >= 7.5) {
    const variants = [
      "An event of staggering power. The energy released could level cities and reshape landscapes. This is the planet reminding us who's in charge.",
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
      "At this magnitude, the earthquake has a sound. A deep, guttural roar from below. People don't forget it.",
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
    return `Over ${quake.felt.toLocaleString()} people reported feeling this one. That's a whole city pausing to wonder what just happened.`;
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
 * Get an evocative loading screen poem, with time-of-day awareness.
 */
export function getLoadingPoem(): string {
  const hour = new Date().getUTCHours();
  const poems = [...LOADING_POEMS];
  if (hour >= 0 && hour < 6)   poems.push(...LOADING_POEMS_NIGHT);
  if (hour >= 18 || hour < 4)  poems.push(...LOADING_POEMS_NIGHT);
  if (hour >= 6 && hour < 12)  poems.push(...LOADING_POEMS_MORNING);
  return poems[Math.floor(Math.random() * poems.length)];
}
