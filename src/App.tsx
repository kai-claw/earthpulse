import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Globe from './components/Globe';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import MoodIndicator from './components/MoodIndicator';
import { 
  TectonicPlateCollection, 
  GlobePoint, 
  FilterState, 
  Statistics,
  TimeRange,
  MoodState
} from './types';
import { 
  fetchEarthquakes, 
  fetchTectonicPlates 
} from './utils/api';
import { 
  convertEarthquakeToGlobePoint, 
  calculateStatistics,
  filterEarthquakesByTimeRange,
  getTourStops,
  calculateMood,
  getFreshnessLabel,
  getHumanImpact,
  getEmotionalContext,
  getLoadingPoem,
  formatDistanceToUser,
  playRichQuakeTone,
  triggerHaptic
} from './utils/helpers';
import './App.css';

const DEFAULT_TIME_RANGE: TimeRange = { label: 'Last Week', hours: 168 };
const TOUR_DWELL_MS = 6000; // Time spent at each stop
const CINEMATIC_INTERVAL = 14000; // Auto-cycle through big quakes

function App() {
  // State management
  const [earthquakes, setEarthquakes] = useState<GlobePoint[]>([]);
  const [tectonicPlates, setTectonicPlates] = useState<TectonicPlateCollection | null>(null);
  const [filteredEarthquakes, setFilteredEarthquakes] = useState<GlobePoint[]>([]);
  const [selectedEarthquake, setSelectedEarthquake] = useState<GlobePoint | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    totalEvents: 0,
    largestMagnitude: 0,
    largestQuake: 'None',
    mostActiveRegion: 'None',
    averageDepth: 0,
    totalFelt: 0,
    tsunamiWarnings: 0,
    significanceScore: 0
  });

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Animation and Time-lapse State
  const [isTimelapse, setIsTimelapse] = useState(false);
  const [timelapseProgress, setTimelapseProgress] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(0.5);

  // Seismic Rings
  const [showSeismicRings, setShowSeismicRings] = useState(true);

  // Fly-to state
  const [flyToTarget, setFlyToTarget] = useState<GlobePoint | null>(null);

  // Cinematic Tour state
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStops, setTourStops] = useState<GlobePoint[]>([]);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourProgress, setTourProgress] = useState(0);
  const tourTimerRef = useRef<number | null>(null);
  const tourProgressRef = useRef<number | null>(null);

  // Cinematic Autoplay state
  const [isCinematic, setIsCinematic] = useState(false);
  const cinematicTimerRef = useRef<number | null>(null);
  const cinematicProgressRef = useRef<number | null>(null);
  const [cinematicProgress, setCinematicProgress] = useState(0);
  const cinematicIndexRef = useRef(0);
  const [cinematicStopKey, setCinematicStopKey] = useState(0);

  // First-load auto-fly flag
  const hasAutoFlown = useRef(false);

  // Mood system
  const [mood, setMood] = useState<MoodState>({
    mood: 'serene', intensity: 0, description: '', color: '#60a5fa', recentBiggest: 0
  });

  // Audio toggle
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // User geolocation for "distance to you" feature
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const hasRequestedGeo = useRef(false);

  // Loading poem
  const [loadingPoem] = useState(() => getLoadingPoem());

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    minMagnitude: 0,
    timeRange: DEFAULT_TIME_RANGE,
    showHeatmap: false,
    showTectonicPlates: true
  });

  // Fetch earthquake data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [earthquakeData, tectonicData] = await Promise.all([
        fetchEarthquakes(500, filters.minMagnitude, filters.timeRange.hours),
        tectonicPlates ? Promise.resolve(tectonicPlates) : fetchTectonicPlates()
      ]);

      const globePoints = earthquakeData.features.map(convertEarthquakeToGlobePoint);
      setEarthquakes(globePoints);
      
      if (!tectonicPlates) {
        setTectonicPlates(tectonicData);
      }

      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [filters.minMagnitude, filters.timeRange.hours, tectonicPlates]);

  // Apply filters to earthquakes
  useEffect(() => {
    let filtered = earthquakes.filter(quake => quake.magnitude >= filters.minMagnitude);
    filtered = filterEarthquakesByTimeRange(filtered, filters.timeRange.hours);
    
    setFilteredEarthquakes(filtered);
    setStatistics(calculateStatistics(filtered));
    setMood(calculateMood(filtered));

    // Auto-fly to biggest quake on first data load for instant wow
    if (!hasAutoFlown.current && filtered.length > 0) {
      hasAutoFlown.current = true;
      const biggest = filtered.reduce((max, q) => q.magnitude > max.magnitude ? q : max, filtered[0]);
      if (biggest.magnitude >= 2.5) {
        // Small delay to let globe initialize first
        setTimeout(() => {
          setFlyToTarget(biggest);
          setSelectedEarthquake(biggest);
        }, 2000);
      }
    }
  }, [earthquakes, filters]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Request user geolocation (non-blocking, enhances "distance to you")
  useEffect(() => {
    if (hasRequestedGeo.current) return;
    hasRequestedGeo.current = true;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { /* Permission denied or unavailable — no problem */ },
        { timeout: 5000, maximumAge: 300000 }
      );
    }
  }, []);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Time-lapse animation
  useEffect(() => {
    if (!isTimelapse) return;

    const interval = setInterval(() => {
      setTimelapseProgress(prev => {
        const next = prev + 0.01;
        if (next >= 1) {
          setIsTimelapse(false);
          return 1;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isTimelapse]);

  // Cinematic Tour — advance to next stop
  const advanceTour = useCallback(() => {
    setTourIndex(prev => {
      const next = prev + 1;
      if (next >= tourStops.length) {
        // Tour complete
        setIsTourActive(false);
        setTourProgress(0);
        return 0;
      }
      setTourProgress(0);
      setFlyToTarget(tourStops[next]);
      return next;
    });
  }, [tourStops]);

  // Cinematic Tour — manage dwell timer and progress bar
  useEffect(() => {
    if (!isTourActive || tourStops.length === 0) {
      if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
      if (tourProgressRef.current) clearInterval(tourProgressRef.current);
      return;
    }

    // Progress bar update at 30fps
    const startTime = Date.now();
    tourProgressRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      setTourProgress(Math.min(1, elapsed / TOUR_DWELL_MS));
    }, 33);

    // Move to next stop after dwell
    tourTimerRef.current = window.setTimeout(() => {
      if (tourProgressRef.current) clearInterval(tourProgressRef.current);
      advanceTour();
    }, TOUR_DWELL_MS);

    return () => {
      if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
      if (tourProgressRef.current) clearInterval(tourProgressRef.current);
    };
  }, [isTourActive, tourIndex, tourStops, advanceTour]);

  // Audio feedback: play a rich multi-layered tone when clicking quakes
  const playQuakeTone = useCallback((magnitude: number) => {
    if (!audioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      playRichQuakeTone(audioCtxRef.current, magnitude);
    } catch {
      // Audio not available — fail silently
    }
  }, [audioEnabled]);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
  }, []);

  // Handle earthquake click — fly to it + haptic + audio
  const handleEarthquakeClick = useCallback((earthquake: GlobePoint) => {
    setSelectedEarthquake(earthquake);
    setFlyToTarget(earthquake);
    playQuakeTone(earthquake.magnitude);
    triggerHaptic(earthquake.magnitude);
  }, [playQuakeTone]);

  const handleFlyToComplete = useCallback(() => {
    // Don't clear during tour — tour manages its own flow
    if (!isTourActive) {
      setFlyToTarget(null);
    }
  }, [isTourActive]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    
    if (
      newFilters.timeRange.hours !== filters.timeRange.hours ||
      newFilters.minMagnitude !== filters.minMagnitude
    ) {
      fetchData();
    }
  }, [filters, fetchData]);

  // Time-lapse controls
  const handleTimelapseToggle = useCallback(() => {
    setIsTimelapse(prev => !prev);
  }, []);

  const handleTimelapseReset = useCallback(() => {
    setIsTimelapse(false);
    setTimelapseProgress(0);
  }, []);

  // Cinematic Tour controls
  const handleTourStart = useCallback(() => {
    const stops = getTourStops(filteredEarthquakes, 8);
    if (stops.length === 0) return;
    
    setTourStops(stops);
    setTourIndex(0);
    setTourProgress(0);
    setIsTourActive(true);
    setFlyToTarget(stops[0]);
    setSelectedEarthquake(stops[0]);
  }, [filteredEarthquakes]);

  const handleTourStop = useCallback(() => {
    setIsTourActive(false);
    setTourProgress(0);
    setFlyToTarget(null);
  }, []);

  // Cinematic Autoplay — auto-cycle through biggest quakes
  const handleCinematicToggle = useCallback(() => {
    setIsCinematic(prev => {
      if (!prev) {
        // Starting cinematic
        const stops = getTourStops(filteredEarthquakes, 12);
        if (stops.length === 0) return false;
        cinematicIndexRef.current = 0;
        setFlyToTarget(stops[0]);
        setSelectedEarthquake(stops[0]);
        setCinematicProgress(0);
        return true;
      } else {
        // Stopping cinematic
        if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
        if (cinematicProgressRef.current) clearInterval(cinematicProgressRef.current);
        setCinematicProgress(0);
        return false;
      }
    });
  }, [filteredEarthquakes]);

  // Cinematic autoplay timer
  useEffect(() => {
    if (!isCinematic) return;
    const stops = getTourStops(filteredEarthquakes, 12);
    if (stops.length === 0) { setIsCinematic(false); return; }

    const startTime = Date.now();
    cinematicProgressRef.current = window.setInterval(() => {
      setCinematicProgress(Math.min(1, (Date.now() - startTime) / CINEMATIC_INTERVAL));
    }, 33);

    cinematicTimerRef.current = window.setTimeout(() => {
      if (cinematicProgressRef.current) clearInterval(cinematicProgressRef.current);
      cinematicIndexRef.current = (cinematicIndexRef.current + 1) % stops.length;
      const next = stops[cinematicIndexRef.current];
      setFlyToTarget(next);
      setSelectedEarthquake(next);
      setCinematicProgress(0);
      setCinematicStopKey(k => k + 1);
    }, CINEMATIC_INTERVAL);

    return () => {
      if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
      if (cinematicProgressRef.current) clearInterval(cinematicProgressRef.current);
    };
  }, [isCinematic, filteredEarthquakes, cinematicStopKey]);

  // Toggle seismic rings
  const handleToggleRings = useCallback(() => {
    setShowSeismicRings(prev => !prev);
  }, []);

  // Responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          handleTimelapseToggle();
          break;
        case 'r':
          handleTimelapseReset();
          break;
        case 'p':
          setSidebarCollapsed(prev => !prev);
          break;
        case 'g': // "G" for guided tour
          if (isTourActive) {
            handleTourStop();
          } else {
            handleTourStart();
          }
          break;
        case 'w': // "W" for waves/rings
          handleToggleRings();
          break;
        case 'c': // "C" for cinematic autoplay
          handleCinematicToggle();
          break;
        case 'a': // "A" for audio toggle
          handleToggleAudio();
          break;
        case 'escape':
          if (isCinematic) {
            handleCinematicToggle();
          } else if (isTourActive) {
            handleTourStop();
          } else if (selectedEarthquake) {
            setSelectedEarthquake(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTimelapseToggle, handleTimelapseReset, selectedEarthquake, isTourActive, isCinematic, handleTourStart, handleTourStop, handleToggleRings, handleCinematicToggle, handleToggleAudio]);

  // Derive emotional data for the selected earthquake
  const selectedFreshness = useMemo(() => 
    selectedEarthquake ? getFreshnessLabel(selectedEarthquake.time) : null,
    [selectedEarthquake]
  );
  const selectedImpact = useMemo(() => 
    selectedEarthquake ? getHumanImpact(selectedEarthquake) : '',
    [selectedEarthquake]
  );
  const selectedEmotion = useMemo(() => 
    selectedEarthquake ? getEmotionalContext(selectedEarthquake) : null,
    [selectedEarthquake]
  );
  const selectedDistance = useMemo(() => 
    selectedEarthquake && userLocation
      ? formatDistanceToUser(selectedEarthquake.lat, selectedEarthquake.lng, userLocation.lat, userLocation.lng)
      : null,
    [selectedEarthquake, userLocation]
  );

  if (loading && earthquakes.length === 0) {
    return (
      <div className="app loading">
        <div className="loading-spinner">
          <div className="loading-earth-pulse">
            <div className="earth-ring earth-ring-1" />
            <div className="earth-ring earth-ring-2" />
            <div className="earth-ring earth-ring-3" />
            <div className="earth-core" />
          </div>
          <p className="loading-poem">{loadingPoem}</p>
        </div>
      </div>
    );
  }

  if (error && earthquakes.length === 0) {
    return (
      <div className="app error">
        <div className="error-message">
          <h2>Unable to load earthquake data</h2>
          <p>{error}</p>
          <button onClick={fetchData}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`app app-enter ${selectedEarthquake && selectedEarthquake.magnitude >= 6 ? 'screen-tremor-heavy' : selectedEarthquake && selectedEarthquake.magnitude >= 5 ? 'screen-tremor' : ''} mood-bg-${mood.mood}`} 
      role="application" 
      aria-label="EarthPulse — Real-time earthquake visualization"
      style={{ '--mood-intensity': mood.intensity } as React.CSSProperties}
    >
      <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          statistics={statistics}
          selectedEarthquake={selectedEarthquake}
          selectedFreshness={selectedFreshness}
          selectedImpact={selectedImpact}
          selectedEmotion={selectedEmotion}
          selectedDistance={selectedDistance}
          onCloseDetails={() => setSelectedEarthquake(null)}
          isTimelapse={isTimelapse}
          onTimelapseToggle={handleTimelapseToggle}
          timelapseProgress={timelapseProgress}
          onTimelapseReset={handleTimelapseReset}
          animationSpeed={animationSpeed}
          onAnimationSpeedChange={setAnimationSpeed}
          showSeismicRings={showSeismicRings}
          onToggleRings={handleToggleRings}
          isTourActive={isTourActive}
          onTourStart={handleTourStart}
          onTourStop={handleTourStop}
          isCinematic={isCinematic}
          onCinematicToggle={handleCinematicToggle}
          audioEnabled={audioEnabled}
          onToggleAudio={handleToggleAudio}
        />

        <main className="globe-container" aria-label="Earthquake globe visualization">
          <ErrorBoundary fallbackMessage="The 3D globe encountered an error">
            <Globe
              earthquakes={filteredEarthquakes}
              tectonicPlates={tectonicPlates}
              showTectonicPlates={filters.showTectonicPlates}
              showHeatmap={filters.showHeatmap}
              showSeismicRings={showSeismicRings}
              onEarthquakeClick={handleEarthquakeClick}
              animationSpeed={animationSpeed}
              timelapseProgress={isTimelapse ? timelapseProgress : -1}
              flyToTarget={flyToTarget}
              onFlyToComplete={handleFlyToComplete}
            />
          </ErrorBoundary>

          {/* Cinematic vignette overlay */}
          <div className="globe-vignette" aria-hidden="true" />

          {/* Ambient mood glow overlay */}
          <div 
            className={`mood-ambient mood-ambient-${mood.mood}`}
            style={{ 
              '--mood-color': mood.color,
              '--mood-intensity': mood.intensity
            } as React.CSSProperties}
          />

          {/* Mood indicator (top-left of globe) */}
          {!isTourActive && !isCinematic && (
            <MoodIndicator 
              mood={mood}
              totalFelt={statistics.totalFelt}
              tsunamiWarnings={statistics.tsunamiWarnings}
            />
          )}

          {/* Cinematic Autoplay Badge */}
          {isCinematic && selectedEarthquake && (
            <div className="cinematic-badge" aria-live="polite">
              <div className="cinematic-indicator">
                <span className="cinematic-pulse"></span>
                CINEMATIC
              </div>
              <div className="cinematic-info">
                M{selectedEarthquake.magnitude.toFixed(1)} — {selectedEarthquake.place}
              </div>
              <div className="cinematic-progress-bar">
                <div 
                  className="cinematic-progress-fill"
                  style={{ width: `${cinematicProgress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Instructions Bar */}
          {!isTourActive && !isCinematic && (
            <div className="instructions-bar">
              <span><kbd>G</kbd> Tour</span>
              <span><kbd>C</kbd> Cinematic</span>
              <span><kbd>W</kbd> Waves</span>
              <span><kbd>A</kbd> Audio</span>
              <span><kbd>Space</kbd> Timelapse</span>
              <span><kbd>P</kbd> Panel</span>
            </div>
          )}

          {/* Cinematic Tour Overlay */}
          {isTourActive && tourStops[tourIndex] && (
            <div className="tour-overlay" aria-live="polite">
              <div className="tour-badge">
                <div className="tour-indicator">
                  <span className="tour-pulse"></span>
                  GUIDED TOUR
                </div>
                <div className="tour-counter">
                  {tourIndex + 1} / {tourStops.length}
                </div>
              </div>
              <div className="tour-card">
                <div className="tour-card-mag">
                  M{tourStops[tourIndex].magnitude.toFixed(1)}
                </div>
                <div className="tour-card-place">
                  {tourStops[tourIndex].place}
                </div>
                <div className="tour-card-depth">
                  Depth: {tourStops[tourIndex].depth.toFixed(1)} km
                </div>
                <div className="tour-card-time">
                  {new Date(tourStops[tourIndex].time).toLocaleString()}
                </div>
                <div className="tour-progress">
                  <div 
                    className="tour-progress-fill"
                    style={{ width: `${tourProgress * 100}%` }}
                  />
                </div>
              </div>
              <button 
                className="tour-stop-btn"
                onClick={handleTourStop}
                aria-label="Stop guided tour"
              >
                Stop Tour (Esc)
              </button>
            </div>
          )}
        </main>

        {error && (
          <div className="error-toast" role="alert" aria-live="assertive">
            <p>Failed to update data: {error}</p>
            <button onClick={() => setError(null)} aria-label="Dismiss error">×</button>
          </div>
        )}

        <div className="status-bar" role="status" aria-live="polite">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <span>Showing {filteredEarthquakes.length} earthquakes</span>
          {showSeismicRings && <span className="status-rings">🌊 Seismic Waves</span>}
        </div>
      </div>
    </div>
  );
}

export default App;
