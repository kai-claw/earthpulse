import { useEffect, useCallback, useRef } from 'react';
import type { GlobePoint } from '../types';

/**
 * URL hash state for sharing specific earthquakes.
 * Format: #eq=<earthquakeId>&mag=<minMag>&hours=<hours>
 */

interface UrlStateOptions {
  earthquakes: GlobePoint[];
  onSelectEarthquake: (eq: GlobePoint) => void;
  onSetFilters?: (filters: { minMagnitude: number; hours: number }) => void;
}

interface UrlState {
  /** Update URL hash when an earthquake is selected */
  setSharedEarthquake: (eq: GlobePoint | null) => void;
  /** Generate a shareable URL for the given earthquake */
  getShareUrl: (eq: GlobePoint) => string;
  /** Whether we restored state from URL on load */
  restoredFromUrl: boolean;
}

function parseHash(): Record<string, string> {
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  const params: Record<string, string> = {};
  for (const part of hash.split('&')) {
    const [key, val] = part.split('=');
    if (key && val !== undefined) params[decodeURIComponent(key)] = decodeURIComponent(val);
  }
  return params;
}

function buildHash(params: Record<string, string>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length > 0 ? `#${parts.join('&')}` : '';
}

export function useUrlState({ earthquakes, onSelectEarthquake, onSetFilters }: UrlStateOptions): UrlState {
  const restoredRef = useRef(false);
  const pendingEqId = useRef<string | null>(null);

  // On mount: parse URL hash and restore state
  useEffect(() => {
    if (restoredRef.current) return;
    const params = parseHash();

    if (params.mag && onSetFilters) {
      const mag = parseFloat(params.mag);
      const hours = params.hours ? parseInt(params.hours, 10) : 168;
      if (!isNaN(mag)) onSetFilters({ minMagnitude: mag, hours });
    }

    if (params.eq) {
      pendingEqId.current = params.eq;
    }
  }, [onSetFilters]);

  // Resolve pending earthquake ID once data loads
  useEffect(() => {
    if (!pendingEqId.current || earthquakes.length === 0) return;

    const target = earthquakes.find(eq => eq.id === pendingEqId.current);
    if (target) {
      restoredRef.current = true;
      pendingEqId.current = null;
      onSelectEarthquake(target);
    }
  }, [earthquakes, onSelectEarthquake]);

  const setSharedEarthquake = useCallback((eq: GlobePoint | null) => {
    if (eq) {
      const newHash = buildHash({ eq: eq.id });
      window.history.replaceState(null, '', newHash || window.location.pathname);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const getShareUrl = useCallback((eq: GlobePoint) => {
    const base = window.location.origin + window.location.pathname;
    return `${base}#eq=${encodeURIComponent(eq.id)}`;
  }, []);

  return {
    setSharedEarthquake,
    getShareUrl,
    restoredFromUrl: restoredRef.current,
  };
}

export type { UrlState };
