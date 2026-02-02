import { useState } from 'react';
import { Clock, Skull, Zap, Star } from 'lucide-react';
import { HISTORICAL_EARTHQUAKES, type HistoricalEarthquake } from '../utils/historical';
import { getEnergyComparison } from '../utils/energy';

interface HistoricalGalleryProps {
  onFlyTo: (lat: number, lng: number, magnitude: number) => void;
}

type CategoryFilter = 'all' | 'deadliest' | 'strongest' | 'notable';

const CATEGORY_CONFIG: Record<CategoryFilter, { label: string; icon: React.ReactNode }> = {
  all:       { label: 'All', icon: <Star size={12} /> },
  deadliest: { label: 'Deadliest', icon: <Skull size={12} /> },
  strongest: { label: 'Strongest', icon: <Zap size={12} /> },
  notable:   { label: 'Notable', icon: <Clock size={12} /> },
};

export default function HistoricalGallery({ onFlyTo }: HistoricalGalleryProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === 'all'
    ? HISTORICAL_EARTHQUAKES
    : HISTORICAL_EARTHQUAKES.filter(eq => eq.category === filter);

  const sorted = [...filtered].sort((a, b) => b.magnitude - a.magnitude);

  return (
    <div className="historical-gallery">
      {/* Category filter chips */}
      <div className="historical-filters" role="group" aria-label="Filter historical earthquakes">
        {(Object.keys(CATEGORY_CONFIG) as CategoryFilter[]).map(cat => (
          <button
            key={cat}
            className={`historical-chip ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
            aria-pressed={filter === cat}
          >
            {CATEGORY_CONFIG[cat].icon}
            <span>{CATEGORY_CONFIG[cat].label}</span>
          </button>
        ))}
      </div>

      {/* Earthquake list */}
      <div className="historical-list">
        {sorted.map(eq => (
          <HistoricalCard
            key={eq.id}
            earthquake={eq}
            isExpanded={expanded === eq.id}
            onToggle={() => setExpanded(expanded === eq.id ? null : eq.id)}
            onFlyTo={onFlyTo}
          />
        ))}
      </div>
    </div>
  );
}

interface CardProps {
  earthquake: HistoricalEarthquake;
  isExpanded: boolean;
  onToggle: () => void;
  onFlyTo: (lat: number, lng: number, magnitude: number) => void;
}

function HistoricalCard({ earthquake: eq, isExpanded, onToggle, onFlyTo }: CardProps) {
  const magClass = eq.magnitude >= 9 ? 'mag-historic'
    : eq.magnitude >= 7 ? 'mag-great'
    : eq.magnitude >= 6 ? 'mag-major'
    : 'mag-moderate';

  return (
    <div className={`historical-card ${isExpanded ? 'expanded' : ''} category-${eq.category}`}>
      {/* Header — always visible */}
      <button
        className="historical-card-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={`${eq.name}, magnitude ${eq.magnitude}`}
      >
        <div className="historical-card-left">
          <span className={`historical-mag ${magClass}`}>
            M{eq.magnitude.toFixed(1)}
          </span>
          <div className="historical-card-info">
            <span className="historical-name">{eq.name}</span>
            <span className="historical-year">{eq.date}</span>
          </div>
        </div>
        <span className="historical-deaths">{eq.deaths}</span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="historical-card-body">
          <p className="historical-description">{eq.description}</p>

          {/* Energy comparison */}
          <EnergyDisplay magnitude={eq.magnitude} />

          <button
            className="historical-fly-btn"
            onClick={() => onFlyTo(eq.lat, eq.lng, eq.magnitude)}
            aria-label={`Fly to ${eq.name} earthquake location`}
          >
            🌍 Fly to Location
          </button>
        </div>
      )}
    </div>
  );
}

function EnergyDisplay({ magnitude }: { magnitude: number }) {
  const energy = getEnergyComparison(magnitude);
  // Show top 3 most interesting comparisons
  const top = energy.comparisons.slice(0, 3);

  return (
    <div className="energy-comparisons">
      <div className="energy-header">Energy Released</div>
      {top.map((c, i) => (
        <div key={i} className="energy-row">
          <span className="energy-icon">{c.icon}</span>
          <div className="energy-text">
            <span className="energy-label">{c.label}</span>
            <span className="energy-detail">{c.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
