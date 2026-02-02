/**
 * Performance monitoring hook — tracks FPS and auto-degrades features
 * when sustained low performance is detected.
 *
 * Auto-disables expensive features (seismic network, energy heatmap)
 * when FPS drops below LOW_FPS_THRESHOLD for DEGRADE_AFTER consecutive
 * samples. Auto-recovers when FPS sustains above RECOVER_FPS_THRESHOLD.
 */

import { useRef, useEffect, useCallback, useState } from 'react';

// ─── Constants ───

/** FPS below this triggers degradation countdown */
const LOW_FPS_THRESHOLD = 30;

/** FPS above this triggers recovery countdown */
const RECOVER_FPS_THRESHOLD = 45;

/** Consecutive low samples before auto-degrading */
const DEGRADE_AFTER = 5;

/** Consecutive high samples before auto-recovering */
const RECOVER_AFTER = 8;

/** Sampling interval (ms) */
const SAMPLE_INTERVAL = 1000;

export interface PerformanceState {
  /** Current measured FPS (0 until first sample) */
  fps: number;
  /** Whether performance warning is active */
  isLowPerf: boolean;
  /** Features auto-disabled by perf monitor */
  degradedFeatures: Set<string>;
}

export interface PerformanceActions {
  /** Callback to disable a feature by name */
  onDegrade: (features: string[]) => void;
  /** Callback to re-enable degraded features */
  onRecover: (features: string[]) => void;
}

export function usePerformanceMonitor(actions: PerformanceActions): PerformanceState {
  const [fps, setFps] = useState(0);
  const [isLowPerf, setIsLowPerf] = useState(false);
  const [degradedFeatures] = useState(() => new Set<string>());

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lowCountRef = useRef(0);
  const highCountRef = useRef(0);
  const isDegradedRef = useRef(false);

  // Stable refs for callbacks
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  // Frame counter (lightweight — just increments a number per rAF)
  const countFrame = useCallback(() => {
    frameCountRef.current++;
    rafRef.current = requestAnimationFrame(countFrame);
  }, []);

  useEffect(() => {
    // Start frame counting
    rafRef.current = requestAnimationFrame(countFrame);

    // Sample FPS at regular intervals
    intervalRef.current = setInterval(() => {
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      const currentFps = Math.round((frameCountRef.current / elapsed) * 1000);
      frameCountRef.current = 0;
      lastTimeRef.current = now;

      setFps(currentFps);

      if (currentFps < LOW_FPS_THRESHOLD && !isDegradedRef.current) {
        lowCountRef.current++;
        highCountRef.current = 0;
        if (lowCountRef.current >= DEGRADE_AFTER) {
          isDegradedRef.current = true;
          setIsLowPerf(true);
          degradedFeatures.add('seismicNetwork');
          degradedFeatures.add('energyHeatmap');
          actionsRef.current.onDegrade(['seismicNetwork', 'energyHeatmap']);
        }
      } else if (currentFps > RECOVER_FPS_THRESHOLD && isDegradedRef.current) {
        highCountRef.current++;
        lowCountRef.current = 0;
        if (highCountRef.current >= RECOVER_AFTER) {
          isDegradedRef.current = false;
          setIsLowPerf(false);
          const features = Array.from(degradedFeatures);
          degradedFeatures.clear();
          actionsRef.current.onRecover(features);
        }
      } else {
        // Reset streak if FPS is in the middle zone
        if (!isDegradedRef.current) lowCountRef.current = 0;
        if (isDegradedRef.current) highCountRef.current = 0;
      }
    }, SAMPLE_INTERVAL);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [countFrame, degradedFeatures]);

  return { fps, isLowPerf, degradedFeatures };
}
