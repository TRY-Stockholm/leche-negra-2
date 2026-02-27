# Performance Optimization Design

**Date:** 2026-02-27
**Scope:** Comprehensive optimization (Approach B) — all critical + moderate issues
**Constraint:** Preserve the existing experience. No visual or interaction regressions.

## Context

Full performance audit of the Leche Negra restaurant website identified 5 critical, 12 moderate, and 6 minor issues across CSS paint performance, React rendering, font loading, and asset optimization. The user reports animation sluggishness primarily in the menu panel.

## 1. CSS & Paint Performance

### 1.1 Scoped Theme Transitions

**Problem:** `theme.css` applies `transition: background-color, color, border-color, filter` to `*` (every DOM element). Theme changes trigger hundreds of independent transitions including the expensive `filter` property.

**Fix:** Replace the `*` selector with targeted selectors for elements that actually change during theme switches (body, main wrapper, nav, menu buttons). Remove `filter` from the transition list entirely.

### 1.2 Neon Logo Rendering

**Problem:** Triple `drop-shadow` filter with infinite `neon-flicker` animation. During long-press, `setInterval` at 30ms triggers 33 React re-renders/second under heavy filters.

**Fix:**
- Replace `setInterval` + `setState` with a single `requestAnimationFrame` loop writing directly to a CSS custom property (zero React re-renders)
- Add `will-change: filter` to promote the logo to its own compositing layer

### 1.3 MenuPanel Height Animation

**Problem:** Animating `height: 0` → `height: "auto"` triggers layout recalculation on every frame (~36 layout recalcs over 0.6s). This is the primary source of perceived jank.

**Fix:** Switch to a grid-based or `max-height` approach, or use Motion's layout animation with `transform: scaleY()` (GPU-composited, no layout thrashing).

## 2. React Rendering & Memoization

### 2.1 Memoize Child Components

**Problem:** `PageContent` holds 4 state variables + context consumer. Any change re-renders the entire tree — none of the children are wrapped in `React.memo()`.

**Fix:** Add `React.memo()` to `NavBar`, `Footer`, `NeonLogo`, `CassetteTape`, `CassettePlayer`. Stabilize callback props with `useCallback`.

### 2.2 Stabilize TapeDeckContext Provider Value

**Problem:** Context value is a new object literal on every render, forcing all consumers to re-render on any state change.

**Fix:** Wrap provider value in `useMemo` keyed to actual state values.

### 2.3 Memoize CassetteTapeSVG String Replacement

**Problem:** `svgContent.replaceAll(...)` runs on every render × 4 tapes.

**Fix:** Wrap in `useMemo` keyed to `svgContent` and `tape.accent`.

### 2.4 Fix CassettePlayer ResizeObserver Churn

**Problem:** During drag, spring value changes fire `registerDeckRef` on every animation frame, disconnecting/reconnecting a `ResizeObserver` ~60 times/second.

**Fix:** Call `registerDeckRef` once on mount/unmount. Use `updateDeckPos` for position updates during drag.

## 3. Font Loading & Asset Optimization

### 3.1 Replace CSS @import with next/font

**Problem:** Two render-blocking `@import url()` statements fetch fonts from external domains, requiring DNS + connection + TLS before any text renders.

**Fix:** Use `next/font/google` for Playfair Display and `next/font/local` for General Sans. Eliminates external requests.

### 3.2 Trim Unused Font Weights

**Problem:** Playfair Display loads 8 variants, General Sans loads 6 weights. Codebase primarily uses 400, 500, 600.

**Fix:** Load only weights actually used.

### 3.3 Remove styled-components

**Problem:** Listed in `package.json` but never imported. Dead weight.

**Fix:** `npm uninstall styled-components`.

### 3.4 CustomCursor Touch Device Skip

**Problem:** Custom cursor loads on all pages including touch devices — fetches 4 SVGs, sets up 5 event listeners + MutationObserver for zero benefit.

**Fix:** Early-return if `(hover: hover)` media query doesn't match. Batch the 4 `setState` calls on theme change into one.

### 3.5 Cache Weather API

**Problem:** `useWeather` fetches on every page load with no caching.

**Fix:** Move to a Next.js Route Handler with `revalidate` caching (~30 min).

## Explicitly Out of Scope

- **Server/client component split** — High risk of hydration mismatches with theme system and tape deck context
- **next/image on main page** — Images are small decorative elements; minimal benefit, potential issues with GIFs and motion-wrapped elements
- **Removing noise overlay** — Deliberate design choice, low compositing cost
- **Restructuring Motion usage** — Used correctly, tree-shakable
- **Deleting Boombox component** — Unused but harmless; may be wanted later
