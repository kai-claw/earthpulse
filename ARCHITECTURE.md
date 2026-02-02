# EarthPulse — Architecture

## Overview

EarthPulse is a real-time earthquake visualization built with React, Three.js, and react-globe.gl. It fetches live data from USGS, renders an interactive 3D globe, and layers on emotional context through a mood system.

## Directory Structure

```
src/
├── main.tsx                    Entry point
├── App.tsx                     App shell, layout orchestration (331 LOC)
├── App.css                     Global styles
├── index.css                   Base styles
│
├── types/
│   └── index.ts                All TypeScript interfaces & types (133 LOC)
│
├── utils/
│   ├── constants.ts            All magic numbers, timing, mood data, config (150 LOC)
│   ├── colors.ts               Depth/magnitude → color/size mapping (35 LOC)
│   ├── formatting.ts           Date/time, descriptions, freshness, impact (110 LOC)
│   ├── geo.ts                  Haversine distance, GeoJSON → GlobePoint (55 LOC)
│   ├── statistics.ts           Stats calculation, filtering, sorting (75 LOC)
│   ├── mood.ts                 Mood system, emotional context, poems (170 LOC)
│   ├── seismic.ts              Ring generation, tour stops (55 LOC)
│   ├── audio.ts                Web Audio tones, haptic feedback (100 LOC)
│   ├── api.ts                  USGS & tectonic plate API clients (75 LOC)
│   ├── helpers.ts              Barrel re-export (backward compat)
│   └── index.ts                Full barrel re-export
│
├── hooks/
│   ├── useEarthquakeData.ts    Data fetching, filtering, mood, derived state (172 LOC)
│   ├── useTour.ts              Guided tour state machine (88 LOC)
│   ├── useCinematic.ts         Cinematic autoplay state machine (74 LOC)
│   ├── useAudio.ts             Audio context management (37 LOC)
│   ├── useKeyboardShortcuts.ts Central keyboard handler (56 LOC)
│   └── index.ts                Barrel export
│
├── components/
│   ├── Globe.tsx               3D globe (Three.js / react-globe.gl) (205 LOC)
│   ├── Sidebar.tsx             Tabbed control panel + details (525 LOC)
│   ├── MoodIndicator.tsx       Ambient mood orb + badges (66 LOC)
│   └── ErrorBoundary.tsx       WebGL crash recovery (112 LOC)
│
└── __tests__/
    ├── helpers.test.ts         Core utility tests (44 tests)
    ├── api.test.ts             API type validation (7 tests)
    ├── blackhat.test.ts        Bug/edge-case tests (25 tests)
    ├── greenhat.test.ts        Feature tests (19 tests)
    ├── redhat.test.ts          Feel/UX tests (39 tests)
    └── bluehat.test.ts         Architecture tests (65 tests)
```

## Key Design Decisions

### Hook Extraction
All state management is in custom hooks. `App.tsx` is a pure orchestrator — it composes hooks and passes props. No business logic in the component tree root.

### Utils Module Split (Blue Hat refactor)
The original `helpers.ts` was 591 LOC — a grab-bag of unrelated concerns. It was split into 8 focused modules:
- **constants.ts** — Single source of truth for all magic numbers
- **colors.ts** — Pure color/size mapping functions
- **formatting.ts** — Date/time/description formatters
- **geo.ts** — Geographic calculations + USGS data conversion
- **statistics.ts** — Statistics aggregation + filtering
- **mood.ts** — Emotional mood system
- **seismic.ts** — Ring generation + tour stop selection
- **audio.ts** — Web Audio + haptics

`helpers.ts` remains as a barrel re-export for backward compatibility.

### Code Splitting
- Globe (Three.js) is `React.lazy()` loaded
- Vite manual chunks: three, react-globe.gl, lucide-react, date-fns
- Test files excluded from production tsconfig via `exclude: ["src/__tests__"]`

### Component Architecture
- **Globe** — Thin wrapper around react-globe.gl with ResizeObserver-driven dimensions
- **Sidebar** — Receives all state as props (no internal data fetching)
- **MoodIndicator** — Presentational; reads mood state from props
- **ErrorBoundary** — Class component with WebGL-specific crash detection
