import { useState, useCallback, useEffect, useRef } from 'react';
import type { GlobePoint } from '../types';
import { CINEMATIC_INTERVAL_MS, CINEMATIC_STOP_COUNT, PROGRESS_TICK_MS } from '../utils/constants';
import { getTourStops } from '../utils/seismic';

export interface CinematicState {
  isCinematic: boolean;
  cinematicProgress: number;
  handleCinematicToggle: () => void;
  cinematicFlyTarget: GlobePoint | null;
}

export function useCinematic(
  filteredEarthquakes: GlobePoint[],
  setSelectedEarthquake: (eq: GlobePoint | null) => void,
): CinematicState {
  const [isCinematic, setIsCinematic] = useState(false);
  const [cinematicProgress, setCinematicProgress] = useState(0);
  const [cinematicFlyTarget, setCinematicFlyTarget] = useState<GlobePoint | null>(null);
  const cinematicTimerRef = useRef<number | null>(null);
  const cinematicProgressRef = useRef<number | null>(null);
  const cinematicIndexRef = useRef(0);
  const [cinematicStopKey, setCinematicStopKey] = useState(0);

  const handleCinematicToggle = useCallback(() => {
    setIsCinematic(prev => {
      if (!prev) {
        const stops = getTourStops(filteredEarthquakes, CINEMATIC_STOP_COUNT);
        if (stops.length === 0) return false;
        cinematicIndexRef.current = 0;
        setCinematicFlyTarget(stops[0]);
        setSelectedEarthquake(stops[0]);
        setCinematicProgress(0);
        return true;
      } else {
        if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
        if (cinematicProgressRef.current) clearInterval(cinematicProgressRef.current);
        setCinematicProgress(0);
        setCinematicFlyTarget(null);
        return false;
      }
    });
  }, [filteredEarthquakes, setSelectedEarthquake]);

  // Cinematic autoplay timer
  useEffect(() => {
    if (!isCinematic) return;
    const stops = getTourStops(filteredEarthquakes, CINEMATIC_STOP_COUNT);
    if (stops.length === 0) { setIsCinematic(false); return; }

    const startTime = Date.now();
    cinematicProgressRef.current = window.setInterval(() => {
      setCinematicProgress(Math.min(1, (Date.now() - startTime) / CINEMATIC_INTERVAL_MS));
    }, PROGRESS_TICK_MS);

    cinematicTimerRef.current = window.setTimeout(() => {
      if (cinematicProgressRef.current) clearInterval(cinematicProgressRef.current);
      cinematicIndexRef.current = (cinematicIndexRef.current + 1) % stops.length;
      const next = stops[cinematicIndexRef.current];
      setCinematicFlyTarget(next);
      setSelectedEarthquake(next);
      setCinematicProgress(0);
      setCinematicStopKey(k => k + 1);
    }, CINEMATIC_INTERVAL_MS);

    return () => {
      if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
      if (cinematicProgressRef.current) clearInterval(cinematicProgressRef.current);
    };
  }, [isCinematic, filteredEarthquakes, cinematicStopKey, setSelectedEarthquake]);

  return { isCinematic, cinematicProgress, handleCinematicToggle, cinematicFlyTarget };
}
