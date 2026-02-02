import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import MoodIndicator from './components/MoodIndicator';
import type { GlobePoint } from './types';
import { INITIAL_FLY_DELAY_MS } from './utils/constants';
import {
  useEarthquakeData,
  useTour,
  useCinematic,
  useAudio,
  useKeyboardShortcuts,
} from './hooks';
import './App.css';

// Lazy-load the heavy Globe component (Three.js + react-globe.gl)
const Globe = lazy(() => import('./components/Globe'));

function App() {
  // ─── Data Layer ───
  const data = useEarthquakeData();

  // ─── UI State ───
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isTimelapse, setIsTimelapse] = useState(false);
  const [timelapseProgress, setTimelapseProgress] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(0.5);
  const [showSeismicRings, setShowSeismicRings] = useState(true);
  const [flyToTarget, setFlyToTarget] = useState<GlobePoint | null>(null);

  // ─── Feature Hooks ───
  const tour = useTour(data.filteredEarthquakes, data.setSelectedEarthquake);
  const cinematic = useCinematic(data.filteredEarthquakes, data.setSelectedEarthquake);
  const audio = useAudio();

  // ─── First-load auto-fly ───
  const hasHandledInitial = useRef(false);
  useEffect(() => {
    if (data.initialBiggest && !hasHandledInitial.current) {
      hasHandledInitial.current = true;
      setTimeout(() => {
        setFlyToTarget(data.initialBiggest);
        data.setSelectedEarthquake(data.initialBiggest);
      }, INITIAL_FLY_DELAY_MS);
    }
  }, [data.initialBiggest, data.setSelectedEarthquake]);

  // ─── Merge fly-to targets (tour/cinematic/manual) ───
  const activeFlyTarget = tour.tourFlyTarget ?? cinematic.cinematicFlyTarget ?? flyToTarget;

  // ─── Click handler ───
  const handleEarthquakeClick = useCallback((earthquake: GlobePoint) => {
    data.setSelectedEarthquake(earthquake);
    setFlyToTarget(earthquake);
    audio.playQuakeAudioFeedback(earthquake);
  }, [data.setSelectedEarthquake, audio.playQuakeAudioFeedback]);

  const handleFlyToComplete = useCallback(() => {
    if (!tour.isTourActive) setFlyToTarget(null);
  }, [tour.isTourActive]);

  // ─── Filter changes ───
  const handleFiltersChange = useCallback((newFilters: typeof data.filters) => {
    const needsRefetch =
      newFilters.timeRange.hours !== data.filters.timeRange.hours ||
      newFilters.minMagnitude !== data.filters.minMagnitude;
    data.setFilters(newFilters);
    if (needsRefetch) data.fetchData();
  }, [data.filters, data.setFilters, data.fetchData]);

  // ─── Timelapse ───
  const handleTimelapseToggle = useCallback(() => setIsTimelapse(p => !p), []);
  const handleTimelapseReset = useCallback(() => {
    setIsTimelapse(false);
    setTimelapseProgress(0);
  }, []);

  useEffect(() => {
    if (!isTimelapse) return;
    const interval = setInterval(() => {
      setTimelapseProgress(prev => {
        const next = prev + 0.01;
        if (next >= 1) { setIsTimelapse(false); return 1; }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isTimelapse]);

  // ─── Seismic rings ───
  const handleToggleRings = useCallback(() => setShowSeismicRings(p => !p), []);

  // ─── Responsive sidebar ───
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Keyboard shortcuts ───
  const shortcutActions = useMemo(() => ({
    onTimelapseToggle: handleTimelapseToggle,
    onTimelapseReset: handleTimelapseReset,
    onSidebarToggle: () => setSidebarCollapsed(p => !p),
    onTourToggle: () => tour.isTourActive ? tour.handleTourStop() : tour.handleTourStart(),
    onRingsToggle: handleToggleRings,
    onCinematicToggle: cinematic.handleCinematicToggle,
    onAudioToggle: audio.handleToggleAudio,
    onEscape: () => {
      if (cinematic.isCinematic) cinematic.handleCinematicToggle();
      else if (tour.isTourActive) tour.handleTourStop();
      else if (data.selectedEarthquake) data.setSelectedEarthquake(null);
    },
  }), [
    handleTimelapseToggle, handleTimelapseReset, handleToggleRings,
    tour.isTourActive, tour.handleTourStart, tour.handleTourStop,
    cinematic.isCinematic, cinematic.handleCinematicToggle,
    audio.handleToggleAudio,
    data.selectedEarthquake, data.setSelectedEarthquake,
  ]);
  useKeyboardShortcuts(shortcutActions);

  // ─── Loading state ───
  if (data.loading && data.filteredEarthquakes.length === 0) {
    return (
      <div className="app loading">
        <div className="loading-spinner">
          <div className="loading-earth-pulse">
            <div className="earth-ring earth-ring-1" />
            <div className="earth-ring earth-ring-2" />
            <div className="earth-ring earth-ring-3" />
            <div className="earth-core" />
          </div>
          <p className="loading-poem">{data.loadingPoem}</p>
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (data.error && data.filteredEarthquakes.length === 0) {
    return (
      <div className="app error">
        <div className="error-message">
          <h2>Unable to load earthquake data</h2>
          <p>{data.error}</p>
          <button onClick={data.fetchData}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`app app-enter ${data.selectedEarthquake && data.selectedEarthquake.magnitude >= 6 ? 'screen-tremor-heavy' : data.selectedEarthquake && data.selectedEarthquake.magnitude >= 5 ? 'screen-tremor' : ''} mood-bg-${data.mood.mood}`}
      role="application"
      aria-label="EarthPulse — Real-time earthquake visualization"
      style={{ '--mood-intensity': data.mood.intensity } as React.CSSProperties}
    >
      <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          filters={data.filters}
          onFiltersChange={handleFiltersChange}
          statistics={data.statistics}
          selectedEarthquake={data.selectedEarthquake}
          selectedFreshness={data.selectedFreshness}
          selectedImpact={data.selectedImpact}
          selectedEmotion={data.selectedEmotion}
          selectedDistance={data.selectedDistance}
          onCloseDetails={() => data.setSelectedEarthquake(null)}
          isTimelapse={isTimelapse}
          onTimelapseToggle={handleTimelapseToggle}
          timelapseProgress={timelapseProgress}
          onTimelapseReset={handleTimelapseReset}
          animationSpeed={animationSpeed}
          onAnimationSpeedChange={setAnimationSpeed}
          showSeismicRings={showSeismicRings}
          onToggleRings={handleToggleRings}
          isTourActive={tour.isTourActive}
          onTourStart={tour.handleTourStart}
          onTourStop={tour.handleTourStop}
          isCinematic={cinematic.isCinematic}
          onCinematicToggle={cinematic.handleCinematicToggle}
          audioEnabled={audio.audioEnabled}
          onToggleAudio={audio.handleToggleAudio}
        />

        <main className="globe-container" aria-label="Earthquake globe visualization">
          <ErrorBoundary fallbackMessage="The 3D globe encountered an error">
            <Suspense fallback={
              <div className="globe-loading">
                <div className="loading-earth-pulse">
                  <div className="earth-ring earth-ring-1" />
                  <div className="earth-ring earth-ring-2" />
                  <div className="earth-core" />
                </div>
                <p>Rendering globe…</p>
              </div>
            }>
              <Globe
                earthquakes={data.filteredEarthquakes}
                tectonicPlates={data.tectonicPlates}
                showTectonicPlates={data.filters.showTectonicPlates}
                showHeatmap={data.filters.showHeatmap}
                showSeismicRings={showSeismicRings}
                onEarthquakeClick={handleEarthquakeClick}
                animationSpeed={animationSpeed}
                timelapseProgress={isTimelapse ? timelapseProgress : -1}
                flyToTarget={activeFlyTarget}
                onFlyToComplete={handleFlyToComplete}
              />
            </Suspense>
          </ErrorBoundary>

          {/* Cinematic vignette overlay */}
          <div className="globe-vignette" aria-hidden="true" />

          {/* Ambient mood glow overlay */}
          <div
            className={`mood-ambient mood-ambient-${data.mood.mood}`}
            style={{
              '--mood-color': data.mood.color,
              '--mood-intensity': data.mood.intensity,
            } as React.CSSProperties}
          />

          {/* Mood indicator (top-left of globe) */}
          {!tour.isTourActive && !cinematic.isCinematic && (
            <MoodIndicator
              mood={data.mood}
              totalFelt={data.statistics.totalFelt}
              tsunamiWarnings={data.statistics.tsunamiWarnings}
            />
          )}

          {/* Cinematic Autoplay Badge */}
          {cinematic.isCinematic && data.selectedEarthquake && (
            <div className="cinematic-badge" aria-live="polite">
              <div className="cinematic-indicator">
                <span className="cinematic-pulse"></span>
                CINEMATIC
              </div>
              <div className="cinematic-info">
                M{data.selectedEarthquake.magnitude.toFixed(1)} — {data.selectedEarthquake.place}
              </div>
              <div className="cinematic-progress-bar">
                <div
                  className="cinematic-progress-fill"
                  style={{ width: `${cinematic.cinematicProgress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Instructions Bar */}
          {!tour.isTourActive && !cinematic.isCinematic && (
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
          {tour.isTourActive && tour.tourStops[tour.tourIndex] && (
            <div className="tour-overlay" aria-live="polite">
              <div className="tour-badge">
                <div className="tour-indicator">
                  <span className="tour-pulse"></span>
                  GUIDED TOUR
                </div>
                <div className="tour-counter">
                  {tour.tourIndex + 1} / {tour.tourStops.length}
                </div>
              </div>
              <div className="tour-card">
                <div className="tour-card-mag">
                  M{tour.tourStops[tour.tourIndex].magnitude.toFixed(1)}
                </div>
                <div className="tour-card-place">
                  {tour.tourStops[tour.tourIndex].place}
                </div>
                <div className="tour-card-depth">
                  Depth: {tour.tourStops[tour.tourIndex].depth.toFixed(1)} km
                </div>
                <div className="tour-card-time">
                  {new Date(tour.tourStops[tour.tourIndex].time).toLocaleString()}
                </div>
                <div className="tour-progress">
                  <div
                    className="tour-progress-fill"
                    style={{ width: `${tour.tourProgress * 100}%` }}
                  />
                </div>
              </div>
              <button
                className="tour-stop-btn"
                onClick={tour.handleTourStop}
                aria-label="Stop guided tour"
              >
                Stop Tour (Esc)
              </button>
            </div>
          )}
        </main>

        {data.error && (
          <div className="error-toast" role="alert" aria-live="assertive">
            <p>Failed to update data: {data.error}</p>
            <button onClick={() => data.setError(null)} aria-label="Dismiss error">×</button>
          </div>
        )}

        <div className="status-bar" role="status" aria-live="polite">
          <span>Last updated: {data.lastUpdate.toLocaleTimeString()}</span>
          <span>Showing {data.filteredEarthquakes.length} earthquakes</span>
          {showSeismicRings && <span className="status-rings">🌊 Seismic Waves</span>}
        </div>
      </div>
    </div>
  );
}

export default App;
