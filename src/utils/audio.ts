/**
 * Web Audio tone generation and haptic feedback for earthquake events.
 */

import {
  MAX_TONE_DURATION,
  BASE_TONE_DURATION,
  TONE_DURATION_PER_MAG,
  MAX_TONE_VOLUME,
  BASE_TONE_VOLUME,
  TONE_VOLUME_PER_MAG,
  HARMONIC_MIN_MAG,
  CRACK_MIN_MAG,
} from './constants';

/**
 * Create a rich multi-oscillator earthquake tone via the Web Audio API.
 * Returns a cleanup function to stop all oscillators early.
 */
export function playRichQuakeTone(
  ctx: AudioContext,
  magnitude: number,
): () => void {
  const now = ctx.currentTime;
  const duration = Math.min(MAX_TONE_DURATION, BASE_TONE_DURATION + magnitude * TONE_DURATION_PER_MAG);
  const volume = Math.min(MAX_TONE_VOLUME, BASE_TONE_VOLUME + magnitude * TONE_VOLUME_PER_MAG);

  // Master gain with fade-out
  const master = ctx.createGain();
  master.gain.setValueAtTime(volume, now);
  master.gain.exponentialRampToValueAtTime(0.001, now + duration);
  master.connect(ctx.destination);

  const oscillators: OscillatorNode[] = [];

  // 1. Sub-bass rumble
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

  // 3. Harmonic overtone (M4+)
  if (magnitude >= HARMONIC_MIN_MAG) {
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

  // 4. Crack transient noise burst (M6+)
  if (magnitude >= CRACK_MIN_MAG) {
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
