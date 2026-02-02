import { useState, useCallback, useRef } from 'react';
import type { GlobePoint } from '../types';
import { playRichQuakeTone, triggerHaptic } from '../utils/audio';

export interface AudioState {
  audioEnabled: boolean;
  handleToggleAudio: () => void;
  playQuakeAudioFeedback: (earthquake: GlobePoint) => void;
}

export function useAudio(): AudioState {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
  }, []);

  const playQuakeAudioFeedback = useCallback((earthquake: GlobePoint) => {
    if (!audioEnabled) {
      triggerHaptic(earthquake.magnitude);
      return;
    }
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      playRichQuakeTone(audioCtxRef.current, earthquake.magnitude);
    } catch {
      // Audio not available
    }
    triggerHaptic(earthquake.magnitude);
  }, [audioEnabled]);

  return { audioEnabled, handleToggleAudio, playQuakeAudioFeedback };
}
