# EarthPulse — Audit Baseline (Pass 1/10 White Hat)

## Codebase Summary
| Metric | Value |
|---|---|
| Source LOC | ~1,797 |
| Source files | 7 (App.tsx, Globe.tsx, Sidebar.tsx, types/index.ts, api.ts, helpers.ts, index.css) |
| Tests | 51 (2 test files) |
| TypeScript errors | 0 |
| Bundle (JS) | 2,046 KB (589 KB gzip) |
| Bundle (CSS) | 9.7 KB (2.6 KB gzip) |
| Dependencies | react, react-dom, three, @react-three/fiber, @react-three/drei, react-globe.gl, date-fns, lucide-react |

## Architecture
- **Globe**: `react-globe.gl` wrapper rendering earthquake points + tectonic plate paths
- **Sidebar**: Tabbed panel (Controls, Stats, Info) with filters, time-lapse, animation speed
- **API**: Fetches from USGS GeoJSON endpoint; tectonic plates are hardcoded simplified data
- **Data flow**: App.tsx orchestrates fetch → filter → Globe + Sidebar

## Known Issues (to address in later passes)
1. **Massive bundle**: 2MB JS — react-globe.gl + three.js dominate. No code splitting.
2. **Hardcoded tectonic plates**: api.ts returns static simplified data, not real plate boundaries.
3. **Globe.tsx `any` types**: `globeEl.current`, `point` callbacks typed as `any`.
4. **`window.innerWidth * 0.7`**: Globe width hardcoded, no responsive resize handling.
5. **No ARIA/accessibility**: No keyboard shortcuts, no ARIA roles/labels, no focus management.
6. **No error boundary**: Error state in App but no React ErrorBoundary.
7. **No mobile responsive**: Sidebar collapse at 768px but Globe width is hardcoded.
8. **Sidebar `handleFilterChange` value typed `any`**: Type-unsafe filter update.
9. **No prefers-reduced-motion**: Animations always run.
10. **Auto-refresh `fetchData` dependency**: useEffect with `fetchData` in dependency triggers extra re-renders.
11. **No tests for components**: Only helpers/types tested so far.
12. **react-globe.gl has React 19 compat concerns**: Using `ref` on class-based component.

## What Was Added (Pass 1)
- Vitest with 51 tests (helpers.test.ts: 44, api.test.ts: 7)
- CI/CD GitHub Actions workflow (typecheck + test + build + deploy)
- Custom SVG favicon (globe with seismic pulse)
- HTML: loading spinner, noscript fallback, JSON-LD, comprehensive SEO/OG/Twitter meta
- robots.txt, sitemap.xml, 404.html with SPA redirect
- MIT LICENSE
- Package metadata (version, homepage, repository, keywords, scripts)
- AUDIT.md (this file)
