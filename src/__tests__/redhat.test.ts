/**
 * Red Hat — Feel & Intuition tests
 * Tests for emotional systems, audio engine, haptics, loading screen, and distance features.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEmotionalContext,
  getLoadingPoem,
  formatDistanceToUser,
  playRichQuakeTone,
  triggerHaptic,
  calculateMood,
  getFreshnessLabel,
  getHumanImpact,
} from '../utils/helpers';
import type { GlobePoint } from '../types';

// Helper to make a GlobePoint with sensible defaults
function makeQuake(overrides: Partial<GlobePoint> = {}): GlobePoint {
  return {
    lat: 35.0,
    lng: -120.0,
    magnitude: 4.5,
    depth: 10,
    place: '10km NE of Somewhere',
    time: Date.now() - 3600000, // 1 hour ago
    id: 'test-quake-' + Math.random().toString(36).slice(2),
    color: '#ff4444',
    size: 1.35,
    felt: undefined,
    cdi: undefined,
    tsunami: false,
    alert: undefined,
    sig: 100,
    url: 'https://earthquake.usgs.gov/earthquakes/eventpage/test',
    ...overrides,
  };
}

describe('Red Hat — Emotional Context', () => {
  it('returns evocative context for M7.5+ quakes', () => {
    const quake = makeQuake({ magnitude: 7.8, id: 'big1' });
    const ctx = getEmotionalContext(quake);
    expect(ctx).toBeTruthy();
    expect(ctx!.length).toBeGreaterThan(50);
  });

  it('mentions tsunami for M7.5+ with tsunami flag', () => {
    const quake = makeQuake({ magnitude: 8.0, tsunami: true, id: 'tsunami1' });
    const ctx = getEmotionalContext(quake);
    expect(ctx).toContain('tsunami');
  });

  it('returns context for M6+ quakes', () => {
    const quake = makeQuake({ magnitude: 6.5, id: 'mid1' });
    const ctx = getEmotionalContext(quake);
    expect(ctx).toBeTruthy();
    expect(ctx!.length).toBeGreaterThan(30);
  });

  it('mentions shallow depth for M6+ shallow quakes', () => {
    const quake = makeQuake({ magnitude: 6.2, depth: 8, id: 'shallow6' });
    const ctx = getEmotionalContext(quake);
    expect(ctx).toContain('shallow');
  });

  it('has specific messaging for very recent M5+ quakes', () => {
    const quake = makeQuake({ magnitude: 5.5, time: Date.now() - 30 * 60 * 1000, id: 'recent5' }); // 30 min ago
    const ctx = getEmotionalContext(quake);
    expect(ctx).toBeTruthy();
    // Very recent within 1 hour — should mention "just happened" or similar
    expect(ctx!.length).toBeGreaterThan(20);
  });

  it('returns context for M4 shallow quakes', () => {
    const quake = makeQuake({ magnitude: 4.2, depth: 5, id: 'shallow4' });
    const ctx = getEmotionalContext(quake);
    expect(ctx).toBeTruthy();
  });

  it('returns context for M4 deep quakes', () => {
    const quake = makeQuake({ magnitude: 4.3, depth: 400, id: 'deep4' });
    const ctx = getEmotionalContext(quake);
    expect(ctx).toContain('deep');
  });

  it('returns context for highly-felt smaller quakes', () => {
    const quake = makeQuake({ magnitude: 3.2, felt: 1500, id: 'felt1' });
    const ctx = getEmotionalContext(quake);
    expect(ctx).toBeTruthy();
    expect(ctx!).toContain('1,500');
  });

  it('returns context for moderately-felt quakes', () => {
    const quake = makeQuake({ magnitude: 3.0, felt: 200, id: 'felt2' });
    const ctx = getEmotionalContext(quake);
    expect(ctx).toBeTruthy();
    expect(ctx!).toContain('200');
  });

  it('returns context for very recent M3 quakes', () => {
    const quake = makeQuake({ magnitude: 3.5, time: Date.now() - 5 * 60 * 1000, id: 'recent3' }); // 5 min ago
    const ctx = getEmotionalContext(quake);
    expect(ctx).toBeTruthy();
  });

  it('returns null for small non-notable quakes', () => {
    const quake = makeQuake({ magnitude: 2.0, felt: 0, time: Date.now() - 48 * 3600000, id: 'tiny1' });
    const ctx = getEmotionalContext(quake);
    expect(ctx).toBeNull();
  });

  it('uses deterministic variant selection per quake ID', () => {
    const quake1 = makeQuake({ magnitude: 7.5, id: 'stable-id-abc' });
    const quake2 = makeQuake({ magnitude: 7.5, id: 'stable-id-abc' });
    expect(getEmotionalContext(quake1)).toEqual(getEmotionalContext(quake2));
  });
});

describe('Red Hat — Loading Poem', () => {
  it('returns a non-empty string', () => {
    const poem = getLoadingPoem();
    expect(typeof poem).toBe('string');
    expect(poem.length).toBeGreaterThan(10);
  });

  it('returns different poems across multiple calls (probabilistic)', () => {
    const poems = new Set<string>();
    for (let i = 0; i < 50; i++) {
      poems.add(getLoadingPoem());
    }
    // With 5+ variants, we should see at least 2 different ones in 50 tries
    expect(poems.size).toBeGreaterThanOrEqual(2);
  });
});

describe('Red Hat — Distance to User', () => {
  it('formats close distances with "close" warning', () => {
    const result = formatDistanceToUser(40.0, -74.0, 40.01, -74.01);
    expect(result).toContain('km');
    expect(result).toContain('close');
  });

  it('formats medium distances in km', () => {
    const result = formatDistanceToUser(35.0, -118.0, 34.0, -118.0);
    expect(result).toContain('km');
    expect(result).not.toContain('k km');
  });

  it('formats large distances with k suffix', () => {
    const result = formatDistanceToUser(35.0, -118.0, -33.0, 151.0); // LA to Sydney
    expect(result).toContain('k km');
  });

  it('handles same location', () => {
    const result = formatDistanceToUser(40.0, -74.0, 40.0, -74.0);
    expect(result).toContain('0 km');
    expect(result).toContain('close');
  });
});

describe('Red Hat — Rich Audio Engine', () => {
  it('playRichQuakeTone creates oscillators and returns cleanup', () => {
    // Mock Web Audio API
    const mockOsc = {
      frequency: { value: 0 },
      type: 'sine',
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn().mockReturnThis(),
    };
    const mockBuffer = { getChannelData: vi.fn().mockReturnValue(new Float32Array(100)) };
    const mockBufferSource = {
      buffer: null,
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
    };

    const ctx = {
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createOscillator: vi.fn().mockReturnValue(mockOsc),
      createGain: vi.fn().mockReturnValue(mockGain),
      createBuffer: vi.fn().mockReturnValue(mockBuffer),
      createBufferSource: vi.fn().mockReturnValue(mockBufferSource),
    } as unknown as AudioContext;

    // M3 quake — should create 2 oscillators (sub + fundamental, no harmonic)
    const cleanup = playRichQuakeTone(ctx, 3.0);
    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
    expect(typeof cleanup).toBe('function');
  });

  it('creates harmonic overtone for M4+ quakes', () => {
    const mockOsc = {
      frequency: { value: 0 },
      type: 'sine',
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const mockGain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
    };

    const ctx = {
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createOscillator: vi.fn().mockReturnValue(mockOsc),
      createGain: vi.fn().mockReturnValue(mockGain),
      createBuffer: vi.fn().mockReturnValue({ getChannelData: vi.fn().mockReturnValue(new Float32Array(100)) }),
      createBufferSource: vi.fn().mockReturnValue({ buffer: null, connect: vi.fn().mockReturnThis(), start: vi.fn() }),
    } as unknown as AudioContext;

    playRichQuakeTone(ctx, 5.0);
    // Sub + fundamental + harmonic = 3
    expect(ctx.createOscillator).toHaveBeenCalledTimes(3);
  });

  it('creates noise burst for M6+ quakes', () => {
    const mockOsc = {
      frequency: { value: 0 },
      type: 'sine',
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const mockGain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
    };
    const mockBuffer = { getChannelData: vi.fn().mockReturnValue(new Float32Array(4000)) };
    const mockBufferSource = {
      buffer: null,
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
    };

    const ctx = {
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createOscillator: vi.fn().mockReturnValue(mockOsc),
      createGain: vi.fn().mockReturnValue(mockGain),
      createBuffer: vi.fn().mockReturnValue(mockBuffer),
      createBufferSource: vi.fn().mockReturnValue(mockBufferSource),
    } as unknown as AudioContext;

    playRichQuakeTone(ctx, 6.5);
    // Should create a noise buffer for the crack
    expect(ctx.createBuffer).toHaveBeenCalled();
    expect(ctx.createBufferSource).toHaveBeenCalled();
  });
});

describe('Red Hat — Haptic Feedback', () => {
  beforeEach(() => {
    // Reset vibrate mock
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  it('triggers heavy haptic for M6+ quakes', () => {
    triggerHaptic(6.5);
    expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 200, 50, 300]);
  });

  it('triggers medium haptic for M4-6 quakes', () => {
    triggerHaptic(4.5);
    expect(navigator.vibrate).toHaveBeenCalledWith([50, 30, 100]);
  });

  it('triggers light haptic for M2-4 quakes', () => {
    triggerHaptic(3.0);
    expect(navigator.vibrate).toHaveBeenCalledWith(40);
  });

  it('does not trigger for M<2 quakes', () => {
    triggerHaptic(1.5);
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });
});

describe('Red Hat — Enhanced Mood System', () => {
  it('calculates fierce mood for historic quakes', () => {
    const quakes = [makeQuake({ magnitude: 8.0, time: Date.now() - 3600000 })];
    const mood = calculateMood(quakes);
    expect(mood.mood).toBe('fierce');
    expect(mood.intensity).toBeGreaterThan(0.8);
    expect(mood.color).toBe('#dc2626');
  });

  it('calculates volatile mood for M6+ recent quakes', () => {
    const quakes = [makeQuake({ magnitude: 6.5, time: Date.now() - 7200000 })];
    const mood = calculateMood(quakes);
    expect(mood.mood).toBe('volatile');
  });

  it('calculates serene mood for empty data', () => {
    const mood = calculateMood([]);
    expect(mood.mood).toBe('serene');
    expect(mood.intensity).toBe(0);
  });

  it('calculates quiet mood for few small quakes', () => {
    const quakes = Array.from({ length: 5 }, (_, i) =>
      makeQuake({ magnitude: 1.5, id: `small-${i}` })
    );
    const mood = calculateMood(quakes);
    // With few, small quakes should be serene or quiet
    expect(['serene', 'quiet']).toContain(mood.mood);
  });
});

describe('Red Hat — Freshness Labels', () => {
  it('returns JUST NOW for quakes < 10 min old', () => {
    const result = getFreshnessLabel(Date.now() - 5 * 60 * 1000);
    expect(result).not.toBeNull();
    expect(result!.label).toBe('JUST NOW');
    expect(result!.urgency).toBe('live');
  });

  it('returns minutes for quakes 10-60 min old', () => {
    const result = getFreshnessLabel(Date.now() - 30 * 60 * 1000);
    expect(result).not.toBeNull();
    expect(result!.label).toContain('m ago');
    expect(result!.urgency).toBe('recent');
  });

  it('returns hours for quakes 1-3 hours old', () => {
    const result = getFreshnessLabel(Date.now() - 2 * 3600 * 1000);
    expect(result).not.toBeNull();
    expect(result!.urgency).toBe('fresh');
  });

  it('returns null for old quakes', () => {
    const result = getFreshnessLabel(Date.now() - 24 * 3600 * 1000);
    expect(result).toBeNull();
  });
});

describe('Red Hat — Human Impact', () => {
  it('formats felt reports', () => {
    const quake = makeQuake({ felt: 500 });
    const impact = getHumanImpact(quake);
    expect(impact).toContain('500');
    expect(impact).toContain('people');
  });

  it('uses k format for large felt counts', () => {
    const quake = makeQuake({ felt: 5000 });
    const impact = getHumanImpact(quake);
    expect(impact).toContain('5.0k');
  });

  it('includes tsunami warning', () => {
    const quake = makeQuake({ tsunami: true });
    const impact = getHumanImpact(quake);
    expect(impact).toContain('Tsunami');
  });

  it('includes PAGER alert description', () => {
    const quake = makeQuake({ alert: 'red' });
    const impact = getHumanImpact(quake);
    expect(impact).toContain('Severe');
  });

  it('includes CDI shaking description', () => {
    const quake = makeQuake({ cdi: 7 });
    const impact = getHumanImpact(quake);
    expect(impact).toContain('Strong shaking');
  });

  it('returns empty string for no-impact quakes', () => {
    const quake = makeQuake({ felt: undefined, tsunami: false, alert: undefined, cdi: undefined });
    const impact = getHumanImpact(quake);
    expect(impact).toBe('');
  });
});
