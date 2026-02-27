# Performance Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Optimize page load, runtime animation smoothness, and bundle size while preserving the existing experience exactly.

**Architecture:** Targeted fixes across CSS (scoped transitions, compositing hints), React (memoization, stable context), font loading (next/font), and asset optimization (touch device skip, weather caching). No structural changes to component hierarchy.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, Motion (Framer Motion), TypeScript

---

### Task 1: Remove unused `styled-components` dependency

**Files:**
- Modify: `package.json:20`

**Step 1: Uninstall the package**

Run: `npm uninstall styled-components`

**Step 2: Verify build still works**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "perf: remove unused styled-components dependency"
```

---

### Task 2: Replace CSS `@import url()` fonts with `next/font`

**Files:**
- Create: `src/app/fonts.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/styles/fonts.css`
- Modify: `src/styles/theme.css:148-149,220,243,252,261,270,278,286`

**Step 1: Create font configuration file**

Create `src/app/fonts.ts`:

```typescript
import { Playfair_Display } from "next/font/google";
import localFont from "next/font/local";

export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

export const generalSans = localFont({
  src: [
    { path: "../fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-body",
});
```

Note: General Sans woff2 files must be downloaded from fontshare.com and placed in `src/fonts/`. If self-hosting isn't possible, use the fontshare CDN with `<link>` in layout instead of `@import`.

**Step 2: Update layout.tsx to apply font classes**

Modify `src/app/layout.tsx` to import fonts and apply CSS variable classes to `<html>`:

```typescript
import type { Metadata } from "next";
import "@/styles/index.css";
import { CustomCursor } from "./components/CustomCursor";
import { playfairDisplay, generalSans } from "./fonts";

export const metadata: Metadata = {
  title: "Leche Negra",
  description:
    "Leche Negra — a restaurant in Stockholm. Breakfast, lunch, dinner, and drinks on Engelbrektsgatan 3.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${generalSans.variable}`}>
      <body className="overflow-x-hidden">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
```

**Step 3: Remove CSS @import statements**

Replace contents of `src/styles/fonts.css` with an empty file (or remove the file and update `src/styles/index.css` import).

**Step 4: Update theme.css to use CSS variables for font families**

In `src/styles/theme.css`, replace all hardcoded font-family declarations with `var(--font-display)` and `var(--font-body)`. The `@theme inline` block already defines `--font-display` and `--font-body`, so update the fallback values there:

```css
--font-display: var(--font-display), "Georgia", "Times New Roman", serif;
--font-body: var(--font-body), "Helvetica Neue", "Arial", sans-serif;
```

And in `body`:
```css
font-family: var(--font-body);
```

And each heading (`h1`–`h4`):
```css
font-family: var(--font-display);
```

And `h5`, `h6`:
```css
font-family: var(--font-body);
```

**Step 5: Verify fonts render correctly**

Run: `npm run dev`
Check: All text renders with correct fonts. No FOUT. Inspect Network tab — no requests to `fonts.googleapis.com` or `api.fontshare.com`.

**Step 6: Commit**

```bash
git add src/app/fonts.ts src/app/layout.tsx src/styles/fonts.css src/styles/theme.css src/fonts/
git commit -m "perf: replace render-blocking @import fonts with next/font"
```

---

### Task 3: Scope theme CSS transitions to specific elements

**Files:**
- Modify: `src/styles/theme.css:208-216`

**Step 1: Replace global `*` transition with targeted selectors**

In `src/styles/theme.css`, replace:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
    transition:
      background-color 0.8s ease,
      color 0.8s ease,
      border-color 0.8s ease,
      filter 0.8s ease;
  }
```

With:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body,
  nav,
  footer,
  .bg-background {
    transition:
      background-color 0.8s ease,
      color 0.8s ease,
      border-color 0.8s ease;
  }
```

Key changes:
- Removed `filter 0.8s ease` entirely (expensive, forces compositing per element)
- Scoped transitions to `body`, `nav`, `footer`, and `.bg-background` (the main wrapper div)
- The `@apply border-border outline-ring/50` stays on `*` (no transition needed for these)

**Step 2: Verify theme switching still looks smooth**

Run: `npm run dev`
Check: Click each menu button (Breakfast, Lunch, Dinner, Drinks). Theme background and text should still smoothly transition. The transition should feel identical but snappier.

**Step 3: Commit**

```bash
git add src/styles/theme.css
git commit -m "perf: scope theme transitions to specific elements, remove filter transition"
```

---

### Task 4: Optimize NeonLogo long-press with rAF instead of setInterval+setState

**Files:**
- Modify: `src/app/components/NeonLogo.tsx:38-66,89-103`

**Step 1: Replace setInterval + setState with rAF + CSS custom property**

Replace the `intensity` state and `startHold` callback. Instead of `useState` for `intensity`, use a ref and write directly to a CSS custom property on the SVG element via a ref.

In `NeonLogo.tsx`, remove `const [intensity, setIntensity] = useState(0)` (line 39). Add `const svgRef = useRef<SVGSVGElement>(null)` and `const intensityRef = useRef(0)`.

Replace the `startHold` callback (lines 54-67):

```typescript
const startHold = useCallback(() => {
  setPressed(true);
  triggeredRef.current = false;
  intensityRef.current = 0;
  const start = performance.now();
  const tick = () => {
    const elapsed = performance.now() - start;
    const t = Math.min(elapsed / 2500, 1);
    intensityRef.current = t;
    const el = svgRef.current;
    if (el) {
      el.style.setProperty("--flicker-dur", `${0.6 - t * 0.52}s`);
      el.style.setProperty("--vibrate-dur", `${0.05 - t * 0.03}s`);
      el.style.setProperty("--char-flicker-dur", `${2 - t * 1.6}s`);
    }
    if (t >= 1 && !triggeredRef.current) {
      triggeredRef.current = true;
      onLongPressComplete?.();
    }
    if (t < 1) {
      rafRef.current = requestAnimationFrame(tick);
    }
  };
  rafRef.current = requestAnimationFrame(tick);
}, [onLongPressComplete]);
```

Replace `endHold` to cancel rAF:

```typescript
const endHold = useCallback(() => {
  setPressed(false);
  intensityRef.current = 0;
  if (rafRef.current) {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }
  const el = svgRef.current;
  if (el) {
    el.style.removeProperty("--flicker-dur");
    el.style.removeProperty("--vibrate-dur");
    el.style.removeProperty("--char-flicker-dur");
  }
  if (triggeredRef.current) {
    onLongPressEnd?.();
  }
}, [onLongPressEnd]);
```

Remove the `style` prop on `motion.svg` that computed `flickerDuration`/`vibrateDuration` from state (lines 99-103). Add `ref={svgRef}` to the `motion.svg`.

Also remove the `const flickerDuration` and `const vibrateDuration` lines (89-90).

Update the cleanup effect (lines 81-85) to cancel rAF instead of clearInterval.

**Step 2: Add `will-change: filter` to neon-logo CSS**

In `src/styles/theme.css`, add to `.neon-logo` (line 360):

```css
.neon-logo {
  will-change: filter, opacity;
  /* ...existing filter and animation... */
}
```

**Step 3: Verify long-press still works**

Run: `npm run dev`
Check: Long-press the logo. The neon glow should intensify progressively, then trigger the easter egg. The animation should feel smoother (no React re-renders during the hold).

**Step 4: Commit**

```bash
git add src/app/components/NeonLogo.tsx src/styles/theme.css
git commit -m "perf: replace NeonLogo setInterval+setState with rAF+CSS custom properties"
```

---

### Task 5: Fix MenuPanel height animation jank

**Files:**
- Modify: `src/app/components/MenuPanel.tsx:44-50`

**Step 1: Switch from height animation to grid-based approach**

Replace the `initial/animate/exit` on the `motion.div` (lines 44-50). Use CSS grid with `grid-template-rows: 0fr` → `1fr` which is GPU-compositable:

```typescript
<motion.div
  key={activeMenu}
  initial={{ gridTemplateRows: "0fr", opacity: 0 }}
  animate={{ gridTemplateRows: "1fr", opacity: 1 }}
  exit={{ gridTemplateRows: "0fr", opacity: 0 }}
  transition={{
    gridTemplateRows: { duration: 0.6, ease: EASE_OUT_EXPO },
    opacity: { duration: 0.4, ease: "easeInOut" },
  }}
  onAnimationComplete={...}
  className="grid"
>
  <div className="overflow-hidden">
    {/* ...existing panel content... */}
  </div>
</motion.div>
```

Note: If Motion doesn't support `gridTemplateRows` animation well, fall back to using a measured `max-height` approach: measure the content height once with a ref, then animate `max-height: 0` → `max-height: ${measured}px`. This avoids the `height: "auto"` problem while giving a concrete pixel target.

**Step 2: Verify menu panel opens/closes smoothly**

Run: `npm run dev`
Check: Click each menu (Breakfast, Lunch, Dinner, Drinks). Panel should expand and collapse smoothly. On mobile, auto-scroll to end should still work.

**Step 3: Commit**

```bash
git add src/app/components/MenuPanel.tsx
git commit -m "perf: replace MenuPanel height:auto animation with grid-based approach"
```

---

### Task 6: Memoize child components and stabilize callbacks in page.tsx

**Files:**
- Modify: `src/app/components/NavBar.tsx`
- Modify: `src/app/components/footer/Footer.tsx`
- Modify: `src/app/components/NeonLogo.tsx`
- Modify: `src/app/components/tape-deck/CassettePlayer.tsx`
- Modify: `src/app/components/tape-deck/CassetteTape.tsx`
- Modify: `src/app/components/MenuPanel.tsx`
- Modify: `src/app/page.tsx:94-99`

**Step 1: Wrap components in React.memo**

For each component, add `React.memo` wrapper. Example pattern:

```typescript
// NavBar.tsx — wrap the export
export const NavBar = memo(function NavBar({ weather, bookingUrl }: NavBarProps) {
  // ...existing code...
});
```

Apply to: `NavBar`, `Footer`, `NeonLogo`, `CassettePlayer`, `CassetteTape`, `MenuPanel`.

Import `memo` from React in each file.

**Step 2: Stabilize the onLongPressComplete callback in page.tsx**

Replace the inline lambda (lines 94-99) with a `useCallback`:

```typescript
const handleLongPressComplete = useCallback(() => {
  const picked = pickScene(lastSceneIdRef.current);
  lastSceneIdRef.current = picked.id;
  setScene(picked);
  setEasterEgg(true);
}, []);
```

Then use `onLongPressComplete={handleLongPressComplete}` in JSX.

**Step 3: Verify no regressions**

Run: `npm run dev`
Check: All interactions work — menu opening, tape dragging, logo press, footer tentacle.

**Step 4: Commit**

```bash
git add src/app/components/NavBar.tsx src/app/components/footer/Footer.tsx src/app/components/NeonLogo.tsx src/app/components/tape-deck/CassettePlayer.tsx src/app/components/tape-deck/CassetteTape.tsx src/app/components/MenuPanel.tsx src/app/page.tsx
git commit -m "perf: memoize child components and stabilize callback props"
```

---

### Task 7: Stabilize TapeDeckContext provider value with useMemo

**Files:**
- Modify: `src/app/components/tape-deck/TapeDeckContext.tsx:137-152`

**Step 1: Wrap provider value in useMemo**

Replace the inline object literal in the Provider value prop:

```typescript
const value = useMemo(() => ({
  loadedTapeId,
  playing,
  nearDeckId,
  deckPosRef,
  nearDeckIdRef,
  registerDeckRef,
  handleTapeDrag,
  handleTapeDragEnd,
  play,
  pause,
  eject,
}), [loadedTapeId, playing, nearDeckId, registerDeckRef, handleTapeDrag, handleTapeDragEnd, play, pause, eject]);

return (
  <TapeDeckContext.Provider value={value}>
    {children}
  </TapeDeckContext.Provider>
);
```

Note: `deckPosRef` and `nearDeckIdRef` are stable refs and don't need to be in the dependency array.

Import `useMemo` from React.

**Step 2: Verify tape deck interactions work**

Run: `npm run dev`
Check: Drag tapes near the player — proximity glow appears. Drop tape — it loads and plays. Eject works.

**Step 3: Commit**

```bash
git add src/app/components/tape-deck/TapeDeckContext.tsx
git commit -m "perf: stabilize TapeDeckContext provider value with useMemo"
```

---

### Task 8: Memoize CassetteTapeSVG string replacement

**Files:**
- Modify: `src/app/components/tape-deck/CassetteTape.tsx:29`

**Step 1: Wrap replaceAll in useMemo**

Replace line 29:

```typescript
const colored = svgContent?.replaceAll('fill="#fff"', `fill="${tape.accent}"`) ?? null
```

With:

```typescript
const colored = useMemo(
  () => svgContent?.replaceAll('fill="#fff"', `fill="${tape.accent}"`) ?? null,
  [svgContent, tape.accent],
);
```

Import `useMemo` from React (add to the existing import on line 1).

**Step 2: Verify tapes render with correct colors**

Run: `npm run dev`
Check: All 4 cassette tapes show their correct accent colors.

**Step 3: Commit**

```bash
git add src/app/components/tape-deck/CassetteTape.tsx
git commit -m "perf: memoize CassetteTapeSVG color replacement"
```

---

### Task 9: Fix CassettePlayer ResizeObserver churn during drag

**Files:**
- Modify: `src/app/components/tape-deck/CassettePlayer.tsx:74-79`

**Step 1: Replace spring-change listener with updateDeckPos**

Replace lines 74-79:

```typescript
// Re-register on drag spring changes so deck position stays in sync
useEffect(() => {
  const unsub = dragSpringX.on('change', () => { registerDeckRef(deckSlotRef.current) })
  const unsub2 = dragSpringY.on('change', () => { registerDeckRef(deckSlotRef.current) })
  return () => { unsub(); unsub2() }
}, [dragSpringX, dragSpringY, registerDeckRef])
```

With:

```typescript
// Keep deck position in sync during drag animation
const { updateDeckPos } = useTapeDeck()
useEffect(() => {
  const unsub = dragSpringX.on('change', updateDeckPos)
  const unsub2 = dragSpringY.on('change', updateDeckPos)
  return () => { unsub(); unsub2() }
}, [dragSpringX, dragSpringY, updateDeckPos])
```

This requires exposing `updateDeckPos` from `TapeDeckContext`. Add it to the context type and the provider value.

**Step 2: Expose updateDeckPos from TapeDeckContext**

In `TapeDeckContext.tsx`, add `updateDeckPos` to the `TapeDeckContextValue` type and include it in the provider value.

**Step 3: Verify drag-to-load still works**

Run: `npm run dev`
Check: Drag a cassette tape near the player. Proximity detection should work while dragging the player itself.

**Step 4: Commit**

```bash
git add src/app/components/tape-deck/CassettePlayer.tsx src/app/components/tape-deck/TapeDeckContext.tsx
git commit -m "perf: fix ResizeObserver churn during CassettePlayer drag"
```

---

### Task 10: Skip CustomCursor initialization on touch devices + batch recolor

**Files:**
- Modify: `src/app/components/CustomCursor.tsx:60-155`

**Step 1: Add early return for touch-only devices**

At the top of the `CustomCursor` component, before any hooks, add a media query check. Since hooks can't be called conditionally, use a wrapper pattern:

```typescript
export function CustomCursor() {
  const [isHoverDevice, setIsHoverDevice] = useState(true);

  useEffect(() => {
    setIsHoverDevice(window.matchMedia("(hover: hover)").matches);
  }, []);

  if (!isHoverDevice) return null;

  return <CustomCursorInner />;
}
```

Move all existing logic into `CustomCursorInner`.

**Step 2: Batch the 4 setState calls on theme change**

In the `recolor` function (lines 139-143), use `ReactDOM.flushSync` is not needed since React 18+ auto-batches. But we can optimize further by computing all 4 values first and setting them in a single render cycle. Since React already batches in event handlers and effects, the 4 calls are already batched. However, we can avoid the 4 separate `getComputedStyle` calls by reading `--foreground` once:

```typescript
const recolor = () => {
  const fg = getComputedStyle(document.documentElement)
    .getPropertyValue("--foreground")
    .trim();
  const colorWithFg = (raw: string) =>
    raw.replace('<g id="OpenNoTape">', `<g id="OpenNoTape" fill="${fg}">`);
  if (svgCache) setSvgHtml(colorWithFg(svgCache));
  if (hoverSvgCache) setHoverSvgHtml(colorWithFg(hoverSvgCache));
  if (grabSvgCache) setGrabSvgHtml(colorWithFg(grabSvgCache));
  if (rudeSvgCache) setRudeSvgHtml(colorWithFg(rudeSvgCache));
};
```

**Step 3: Verify cursor works on desktop, doesn't load on mobile**

Run: `npm run dev`
Check: Desktop — custom cursor follows mouse, changes on hover/click. Mobile (use devtools device mode) — no custom cursor rendered.

**Step 4: Commit**

```bash
git add src/app/components/CustomCursor.tsx
git commit -m "perf: skip CustomCursor on touch devices, optimize recolor"
```

---

### Task 11: Cache weather API with Next.js Route Handler

**Files:**
- Create: `src/app/api/weather/route.ts`
- Modify: `src/hooks/useWeather.ts`

**Step 1: Create weather API route with caching**

Create `src/app/api/weather/route.ts`:

```typescript
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=59.3326&longitude=18.0649&current=temperature_2m,weather_code&timezone=Europe/Stockholm";

export async function GET() {
  const res = await fetch(WEATHER_URL, { next: { revalidate: 1800 } });
  const data = await res.json();

  return Response.json({
    temp: Math.round(data.current.temperature_2m),
    code: data.current.weather_code,
  });
}
```

**Step 2: Update useWeather to call local API route**

In `src/hooks/useWeather.ts`, replace the external URL:

```typescript
useEffect(() => {
  fetch("/api/weather")
    .then((r) => r.json())
    .then((data) => setWeather(data))
    .catch(() => {});
}, []);
```

**Step 3: Verify weather still shows in navbar**

Run: `npm run dev`
Check: Temperature and weather poem appear in the top-right of the nav.

**Step 4: Commit**

```bash
git add src/app/api/weather/route.ts src/hooks/useWeather.ts
git commit -m "perf: cache weather API with Next.js Route Handler (30min revalidation)"
```

---

### Task 12: Final verification

**Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with no errors or warnings.

**Step 2: Visual regression check**

Run: `npm run dev`
Check each interaction:
- [ ] Theme changes smoothly when clicking Breakfast/Lunch/Dinner/Drinks
- [ ] Menu panel opens and closes without jank
- [ ] Cassette tapes drag and snap to player
- [ ] Music plays when tape is loaded
- [ ] Logo long-press triggers easter egg
- [ ] Custom cursor works on desktop
- [ ] Footer tentacle appears on hover
- [ ] Weather shows in navbar
- [ ] Mobile nav overlay works

**Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "perf: comprehensive performance optimization pass"
```
