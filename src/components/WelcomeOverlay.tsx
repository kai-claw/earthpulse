import { useState, useEffect, useCallback } from 'react';
import { Globe as GlobeIcon, Activity, Navigation, Waves, Download, Keyboard } from 'lucide-react';

const STORAGE_KEY = 'earthpulse-welcome-dismissed';

interface WelcomeOverlayProps {
  /** Total earthquake count to show live data proof */
  earthquakeCount: number;
}

const FEATURES = [
  {
    icon: <GlobeIcon size={24} />,
    title: 'Live 3D Globe',
    description: 'Real-time earthquake data from USGS plotted on an interactive 3D Earth. Click any point to explore.',
  },
  {
    icon: <Activity size={24} />,
    title: 'Seismic Insights',
    description: 'Magnitude charts, depth profiles, energy comparisons, and emotional mood tracking of planetary activity.',
  },
  {
    icon: <Navigation size={24} />,
    title: 'Guided Experiences',
    description: 'Take a guided tour through the biggest quakes, or enable cinematic autoplay for a hands-free journey.',
  },
  {
    icon: <Waves size={24} />,
    title: 'Immersive Layers',
    description: 'Seismic wave rings, energy heatmaps, network arcs connecting related quakes, and spatialized audio.',
  },
  {
    icon: <Download size={24} />,
    title: 'Export & Share',
    description: 'Download earthquake data as CSV, share individual quakes via deep links, or use the search to find specific events.',
  },
  {
    icon: <Keyboard size={24} />,
    title: 'Keyboard Shortcuts',
    description: 'Press G for guided tour, C for cinematic mode, W for waves, A for audio, and more. Press P to toggle the panel.',
  },
];

export default function WelcomeOverlay({ earthquakeCount }: WelcomeOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [fadeClass, setFadeClass] = useState('');

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        // Slight delay so the globe has time to render behind
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable — don't show
    }
  }, []);

  const dismiss = useCallback(() => {
    setFadeClass('welcome-fade-out');
    setTimeout(() => {
      setVisible(false);
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // silent
      }
    }, 400);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`welcome-overlay ${fadeClass}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to EarthPulse"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="welcome-card">
        <div className="welcome-header">
          <div className="welcome-icon-pulse">
            <div className="welcome-ring welcome-ring-1" />
            <div className="welcome-ring welcome-ring-2" />
            <span className="welcome-earth-emoji">🌍</span>
          </div>
          <h2 className="welcome-title">Welcome to EarthPulse</h2>
          <p className="welcome-subtitle">
            {earthquakeCount > 0
              ? `${earthquakeCount.toLocaleString()} earthquakes are happening right now.`
              : 'Real-time seismic activity at your fingertips.'}
          </p>
        </div>

        <div className="welcome-features">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="welcome-feature"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <div className="welcome-feature-icon">{f.icon}</div>
              <div className="welcome-feature-text">
                <strong>{f.title}</strong>
                <span>{f.description}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          className="welcome-start-btn"
          onClick={dismiss}
          autoFocus
        >
          Explore the Earth
        </button>

        <p className="welcome-hint">
          Press <kbd>?</kbd> or visit the Info tab for keyboard shortcuts
        </p>
      </div>
    </div>
  );
}
