import { useCallback, useEffect, useRef, useState } from 'react';
import GlobeGL from 'react-globe.gl';
import { GlobePoint, TectonicPlateCollection } from '../types';
import { getMagnitudeColor, generateSeismicRings } from '../utils/helpers';

interface GlobeComponentProps {
  earthquakes: GlobePoint[];
  tectonicPlates: TectonicPlateCollection | null;
  showTectonicPlates: boolean;
  showHeatmap: boolean;
  showSeismicRings: boolean;
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

  // Generate seismic ring data
  const ringsData = showSeismicRings ? generateSeismicRings(visibleEarthquakes) : [];

  // Responsive resize via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    };

    // Initial measurement
    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Handle time-lapse animation
  useEffect(() => {
    if (timelapseProgress >= 0 && timelapseProgress <= 1) {
      const sortedQuakes = [...earthquakes].sort((a, b) => a.time - b.time);
      const maxIndex = Math.floor(timelapseProgress * sortedQuakes.length);
      setVisibleEarthquakes(sortedQuakes.slice(0, maxIndex));
    } else {
      setVisibleEarthquakes(earthquakes);
    }
  }, [earthquakes, timelapseProgress]);

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
    return `
      <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
        <strong>M${p.magnitude} - ${p.place}</strong><br/>
        <strong>Depth:</strong> ${p.depth.toFixed(1)} km<br/>
        <strong>Time:</strong> ${new Date(p.time).toLocaleString()}
      </div>
    `;
  }, []);

  // Ring color accessor — each ring datum has its own color function
  const ringColor = useCallback((d: object) => {
    const ring = d as ReturnType<typeof generateSeismicRings>[number];
    return ring.color;
  }, []);

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

          // Seismic rings
          ringsData={ringsData}
          ringLat={(d: object) => (d as { lat: number }).lat}
          ringLng={(d: object) => (d as { lng: number }).lng}
          ringColor={ringColor}
          ringMaxRadius={(d: object) => (d as { maxR: number }).maxR}
          ringPropagationSpeed={(d: object) => (d as { propagationSpeed: number }).propagationSpeed}
          ringRepeatPeriod={(d: object) => (d as { repeatPeriod: number }).repeatPeriod}
          ringAltitude={0.002}
          ringResolution={48}

          // Paths (tectonic plates)
          pathsData={showTectonicPlates && tectonicPlates ? tectonicPlates.features : []}
          pathColor={() => '#ff6b00'}
          pathStroke={2}
          pathDashLength={0.1}
          pathDashGap={0.05}
          pathDashAnimateTime={3000}

          // Animation and interaction
          animateIn={true}
          waitForGlobeReady={true}
          onGlobeReady={() => setGlobeReady(true)}

          // Lighting
          enablePointerInteraction={true}
          showGlobe={true}
          showAtmosphere={true}
          atmosphereColor="#ffffff"
          atmosphereAltitude={0.15}

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
