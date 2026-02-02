# 🌍 EarthPulse — Real-Time Seismic Globe

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-333_passing-22c55e?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bundle](https://img.shields.io/badge/Bundle-263KB_(83KB_gzip)-orange)](https://kai-claw.github.io/earthpulse/)

An interactive 3D globe visualizing real-time earthquake activity from the USGS, enriched with tectonic plate boundaries, seismic network analysis, energy heatmaps, emotional context, and cinematic exploration modes. Live data, living planet.

**[→ View EarthPulse Live](https://kai-claw.github.io/earthpulse/)**

---

## ✨ Features

### 🌐 Core Visualization

| Feature | Description |
|---|---|
| **3D Interactive Globe** | Drag to rotate, scroll to zoom, click earthquakes for details |
| **Live USGS Data** | Real-time earthquake feed with auto-refresh every 5 minutes |
| **Tectonic Plates** | Live boundary data from [fraxen/tectonicplates](https://github.com/fraxen/tectonicplates) GeoJSON |
| **Visual Encoding** | Magnitude → dot size, depth → color (red=shallow, blue=deep) |
| **Time Filtering** | Last hour to last month, plus magnitude threshold slider |
| **Time-Lapse** | Chronological playback of earthquake sequence |
| **Fly-To** | Click any quake to smoothly fly the globe to its location |

### 🎨 Visual & Interactive

| Feature | Description |
|---|---|
| **Seismic Ring Waves** | Animated expanding rings from M3+ epicenters |
| **Seismic Network** | Connection arcs between spatially/temporally close quakes (≤300km, ≤48h) |
| **3D Energy Heatmap** | Elevated thermal visualization of seismic energy density (∝ 10^(1.5×M)) |
| **Mood System** | 6 ambient moods (serene → fierce) with reactive background, orb, and text |
| **Seismic Audio** | 4-layer audio engine: sub-bass + fundamental + harmonic + crack transient |
| **Haptic Feedback** | Vibration patterns on mobile matching earthquake magnitude |
| **Screen Tremor** | CSS shake for M5+/M6+ earthquakes on selection |
| **Emotional Context** | Freshness badges, human impact text, distance-to-user |

### 🎬 Experience Modes

| Feature | Description |
|---|---|
| **Guided Tour** | Auto-flies through top 8 biggest quakes with info cards and progress bar |
| **Cinematic Autoplay** | Cycles top 12 quakes every 14s with floating badge and smooth transitions |
| **Welcome Overlay** | First-visit educational introduction |
| **Historical Gallery** | Browse notable historical earthquakes with fly-to |

### ⚡ Performance & Polish

| Feature | Description |
|---|---|
| **Lazy-Loaded Globe** | Three.js/react-globe.gl code-split via `React.lazy` |
| **Memoized Layers** | Rings, arcs, heatmap, plates — all wrapped in `useMemo` |
| **Stable Accessor Refs** | 20+ module-level functions prevent Three.js object churn |
| **Wall Mask / Pre-Sort** | Timelapse pre-sorted, render allocations eliminated |
| **Adaptive PerformanceMonitor** | Auto-disables network/heatmap at sustained <30 FPS |
| **Debounced Filters** | 300ms debounce on filter changes to prevent API hammering |
| **Error Boundary** | WebGL crash recovery with retry |
| **Full Accessibility** | ARIA roles/labels, keyboard nav, focus-visible, reduced-motion |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| <kbd>Space</kbd> | Toggle time-lapse playback |
| <kbd>R</kbd> | Reset time-lapse |
| <kbd>P</kbd> | Toggle sidebar panel |
| <kbd>G</kbd> | Start/stop guided tour |
| <kbd>C</kbd> | Toggle cinematic autoplay |
| <kbd>N</kbd> | Toggle seismic network arcs |
| <kbd>X</kbd> | Toggle 3D energy heatmap |
| <kbd>W</kbd> | Toggle seismic ring waves |
| <kbd>A</kbd> | Toggle seismic audio |
| <kbd>Esc</kbd> | Close details / stop tour / exit cinematic |

---

## 🏗️ Architecture

```
src/
├── main.tsx                          Entry point
├── App.tsx                           App shell, layout orchestration (474 LOC)
├── App.css                           Global styles (3,214 LOC)
├── index.css                         Base reset & variables (58 LOC)
│
├── types/
│   └── index.ts                      All TypeScript interfaces (133 LOC)
│
├── utils/
│   ├── constants.ts                  Magic numbers, timing, mood data (181 LOC)
│   ├── colors.ts                     Depth/magnitude → color/size (34 LOC)
│   ├── formatting.ts                 Date/time, descriptions, freshness (110 LOC)
│   ├── geo.ts                        Haversine distance, GeoJSON conversion (51 LOC)
│   ├── statistics.ts                 Stats calculation, filtering, sorting (73 LOC)
│   ├── mood.ts                       Mood system, emotional context (153 LOC)
│   ├── seismic.ts                    Ring generation, tour stops (52 LOC)
│   ├── audio.ts                      Web Audio tones, haptic feedback (109 LOC)
│   ├── clusters.ts                   Seismic network arcs, heatmap points (197 LOC)
│   ├── energy.ts                     Energy density calculations (159 LOC)
│   ├── export.ts                     Data export utilities (164 LOC)
│   ├── historical.ts                 Historical earthquake data (189 LOC)
│   ├── api.ts                        USGS & tectonic plate API clients (122 LOC)
│   ├── helpers.ts                    Barrel re-export (backward compat)
│   └── index.ts                      Full barrel export
│
├── hooks/
│   ├── useEarthquakeData.ts          Data fetching, filtering, mood (179 LOC)
│   ├── usePerformanceMonitor.ts      FPS tracking, auto-degradation (116 LOC)
│   ├── useUrlState.ts                URL sharing / deep linking (95 LOC)
│   ├── useTour.ts                    Guided tour state machine (87 LOC)
│   ├── useCinematic.ts              Cinematic autoplay state machine (81 LOC)
│   ├── useSearch.ts                  Earthquake search (71 LOC)
│   ├── useKeyboardShortcuts.ts       Central keyboard handler (60 LOC)
│   ├── useAutoRefresh.ts             Auto-refresh timer (53 LOC)
│   ├── useAudio.ts                   Audio context management (37 LOC)
│   └── index.ts                      Barrel export
│
├── components/
│   ├── Sidebar.tsx                   Tabbed control panel + details (663 LOC)
│   ├── Globe.tsx                     3D globe (react-globe.gl) (323 LOC)
│   ├── WelcomeOverlay.tsx            First-visit introduction (130 LOC)
│   ├── DepthProfile.tsx              Depth distribution chart (130 LOC)
│   ├── HistoricalGallery.tsx         Notable earthquakes browser (136 LOC)
│   ├── MagnitudeChart.tsx            Magnitude distribution chart (117 LOC)
│   ├── ErrorBoundary.tsx             WebGL crash recovery (112 LOC)
│   ├── ActivitySummary.tsx           Regional activity summary (103 LOC)
│   ├── MoodIndicator.tsx             Ambient mood orb + badges (89 LOC)
│   ├── SearchBar.tsx                 Earthquake search bar (89 LOC)
│   └── ShareButton.tsx               URL share button
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

### Data Flow

```
USGS GeoJSON API ──→ useEarthquakeData ──→ filtering + mood scoring
                                             ├── Globe (3D points, rings, arcs, heatmap, plates)
                                             ├── Sidebar (stats, details, controls, charts)
                                             ├── MoodIndicator (ambient orb + text)
                                             └── Status bar (count, refresh timer, FPS)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript 5 |
| **Build** | Vite 6 |
| **3D Rendering** | Three.js + react-globe.gl |
| **R3F Utilities** | @react-three/fiber + @react-three/drei |
| **Icons** | Lucide React |
| **Date Handling** | date-fns |
| **Testing** | Vitest (333 tests) |
| **CI/CD** | GitHub Actions → GitHub Pages |
| **Data Source** | USGS Earthquake API (real-time GeoJSON) |
| **Tectonic Data** | fraxen/tectonicplates (GeoJSON) |

---

## 🌊 Science Concepts

| Concept | Implementation |
|---|---|
| **Richter Scale** | 8 magnitude categories (micro → great) with descriptions |
| **Depth Classification** | Shallow (<35km), Intermediate (35–70km), Deep (>70km) color encoding |
| **Seismic Energy** | E ∝ 10^(1.5×M) — used for heatmap weight normalization |
| **Haversine Formula** | Great-circle distance for network arc proximity (R = 6,371 km) |
| **CFL-like Stability** | Network arcs capped at 120 for rendering stability |
| **Tectonic Plates** | Real PB2002 boundary data (Bird, 2003) rendered as animated paths |
| **Doppler / Cascading** | Network reveals fault-line cascade patterns via spatiotemporal clustering |
| **Mood Scoring** | Weighted: 50% max magnitude + 30% count + 20% significance sum |

---

## 📊 Bundle Stats

| Chunk | Size | Gzip |
|---|---|---|
| `index.js` (app) | 263 KB | 83 KB |
| `Globe.js` (lazy) | 5.4 KB | 2.4 KB |
| `vendor-three.js` | 569 KB | 146 KB |
| `vendor-globe.js` | 1,239 KB | 369 KB |
| `vendor-icons.js` | 16 KB | 6 KB |
| `vendor-date.js` | 19 KB | 6 KB |
| **CSS** | 47 KB | 9 KB |

---

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/kai-claw/earthpulse.git
cd earthpulse

# Install
npm install

# Development
npm run dev          # → http://localhost:5173

# Test
npm test             # 333 tests

# Build
npm run build        # Production build

# Deploy
npm run deploy       # → GitHub Pages
```

---

## 🌍 Data Sources

- **[USGS Earthquake API](https://earthquake.usgs.gov/fdsnws/event/1/)** — Real-time GeoJSON feed, updated within minutes of seismic events worldwide
- **[fraxen/tectonicplates](https://github.com/fraxen/tectonicplates)** — PB2002 tectonic plate boundary dataset (Bird, 2003)

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ for science education and earthquake awareness*
