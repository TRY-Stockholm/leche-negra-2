# Whole-Page Speakeasy Drag — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the speakeasy entrance so the entire page (main content + footer) lifts as one panel when dragged from the footer, revealing a full-viewport glow underneath.

**Architecture:** Move drag orchestration from Footer up to HomePage. The footer becomes a simple grab-handle that receives pointer handlers as props. A motion.div wrapper around the entire page receives the y offset. The glow layer expands to cover the full viewport.

**Tech Stack:** Motion (spring animations), useSpeakeasyDrag hook (unchanged physics), CSS custom properties for glow.

---

### Task 1: Expand SpeakeasyGlow to Full Viewport

The glow layer currently covers only the footer area (500px from bottom). Change it to cover the full viewport so the entire space behind the page is lit.

**Files:**
- Modify: `src/app/components/footer/SpeakeasyGlow.tsx`

**Step 1: Update the component**

Replace the entire contents of `SpeakeasyGlow.tsx` with:

```tsx
"use client";

export function SpeakeasyGlow() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -1,
        background: "#0a0604",
        opacity: "var(--speakeasy-progress, 0)",
      } as React.CSSProperties}
    >
      {/* Warm candlelight radial glow — centered near bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 85%, rgba(201,169,110,0.3) 0%, rgba(201,169,110,0.1) 35%, transparent 65%)",
        }}
      />
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.08,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
```

Key changes from current:
- `fixed bottom-0 left-0 right-0` + `height: 500` → `fixed inset-0` (full viewport)
- Radial gradient repositioned: `at 50% 60%` → `at 50% 85%` (centered near bottom of screen, where the gap opens)
- Gradient shape widened slightly: `ellipse 60% 50%` → `ellipse 60% 40%` and boosted intensity (0.25 → 0.3)

**Step 2: Verify it renders**

Run: `npm run dev`
The glow won't be visually testable yet (still wired to the old footer-only drag), but confirm no errors.

**Step 3: Commit**

```bash
git add src/app/components/footer/SpeakeasyGlow.tsx
git commit -m "refactor: expand SpeakeasyGlow to full viewport"
```

---

### Task 2: Simplify Footer.tsx — Remove Drag Ownership

The footer currently owns the drag hook, motion animation, glow layer, and blackout. Strip all of that out. The footer becomes a regular `<footer>` that accepts pointer handlers and drag state from its parent.

**Files:**
- Modify: `src/app/components/footer/Footer.tsx`

**Step 1: Rewrite Footer.tsx**

Replace the entire contents with:

```tsx
"use client";

import { useEffect, useState, memo } from "react";
import { FooterContent } from "./FooterContent";
import type { SiteSettings, SocialLink } from "@/lib/types";

const FOOTER_HEIGHT = 500;
const FOOTER_HEIGHT_MOBILE = 420;

interface FooterProps {
  siteSettings?: SiteSettings | null;
  socialLinks?: SocialLink[];
  /** Pointer handlers from the drag hook — spread onto the footer element */
  dragHandlers?: Record<string, (e: React.PointerEvent) => void>;
  /** Whether the user is actively dragging */
  isDragging?: boolean;
  /** Nudge hint callback for the trigger text */
  onDragHint?: () => void;
}

export const Footer = memo(function Footer({
  siteSettings,
  socialLinks,
  dragHandlers,
  isDragging,
  onDragHint,
}: FooterProps) {
  const [height, setHeight] = useState(FOOTER_HEIGHT);

  useEffect(() => {
    const update = () => {
      setHeight(window.innerWidth < 640 ? FOOTER_HEIGHT_MOBILE : FOOTER_HEIGHT);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <>
      <div style={{ height }} />

      <footer
        className="theme-night fixed bottom-0 left-0 right-0 bg-background border-t border-border/30 touch-none"
        style={{
          height,
          zIndex: 0,
          cursor: isDragging ? "grabbing" : undefined,
        }}
        {...dragHandlers}
      >
        <FooterContent
          onDragHint={onDragHint ?? (() => {})}
          siteSettings={siteSettings}
          socialLinks={socialLinks}
          isDragging={isDragging}
        />
      </footer>
    </>
  );
});
```

Key changes:
- Removed imports: `motion`, `SpeakeasyGlow`, `BlackoutOverlay`, `useSpeakeasyDrag`
- `motion.footer` → regular `<footer>`
- No longer owns drag state — receives `dragHandlers`, `isDragging`, `onDragHint` as props
- No `containerRef`, no y offset, no animate/transition props
- The spacer div and footer element remain (footer is still `position: fixed`)
- Pointer handlers are spread onto the `<footer>` from props — this is the "grab handle"

**Step 2: Note — this will cause a type error in HomePage.tsx**

The Footer component now expects new props that HomePage doesn't pass yet. This will be fixed in Task 3.

**Step 3: Commit**

```bash
git add src/app/components/footer/Footer.tsx
git commit -m "refactor: simplify Footer to accept drag handlers as props"
```

---

### Task 3: Refactor HomePage.tsx — Own the Drag and Page Wrapper

This is the main task. HomePage now orchestrates the drag: it wraps the entire page content + footer in a `motion.div` that translates on drag, and places the glow layer and blackout overlay outside the moving panel.

**Files:**
- Modify: `src/app/components/HomePage.tsx`

**Step 1: Rewrite the PageContent component**

The `PageContent` function (lines 42-225) needs these changes:

1. Add imports at the top of the file (after existing imports):

```tsx
import { motion } from "motion/react";
import { SpeakeasyGlow } from "./footer/SpeakeasyGlow";
import { BlackoutOverlay } from "./footer/BlackoutOverlay";
import { useSpeakeasyDrag } from "@/hooks/useSpeakeasyDrag";
```

2. Add the drag hook inside `PageContent`, after the existing state declarations (after line 49):

```tsx
const { state: dragState, containerRef, handlers: dragHandlers, nudge } = useSpeakeasyDrag({
  maxDrag: 300,
  threshold: 0.4,
  resistance: 0.55,
});
```

Note: `maxDrag: 300` (fixed value instead of `height * 0.6`) — this is the max pixels the whole page can be dragged. It's decoupled from footer height now since the entire page moves.

3. Replace the return statement (lines 90-225). The new structure wraps everything in the container + motion panel:

```tsx
  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`bg-background text-foreground font-body ${activeTheme ? `theme-${activeTheme}` : ""}`}
    >
      {/* Glow layer — full viewport, behind everything */}
      <SpeakeasyGlow />

      {/* The "panel" — entire page moves as one rigid piece */}
      <motion.div
        style={{
          y: dragState.isTransitioning ? undefined : -dragState.offsetY,
        }}
        animate={
          dragState.isTransitioning
            ? { y: "-100vh" }
            : !dragState.isDragging
              ? { y: 0 }
              : undefined
        }
        transition={
          dragState.isTransitioning
            ? { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
            : !dragState.isDragging
              ? { type: "spring", stiffness: 200, damping: 25 }
              : undefined
        }
      >
        <div
          className="relative z-10 min-h-screen bg-background"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
        >
          <NavBar weather={weather} bookingUrl={siteSettings?.bookingUrl} />

          {/* Main Content — 12-column grid */}
          <div className="grid grid-cols-12 lg:grid-rows-[auto_1fr_auto] gap-x-4 px-5 md:px-10 min-h-[calc(100vh-65px)]">
            {/* Logo */}
            <div className="col-span-12 row-start-1 self-start pt-8 md:col-span-5 md:pt-16">
              <div className="relative">
                <NeonLogo
                  isOff={isLightTheme(activeTheme)}
                  onLongPressComplete={handleLongPressComplete}
                />
                <img
                  src="/touch-me.gif"
                  alt="Touch me"
                  className="absolute -top-4 -left-4 w-[50px] pointer-events-none select-none"
                />
              </div>
            </div>

            {/* Menu section — full-width bottom grid */}
            <div className="col-span-12 self-end row-start-4 pb-4 lg:pb-8">
              <div className="grid grid-cols-2 md:flex gap-y-6 gap-x-3 lg:gap-12">
                {[
                  {
                    key: "breakfast" as MenuKey,
                    time: "07:00 – 11:00",
                    label: "Breakfast",
                    size: "text-[clamp(2.5rem,5vw,5.5rem)]",
                  },
                  {
                    key: "lunch" as MenuKey,
                    time: "11:30 – 14:30",
                    label: "Lunch",
                    size: "text-[clamp(2.5rem,6vw,5.5rem)]",
                  },
                  {
                    key: "dinner" as MenuKey,
                    time: "17:00 – 22:00",
                    label: "Dinner",
                    size: "text-[clamp(2.5rem,5vw,5.5rem)]",
                  },
                  {
                    key: "drinks" as MenuKey,
                    time: "All Day",
                    label: "Drinks",
                    size: "text-[clamp(2.5rem,5vw,5.5rem)]",
                  },
                ].map((item) => {
                  const active = openMenu === item.key;
                  return (
                    <button
                      key={item.key}
                      className="cursor-pointer text-left capitalize"
                      onClick={() => handleMenuClick(item.key)}
                      style={{
                        textShadow: active
                          ? "0 0 8px var(--accent), 0 0 20px var(--accent), 0 0 60px var(--accent)"
                          : "none",
                        transition: "text-shadow 0.5s ease",
                      }}
                    >
                      <span
                        className={`block mb-2 font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase ${item.key === "drinks" ? "text-accent" : "text-muted-foreground"}`}
                      >
                        {item.time}
                      </span>
                      <span
                        className={`font-display ${item.size} font-medium leading-[0.95] italic`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <MenuPanel
                activeMenu={openMenu}
                onClose={handleMenuClose}
                cmsMenus={menus}
                bookingUrl={siteSettings?.bookingUrl}
              />
            </div>

            {/* Cassette player — right side, vertically centered */}
            <div className="col-span-12 row-start-3 flex justify-center py-8 overflow-visible md:col-start-7 md:col-span-5 md:row-start-1 md:row-span-3 md:self-center md:py-0">
              <CassettePlayer />
            </div>

            {/* Cassette tapes — scattered */}
            <CassetteTape
              id="morning"
              className="col-span-3 row-start-2 self-center pb-8 md:pb-0 md:col-start-7 md:col-span-2 md:row-start-2 md:self-start md:mt-8"
              style={{ rotate: "-5deg" }}
            />
            <CassetteTape
              id="midday"
              className="col-span-3 col-start-4 row-start-2 self-center pb-8 md:pb-0 md:col-start-11 md:col-span-2 md:row-start-1 md:self-center"
              style={{ rotate: "3deg" }}
            />
            <CassetteTape
              id="evening"
              className="col-span-3 col-start-7 row-start-2 self-center pb-8 md:pb-0 md:col-start-9 md:col-span-2 md:row-start-2 md:self-start md:mt-12"
              style={{ rotate: "7deg" }}
            />
            <CassetteTape
              id="night"
              className="col-span-3 col-start-10 row-start-2 self-center pb-8 md:pb-0 md:col-start-11 md:col-span-2 md:row-start-2 md:self-start md:mt-4"
              style={{ rotate: "-3deg" }}
            />
          </div>

          {/* <Ticker /> */}
        </div>

        {/* <Ticker /> */}

        {scene && (
          <EasterEggScene
            scene={scene}
            active={easterEgg}
            onDismiss={() => setEasterEgg(false)}
          />
        )}

        <Footer
          siteSettings={siteSettings}
          socialLinks={socialLinks}
          dragHandlers={dragHandlers}
          isDragging={dragState.isDragging}
          onDragHint={nudge}
        />
      </motion.div>

      {/* Blackout during transition — outside the moving panel */}
      <BlackoutOverlay active={dragState.isTransitioning} />
    </div>
  );
```

Key changes:
- Outer div now has `ref={containerRef}` for CSS custom property updates
- `SpeakeasyGlow` rendered outside the motion panel (stays fixed behind)
- New `motion.div` wraps ALL page content + footer — this is the "panel"
- Transition on fly-up uses `y: "-100vh"` (fly entire viewport height) with Emil Kowalski's spring-snappy curve `[0.16, 1, 0.3, 1]`
- Snap-back uses same spring as before (stiffness 200, damping 25)
- Footer receives drag props instead of owning the hook
- `BlackoutOverlay` rendered outside the motion panel (stays fixed on top)
- `EasterEggScene` is inside the panel (moves with the page)

**Step 2: Verify dev server compiles and the interaction works**

Run: `npm run dev`

Test:
1. Hover "go deeper" — entire page should nudge up ~6px
2. Click-drag upward on footer — entire page lifts, glow visible at bottom
3. Release below threshold — page snaps back
4. Drag past threshold — page flies up off screen, glow fills viewport, blackout, navigate to /speakeasy

**Step 3: Commit**

```bash
git add src/app/components/HomePage.tsx
git commit -m "refactor: move drag orchestration to HomePage, whole page lifts as one panel"
```

---

### Task 4: Update Footer Index Export

The footer directory's index.ts may need updating since we removed some imports. Check it still exports correctly.

**Files:**
- Check: `src/app/components/footer/index.ts`

**Step 1: Verify the export**

The current `index.ts` only exports `Footer`:
```ts
export { Footer } from "./Footer";
```

This should still work. The `SpeakeasyGlow` and `BlackoutOverlay` are now imported directly by `HomePage.tsx` from their file paths — they don't need to be in the barrel export.

No changes needed unless the export is broken.

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit (only if changes were needed)**

---

### Task 5: Polish — Verify Animations and Edge Cases

**Files:**
- Potentially tweak: `src/app/components/HomePage.tsx` (animation values)
- Potentially tweak: `src/hooks/useSpeakeasyDrag.ts` (if maxDrag needs adjustment)

**Step 1: Test the full interaction on desktop**

Run: `npm run dev`

Verify:
- Nudge hint works on hover over "go deeper" text
- Drag starts only from footer area (not from main content)
- Whole page moves together — navbar, content, cassettes, footer — as one rigid panel
- Glow visible underneath as page lifts (warm amber from the bottom)
- Resistance feels heavy, then lighter past threshold
- Releasing below threshold: smooth spring snap-back
- Releasing past threshold: page flies up, glow fills screen, blackout, navigates

**Step 2: Test on mobile (Chrome DevTools device emulation)**

- Tap "go deeper" triggers nudge
- Swipe up from footer area drags the page
- `touch-none` on footer prevents scroll interference
- Full transition works on touch

**Step 3: Tune animation values if needed**

Adjust in `HomePage.tsx`:
- `maxDrag: 300` — increase if drag range feels too short, decrease if too long
- Fly-up transition duration `0.5` — Emil Kowalski recommends 400-600ms for complex animations
- Snap-back spring `stiffness: 200, damping: 25` — increase damping for less bounce

Adjust in `BlackoutOverlay.tsx` if timing feels off:
- `delay: 0.2` — how long after fly-up starts before blackout begins
- `duration: 0.3` — how fast the blackout fades in

**Step 4: Verify production build**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "polish: tune whole-page drag animations and verify edge cases"
```
