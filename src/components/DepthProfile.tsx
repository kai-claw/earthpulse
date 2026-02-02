import { useMemo } from 'react';
import type { GlobePoint } from '../types';

interface DepthProfileProps {
  earthquakes: GlobePoint[];
}

const WIDTH = 210;
const HEIGHT = 120;
const PADDING = { top: 14, right: 8, bottom: 20, left: 36 };
const INNER_W = WIDTH - PADDING.left - PADDING.right;
const INNER_H = HEIGHT - PADDING.top - PADDING.bottom;

/** Depth zone colors and boundaries */
const DEPTH_ZONES = [
  { maxDepth: 35, label: 'Shallow', color: 'rgba(96,165,250,0.12)' },
  { maxDepth: 70, label: 'Intermediate', color: 'rgba(129,140,248,0.10)' },
  { maxDepth: 300, label: 'Deep', color: 'rgba(167,139,250,0.08)' },
  { maxDepth: 700, label: 'Very Deep', color: 'rgba(244,114,182,0.06)' },
];

export default function DepthProfile({ earthquakes }: DepthProfileProps) {
  const { points, maxDepth, depthTicks } = useMemo(() => {
    if (earthquakes.length === 0) return { points: [], maxDepth: 300, depthTicks: [0, 100, 200, 300] };

    const maxD = Math.min(700, Math.max(100, ...earthquakes.map(q => q.depth)));
    // Create smart ticks
    const step = maxD <= 100 ? 25 : maxD <= 300 ? 50 : 100;
    const ticks: number[] = [];
    for (let t = 0; t <= maxD; t += step) ticks.push(t);

    // Map earthquakes to plot points — x = magnitude, y = depth
    const pts = earthquakes.map(q => ({
      x: PADDING.left + ((q.magnitude / 10) * INNER_W),
      y: PADDING.top + (q.depth / maxD) * INNER_H,
      mag: q.magnitude,
      depth: q.depth,
      color: q.magnitude >= 6 ? '#ef4444' : q.magnitude >= 4 ? '#f59e0b' : '#60a5fa',
      r: Math.max(1.5, Math.min(5, q.magnitude * 0.6)),
    }));

    return { points: pts, maxDepth: maxD, depthTicks: ticks };
  }, [earthquakes]);

  if (earthquakes.length === 0) return null;

  return (
    <div className="depth-profile" role="img" aria-label="Earthquake depth vs magnitude scatter plot">
      <h5 style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
        Depth vs Magnitude
      </h5>
      <svg width={WIDTH} height={HEIGHT} style={{ display: 'block' }}>
        {/* Depth zone backgrounds */}
        {DEPTH_ZONES.filter(z => z.maxDepth <= maxDepth * 1.1).map((zone, i) => {
          const prevMax = i === 0 ? 0 : DEPTH_ZONES[i - 1].maxDepth;
          const y1 = PADDING.top + (prevMax / maxDepth) * INNER_H;
          const y2 = PADDING.top + (Math.min(zone.maxDepth, maxDepth) / maxDepth) * INNER_H;
          return (
            <rect
              key={zone.label}
              x={PADDING.left}
              y={y1}
              width={INNER_W}
              height={y2 - y1}
              fill={zone.color}
            />
          );
        })}

        {/* Depth tick lines + labels */}
        {depthTicks.map(d => {
          const y = PADDING.top + (d / maxDepth) * INNER_H;
          return (
            <g key={d}>
              <line x1={PADDING.left} y1={y} x2={PADDING.left + INNER_W} y2={y}
                stroke="rgba(255,255,255,0.08)" strokeDasharray="2,3" />
              <text x={PADDING.left - 4} y={y} textAnchor="end" dominantBaseline="middle"
                fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="Inter, system-ui, sans-serif">
                {d}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {[0, 2, 4, 6, 8].map(m => {
          const x = PADDING.left + (m / 10) * INNER_W;
          return (
            <text key={m} x={x} y={HEIGHT - 4} textAnchor="middle"
              fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="Inter, system-ui, sans-serif">
              M{m}
            </text>
          );
        })}

        {/* Axis labels */}
        <text x={PADDING.left + INNER_W / 2} y={HEIGHT - 1} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="Inter, system-ui, sans-serif">
          Magnitude →
        </text>
        <text x={4} y={PADDING.top + INNER_H / 2} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="Inter, system-ui, sans-serif"
          transform={`rotate(-90, 4, ${PADDING.top + INNER_H / 2})`}>
          Depth (km) ↓
        </text>

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={p.color}
            opacity={0.6}
            stroke={p.color}
            strokeWidth={0.5}
            strokeOpacity={0.3}
          >
            <title>M{p.mag.toFixed(1)} at {p.depth.toFixed(1)}km depth</title>
          </circle>
        ))}

        {/* Border */}
        <rect x={PADDING.left} y={PADDING.top} width={INNER_W} height={INNER_H}
          fill="none" stroke="rgba(255,255,255,0.1)" />
      </svg>
    </div>
  );
}
