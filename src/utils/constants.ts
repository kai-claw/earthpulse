/**
 * Centralized constants for EarthPulse.
 * All magic numbers, timing values, mood data, and configuration live here.
 */

import type { SeismicMood, TimeRange } from '../types';

// ─── Timing Constants ───

/** Auto-refresh interval for earthquake data (5 minutes) */
export const AUTO_REFRESH_MS = 5 * 60 * 1000;

/** Cinematic autoplay dwell time per earthquake (14 seconds) */
export const CINEMATIC_INTERVAL_MS = 14_000;

/** Cinematic tour stop count */
export const CINEMATIC_STOP_COUNT = 12;

/** Guided tour dwell time per stop (6 seconds) */
export const TOUR_DWELL_MS = 6_000;

/** Guided tour stop count */
export const TOUR_STOP_COUNT = 8;

/** Auto-fly delay after first data load (2 seconds) */
export const INITIAL_FLY_DELAY_MS = 2_000;

/** Minimum magnitude for initial auto-fly target */
export const INITIAL_FLY_MIN_MAG = 2.5;

/** Progress bar update interval (~30 fps) */
export const PROGRESS_TICK_MS = 33;

// ─── API Constants ───

export const USGS_BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

export const TECTONIC_PLATES_URL =
  'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';

/** Default USGS query limit */
export const DEFAULT_FETCH_LIMIT = 500;

// ─── Display Constants ───

/** Maximum seismic rings rendered (performance cap) */
export const MAX_SEISMIC_RINGS = 30;

/** Minimum magnitude for seismic ring display */
export const SEISMIC_RING_MIN_MAG = 3.0;

/** Earth's mean radius in km (for Haversine formula) */
export const EARTH_RADIUS_KM = 6371;

/** Magnitude size range [min, max] */
export const MAGNITUDE_SIZE_RANGE = [0.1, 2.0] as const;

/** Magnitude size multiplier */
export const MAGNITUDE_SIZE_SCALE = 0.3;

// ─── Default Filter State ───

export const DEFAULT_TIME_RANGE: TimeRange = { label: 'Last Week', hours: 168 };

export const TIME_RANGES: TimeRange[] = [
  { label: 'Last Hour', hours: 1 },
  { label: 'Last 6 Hours', hours: 6 },
  { label: 'Last Day', hours: 24 },
  { label: 'Last Week', hours: 168 },
  { label: 'Last Month', hours: 720 },
];

// ─── Mood System ───

export const MOOD_DESCRIPTIONS: Record<SeismicMood, readonly string[]> = {
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
    "The crust won't stay still.",
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
  ],
};

export const MOOD_COLORS: Record<SeismicMood, string> = {
  serene:   '#60a5fa',
  quiet:    '#818cf8',
  stirring: '#a78bfa',
  restless: '#f59e0b',
  volatile: '#ef4444',
  fierce:   '#dc2626',
};

/** All valid mood keys */
export const MOOD_KEYS: readonly SeismicMood[] = [
  'serene', 'quiet', 'stirring', 'restless', 'volatile', 'fierce',
] as const;

// ─── Mood Thresholds ───

export const MOOD_THRESHOLDS = {
  fierce:   { minMag: 7.5 },
  volatile: { minMag: 6.0, minScore: 50_000 },
  restless: { minMag: 5.0, minScore: 10_000 },
  stirring: { minScore: 3_000, minCount: 100 },
  quiet:    { minCount: 10 },
} as const;

// ─── Loading Poems ───

export const LOADING_POEMS = [
  'Listening to the planet…',
  "Tuning into Earth's frequency…",
  'Feeling for tremors in the data…',
  'The ground beneath us is always moving…',
  'Somewhere right now, the Earth just shifted…',
];

export const LOADING_POEMS_NIGHT = [
  'While you sleep, the planet breathes…',
  "The Earth doesn't rest at night…",
];

export const LOADING_POEMS_MORNING = [
  'A new day. The plates keep their own schedule…',
];

// ─── Audio Constants ───

/** Maximum audio tone duration (seconds) */
export const MAX_TONE_DURATION = 3.5;

/** Base tone duration (seconds) */
export const BASE_TONE_DURATION = 0.4;

/** Duration scale per magnitude unit */
export const TONE_DURATION_PER_MAG = 0.35;

/** Maximum master volume */
export const MAX_TONE_VOLUME = 0.3;

/** Base master volume */
export const BASE_TONE_VOLUME = 0.03;

/** Volume scale per magnitude unit */
export const TONE_VOLUME_PER_MAG = 0.035;

/** Minimum magnitude for harmonic overtone */
export const HARMONIC_MIN_MAG = 4;

/** Minimum magnitude for crack transient noise burst */
export const CRACK_MIN_MAG = 6;
