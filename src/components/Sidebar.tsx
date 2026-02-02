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
  Filter
} from 'lucide-react';
import { FilterState, Statistics, TimeRange, GlobePoint } from '../types';
import { formatDate, formatRelativeTime, getMagnitudeDescription, getDepthDescription } from '../utils/helpers';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  statistics: Statistics;
  selectedEarthquake: GlobePoint | null;
  onCloseDetails: () => void;
  isTimelapse: boolean;
  onTimelapseToggle: () => void;
  timelapseProgress: number;
  onTimelapseReset: () => void;
  animationSpeed: number;
  onAnimationSpeedChange: (speed: number) => void;
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Last Hour', hours: 1 },
  { label: 'Last 6 Hours', hours: 6 },
  { label: 'Last Day', hours: 24 },
  { label: 'Last Week', hours: 168 },
  { label: 'Last Month', hours: 720 },
];

export default function Sidebar({
  isCollapsed,
  onToggle,
  filters,
  onFiltersChange,
  statistics,
  selectedEarthquake,
  onCloseDetails,
  isTimelapse,
  onTimelapseToggle,
  timelapseProgress,
  onTimelapseReset,
  animationSpeed,
  onAnimationSpeedChange
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'controls' | 'stats' | 'info'>('controls');

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
        {selectedEarthquake && (
          <div className="earthquake-details">
            <div className="details-header">
              <h3>Earthquake Details</h3>
              <button className="close-btn" onClick={onCloseDetails} aria-label="Close earthquake details">×</button>
            </div>
            <div className="details-content">
              <div className="detail-item">
                <span className="label">Magnitude:</span>
                <span className="value magnitude">
                  M{selectedEarthquake.magnitude.toFixed(1)} ({getMagnitudeDescription(selectedEarthquake.magnitude)})
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
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-panel" role="tabpanel" id="panel-stats" aria-labelledby="tab-stats">
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