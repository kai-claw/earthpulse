import { Search, X } from 'lucide-react';
import type { GlobePoint } from '../types';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onClear: () => void;
  resultCount: number;
  totalCount: number;
  results: GlobePoint[];
  onSelectResult: (eq: GlobePoint) => void;
}

export default function SearchBar({
  query,
  onQueryChange,
  onClear,
  resultCount,
  totalCount,
  results,
  onSelectResult,
}: SearchBarProps) {
  const isFiltering = query.trim().length > 0;
  const topResults = isFiltering ? results.slice(0, 8) : [];

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search locations…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search earthquake locations"
          role="searchbox"
        />
        {isFiltering && (
          <button
            className="search-clear"
            onClick={onClear}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isFiltering && (
        <div className="search-meta" aria-live="polite">
          {resultCount} of {totalCount} earthquakes
        </div>
      )}

      {topResults.length > 0 && (
        <ul className="search-results" role="listbox" aria-label="Search results">
          {topResults.map((eq) => (
            <li
              key={eq.id}
              className="search-result-item"
              role="option"
              tabIndex={0}
              onClick={() => onSelectResult(eq)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectResult(eq);
                }
              }}
            >
              <span className={`search-mag mag-${eq.magnitude >= 6 ? 'major' : eq.magnitude >= 4 ? 'moderate' : 'minor'}`}>
                M{eq.magnitude.toFixed(1)}
              </span>
              <span className="search-place">{eq.place}</span>
            </li>
          ))}
          {resultCount > 8 && (
            <li className="search-more">+{resultCount - 8} more</li>
          )}
        </ul>
      )}

      {isFiltering && resultCount === 0 && (
        <div className="search-empty">No earthquakes found for "{query}"</div>
      )}
    </div>
  );
}
