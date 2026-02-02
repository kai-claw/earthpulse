import { MoodState } from '../types';

interface MoodIndicatorProps {
  mood: MoodState;
  totalFelt: number;
  tsunamiWarnings: number;
}

export default function MoodIndicator({ mood, totalFelt, tsunamiWarnings }: MoodIndicatorProps) {
  const moodEmojis: Record<string, string> = {
    serene: '🌊',
    quiet: '🌙',
    stirring: '🌀',
    restless: '⚡',
    volatile: '🔥',
    fierce: '💥'
  };

  return (
    <div 
      className={`mood-indicator mood-${mood.mood}`}
      role="status"
      aria-label={`Seismic mood: ${mood.mood}. ${mood.description}`}
    >
      {/* Ambient pulse orb */}
      <div 
        className="mood-orb"
        style={{ 
          '--mood-color': mood.color,
          '--mood-intensity': mood.intensity 
        } as React.CSSProperties}
      >
        <div className="mood-orb-inner" />
        <div className="mood-orb-ring" />
        <div className="mood-orb-ring mood-orb-ring-2" />
      </div>

      <div className="mood-text">
        <div className="mood-label">
          <span className="mood-emoji">{moodEmojis[mood.mood] || '🌍'}</span>
          <span className="mood-name">{mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)}</span>
        </div>
        <div className="mood-description">{mood.description}</div>

        {/* Human impact badges */}
        <div className="mood-badges">
          {totalFelt > 0 && (
            <span className="mood-badge felt-badge" title={`${totalFelt} felt reports`}>
              👤 {totalFelt >= 1000 ? `${(totalFelt / 1000).toFixed(1)}k` : totalFelt} felt
            </span>
          )}
          {tsunamiWarnings > 0 && (
            <span className="mood-badge tsunami-badge" title={`${tsunamiWarnings} tsunami warning${tsunamiWarnings > 1 ? 's' : ''}`}>
              🌊 {tsunamiWarnings} tsunami {tsunamiWarnings === 1 ? 'alert' : 'alerts'}
            </span>
          )}
          {mood.recentBiggest >= 5.0 && (
            <span className="mood-badge big-quake-badge" title="Largest recent event">
              M{mood.recentBiggest.toFixed(1)} largest
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
