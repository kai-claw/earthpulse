import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
import type { GlobePoint } from '../types';
import { calculateActivityRate, downloadCSV } from '../utils/export';

interface ActivitySummaryProps {
  earthquakes: GlobePoint[];
}

const LEVEL_CONFIG: Record<string, { emoji: string; color: string }> = {
  quiet:    { emoji: '🟢', color: '#22c55e' },
  normal:   { emoji: '🔵', color: '#3b82f6' },
  active:   { emoji: '🟡', color: '#eab308' },
  elevated: { emoji: '🟠', color: '#f97316' },
  intense:  { emoji: '🔴', color: '#ef4444' },
};

const TREND_ICONS: Record<string, React.ReactNode> = {
  rising:  <TrendingUp size={14} />,
  falling: <TrendingDown size={14} />,
  stable:  <Minus size={14} />,
};

export default function ActivitySummary({ earthquakes }: ActivitySummaryProps) {
  const rate = useMemo(() => calculateActivityRate(earthquakes), [earthquakes]);
  const config = LEVEL_CONFIG[rate.level] || LEVEL_CONFIG.normal;

  // Magnitude breakdown: count significant (M4+) quakes
  const significant = useMemo(() => {
    let m4plus = 0;
    let m5plus = 0;
    let m6plus = 0;
    for (const q of earthquakes) {
      if (q.magnitude >= 4) m4plus++;
      if (q.magnitude >= 5) m5plus++;
      if (q.magnitude >= 6) m6plus++;
    }
    return { m4plus, m5plus, m6plus };
  }, [earthquakes]);

  if (earthquakes.length === 0) return null;

  return (
    <div className="activity-summary">
      <div className="activity-header">
        <h5 className="activity-title">⚡ Activity Snapshot</h5>
        <button
          className="export-csv-btn"
          onClick={() => downloadCSV(earthquakes)}
          aria-label="Export earthquake data as CSV"
          title="Download CSV"
        >
          <Download size={13} />
          <span>CSV</span>
        </button>
      </div>

      <div className="activity-rate-row">
        <div className="rate-primary">
          <span className="rate-number" style={{ color: config.color }}>
            {rate.perHour.toFixed(1)}
          </span>
          <span className="rate-unit">quakes/hr</span>
        </div>
        <div className="rate-secondary">
          <span className="rate-number-small">~{Math.round(rate.perDay)}</span>
          <span className="rate-unit-small">/day</span>
        </div>
      </div>

      <div className="activity-level-row">
        <span className="level-indicator">
          {config.emoji} <span className="level-label" style={{ color: config.color }}>
            {rate.level.charAt(0).toUpperCase() + rate.level.slice(1)}
          </span>
        </span>
        <span className={`trend-indicator trend-${rate.trend}`}>
          {TREND_ICONS[rate.trend]}
          <span className="trend-text">{rate.trendDescription}</span>
        </span>
      </div>

      {/* Notable quake counts */}
      {significant.m4plus > 0 && (
        <div className="activity-notable">
          {significant.m6plus > 0 && (
            <span className="notable-badge notable-m6">
              {significant.m6plus} M6+
            </span>
          )}
          {significant.m5plus > 0 && (
            <span className="notable-badge notable-m5">
              {significant.m5plus} M5+
            </span>
          )}
          <span className="notable-badge notable-m4">
            {significant.m4plus} M4+
          </span>
        </div>
      )}
    </div>
  );
}
