import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { GlobePoint, TectonicPlateCollection, FilterState, Statistics, MoodState } from '../types';
import { fetchEarthquakes, fetchTectonicPlates } from '../utils/api';
import { AUTO_REFRESH_MS, DEFAULT_TIME_RANGE, INITIAL_FLY_MIN_MAG } from '../utils/constants';
import { convertEarthquakeToGlobePoint } from '../utils/geo';
import { calculateStatistics, filterEarthquakesByTimeRange } from '../utils/statistics';
import { calculateMood, getLoadingPoem } from '../utils/mood';
import { getFreshnessLabel, getHumanImpact, formatDistanceToUser } from '../utils/formatting';
import { getEmotionalContext } from '../utils/mood';

export interface EarthquakeDataState {
  // Data
  filteredEarthquakes: GlobePoint[];
  tectonicPlates: TectonicPlateCollection | null;
  statistics: Statistics;
  mood: MoodState;

  // UI
  loading: boolean;
  error: string | null;
  lastUpdate: Date;
  loadingPoem: string;

  // Selected earthquake details
  selectedEarthquake: GlobePoint | null;
  selectedFreshness: ReturnType<typeof getFreshnessLabel>;
  selectedImpact: string;
  selectedEmotion: string | null;
  selectedDistance: string | null;

  // Filters
  filters: FilterState;

  // Actions
  setSelectedEarthquake: (eq: GlobePoint | null) => void;
  setFilters: (filters: FilterState) => void;
  setError: (error: string | null) => void;
  fetchData: () => Promise<void>;

  // First-load auto-fly target
  initialBiggest: GlobePoint | null;
}

export function useEarthquakeData(): EarthquakeDataState {
  const [earthquakes, setEarthquakes] = useState<GlobePoint[]>([]);
  const [tectonicPlates, setTectonicPlates] = useState<TectonicPlateCollection | null>(null);
  const [filteredEarthquakes, setFilteredEarthquakes] = useState<GlobePoint[]>([]);
  const [selectedEarthquake, setSelectedEarthquake] = useState<GlobePoint | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    totalEvents: 0, largestMagnitude: 0, largestQuake: 'None',
    mostActiveRegion: 'None', averageDepth: 0,
    totalFelt: 0, tsunamiWarnings: 0, significanceScore: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loadingPoem] = useState(() => getLoadingPoem());

  const [mood, setMood] = useState<MoodState>({
    mood: 'serene', intensity: 0, description: '', color: '#60a5fa', recentBiggest: 0,
  });

  const [filters, setFilters] = useState<FilterState>({
    minMagnitude: 0,
    timeRange: DEFAULT_TIME_RANGE,
    showHeatmap: false,
    showTectonicPlates: true,
  });

  // User geolocation for distance feature
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const hasRequestedGeo = useRef(false);
  const hasAutoFlown = useRef(false);
  const [initialBiggest, setInitialBiggest] = useState<GlobePoint | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [earthquakeData, tectonicData] = await Promise.all([
        fetchEarthquakes(500, filters.minMagnitude, filters.timeRange.hours),
        tectonicPlates ? Promise.resolve(tectonicPlates) : fetchTectonicPlates(),
      ]);
      const globePoints = earthquakeData.features.map(convertEarthquakeToGlobePoint);
      setEarthquakes(globePoints);
      if (!tectonicPlates) setTectonicPlates(tectonicData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [filters.minMagnitude, filters.timeRange.hours, tectonicPlates]);

  // Apply filters
  useEffect(() => {
    let filtered = earthquakes.filter(q => q.magnitude >= filters.minMagnitude);
    filtered = filterEarthquakesByTimeRange(filtered, filters.timeRange.hours);
    setFilteredEarthquakes(filtered);
    setStatistics(calculateStatistics(filtered));
    setMood(calculateMood(filtered));

    // Auto-fly to biggest quake on first load
    if (!hasAutoFlown.current && filtered.length > 0) {
      hasAutoFlown.current = true;
      const biggest = filtered.reduce((max, q) => q.magnitude > max.magnitude ? q : max, filtered[0]);
      if (biggest.magnitude >= INITIAL_FLY_MIN_MAG) {
        setInitialBiggest(biggest);
      }
    }
  }, [earthquakes, filters]);

  // Initial fetch
  useEffect(() => { fetchData(); }, []);

  // Geolocation (non-blocking)
  useEffect(() => {
    if (hasRequestedGeo.current) return;
    hasRequestedGeo.current = true;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000, maximumAge: 300000 },
      );
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchData, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Derived emotional data for selected earthquake
  const selectedFreshness = useMemo(
    () => selectedEarthquake ? getFreshnessLabel(selectedEarthquake.time) : null,
    [selectedEarthquake],
  );
  const selectedImpact = useMemo(
    () => selectedEarthquake ? getHumanImpact(selectedEarthquake) : '',
    [selectedEarthquake],
  );
  const selectedEmotion = useMemo(
    () => selectedEarthquake ? getEmotionalContext(selectedEarthquake) : null,
    [selectedEarthquake],
  );
  const selectedDistance = useMemo(
    () => selectedEarthquake && userLocation
      ? formatDistanceToUser(selectedEarthquake.lat, selectedEarthquake.lng, userLocation.lat, userLocation.lng)
      : null,
    [selectedEarthquake, userLocation],
  );

  return {
    filteredEarthquakes, tectonicPlates, statistics, mood,
    loading, error, lastUpdate, loadingPoem,
    selectedEarthquake, selectedFreshness, selectedImpact, selectedEmotion, selectedDistance,
    filters, initialBiggest,
    setSelectedEarthquake, setFilters, setError, fetchData,
  };
}
