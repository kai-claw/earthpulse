# EarthPulse — Architecture

## Overview

EarthPulse is a real-time earthquake visualization built with React 19, Three.js, and react-globe.gl. It fetches live data from the USGS GeoJSON API, renders an interactive 3D globe with tectonic plates, and layers on emotional context through a mood system, seismic audio, network analysis, and energy heatmaps.

## Directory Structure

```
src/
├── main.tsx                          Entry point (10 LOC)
├── App.tsx                           App shell, layout orchestration (476 LOC)
├── App.css                           Global styles (3,231 LOC)
├── index.css                         Base reset & variables (58 LOC)
│
├── types/
│   └── index.ts                      All TypeScript interfaces & types (133 LOC)
│
├── utils/                            Pure utility modules — no React, independently testable
│   ├── constants.ts                  All magic numbers, timing, mood data, config (181 LOC)
│   ├── colors.ts                     Depth/magnitude → color/size mapping (37 LOC)
│   ├── formatting.ts                 Date/time, descriptions, freshness, impact (110 LOC)
│   ├── geo.ts                        Haversine distance, GeoJSON → GlobePoint conversion (51 LOC)
│   ├── statistics.ts                 Stats calculation, filtering, sorting (80 LOC)
│   ├── mood.ts                       Mood system, emotional context, poems (153 LOC)
│   ├── seismic.ts                    Ring generation, tour stops (52 LOC)
│   ├── audio.ts                      Web Audio tones, haptic feedback (109 LOC)
│   ├── clusters.ts                   Seismic network arcs, heatmap point generation (197 LOC)
│   ├── energy.ts                     Energy density calculations (159 LOC)
│   ├── export.ts                     Data export utilities (164 LOC)
│   ├── historical.ts                 Historical earthquake data & metadata (189 LOC)
│   ├── api.ts                        USGS & tectonic plate API clients (122 LOC)
│   ├── helpers.ts                    Barrel re-export for backward compat (42 LOC)
│   └── index.ts                      Full barrel export
│
├── hooks/                            Custom React hooks — encapsulate side effects & state machines
│   ├── useEarthquakeData.ts          Data fetching, filtering, mood, derived state (179 LOC)
│   ├── usePerformanceMonitor.ts      FPS tracking, auto-degradation (116 LOC)
│   ├── useUrlState.ts                URL sharing / deep linking (95 LOC)
│   ├── useTour.ts                    Guided tour state machine (87 LOC)
│   ├── useCinematic.ts              Cinematic autoplay state machine (81 LOC)
│   ├── useSearch.ts                  Earthquake search (43 LOC)
│   ├── useAutoRefresh.ts             Auto-refresh timer (66 LOC)
│   ├── useKeyboardShortcuts.ts       Central keyboard handler (64 LOC)
│   ├── useAudio.ts                   Audio context management (55 LOC)
│   └── index.ts                      Barrel export
│
├── components/                       React UI components
│   ├── Sidebar.tsx                   Tabbed control panel + details + charts (663 LOC)
│   ├── Globe.tsx                     3D globe (react-globe.gl + Three.js) (323 LOC)
│   ├── HistoricalGallery.tsx         Notable earthquakes browser (136 LOC)
│   ├── WelcomeOverlay.tsx            First-visit educational intro (130 LOC)
│   ├── DepthProfile.tsx              Depth distribution chart (130 LOC)
│   ├── MagnitudeChart.tsx            Magnitude distribution chart (117 LOC)
│   ├── ErrorBoundary.tsx             WebGL crash recovery (112 LOC)
│   ├── ActivitySummary.tsx           Regional activity summary (103 LOC)
│   ├── SearchBar.tsx                 Earthquake search bar (89 LOC)
│   ├── MoodIndicator.tsx             Ambient mood orb + badges (66 LOC)
│   └── ShareButton.tsx               URL share button (71 LOC)
│
└── __tests__/                        333 tests across 9 test files
    ├── helpers.test.ts               Core utility tests (44)
    ├── api.test.ts                   API type validation (7)
    ├── blackhat.test.ts              Bug/edge-case tests (25)
    ├── greenhat.test.ts              Feature tests (19)
    ├── redhat.test.ts                Feel/UX tests (39)
    ├── bluehat.test.ts               Architecture tests (40)
    ├── greenhat2.test.ts             Creative feature tests (28)
    ├── blackhat2.test.ts             Stress/perf tests (89)
    └── yellowhat2.test.ts            Polish/integration tests (42)
```

## Design Decisions

### Modular Utils
The `utils/` directory contains pure functions with no React dependency. Every module is independently importable and testable. `helpers.ts` exists as a barrel re-export for backward compatibility.

### Hook Composition
Each feature (tour, cinematic, audio, search, auto-refresh, perf monitor) lives in its own custom hook. `App.tsx` composes them together, keeping the shell thin.

### Lazy Globe
`Globe.tsx` is loaded via `React.lazy` + `Suspense` since it pulls in Three.js and react-globe.gl (~1.8MB). The rest of the app renders instantly.

### Stable Accessors
Globe visualization accessors (ring/arc/heatmap/plate color/size/altitude functions) are extracted to module scope to prevent Three.js object recreation on every React render.

### Adaptive Performance
`usePerformanceMonitor` tracks FPS via `requestAnimationFrame` sampling. If sustained FPS drops below 30 for 5+ seconds, it auto-disables seismic network and energy heatmap layers.

### Mood System
Earthquake activity is scored into 6 moods (serene → fierce) using weighted magnitude/count/significance. The mood drives ambient background color, indicator orb, and contextual text.

## Data Flow

```
USGS GeoJSON API ──→ useEarthquakeData ──→ filtering + mood scoring
                                             ├── Globe (3D points, rings, arcs, heatmap, plates)
                                             ├── Sidebar (stats, details, controls, charts)
                                             ├── MoodIndicator (ambient orb + text)
                                             └── Status bar (count, refresh timer, FPS)
```
