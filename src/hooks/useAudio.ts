import { useState, useCallback, useRef, useEffect } from 'react';
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

  // Cleanup AudioContext on unmount to prevent browser resource leaks
  // (browsers cap at ~6 active AudioContexts)
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      if (prev && audioCtxRef.current) {
        // Suspend (not close) context when disabling to free resources
        audioCtxRef.current.suspend().catch(() => {});
      }
      return !prev;
    });
  }, []);

  const playQuakeAudioFeedback = useCallback((earthquake: GlobePoint) => {
    if (!audioEnabled) {
      triggerHaptic(earthquake.magnitude);
      return;
    }
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext();
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      playRichQuakeTone(audioCtxRef.current, earthquake.magnitude);
    } catch {
      // Audio not available — degrade gracefully
    }
    triggerHaptic(earthquake.magnitude);
  }, [audioEnabled]);

  return { audioEnabled, handleToggleAudio, playQuakeAudioFeedback };
}
