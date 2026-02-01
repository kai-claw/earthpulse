import { useCallback, useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { GlobePoint, TectonicPlateCollection } from '../types';
import { getMagnitudeColor } from '../utils/helpers';

interface GlobeComponentProps {
  earthquakes: GlobePoint[];
  tectonicPlates: TectonicPlateCollection | null;
  showTectonicPlates: boolean;
  showHeatmap: boolean;
  onEarthquakeClick: (earthquake: GlobePoint) => void;
  animationSpeed: number;
  timelapseProgress: number;
}

export default function GlobeComponent({
  earthquakes,
  tectonicPlates,
  showTectonicPlates,
  showHeatmap,
  onEarthquakeClick,
  animationSpeed,
  timelapseProgress
}: GlobeComponentProps) {
  const globeEl = useRef<any>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [visibleEarthquakes, setVisibleEarthquakes] = useState<GlobePoint[]>([]);

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
      // Set up auto-rotation
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = animationSpeed;
    }
  }, [globeReady, animationSpeed]);

  const handleEarthquakeClick = useCallback((point: any) => {
    onEarthquakeClick(point);
  }, [onEarthquakeClick]);

  const pointColor = useCallback((point: any) => {
    return showHeatmap ? getMagnitudeColor(point.magnitude) : point.color;
  }, [showHeatmap]);

  const pointSize = useCallback((point: any) => {
    return showHeatmap ? point.magnitude * 0.2 : point.size;
  }, [showHeatmap]);

  return (
    <div className="globe-container">
      <Globe
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
        pointLabel={(point: any) => `
          <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
            <strong>M${point.magnitude} - ${point.place}</strong><br/>
            <strong>Depth:</strong> ${point.depth.toFixed(1)} km<br/>
            <strong>Time:</strong> ${new Date(point.time).toLocaleString()}
          </div>
        `}

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
        
        width={window.innerWidth * 0.7}
        height={window.innerHeight}
      />
      
      {/* Pulsing animation for earthquakes */}
      <style>{`
        .globe-container canvas {
          cursor: grab;
        }
        .globe-container canvas:active {
          cursor: grabbing;
        }
        
        /* Custom styles for better appearance */
        .scene-tooltip {
          pointer-events: none;
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}