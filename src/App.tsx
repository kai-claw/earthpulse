import { useState, useEffect, useCallback } from 'react';
import Globe from './components/Globe';
import Sidebar from './components/Sidebar';
import { 
  TectonicPlateCollection, 
  GlobePoint, 
  FilterState, 
  Statistics,
  TimeRange 
} from './types';
import { 
  fetchEarthquakes, 
  fetchTectonicPlates 
} from './utils/api';
import { 
  convertEarthquakeToGlobePoint, 
  calculateStatistics,
  filterEarthquakesByTimeRange
} from './utils/helpers';
import './App.css';

const DEFAULT_TIME_RANGE: TimeRange = { label: 'Last Day', hours: 24 };

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
    averageDepth: 0
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
  }, [earthquakes, filters]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
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
        const next = prev + 0.01; // 1% progress per tick
        if (next >= 1) {
          setIsTimelapse(false);
          return 1;
        }
        return next;
      });
    }, 100); // 100ms intervals

    return () => clearInterval(interval);
  }, [isTimelapse]);

  // Handle earthquake click
  const handleEarthquakeClick = useCallback((earthquake: GlobePoint) => {
    setSelectedEarthquake(earthquake);
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    
    // If time range or magnitude filter changed, refetch data
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

  // Responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check initial size
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading && earthquakes.length === 0) {
    return (
      <div className="app loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Earth's seismic activity...</p>
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
    <div className="app">
      <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          statistics={statistics}
          selectedEarthquake={selectedEarthquake}
          onCloseDetails={() => setSelectedEarthquake(null)}
          isTimelapse={isTimelapse}
          onTimelapseToggle={handleTimelapseToggle}
          timelapseProgress={timelapseProgress}
          onTimelapseReset={handleTimelapseReset}
          animationSpeed={animationSpeed}
          onAnimationSpeedChange={setAnimationSpeed}
        />

        <div className="globe-container">
          <Globe
            earthquakes={filteredEarthquakes}
            tectonicPlates={tectonicPlates}
            showTectonicPlates={filters.showTectonicPlates}
            showHeatmap={filters.showHeatmap}
            onEarthquakeClick={handleEarthquakeClick}
            animationSpeed={animationSpeed}
            timelapseProgress={isTimelapse ? timelapseProgress : -1}
          />
        </div>

        {error && (
          <div className="error-toast">
            <p>Failed to update data: {error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="status-bar">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <span>Showing {filteredEarthquakes.length} earthquakes</span>
        </div>
      </div>
    </div>
  );
}

export default App;