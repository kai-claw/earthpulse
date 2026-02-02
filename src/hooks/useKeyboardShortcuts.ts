import { useEffect } from 'react';

interface ShortcutActions {
  onTimelapseToggle: () => void;
  onTimelapseReset: () => void;
  onSidebarToggle: () => void;
  onTourToggle: () => void;
  onRingsToggle: () => void;
  onNetworkToggle: () => void;
  onEnergyHeatmapToggle: () => void;
  onCinematicToggle: () => void;
  onAudioToggle: () => void;
  onEscape: () => void;
}

/**
 * Central keyboard shortcut handler.
 * Skips when focus is on input/select/textarea elements.
 */
export function useKeyboardShortcuts(actions: ShortcutActions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          actions.onTimelapseToggle();
          break;
        case 'r':
          actions.onTimelapseReset();
          break;
        case 'p':
          actions.onSidebarToggle();
          break;
        case 'g':
          actions.onTourToggle();
          break;
        case 'w':
          actions.onRingsToggle();
          break;
        case 'n':
          actions.onNetworkToggle();
          break;
        case 'x':
          actions.onEnergyHeatmapToggle();
          break;
        case 'c':
          actions.onCinematicToggle();
          break;
        case 'a':
          actions.onAudioToggle();
          break;
        case 'escape':
          actions.onEscape();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
