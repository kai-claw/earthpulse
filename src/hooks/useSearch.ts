import { useState, useMemo, useCallback } from 'react';
import type { GlobePoint } from '../types';

export interface SearchState {
  query: string;
  setQuery: (q: string) => void;
  results: GlobePoint[];
  hasResults: boolean;
  resultCount: number;
  clearSearch: () => void;
}

/**
 * Fuzzy search over earthquake locations.
 * Matches against place names, case-insensitive.
 * Supports multiple space-separated terms (AND logic).
 */
export function useSearch(earthquakes: GlobePoint[]): SearchState {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return earthquakes;

    const terms = trimmed.split(/\s+/).filter(Boolean);

    return earthquakes.filter(eq => {
      const place = eq.place.toLowerCase();
      return terms.every(term => place.includes(term));
    });
  }, [earthquakes, query]);

  const clearSearch = useCallback(() => setQuery(''), []);

  return {
    query,
    setQuery,
    results,
    hasResults: results.length > 0,
    resultCount: results.length,
    clearSearch,
  };
}
