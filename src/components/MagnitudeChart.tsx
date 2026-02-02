import { useMemo } from 'react';
import type { GlobePoint } from '../types';

interface MagnitudeChartProps {
  earthquakes: GlobePoint[];
}

/** Magnitude bucket boundaries */
const BUCKETS = [
  { min: 0, max: 2, label: '<2', color: '#60a5fa' },
  { min: 2, max: 3, label: '2–3', color: '#34d399' },
  { min: 3, max: 4, label: '3–4', color: '#a3e635' },
  { min: 4, max: 5, label: '4–5', color: '#fbbf24' },
  { min: 5, max: 6, label: '5–6', color: '#f97316' },
  { min: 6, max: 7, label: '6–7', color: '#ef4444' },
  { min: 7, max: 10, label: '7+', color: '#dc2626' },
];

const BAR_HEIGHT = 18;
const LABEL_WIDTH = 32;
const COUNT_WIDTH = 36;
const GAP = 3;
const CHART_HEIGHT = BUCKETS.length * (BAR_HEIGHT + GAP);

export default function MagnitudeChart({ earthquakes }: MagnitudeChartProps) {
  const distribution = useMemo(() => {
    const counts = BUCKETS.map(b => ({
      ...b,
      count: earthquakes.filter(q => q.magnitude >= b.min && q.magnitude < b.max).length,
    }));
    const maxCount = Math.max(1, ...counts.map(c => c.count));
    return counts.map(c => ({ ...c, pct: c.count / maxCount }));
  }, [earthquakes]);

  const barAreaWidth = 140;

  if (earthquakes.length === 0) return null;

  return (
    <div className="magnitude-chart" role="img" aria-label="Magnitude distribution chart">
      <h5 style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
        Magnitude Distribution
      </h5>
      <svg
        width={LABEL_WIDTH + barAreaWidth + COUNT_WIDTH + 8}
        height={CHART_HEIGHT}
        style={{ display: 'block' }}
      >
        {distribution.map((bucket, i) => {
          const y = i * (BAR_HEIGHT + GAP);
          return (
            <g key={bucket.label}>
              {/* Label */}
              <text
                x={LABEL_WIDTH - 4}
                y={y + BAR_HEIGHT / 2 + 1}
                textAnchor="end"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize="10"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {bucket.label}
              </text>

              {/* Bar background */}
              <rect
                x={LABEL_WIDTH}
                y={y}
                width={barAreaWidth}
                height={BAR_HEIGHT}
                rx={4}
                fill="rgba(255,255,255,0.06)"
              />

              {/* Bar fill */}
              <rect
                x={LABEL_WIDTH}
                y={y}
                width={Math.max(bucket.count > 0 ? 4 : 0, bucket.pct * barAreaWidth)}
                height={BAR_HEIGHT}
                rx={4}
                fill={bucket.color}
                opacity={0.8}
              >
                <animate
                  attributeName="width"
                  from="0"
                  to={Math.max(bucket.count > 0 ? 4 : 0, bucket.pct * barAreaWidth)}
                  dur="0.6s"
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.25 0.46 0.45 0.94"
                  keyTimes="0;1"
                />
              </rect>

              {/* Count */}
              <text
                x={LABEL_WIDTH + barAreaWidth + 6}
                y={y + BAR_HEIGHT / 2 + 1}
                textAnchor="start"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.8)"
                fontSize="10"
                fontWeight="600"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {bucket.count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
