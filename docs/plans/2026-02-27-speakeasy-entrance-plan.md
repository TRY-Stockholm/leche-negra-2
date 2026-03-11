# Speakeasy Hidden Entrance — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the tentacle animation in the footer with a draggable "hidden door" mechanic that reveals a speakeasy glow underneath and navigates to `/speakeasy` when dragged past a threshold.

**Architecture:** The footer becomes vertically draggable via pointer events. A fixed glow layer sits behind it, visible only when the footer lifts. A custom hook (`useSpeakeasyDrag`) manages all drag state, spring physics, threshold detection, and transition orchestration. A blackout overlay handles the page transition.

**Tech Stack:** Motion (spring animations), Next.js `useRouter`, pointer events API, CSS custom properties for glow intensity.

---

### Task 1: Create the SpeakeasyGlow Component

The ambient glow layer that sits behind the footer, revealed as the footer is dragged up.

**Files:**
- Create: `src/app/components/footer/SpeakeasyGlow.tsx`

**Step 1: Create the glow component**

```tsx
"use client";

interface SpeakeasyGlowProps {
  /** 0 → hidden, 1 → full intensity */
  progress: number;
}

export function SpeakeasyGlow({ progress }: SpeakeasyGlowProps) {
  if (progress <= 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 pointer-events-none"
      style={{
        height: 500,
        zIndex: -1,
        background: "#0a0604",
      }}
    >
      {/* Warm candlelight radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(201,169,110,0.25) 0%, rgba(201,169,110,0.08) 40%, transparent 70%)",
          opacity: progress,
          transition: progress === 0 ? "opacity 0.3s ease" : "none",
        }}
      />
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.08 * progress,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
```

**Step 2: Verify it renders**

Run: `npm run dev`
Temporarily import `SpeakeasyGlow` into `Footer.tsx` with `progress={1}` and confirm the dark glow layer appears behind the footer. Then revert.

**Step 3: Commit**

```bash
git add src/app/components/footer/SpeakeasyGlow.tsx
git commit -m "feat: add SpeakeasyGlow ambient layer component"
```

---

### Task 2: Create the useSpeakeasyDrag Hook

Custom hook encapsulating all drag logic: pointer tracking, resistance physics, threshold detection, transition state.

**Files:**
- Create: `src/hooks/useSpeakeasyDrag.ts`

**Step 1: Create the hook**

```ts
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DragState {
  /** How far the footer has been dragged up in px (always >= 0) */
  offsetY: number;
  /** 0–1 progress toward threshold */
  progress: number;
  /** Whether the user is actively dragging */
  isDragging: boolean;
  /** Whether the exit transition is playing */
  isTransitioning: boolean;
}

interface UseSpeakeasyDragOptions {
  /** Max drag distance in px */
  maxDrag: number;
  /** Threshold ratio (0–1) at which the door "gives way" */
  threshold?: number;
  /** Resistance factor (higher = heavier). Applied as exponent to normalize drag. */
  resistance?: number;
}

export function useSpeakeasyDrag({
  maxDrag,
  threshold = 0.4,
  resistance = 0.55,
}: UseSpeakeasyDragOptions) {
  const router = useRouter();
  const [state, setState] = useState<DragState>({
    offsetY: 0,
    progress: 0,
    isDragging: false,
    isTransitioning: false,
  });

  const startYRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const footerRef = useRef<HTMLElement>(null);

  /** Apply resistance curve: raw pixels → dampened pixels */
  const applyResistance = useCallback(
    (rawDelta: number) => {
      const normalized = Math.min(rawDelta / maxDrag, 1);
      // Power curve creates heavy-then-lighter feel
      const dampened = Math.pow(normalized, resistance);
      return dampened * maxDrag;
    },
    [maxDrag, resistance],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (state.isTransitioning) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startYRef.current = e.clientY;
      currentOffsetRef.current = 0;
      setState((s) => ({ ...s, isDragging: true }));
    },
    [state.isTransitioning],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!state.isDragging || state.isTransitioning) return;

      const rawDelta = startYRef.current - e.clientY;
      // Only allow upward drag
      if (rawDelta <= 0) {
        currentOffsetRef.current = 0;
        setState((s) => ({ ...s, offsetY: 0, progress: 0 }));
        return;
      }

      const dampened = applyResistance(rawDelta);
      currentOffsetRef.current = dampened;

      // Past threshold: reduce resistance (latch releasing feel)
      const progress = dampened / maxDrag;

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setState((s) => ({
          ...s,
          offsetY: dampened,
          progress: Math.min(progress / threshold, 1),
        }));
      });
    },
    [state.isDragging, state.isTransitioning, applyResistance, maxDrag, threshold],
  );

  const triggerTransition = useCallback(() => {
    setState((s) => ({ ...s, isTransitioning: true, isDragging: false }));

    // After the footer flies up + glow fills screen, navigate
    setTimeout(() => {
      router.push("/speakeasy");
    }, 600);
  }, [router]);

  const onPointerUp = useCallback(() => {
    if (!state.isDragging) return;

    const progress = currentOffsetRef.current / maxDrag;

    if (progress >= threshold) {
      // Past threshold — trigger exit
      triggerTransition();
    } else {
      // Snap back — rubber band
      setState({
        offsetY: 0,
        progress: 0,
        isDragging: false,
        isTransitioning: false,
      });
    }
  }, [state.isDragging, maxDrag, threshold, triggerTransition]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return {
    state,
    footerRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
    /** Call from the trigger button to hint the footer is loose */
    nudge: useCallback(() => {
      if (state.isTransitioning) return;
      setState((s) => ({ ...s, offsetY: 6, progress: 0 }));
      setTimeout(() => {
        setState((s) => {
          if (s.isDragging) return s;
          return { ...s, offsetY: 0, progress: 0 };
        });
      }, 400);
    }, [state.isTransitioning]),
  };
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors related to `useSpeakeasyDrag.ts`.

**Step 3: Commit**

```bash
git add src/hooks/useSpeakeasyDrag.ts
git commit -m "feat: add useSpeakeasyDrag hook with resistance physics"
```

---

### Task 3: Create the Blackout Overlay Component

A full-screen overlay that fades to black during the transition to `/speakeasy`.

**Files:**
- Create: `src/app/components/footer/BlackoutOverlay.tsx`

**Step 1: Create the overlay component**

```tsx
"use client";

import { motion, AnimatePresence } from "motion/react";

interface BlackoutOverlayProps {
  active: boolean;
}

export function BlackoutOverlay({ active }: BlackoutOverlayProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="blackout"
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 9998, background: "#0a0604" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2, ease: "easeIn" }}
        />
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/components/footer/BlackoutOverlay.tsx
git commit -m "feat: add BlackoutOverlay for speakeasy transition"
```

---

### Task 4: Wire Up Footer.tsx — Replace Tentacle with Drag Mechanic

Replace the tentacle animation state with the speakeasy drag system.

**Files:**
- Modify: `src/app/components/footer/Footer.tsx` (full rewrite of component body)

**Step 1: Rewrite Footer.tsx**

Replace the entire contents of `Footer.tsx` with:

```tsx
"use client";

import { useEffect, useState, memo } from "react";
import { motion } from "motion/react";
import { FooterContent } from "./FooterContent";
import { SpeakeasyGlow } from "./SpeakeasyGlow";
import { BlackoutOverlay } from "./BlackoutOverlay";
import { useSpeakeasyDrag } from "@/hooks/useSpeakeasyDrag";
import type { SiteSettings, SocialLink } from "@/lib/types";

const FOOTER_HEIGHT = 500;
const FOOTER_HEIGHT_MOBILE = 420;

interface FooterProps {
  siteSettings?: SiteSettings | null;
  socialLinks?: SocialLink[];
}

export const Footer = memo(function Footer({
  siteSettings,
  socialLinks,
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

  const { state, handlers, nudge } = useSpeakeasyDrag({
    maxDrag: height * 0.6,
    threshold: 0.4,
    resistance: 0.55,
  });

  return (
    <>
      <div style={{ height }} />

      {/* Glow layer — behind footer */}
      <SpeakeasyGlow progress={state.progress} />

      <motion.footer
        className="theme-night fixed bottom-0 left-0 right-0 bg-background border-t border-border/30 touch-none"
        style={{
          height,
          zIndex: 0,
          y: state.isTransitioning ? undefined : -state.offsetY,
          cursor: state.isDragging ? "grabbing" : undefined,
        }}
        animate={
          state.isTransitioning
            ? { y: -height - 100 }
            : !state.isDragging
              ? { y: 0 }
              : undefined
        }
        transition={
          state.isTransitioning
            ? { type: "spring", stiffness: 300, damping: 30 }
            : !state.isDragging
              ? { type: "spring", stiffness: 200, damping: 25 }
              : undefined
        }
        {...handlers}
      >
        <FooterContent
          onDragHint={nudge}
          siteSettings={siteSettings}
          socialLinks={socialLinks}
          isDragging={state.isDragging}
        />
      </motion.footer>

      {/* Blackout during transition */}
      <BlackoutOverlay active={state.isTransitioning} />
    </>
  );
});
```

**Key changes:**
- Import `motion` from `motion/react` to make the footer a `motion.footer`
- Replace `showTentacle` state with `useSpeakeasyDrag` hook
- Add `touch-none` class to prevent browser scroll interference during drag
- Footer `y` position driven by drag offset during active drag
- When transitioning: animate footer flying up off screen
- When released below threshold: spring back to `y: 0`
- Pointer event handlers spread onto the `motion.footer` element
- Add `SpeakeasyGlow` behind footer, `BlackoutOverlay` on top

**Step 2: Verify dev server compiles**

Run: `npm run dev`
Expected: Page loads. Footer renders (will have prop type errors in FooterContent until Task 5).

**Step 3: Commit**

```bash
git add src/app/components/footer/Footer.tsx
git commit -m "feat: wire footer drag mechanic replacing tentacle"
```

---

### Task 5: Update FooterContent.tsx — New Props and Trigger Behavior

Replace tentacle hover callbacks with drag hint trigger.

**Files:**
- Modify: `src/app/components/footer/FooterContent.tsx:33-54` (interface + trigger button)

**Step 1: Update the interface and trigger button**

Change the `FooterContentProps` interface from:

```ts
interface FooterContentProps {
  onTentacleHover: (active: boolean) => void;
  siteSettings?: SiteSettings | null;
  socialLinks?: SocialLink[];
}
```

to:

```ts
interface FooterContentProps {
  onDragHint: () => void;
  siteSettings?: SiteSettings | null;
  socialLinks?: SocialLink[];
  isDragging?: boolean;
}
```

Update the function signature to destructure the new props:

```tsx
export function FooterContent({
  onDragHint,
  siteSettings,
  socialLinks,
  isDragging,
}: FooterContentProps) {
```

Replace the trigger `<button>` element (lines 49–63) with:

```tsx
<div
  className="pointer-events-auto leading-snug text-foreground/40 hover:text-foreground transition-colors duration-500 text-left select-none"
  style={{ cursor: isDragging ? "grabbing" : "grab" }}
  onMouseEnter={onDragHint}
  onTouchStart={onDragHint}
>
  <span className="font-display text-[clamp(1rem,2vw,1.5rem)] italic">
    not everything is on the menu.
  </span>
  <br />
  <span className="font-display text-[clamp(1rem,2vw,1.5rem)] font-bold not-italic">
    go deeper.
  </span>
</div>
```

**Key changes:**
- `button` → `div` (no click action needed, drag is on the whole footer)
- `onTentacleHover` → `onDragHint` (triggers the subtle nudge-up hint)
- Cursor changes to `grab`/`grabbing` based on drag state
- `select-none` prevents text selection during drag
- Removed `onMouseLeave` and `onTouchEnd` — the nudge auto-resets via timeout in the hook

**Step 2: Verify the full interaction works**

Run: `npm run dev`
Test:
1. Hover "go deeper" text — footer should nudge up ~6px and snap back
2. Click and drag upward on footer — should drag up with resistance
3. Release below threshold — should rubber-band back
4. Drag past threshold and release — footer should fly up, glow fills, blackout, then 404 (speakeasy page doesn't exist yet)

**Step 3: Commit**

```bash
git add src/app/components/footer/FooterContent.tsx
git commit -m "feat: update footer trigger for speakeasy drag interaction"
```

---

### Task 6: Delete Tentacle Component

Remove the now-unused tentacle component and its asset.

**Files:**
- Delete: `src/app/components/footer/Tentacle.tsx`

**Step 1: Delete the file**

```bash
rm src/app/components/footer/Tentacle.tsx
```

**Step 2: Verify no remaining imports**

Search for any remaining references to `Tentacle`:

```bash
grep -r "Tentacle" src/ --include="*.tsx" --include="*.ts"
```

Expected: No results (Footer.tsx no longer imports it).

**Step 3: Verify dev server still runs**

Run: `npm run dev`
Expected: No errors. Footer works as before.

**Step 4: Commit**

```bash
git add -u src/app/components/footer/Tentacle.tsx
git commit -m "chore: remove unused Tentacle component"
```

---

### Task 7: Create the Speakeasy Page Placeholder

A minimal page at `/speakeasy` so navigation lands somewhere.

**Files:**
- Create: `src/app/speakeasy/page.tsx`

**Step 1: Create the page**

```tsx
export default function SpeakeasyPage() {
  return (
    <div className="theme-night min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-[clamp(2rem,5vw,4rem)] italic mb-4">
          You found us.
        </h1>
        <p className="text-muted-foreground text-sm uppercase tracking-widest">
          The speakeasy is coming soon.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Verify the full flow end-to-end**

Run: `npm run dev`
Test the complete flow:
1. Scroll to footer
2. Hover "go deeper" — nudge hint
3. Drag footer up past threshold
4. Footer flies up → glow → blackout → lands on `/speakeasy`
5. "You found us." page displays
6. Go back to homepage — footer is back in normal position

**Step 3: Commit**

```bash
git add src/app/speakeasy/page.tsx
git commit -m "feat: add speakeasy page placeholder"
```

---

### Task 8: Polish and Edge Cases

Final refinements after the core mechanic works.

**Files:**
- Modify: `src/hooks/useSpeakeasyDrag.ts` (if needed)
- Modify: `src/app/components/footer/Footer.tsx` (if needed)

**Step 1: Test and fix mobile behavior**

Test on mobile (or Chrome DevTools device emulation):
- Verify the swipe-up gesture works naturally
- Ensure `touch-none` on the footer prevents page scroll during drag
- Confirm the nudge hint works on tap

**Step 2: Test reduced motion preference**

In Chrome DevTools → Rendering → Emulate CSS media `prefers-reduced-motion: reduce`.
If enabled, the interaction should still work but skip the spring animations — use instant transitions instead.

Add to `useSpeakeasyDrag.ts` if needed:

```ts
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

**Step 3: Test threshold feel**

Manually test the drag resistance. Adjust these values in `Footer.tsx` if the feel is off:
- `resistance: 0.55` — increase for heavier, decrease for lighter
- `threshold: 0.4` — increase to require more drag
- `maxDrag: height * 0.6` — the cap on how far the footer can be dragged

**Step 4: Verify production build**

Run: `npm run build`
Expected: Builds successfully with no errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "polish: refine speakeasy drag feel and edge cases"
```
