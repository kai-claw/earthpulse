import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings,
  BarChart3,
  Info,
  Play,
  Pause,
  RotateCcw,
  Map,
  Activity,
  Filter,
  Radio,
  Navigation,
  Waves,
  Volume2,
  VolumeX,
  BookOpen,
  GitBranch,
  Flame
} from 'lucide-react';
import type { FilterState, Statistics, GlobePoint } from '../types';
import { TIME_RANGES } from '../utils/constants';
import { formatDate, formatRelativeTime, getMagnitudeDescription, getDepthDescription } from '../utils/formatting';
import { getEnergyComparison } from '../utils/energy';
import MagnitudeChart from './MagnitudeChart';
import DepthProfile from './DepthProfile';
import HistoricalGallery from './HistoricalGallery';
import SearchBar from './SearchBar';
import ShareButton from './ShareButton';
import ActivitySummary from './ActivitySummary';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  statistics: Statistics;
  earthquakes: GlobePoint[];
  selectedEarthquake: GlobePoint | null;
  selectedFreshness: { label: string; urgency: 'live' | 'recent' | 'fresh' } | null;
  selectedImpact: string;
  selectedEmotion: string | null;
  selectedDistance: string | null;
  onCloseDetails: () => void;
  isTimelapse: boolean;
  onTimelapseToggle: () => void;
  timelapseProgress: number;
  onTimelapseReset: () => void;
  animationSpeed: number;
  onAnimationSpeedChange: (speed: number) => void;
  showSeismicRings: boolean;
  onToggleRings: () => void;
  isTourActive: boolean;
  onTourStart: () => void;
  onTourStop: () => void;
  isCinematic: boolean;
  onCinematicToggle: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  showSeismicNetwork: boolean;
  onToggleNetwork: () => void;
  showEnergyHeatmap: boolean;
  onToggleEnergyHeatmap: () => void;
  onHistoricalFlyTo: (lat: number, lng: number, magnitude: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchClear: () => void;
  searchResults: GlobePoint[];
  searchResultCount: number;
  getShareUrl: (eq: GlobePoint) => string;
}

export default function Sidebar({
  isCollapsed,
  onToggle,
  filters,
  onFiltersChange,
  statistics,
  earthquakes,
  selectedEarthquake,
  selectedFreshness,
  selectedImpact,
  selectedEmotion,
  selectedDistance,
  onCloseDetails,
  isTimelapse,
  onTimelapseToggle,
  timelapseProgress,
  onTimelapseReset,
  animationSpeed,
  onAnimationSpeedChange,
  showSeismicRings,
  onToggleRings,
  isTourActive,
  onTourStart,
  onTourStop,
  isCinematic,
  onCinematicToggle,
  audioEnabled,
  onToggleAudio,
  showSeismicNetwork,
  onToggleNetwork,
  showEnergyHeatmap,
  onToggleEnergyHeatmap,
  onHistoricalFlyTo,
  searchQuery,
  onSearchChange,
  onSearchClear,
  searchResults,
  searchResultCount,
  getShareUrl,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'controls' | 'stats' | 'history' | 'info'>('controls');

  const handleFilterChange = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  if (isCollapsed) {
    return (
      <nav className="sidebar collapsed" role="complementary" aria-label="Controls panel (collapsed)">
        <button 
          className="toggle-btn"
          onClick={onToggle}
          aria-label="Expand sidebar"
          title="Expand Sidebar"
        >
          <ChevronRight size={20} />
        </button>
      </nav>
    );
  }

  return (
    <nav className="sidebar expanded" role="complementary" aria-label="Controls panel">
      <div className="sidebar-header">
        <h1>EarthPulse</h1>
        <button 
          className="toggle-btn"
          onClick={onToggle}
          aria-label="Collapse sidebar"
          title="Collapse Sidebar"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="sidebar-tabs" role="tablist" aria-label="Panel tabs">
        <button 
          className={`tab ${activeTab === 'controls' ? 'active' : ''}`}
          onClick={() => setActiveTab('controls')}
          role="tab"
          aria-selected={activeTab === 'controls'}
          aria-controls="panel-controls"
          id="tab-controls"
        >
          <Settings size={16} />
          <span>Controls</span>
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
          role="tab"
          aria-selected={activeTab === 'stats'}
          aria-controls="panel-stats"
          id="tab-stats"
        >
          <BarChart3 size={16} />
          <span>Stats</span>
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          role="tab"
          aria-selected={activeTab === 'history'}
          aria-controls="panel-history"
          id="tab-history"
        >
          <BookOpen size={16} />
          <span>History</span>
        </button>
        <button 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
          role="tab"
          aria-selected={activeTab === 'info'}
          aria-controls="panel-info"
          id="tab-info"
        >
          <Info size={16} />
          <span>Info</span>
        </button>
      </div>

      <div className="sidebar-content">
        {/* Search Bar */}
        <SearchBar
          query={searchQuery}
          onQueryChange={onSearchChange}
          onClear={onSearchClear}
          resultCount={searchResultCount}
          totalCount={earthquakes.length}
          results={searchResults}
          onSelectResult={(eq) => {
            onFiltersChange(filters); // ensure filters applied
            // Simulate click by selecting + closing details first
            onCloseDetails();
            setTimeout(() => {
              // parent handles the actual selection + fly-to
              const event = new CustomEvent('earthquake-select', { detail: eq });
              window.dispatchEvent(event);
            }, 50);
          }}
        />

        {selectedEarthquake && (
          <div className={`earthquake-details ${selectedEarthquake.magnitude >= 5 ? 'details-intense' : ''} ${selectedEarthquake.tsunami ? 'details-tsunami' : ''}`}>
            <div className="details-header">
              <h3>
                Earthquake Details
                {selectedFreshness && (
                  <span className={`freshness-badge freshness-${selectedFreshness.urgency}`}>
                    {selectedFreshness.label}
                  </span>
                )}
              </h3>
              <button className="close-btn" onClick={onCloseDetails} aria-label="Close earthquake details">×</button>
            </div>

            {/* Emotional context — gut reaction */}
            {selectedEmotion && (
              <div className="emotional-context">
                <p>{selectedEmotion}</p>
              </div>
            )}

            <div className="details-content">
              <div className="detail-item">
                <span className="label">Magnitude:</span>
                <span className={`value magnitude mag-${selectedEarthquake.magnitude >= 6 ? 'major' : selectedEarthquake.magnitude >= 4 ? 'moderate' : 'minor'}`}>
                  <span className="mag-hero">M{selectedEarthquake.magnitude.toFixed(1)}</span>
                  <span className="mag-hero-label">{getMagnitudeDescription(selectedEarthquake.magnitude)}</span>
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Location:</span>
                <span className="value">{selectedEarthquake.place}</span>
              </div>
              <div className="detail-item">
                <span className="label">Depth:</span>
                <span className="value">
                  {selectedEarthquake.depth.toFixed(1)} km ({getDepthDescription(selectedEarthquake.depth)})
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Time:</span>
                <span className="value">{formatDate(selectedEarthquake.time)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Occurred:</span>
                <span className="value">{formatRelativeTime(selectedEarthquake.time)}</span>
              </div>

              {/* Human impact section */}
              {selectedImpact && (
                <div className="detail-item human-impact">
                  <span className="label">Impact:</span>
                  <span className="value impact-value">{selectedImpact}</span>
                </div>
              )}

              {selectedEarthquake.felt && selectedEarthquake.felt > 0 && (
                <div className="detail-item">
                  <span className="label">Felt Reports:</span>
                  <span className="value felt-value">
                    {selectedEarthquake.felt.toLocaleString()} {selectedEarthquake.felt === 1 ? 'report' : 'reports'}
                  </span>
                </div>
              )}

              {selectedEarthquake.alert && (
                <div className={`detail-item alert-item alert-${selectedEarthquake.alert}`}>
                  <span className="label">PAGER Alert:</span>
                  <span className={`value alert-badge alert-badge-${selectedEarthquake.alert}`}>
                    {selectedEarthquake.alert.toUpperCase()}
                  </span>
                </div>
              )}

              {selectedEarthquake.tsunami && (
                <div className="detail-item tsunami-warning">
                  <span className="tsunami-icon">🌊</span>
                  <span className="tsunami-text">Tsunami warning issued</span>
                </div>
              )}

              {selectedDistance && (
                <div className="detail-item distance-item">
                  <span className="label">📍 Distance:</span>
                  <span className="value distance-value">{selectedDistance}</span>
                </div>
              )}

              <div className="detail-actions">
                {selectedEarthquake.url && (
                  <a 
                    href={selectedEarthquake.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="usgs-link"
                  >
                    View on USGS →
                  </a>
                )}
                <ShareButton
                  earthquake={selectedEarthquake}
                  getShareUrl={getShareUrl}
                />
              </div>

              {/* Energy comparison */}
              {selectedEarthquake.magnitude >= 2 && (
                <div className="energy-section">
                  <div className="energy-section-header">⚡ Energy Released</div>
                  {getEnergyComparison(selectedEarthquake.magnitude).comparisons.slice(0, 3).map((c, i) => (
                    <div key={i} className="energy-comparison-row">
                      <span className="energy-icon">{c.icon}</span>
                      <div className="energy-text-group">
                        <span className="energy-main">{c.label}</span>
                        <span className="energy-sub">{c.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="controls-panel" role="tabpanel" id="panel-controls" aria-labelledby="tab-controls">
            <div className="control-group">
              <h4><Filter size={16} /> Filters</h4>
              
              <div className="control-item">
                <label>Time Range</label>
                <select 
                  value={TIME_RANGES.findIndex(tr => tr.hours === filters.timeRange.hours)}
                  onChange={(e) => handleFilterChange('timeRange', TIME_RANGES[parseInt(e.target.value)])}
                >
                  {TIME_RANGES.map((range, index) => (
                    <option key={index} value={index}>{range.label}</option>
                  ))}
                </select>
              </div>

              <div className="control-item">
                <label htmlFor="min-magnitude">
                  Minimum Magnitude: {filters.minMagnitude.toFixed(1)}
                </label>
                <input
                  id="min-magnitude"
                  type="range"
                  min="0"
                  max="9"
                  step="0.1"
                  value={filters.minMagnitude}
                  aria-valuemin={0}
                  aria-valuemax={9}
                  aria-valuenow={filters.minMagnitude}
                  aria-label={`Minimum magnitude: ${filters.minMagnitude.toFixed(1)}`}
                  onChange={(e) => handleFilterChange('minMagnitude', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="control-group">
              <h4><Map size={16} /> Display</h4>
              
              <div className="control-item checkbox">
                <input
                  type="checkbox"
                  id="heatmap"
                  checked={filters.showHeatmap}
                  onChange={(e) => handleFilterChange('showHeatmap', e.target.checked)}
                />
                <label htmlFor="heatmap">Heatmap Mode</label>
              </div>

              <div className="control-item checkbox">
                <input
                  type="checkbox"
                  id="plates"
                  checked={filters.showTectonicPlates}
                  onChange={(e) => handleFilterChange('showTectonicPlates', e.target.checked)}
                />
                <label htmlFor="plates">Tectonic Plates</label>
              </div>
            </div>

            <div className="control-group">
              <h4><Activity size={16} /> Animation</h4>
              
              <div className="control-item">
                <label htmlFor="globe-rotation">
                  Globe Rotation: {animationSpeed.toFixed(1)}x
                </label>
                <input
                  id="globe-rotation"
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={animationSpeed}
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-valuenow={animationSpeed}
                  aria-label={`Globe rotation speed: ${animationSpeed.toFixed(1)}x`}
                  onChange={(e) => onAnimationSpeedChange(parseFloat(e.target.value))}
                />
              </div>

              <div className="control-item">
                <div className="timelapse-controls">
                  <button 
                    className={`timelapse-btn ${isTimelapse ? 'active' : ''}`}
                    onClick={onTimelapseToggle}
                    aria-label={isTimelapse ? 'Pause time-lapse' : 'Start time-lapse'}
                    aria-pressed={isTimelapse}
                  >
                    {isTimelapse ? <Pause size={16} /> : <Play size={16} />}
                    {isTimelapse ? 'Pause' : 'Time-lapse'}
                  </button>
                  <button 
                    className="reset-btn"
                    onClick={onTimelapseReset}
                    aria-label="Reset time-lapse"
                    title="Reset Time-lapse"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
                {isTimelapse && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${timelapseProgress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="control-group">
              <h4><Waves size={16} /> Experience</h4>
              
              <div className="control-item">
                <button
                  className={`experience-btn rings-btn ${showSeismicRings ? 'active' : ''}`}
                  onClick={onToggleRings}
                  aria-pressed={showSeismicRings}
                  aria-label={showSeismicRings ? 'Hide seismic waves' : 'Show seismic waves'}
                >
                  <Radio size={16} />
                  {showSeismicRings ? 'Seismic Waves On' : 'Seismic Waves Off'}
                </button>
              </div>

              <div className="control-item">
                <button
                  className={`experience-btn network-btn ${showSeismicNetwork ? 'active' : ''}`}
                  onClick={onToggleNetwork}
                  aria-pressed={showSeismicNetwork}
                  aria-label={showSeismicNetwork ? 'Hide seismic network' : 'Show seismic network'}
                >
                  <GitBranch size={16} />
                  {showSeismicNetwork ? 'Network On' : 'Seismic Network'}
                </button>
                <span className="control-hint">Connect related earthquakes with arcs</span>
              </div>

              <div className="control-item">
                <button
                  className={`experience-btn heatmap3d-btn ${showEnergyHeatmap ? 'active' : ''}`}
                  onClick={onToggleEnergyHeatmap}
                  aria-pressed={showEnergyHeatmap}
                  aria-label={showEnergyHeatmap ? 'Hide energy heatmap' : 'Show energy heatmap'}
                >
                  <Flame size={16} />
                  {showEnergyHeatmap ? 'Energy Map On' : '3D Energy Map'}
                </button>
                <span className="control-hint">See seismic energy density rising from the surface</span>
              </div>

              <div className="control-item">
                <button
                  className={`experience-btn tour-btn ${isTourActive ? 'active' : ''}`}
                  onClick={isTourActive ? onTourStop : onTourStart}
                  aria-pressed={isTourActive}
                  aria-label={isTourActive ? 'Stop guided tour' : 'Start guided tour'}
                >
                  <Navigation size={16} />
                  {isTourActive ? 'Stop Tour' : 'Guided Tour'}
                </button>
                <span className="control-hint">Fly through the biggest quakes</span>
              </div>

              <div className="control-item">
                <button
                  className={`experience-btn cinematic-btn ${isCinematic ? 'active' : ''}`}
                  onClick={onCinematicToggle}
                  aria-pressed={isCinematic}
                  aria-label={isCinematic ? 'Stop cinematic autoplay' : 'Start cinematic autoplay'}
                >
                  <Play size={16} />
                  {isCinematic ? 'Stop Cinematic' : 'Cinematic Autoplay'}
                </button>
                <span className="control-hint">Auto-cycle through major earthquakes</span>
              </div>

              <div className="control-item">
                <button
                  className={`experience-btn audio-btn ${audioEnabled ? 'active' : ''}`}
                  onClick={onToggleAudio}
                  aria-pressed={audioEnabled}
                  aria-label={audioEnabled ? 'Disable seismic audio' : 'Enable seismic audio'}
                >
                  {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  {audioEnabled ? 'Audio On' : 'Seismic Audio'}
                </button>
                <span className="control-hint">Hear earthquakes as deep tones</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-panel" role="tabpanel" id="panel-stats" aria-labelledby="tab-stats">
            {/* Activity Rate Summary + CSV Export */}
            <ActivitySummary earthquakes={earthquakes} />

            <h4><BarChart3 size={16} /> Statistics</h4>
            
            <div className="stat-item">
              <span className="stat-label">Total Events</span>
              <span className="stat-value">{statistics.totalEvents}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Largest Magnitude</span>
              <span className="stat-value magnitude">
                M{statistics.largestMagnitude.toFixed(1)}
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Largest Quake</span>
              <span className="stat-value location">{statistics.largestQuake}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Most Active Region</span>
              <span className="stat-value location">{statistics.mostActiveRegion}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Average Depth</span>
              <span className="stat-value">{statistics.averageDepth.toFixed(1)} km</span>
            </div>

            {statistics.totalFelt > 0 && (
              <div className="stat-item felt-stat">
                <span className="stat-label">👤 People Felt It</span>
                <span className="stat-value">{statistics.totalFelt.toLocaleString()}</span>
              </div>
            )}

            {statistics.tsunamiWarnings > 0 && (
              <div className="stat-item tsunami-stat">
                <span className="stat-label">🌊 Tsunami Alerts</span>
                <span className="stat-value">{statistics.tsunamiWarnings}</span>
              </div>
            )}

            {/* Magnitude distribution chart */}
            <div className="stat-chart-divider" />
            <MagnitudeChart earthquakes={earthquakes} />

            {/* Depth vs magnitude scatter plot */}
            <div className="stat-chart-divider" />
            <DepthProfile earthquakes={earthquakes} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-panel" role="tabpanel" id="panel-history" aria-labelledby="tab-history">
            <h4><BookOpen size={16} /> Historical Earthquakes</h4>
            <p className="history-intro">
              Explore the most significant earthquakes in recorded history. Click to learn more, fly to their location on the globe.
            </p>
            <HistoricalGallery onFlyTo={onHistoricalFlyTo} />
          </div>
        )}

        {activeTab === 'info' && (
          <div className="info-panel" role="tabpanel" id="panel-info" aria-labelledby="tab-info">
            <h4><Info size={16} /> About EarthPulse</h4>
            
            <div className="info-section">
              <h5>Earthquake Magnitude Scale</h5>
              <ul>
                <li><span className="magnitude-color micro"></span> &lt;2.0 - Micro</li>
                <li><span className="magnitude-color minor"></span> 2.0-2.9 - Minor</li>
                <li><span className="magnitude-color light"></span> 3.0-3.9 - Light</li>
                <li><span className="magnitude-color moderate"></span> 4.0-4.9 - Moderate</li>
                <li><span className="magnitude-color strong"></span> 5.0-5.9 - Strong</li>
                <li><span className="magnitude-color major"></span> 6.0-6.9 - Major</li>
                <li><span className="magnitude-color great"></span> 7.0+ - Great</li>
              </ul>
            </div>

            <div className="info-section">
              <h5>Depth Colors</h5>
              <ul>
                <li><span className="depth-color shallow"></span> &lt;35 km - Shallow</li>
                <li><span className="depth-color intermediate"></span> 35-70 km - Intermediate</li>
                <li><span className="depth-color deep"></span> 70-300 km - Deep</li>
                <li><span className="depth-color very-deep"></span> 300+ km - Very Deep</li>
              </ul>
            </div>

            <div className="info-section">
              <h5>Keyboard Shortcuts</h5>
              <ul className="shortcut-list">
                <li><kbd>Space</kbd> Toggle time-lapse</li>
                <li><kbd>R</kbd> Reset time-lapse</li>
                <li><kbd>G</kbd> Start/stop guided tour</li>
                <li><kbd>C</kbd> Cinematic autoplay</li>
                <li><kbd>N</kbd> Toggle seismic network</li>
                <li><kbd>X</kbd> Toggle 3D energy heatmap</li>
                <li><kbd>W</kbd> Toggle seismic waves</li>
                <li><kbd>A</kbd> Toggle seismic audio</li>
                <li><kbd>P</kbd> Toggle sidebar</li>
                <li><kbd>Esc</kbd> Close / stop</li>
              </ul>
            </div>

            <div className="info-section">
              <h5>Data Source</h5>
              <p>Real-time earthquake data from the United States Geological Survey (USGS).</p>
            </div>

            <div className="info-section">
              <h5>Tectonic Plates</h5>
              <p>Earth's lithosphere is divided into major tectonic plates that slowly move and interact, causing most earthquakes along their boundaries.</p>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}