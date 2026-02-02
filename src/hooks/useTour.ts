import { useState, useCallback, useEffect, useRef } from 'react';
import type { GlobePoint } from '../types';
import { TOUR_DWELL_MS, TOUR_STOP_COUNT, PROGRESS_TICK_MS } from '../utils/constants';
import { getTourStops } from '../utils/seismic';

export interface TourState {
  isTourActive: boolean;
  tourStops: GlobePoint[];
  tourIndex: number;
  tourProgress: number;
  handleTourStart: () => void;
  handleTourStop: () => void;
  tourFlyTarget: GlobePoint | null;
}

export function useTour(
  filteredEarthquakes: GlobePoint[],
  setSelectedEarthquake: (eq: GlobePoint | null) => void,
): TourState {
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStops, setTourStops] = useState<GlobePoint[]>([]);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourProgress, setTourProgress] = useState(0);
  const [tourFlyTarget, setTourFlyTarget] = useState<GlobePoint | null>(null);
  const tourTimerRef = useRef<number | null>(null);
  const tourProgressRef = useRef<number | null>(null);

  const advanceTour = useCallback(() => {
    setTourIndex(prev => {
      const next = prev + 1;
      if (next >= tourStops.length) {
        setIsTourActive(false);
        setTourProgress(0);
        return 0;
      }
      setTourProgress(0);
      setTourFlyTarget(tourStops[next]);
      return next;
    });
  }, [tourStops]);

  // Tour dwell timer and progress bar
  useEffect(() => {
    if (!isTourActive || tourStops.length === 0) {
      if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
      if (tourProgressRef.current) clearInterval(tourProgressRef.current);
      return;
    }

    const startTime = Date.now();
    tourProgressRef.current = window.setInterval(() => {
      setTourProgress(Math.min(1, (Date.now() - startTime) / TOUR_DWELL_MS));
    }, PROGRESS_TICK_MS);

    tourTimerRef.current = window.setTimeout(() => {
      if (tourProgressRef.current) clearInterval(tourProgressRef.current);
      advanceTour();
    }, TOUR_DWELL_MS);

    return () => {
      if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
      if (tourProgressRef.current) clearInterval(tourProgressRef.current);
    };
  }, [isTourActive, tourIndex, tourStops, advanceTour]);

  const handleTourStart = useCallback(() => {
    const stops = getTourStops(filteredEarthquakes, TOUR_STOP_COUNT);
    if (stops.length === 0) return;
    setTourStops(stops);
    setTourIndex(0);
    setTourProgress(0);
    setIsTourActive(true);
    setTourFlyTarget(stops[0]);
    setSelectedEarthquake(stops[0]);
  }, [filteredEarthquakes, setSelectedEarthquake]);

  const handleTourStop = useCallback(() => {
    setIsTourActive(false);
    setTourProgress(0);
    setTourFlyTarget(null);
  }, []);

  return {
    isTourActive, tourStops, tourIndex, tourProgress,
    handleTourStart, handleTourStop, tourFlyTarget,
  };
}
