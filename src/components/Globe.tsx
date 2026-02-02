import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import GlobeGL from 'react-globe.gl';
import type { GlobePoint, TectonicPlateCollection } from '../types';
import { getMagnitudeColor } from '../utils/colors';
import { generateSeismicRings } from '../utils/seismic';
import { generateSeismicArcs, generateHeatmapPoints, HEATMAP_BANDWIDTH, HEATMAP_TOP_ALT, HEATMAP_BASE_ALT } from '../utils/clusters';
import type { SeismicArc, HeatmapPoint } from '../utils/clusters';

// ─── Stable accessor functions (avoid per-render allocation) ───
const ringLatAccessor = (d: object) => (d as { lat: number }).lat;
const ringLngAccessor = (d: object) => (d as { lng: number }).lng;
const ringMaxRAccessor = (d: object) => (d as { maxR: number }).maxR;
const ringSpeedAccessor = (d: object) => (d as { propagationSpeed: number }).propagationSpeed;
const ringRepeatAccessor = (d: object) => (d as { repeatPeriod: number }).repeatPeriod;
const arcStartLatAccessor = (d: object) => (d as SeismicArc).startLat;
const arcStartLngAccessor = (d: object) => (d as SeismicArc).startLng;
const arcEndLatAccessor = (d: object) => (d as SeismicArc).endLat;
const arcEndLngAccessor = (d: object) => (d as SeismicArc).endLng;
const arcColorAccessor = (d: object) => (d as SeismicArc).color;
const arcStrokeAccessor = (d: object) => (d as SeismicArc).stroke;
const arcDashLenAccessor = (d: object) => (d as SeismicArc).dashLength;
const arcDashGapAccessor = (d: object) => (d as SeismicArc).dashGap;
const arcDashAnimAccessor = (d: object) => (d as SeismicArc).dashAnimateTime;
const arcAltAccessor = (d: object) => (d as SeismicArc).altitude;
const heatLat = (d: object) => (d as HeatmapPoint).lat;
const heatLng = (d: object) => (d as HeatmapPoint).lng;
const heatWeight = (d: object) => (d as HeatmapPoint).weight;
const plateColorFn = () => 'rgba(255, 120, 30, 0.65)';
const arcLabelFn = (d: object) => {
  const arc = d as SeismicArc;
  return `<div style="background: rgba(10,14,26,0.92); color: white; padding: 8px 12px; border-radius: 8px; font-size: 11px; border: 1px solid rgba(168,85,247,0.3); backdrop-filter: blur(8px);">
    <div style="font-weight: 600; color: #a78bfa;">🔗 Seismic Connection</div>
    <div style="margin-top: 4px; color: rgba(255,255,255,0.8);">${arc.label}</div>
  </div>`;
};

/** Stable heatmap color function — extracted outside component to avoid re-allocation */
function heatmapColorFn(t: number): string {
  if (t < 0.33) {
    const f = t / 0.33;
    return `rgba(${Math.round(30 + f * 70)}, ${Math.round(100 + f * 60)}, ${Math.round(200 - f * 50)}, ${0.4 + f * 0.2})`;
  } else if (t < 0.66) {
    const f = (t - 0.33) / 0.33;
    return `rgba(${Math.round(100 + f * 155)}, ${Math.round(160 - f * 60)}, ${Math.round(150 - f * 120)}, ${0.6 + f * 0.15})`;
  } else {
    const f = (t - 0.66) / 0.34;
    return `rgba(${Math.round(255)}, ${Math.round(100 - f * 60)}, ${Math.round(30)}, ${0.75 + f * 0.2})`;
  }
}

interface GlobeComponentProps {
  earthquakes: GlobePoint[];
  tectonicPlates: TectonicPlateCollection | null;
  showTectonicPlates: boolean;
  showHeatmap: boolean;
  showSeismicRings: boolean;
  showSeismicNetwork: boolean;
  showEnergyHeatmap: boolean;
  onEarthquakeClick: (earthquake: GlobePoint) => void;
  animationSpeed: number;
  timelapseProgress: number;
  flyToTarget: GlobePoint | null;
  onFlyToComplete: () => void;
}

export default function GlobeComponent({
  earthquakes,
  tectonicPlates,
  showTectonicPlates,
  showHeatmap,
  showSeismicRings,
  showSeismicNetwork,
  showEnergyHeatmap,
  onEarthquakeClick,
  animationSpeed,
  timelapseProgress,
  flyToTarget,
  onFlyToComplete
}: GlobeComponentProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [visibleEarthquakes, setVisibleEarthquakes] = useState<GlobePoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Generate seismic ring data (memoized — creates closures per ring)
  const ringsData = useMemo(
    () => showSeismicRings ? generateSeismicRings(visibleEarthquakes) : [],
    [showSeismicRings, visibleEarthquakes],
  );

  // Generate seismic network arcs (memoized — expensive O(n²))
  const arcsData: SeismicArc[] = useMemo(
    () => showSeismicNetwork ? generateSeismicArcs(visibleEarthquakes) : [],
    [showSeismicNetwork, visibleEarthquakes],
  );

  // Generate 3D energy heatmap points (memoized)
  const heatmapPoints: HeatmapPoint[] = useMemo(
    () => showEnergyHeatmap ? generateHeatmapPoints(visibleEarthquakes) : [],
    [showEnergyHeatmap, visibleEarthquakes],
  );

  // Pre-sort earthquakes for timelapse (avoid re-sorting on every progress tick)
  const sortedByTime = useMemo(
    () => [...earthquakes].sort((a, b) => a.time - b.time),
    [earthquakes],
  );

  // Responsive resize via ResizeObserver (debounced to avoid layout thrash)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    };

    // Initial measurement (immediate)
    updateDimensions();

    const observer = new ResizeObserver(() => {
      // Debounce resize events to avoid multiple re-renders during drag resize
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateDimensions, 100);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  // Handle time-lapse animation (uses pre-sorted array to avoid re-sorting at 10fps)
  useEffect(() => {
    if (timelapseProgress >= 0 && timelapseProgress <= 1) {
      const maxIndex = Math.floor(timelapseProgress * sortedByTime.length);
      setVisibleEarthquakes(sortedByTime.slice(0, maxIndex));
    } else {
      setVisibleEarthquakes(earthquakes);
    }
  }, [earthquakes, sortedByTime, timelapseProgress]);

  useEffect(() => {
    if (globeEl.current && globeReady) {
      const controls = globeEl.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = animationSpeed;
      }
    }
  }, [globeReady, animationSpeed]);

  // Fly-to target when it changes
  useEffect(() => {
    if (flyToTarget && globeEl.current && globeReady) {
      // Zoom altitude based on magnitude — bigger quakes zoom out more to show context
      const altitude = Math.max(0.5, 2.5 - flyToTarget.magnitude * 0.15);
      globeEl.current.pointOfView(
        { lat: flyToTarget.lat, lng: flyToTarget.lng, altitude },
        1500 // 1.5s smooth transition
      );
      // Notify parent after transition completes
      const timer = setTimeout(onFlyToComplete, 1600);
      return () => clearTimeout(timer);
    }
  }, [flyToTarget, globeReady, onFlyToComplete]);

  const handleEarthquakeClick = useCallback((point: object) => {
    onEarthquakeClick(point as GlobePoint);
  }, [onEarthquakeClick]);

  const pointColor = useCallback((point: object) => {
    const p = point as GlobePoint;
    return showHeatmap ? getMagnitudeColor(p.magnitude) : p.color;
  }, [showHeatmap]);

  const pointSize = useCallback((point: object) => {
    const p = point as GlobePoint;
    return showHeatmap ? p.magnitude * 0.2 : p.size;
  }, [showHeatmap]);

  const pointLabel = useCallback((point: object) => {
    const p = point as GlobePoint;
    const magColor = p.magnitude >= 6 ? '#ef4444' : p.magnitude >= 4 ? '#f59e0b' : '#60a5fa';
    return `
      <div style="background: rgba(10,14,26,0.92); color: white; padding: 12px 16px; border-radius: 10px; font-size: 12px; border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(8px); min-width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
        <div style="font-size: 20px; font-weight: 800; color: ${magColor}; margin-bottom: 4px;">M${p.magnitude.toFixed(1)}</div>
        <div style="font-weight: 600; margin-bottom: 8px; line-height: 1.3;">${p.place}</div>
        <div style="color: rgba(255,255,255,0.6); display: flex; justify-content: space-between; gap: 16px;">
          <span>Depth: ${p.depth.toFixed(1)} km</span>
          <span>${new Date(p.time).toLocaleString()}</span>
        </div>
      </div>
    `;
  }, []);

  // Ring color accessor — each ring datum has its own color function
  const ringColor = useCallback((d: object) => {
    const ring = d as ReturnType<typeof generateSeismicRings>[number];
    return ring.color;
  }, []);

  // Memoize array wrapper to avoid new [heatmapPoints] ref every render
  const heatmapsData = useMemo(
    () => heatmapPoints.length > 0 ? [heatmapPoints] : [],
    [heatmapPoints],
  );

  // Memoize tectonic plate features array ref
  const pathsData = useMemo(
    () => showTectonicPlates && tectonicPlates ? tectonicPlates.features : [],
    [showTectonicPlates, tectonicPlates],
  );

  const handleGlobeReady = useCallback(() => setGlobeReady(true), []);

  return (
    <div
      ref={containerRef}
      className="globe-wrapper"
      role="img"
      aria-label={`Interactive 3D globe showing ${visibleEarthquakes.length} earthquakes. Click and drag to rotate. Scroll to zoom.`}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <GlobeGL
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

          // Points (earthquakes)
          pointsData={visibleEarthquakes}
          pointAltitude={0.01}
          pointColor={pointColor}
          pointRadius={pointSize}
          pointResolution={8}
          onPointClick={handleEarthquakeClick}
          pointLabel={pointLabel}

          // Seismic rings (stable accessor refs — no per-render allocation)
          ringsData={ringsData}
          ringLat={ringLatAccessor}
          ringLng={ringLngAccessor}
          ringColor={ringColor}
          ringMaxRadius={ringMaxRAccessor}
          ringPropagationSpeed={ringSpeedAccessor}
          ringRepeatPeriod={ringRepeatAccessor}
          ringAltitude={0.002}
          ringResolution={48}

          // Seismic network arcs (stable accessor refs)
          arcsData={arcsData}
          arcStartLat={arcStartLatAccessor}
          arcStartLng={arcStartLngAccessor}
          arcEndLat={arcEndLatAccessor}
          arcEndLng={arcEndLngAccessor}
          arcColor={arcColorAccessor}
          arcStroke={arcStrokeAccessor}
          arcDashLength={arcDashLenAccessor}
          arcDashGap={arcDashGapAccessor}
          arcDashAnimateTime={arcDashAnimAccessor}
          arcAltitude={arcAltAccessor}
          arcLabel={arcLabelFn}

          // 3D Energy heatmap (stable accessor refs)
          heatmapsData={heatmapsData}
          heatmapPoints="."
          heatmapPointLat={heatLat}
          heatmapPointLng={heatLng}
          heatmapPointWeight={heatWeight}
          heatmapBandwidth={HEATMAP_BANDWIDTH}
          heatmapTopAltitude={HEATMAP_TOP_ALT}
          heatmapBaseAltitude={HEATMAP_BASE_ALT}
          heatmapColorSaturation={2.5}
          heatmapColorFn={heatmapColorFn}

          // Paths (tectonic plates)
          pathsData={pathsData}
          pathColor={plateColorFn}
          pathStroke={1.5}
          pathDashLength={0.08}
          pathDashGap={0.04}
          pathDashAnimateTime={4000}

          // Animation and interaction
          animateIn={true}
          waitForGlobeReady={true}
          onGlobeReady={handleGlobeReady}

          // Lighting
          enablePointerInteraction={true}
          showGlobe={true}
          showAtmosphere={true}
          atmosphereColor="#6ba3ff"
          atmosphereAltitude={0.2}

          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      <style>{`
        .globe-wrapper canvas {
          cursor: grab;
        }
        .globe-wrapper canvas:active {
          cursor: grabbing;
        }
        .scene-tooltip {
          pointer-events: none;
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}
