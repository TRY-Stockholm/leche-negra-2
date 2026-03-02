# 411 Speakeasy — Dark Romanticism Atmosphere Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the 411 speakeasy page into a deeply atmospheric, interactive dark romanticism experience with a theatrical entrance, living room effects, and hidden interactive mysteries.

**Architecture:** Three layers built incrementally: (1) theatrical entrance sequence replacing the current fade transition, (2) ambient atmospheric effects (mouse-reactive light, smoke, parallax), (3) interactive mystery elements (hidden whispers, typewriter text, time-gated rewards). Each layer is independently commitable and builds on the previous.

**Tech Stack:** Next.js 15, Motion v12 (`motion/react`), CSS keyframes, Web Audio API (heartbeat only), Tailwind v4, TypeScript.

**Key files reference:**
- Theme CSS: `src/styles/theme.css` (speakeasy keyframes start at line 756)
- Speakeasy scene: `src/app/speakeasy/_components/SpeakeasyScene.tsx`
- Background: `src/app/speakeasy/_components/SpeakeasyBackground.tsx`
- Botanicals: `src/app/speakeasy/_components/SpeakeasyBotanicals.tsx`
- Details: `src/app/speakeasy/_components/SpeakeasyDetails.tsx`
- Reveal wrapper: `src/app/speakeasy/_components/SpeakeasyReveal.tsx`
- Drag hook: `src/hooks/useSpeakeasyDrag.ts`
- Blackout overlay: `src/app/components/footer/BlackoutOverlay.tsx`
- Constants: `src/lib/constants.ts` (`EASE_OUT_EXPO = [0.22, 1, 0.36, 1]`)
- Existing hooks: `src/hooks/useCanHover.ts`, `src/hooks/useIsMobile.ts`

---

## Task 1: Foundation — `useMousePosition` Hook

**Files:**
- Create: `src/hooks/useMousePosition.ts`

**Step 1: Create the hook**

```ts
// src/hooks/useMousePosition.ts
"use client";

import { useEffect } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

/** Returns raw mouse position as motion values. Consumers can apply useSpring on top. */
export function useMousePosition(): { x: MotionValue<number>; y: MotionValue<number> } {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", handler);
    return () => window.removeEventListener("pointermove", handler);
  }, [x, y]);

  return { x, y };
}
```

Initial values are `-1000` (off-screen) so nothing illuminates until the mouse moves.

**Step 2: Verify it compiles**

Run: `npx next build --no-lint 2>&1 | tail -5` or just `npm run dev` and check no errors in console.

**Step 3: Commit**

```bash
git add src/hooks/useMousePosition.ts
git commit -m "feat(speakeasy): add useMousePosition hook for cursor tracking"
```

---

## Task 2: Theatrical Entrance — Iris Close

Replace the current BlackoutOverlay fade with an iris close effect (shrinking circle of light surrounded by expanding darkness).

**Files:**
- Modify: `src/app/components/footer/BlackoutOverlay.tsx`

**Step 1: Rewrite BlackoutOverlay**

Replace the entire file:

```tsx
// src/app/components/footer/BlackoutOverlay.tsx
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
          key="iris"
          className="fixed pointer-events-none rounded-full"
          style={{
            zIndex: 9998,
            top: "50%",
            left: "50%",
            boxShadow: "0 0 0 100vmax #0a0604",
          }}
          initial={{ width: "300vmax", height: "300vmax", x: "-50%", y: "-50%" }}
          animate={{ width: 0, height: 0, x: "-50%", y: "-50%" }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </AnimatePresence>
  );
}
```

How it works: a `border-radius: 50%` element starts larger than the viewport (300vmax). Its box-shadow (100vmax spread of `#0a0604`) is invisible because the element itself is bigger. As it shrinks to 0, the shadow eats inward — creating a shrinking circle of light with darkness closing from the edges. Classic iris close.

**Step 2: Adjust transition timing in useSpeakeasyDrag**

In `src/hooks/useSpeakeasyDrag.ts`, the navigation fires after 600ms. The iris close takes 1.5s. Increase the delay so navigation happens at the end of the iris:

Find line 149:
```ts
    }, prefersReducedMotion ? 100 : 600);
```

Replace with:
```ts
    }, prefersReducedMotion ? 100 : 1600);
```

**Step 3: Verify visually**

Run: `npm run dev`. Navigate to homepage, drag the footer up past threshold. You should see:
- A circular hole of light shrinking from center
- Darkness closing from the edges
- Navigation to `/speakeasy` fires after the iris is nearly closed

**Step 4: Commit**

```bash
git add src/app/components/footer/BlackoutOverlay.tsx src/hooks/useSpeakeasyDrag.ts
git commit -m "feat(speakeasy): replace fade with iris close entrance transition"
```

---

## Task 3: Theatrical Entrance — Heartbeat Audio

Add a low, felt-more-than-heard heartbeat pulse during the iris close transition.

**Files:**
- Create: `src/lib/heartbeat.ts`
- Modify: `src/hooks/useSpeakeasyDrag.ts`

**Step 1: Create the heartbeat utility**

```ts
// src/lib/heartbeat.ts

/** Play a single heartbeat (two low thuds). Uses Web Audio API — no external assets. */
export function playHeartbeat(): void {
  let ctx: AudioContext;
  try {
    ctx = new AudioContext();
  } catch {
    return; // Audio not available — fail silently
  }

  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.value = 0;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 40; // Sub-bass — felt in the chest, barely audible
  osc.connect(gain);
  osc.start();

  const now = ctx.currentTime;

  // First thud — lub
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  // Second thud — dub (0.4s after first)
  gain.gain.setValueAtTime(0.001, now + 0.4);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.46);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

  // Cleanup
  osc.stop(now + 1);
  setTimeout(() => ctx.close(), 1500);
}
```

**Step 2: Wire heartbeat into the drag transition**

In `src/hooks/useSpeakeasyDrag.ts`:

Add import at top:
```ts
import { playHeartbeat } from "@/lib/heartbeat";
```

In the `triggerTransition` callback, add the heartbeat call right before the `safeTimeout`. Find:
```ts
  const triggerTransition = useCallback(() => {
    isDraggingRef.current = false;
    isTransitioningRef.current = true;
    setState((s) => ({ ...s, isTransitioning: true, isDragging: false }));
    if (containerRef.current) {
      containerRef.current.style.setProperty("--speakeasy-progress", "1");
    }
```

Add after the `setProperty` line:
```ts
    // Heartbeat during the iris close — a gut-level "am I supposed to be here?"
    if (!prefersReducedMotion) {
      playHeartbeat();
    }
```

**Step 3: Verify**

Run dev server. Drag footer past threshold. You should hear/feel two low bass thuds during the iris close. On devices with speakers, it's subtle. On headphones, more noticeable. Test with `prefers-reduced-motion` enabled to confirm it's silenced.

**Step 4: Commit**

```bash
git add src/lib/heartbeat.ts src/hooks/useSpeakeasyDrag.ts
git commit -m "feat(speakeasy): add heartbeat audio pulse during entrance transition"
```

---

## Task 4: Arrival Sequence — Darkness, Ember Glow, Logo Stutter, Slow Reveals

Replace the current instant-reveal with a phased arrival: darkness → ember glow → logo stutter → content reveals.

**Files:**
- Modify: `src/app/speakeasy/_components/SpeakeasyScene.tsx`
- Modify: `src/app/speakeasy/_components/SpeakeasyBackground.tsx`
- Modify: `src/styles/theme.css` (add stutter + cursor-blink keyframes)

**Step 1: Add CSS keyframes for neon stutter and cursor blink**

In `src/styles/theme.css`, find the line after `speakeasy-vignette-breathe` closing brace (line 774). Insert:

```css

@keyframes speakeasy-neon-stutter {
  0% { opacity: 0; }
  8% { opacity: 0.8; }
  12% { opacity: 0; }
  20% { opacity: 0; }
  28% { opacity: 1; }
  32% { opacity: 0; }
  36% { opacity: 0; }
  50% { opacity: 0.6; }
  54% { opacity: 0; }
  70% { opacity: 0; }
  78% { opacity: 1; }
  82% { opacity: 0.9; }
  100% { opacity: 1; }
}

@keyframes speakeasy-cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
```

**Step 2: Add ember glow entrance to SpeakeasyBackground**

Replace the entire file:

```tsx
// src/app/speakeasy/_components/SpeakeasyBackground.tsx
"use client";

interface SpeakeasyBackgroundProps {
  /** 0=darkness, 1=ember glow started, 2+=fully alive */
  phase: number;
}

export function SpeakeasyBackground({ phase }: SpeakeasyBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      {/* Deep black base — always visible */}
      <div className="absolute inset-0 bg-background" />

      {/* Crimson radial glow from below — fades in at phase 1 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 85%, rgba(212,68,68,0.12) 0%, transparent 70%)",
          animation: phase >= 2 ? "speakeasy-glow-pulse 8s ease-in-out infinite" : "none",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 2s ease-in-out",
        }}
      />

      {/* Heavy vignette — tighter keyhole than before */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 38% 32% at 50% 50%, transparent 0%, rgba(10,6,4,0.95) 100%)",
          animation: phase >= 2 ? "speakeasy-vignette-breathe 10s ease-in-out infinite" : "none",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 2.5s ease-in-out",
        }}
      />

      {/* Enhanced noise/grain overlay — always visible for texture during darkness */}
      <div className="absolute inset-0" style={{ opacity: 0.18 }}>
        <svg width="100%" height="100%">
          <filter id="speakeasy-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#speakeasy-grain)" />
        </svg>
      </div>
    </div>
  );
}
```

Changes from original:
- Takes a `phase` prop to control entry sequencing
- Vignette is tighter: `38% 32%` ellipse (was `50% 45%`), opacity `0.95` (was `0.85`) — claustrophobic keyhole
- Grain is slightly denser: `0.18` (was `0.16`)
- Both glow and vignette fade in at phase 1 over 2-2.5s
- Glow pulse animation only starts at phase 2 (room fully alive)

**Step 3: Rewrite SpeakeasyScene with phased arrival**

Replace the entire file:

```tsx
// src/app/speakeasy/_components/SpeakeasyScene.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { NavBar } from "@/app/components/NavBar";
import { NeonLogo } from "@/app/components/NeonLogo";
import { useWeather } from "@/hooks/useWeather";
import { SpeakeasyBackground } from "./SpeakeasyBackground";
import { SpeakeasyBotanicals } from "./SpeakeasyBotanicals";
import { SpeakeasyDetails } from "./SpeakeasyDetails";
import { SpeakeasyReveal } from "./SpeakeasyReveal";
import type { SiteSettings } from "@/lib/types";

interface SpeakeasySceneProps {
  menuPdfUrl?: string;
  siteSettings: SiteSettings | null;
}

/**
 * Arrival phases:
 * 0 — Total darkness (800ms). Black + grain only.
 * 1 — Ember glow fades in from below (2s transition).
 * 2 — Logo stutters on like a neon tube warming up (~1.2s).
 * 3 — Content reveals begin (staggered, slow).
 */

export function SpeakeasyScene({ menuPdfUrl, siteSettings }: SpeakeasySceneProps) {
  const router = useRouter();
  const weather = useWeather();
  const prefersReducedMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);
  const [phase, setPhase] = useState(prefersReducedMotion ? 3 : 0);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const t1 = setTimeout(() => setPhase(1), 800);    // ember glow
    const t2 = setTimeout(() => setPhase(2), 2800);   // logo stutter
    const t3 = setTimeout(() => setPhase(3), 4200);   // content reveals
    timerRefs.current = [t1, t2, t3];
    return () => timerRefs.current.forEach(clearTimeout);
  }, [prefersReducedMotion]);

  const handleExit = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      router.push("/");
    }, 600);
  }, [router]);

  return (
    <div
      data-scene="speakeasy"
      className="relative min-h-screen overflow-hidden bg-background text-foreground font-body"
      style={{ isolation: "isolate" }}
    >
      <SpeakeasyBackground phase={phase} />
      <SpeakeasyBotanicals />

      {/* Exit fade overlay */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[10000]"
        style={{ backgroundColor: "#0a0604" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {/* Content layer */}
      <div className="relative z-10 min-h-screen bg-transparent">
        <NavBar weather={weather} bookingUrl={siteSettings?.bookingUrl} />

        {/* Main Content — 12-column grid mirroring homepage */}
        <div className="grid grid-cols-12 lg:grid-rows-[auto_1fr_auto] gap-x-4 px-5 md:px-10 min-h-[calc(100vh-65px)]">
          {/* 411 Logo — stutters on at phase 2 */}
          <div className="col-span-12 row-start-1 self-start pt-8 md:col-span-5 md:pt-16">
            <div className="max-w-[52%]">
              <div
                style={{
                  opacity: phase < 2 ? 0 : undefined,
                  animation: phase === 2 ? "speakeasy-neon-stutter 1.2s ease-out forwards" : undefined,
                }}
              >
                <NeonLogo
                  isOff={false}
                  src="/411-logo-neon.svg"
                  label="411"
                />
              </div>
            </div>
          </div>

          {/* 411 section — bottom, reveals at phase 3 */}
          {phase >= 3 && (
            <div className="col-span-12 self-end row-start-4 pb-4 lg:pb-8">
              <SpeakeasyReveal delay={0} duration={1.2}>
                <div className="mb-4">
                  <span className="block mb-2 font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase text-muted-foreground">
                    Behind the painting
                  </span>
                  <button
                    onClick={handleExit}
                    aria-label="Return to homepage"
                    className="cursor-pointer text-left"
                  >
                    <span
                      className="font-display text-[clamp(2.5rem,8vw,5.5rem)] font-medium leading-[0.95] italic text-foreground"
                      style={{
                        textShadow:
                          "0 0 30px rgba(212,68,68,0.2), 0 0 60px rgba(212,68,68,0.08)",
                      }}
                    >
                      411
                    </span>
                  </button>
                </div>
              </SpeakeasyReveal>

              {/* Tagline */}
              <SpeakeasyReveal delay={0.6} duration={1.2}>
                <p className="font-display italic text-[clamp(1rem,2.5vw,1.5rem)] text-muted-foreground mb-6">
                  what the walls remember
                </p>
              </SpeakeasyReveal>

              <SpeakeasyDetails menuPdfUrl={menuPdfUrl} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

Key changes:
- Phase state machine: 0→1→2→3 on timers (800ms, 2800ms, 4200ms)
- Phase 0: only grain visible (SpeakeasyBackground shows grain always)
- Phase 1: ember glow + vignette fade in (handled in SpeakeasyBackground)
- Phase 2: logo stutter-on via `speakeasy-neon-stutter` CSS animation
- Phase 3: content renders with slower reveals (1.2s duration, 0.6s stagger)
- `bg-transparent` on content layer instead of `bg-background` so background shows through
- `prefersReducedMotion` skips straight to phase 3

**Step 4: Verify visually**

Run dev server. Navigate to speakeasy (either directly via URL or via footer drag). You should see:
1. ~800ms of pure darkness with grain texture
2. A warm crimson glow slowly rising from the bottom
3. The 411 neon logo stuttering on with rapid flashes
4. Content fading in slowly below

**Step 5: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasyScene.tsx src/app/speakeasy/_components/SpeakeasyBackground.tsx src/styles/theme.css
git commit -m "feat(speakeasy): phased arrival sequence — darkness, ember glow, neon stutter, slow reveals"
```

---

## Task 5: Living Room — Mouse-Reactive Light Pool

A crimson radial glow that follows the cursor like holding a candle in a dark room.

**Files:**
- Create: `src/app/speakeasy/_components/SpeakeasyLightPool.tsx`
- Modify: `src/app/speakeasy/_components/SpeakeasyScene.tsx`

**Step 1: Create the SpeakeasyLightPool component**

```tsx
// src/app/speakeasy/_components/SpeakeasyLightPool.tsx
"use client";

import { motion, useSpring } from "motion/react";
import { useMousePosition } from "@/hooks/useMousePosition";
import { useCanHover } from "@/hooks/useCanHover";

const POOL_SIZE = 600;
const SPRING = { damping: 50, stiffness: 80, mass: 1.2 };

export function SpeakeasyLightPool() {
  const { x, y } = useMousePosition();
  const canHover = useCanHover();

  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  if (!canHover) {
    // Mobile: fixed breathing candle at bottom-center
    return (
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        <div
          className="absolute left-1/2 bottom-[15%] -translate-x-1/2"
          style={{
            width: 400,
            height: 400,
            background:
              "radial-gradient(circle, rgba(212,68,68,0.08) 0%, rgba(212,68,68,0.03) 40%, transparent 70%)",
            filter: "blur(30px)",
            animation: "speakeasy-glow-pulse 8s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0"
      style={{
        zIndex: 1,
        x: springX,
        y: springY,
        width: POOL_SIZE,
        height: POOL_SIZE,
        marginLeft: -POOL_SIZE / 2,
        marginTop: -POOL_SIZE / 2,
        background:
          "radial-gradient(circle, rgba(212,68,68,0.07) 0%, rgba(212,68,68,0.03) 30%, transparent 70%)",
        filter: "blur(20px)",
      }}
      aria-hidden="true"
    />
  );
}
```

**Step 2: Wire into SpeakeasyScene**

In `src/app/speakeasy/_components/SpeakeasyScene.tsx`:

Add import:
```tsx
import { SpeakeasyLightPool } from "./SpeakeasyLightPool";
```

Add the component inside the root div, after `<SpeakeasyBotanicals />` and before the exit overlay. Only render after phase 1:
```tsx
      {phase >= 1 && <SpeakeasyLightPool />}
```

**Step 3: Verify**

Move cursor around the speakeasy page. A faint crimson glow should trail behind your cursor with noticeable lag (heavy spring). On mobile, a fixed glow breathes at the bottom center.

**Step 4: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasyLightPool.tsx src/app/speakeasy/_components/SpeakeasyScene.tsx
git commit -m "feat(speakeasy): mouse-reactive crimson light pool"
```

---

## Task 6: Living Room — Smoke Wisps

Translucent smoke wisps drifting slowly across the viewport. Pure CSS.

**Files:**
- Create: `src/app/speakeasy/_components/SpeakeasySmoke.tsx`
- Modify: `src/styles/theme.css`
- Modify: `src/app/speakeasy/_components/SpeakeasyScene.tsx`

**Step 1: Add smoke drift keyframes to theme.css**

In `src/styles/theme.css`, insert after the `speakeasy-neon-stutter` keyframe (which you added in Task 4):

```css

@keyframes speakeasy-smoke-0 {
  0% { transform: translateX(-30%) translateY(0); opacity: 0; }
  10% { opacity: 0.5; }
  90% { opacity: 0.5; }
  100% { transform: translateX(130%) translateY(-5vh); opacity: 0; }
}

@keyframes speakeasy-smoke-1 {
  0% { transform: translateX(-40%) translateY(0); opacity: 0; }
  10% { opacity: 0.4; }
  90% { opacity: 0.4; }
  100% { transform: translateX(140%) translateY(8vh); opacity: 0; }
}

@keyframes speakeasy-smoke-2 {
  0% { transform: translateX(-25%) translateY(0); opacity: 0; }
  10% { opacity: 0.35; }
  90% { opacity: 0.35; }
  100% { transform: translateX(125%) translateY(-3vh); opacity: 0; }
}
```

**Step 2: Create SpeakeasySmoke component**

```tsx
// src/app/speakeasy/_components/SpeakeasySmoke.tsx
"use client";

const WISPS = [
  { top: "18%", height: "clamp(80px, 12vh, 160px)", width: "clamp(300px, 45vw, 700px)", duration: 32, delay: 0 },
  { top: "45%", height: "clamp(60px, 10vh, 140px)", width: "clamp(250px, 40vw, 600px)", duration: 38, delay: -12 },
  { top: "70%", height: "clamp(70px, 11vh, 150px)", width: "clamp(280px, 42vw, 650px)", duration: 35, delay: -22 },
];

export function SpeakeasySmoke() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {WISPS.map((wisp, i) => (
        <div
          key={i}
          className="absolute left-0"
          style={{
            top: wisp.top,
            width: wisp.width,
            height: wisp.height,
            background:
              "radial-gradient(ellipse at center, rgba(212,68,68,0.04) 0%, transparent 70%)",
            filter: "blur(40px)",
            animation: `speakeasy-smoke-${i} ${wisp.duration}s linear infinite`,
            animationDelay: `${wisp.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
```

**Step 3: Wire into SpeakeasyScene**

Add import:
```tsx
import { SpeakeasySmoke } from "./SpeakeasySmoke";
```

Add after `<SpeakeasyLightPool />`, gated on phase:
```tsx
      {phase >= 2 && <SpeakeasySmoke />}
```

**Step 4: Verify**

On the speakeasy page, very faint crimson wisps should drift across the screen from left to right. They should be barely perceptible — you notice the space feels "alive" without pinpointing why.

**Step 5: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasySmoke.tsx src/styles/theme.css src/app/speakeasy/_components/SpeakeasyScene.tsx
git commit -m "feat(speakeasy): ambient smoke wisps drifting across viewport"
```

---

## Task 7: Living Room — Botanical Parallax + Flinch

Botanicals shift slightly counter to cursor (parallax) and flinch away when cursor gets close.

**Files:**
- Modify: `src/app/speakeasy/_components/SpeakeasyBotanicals.tsx`
- Modify: `src/app/speakeasy/_components/SpeakeasyScene.tsx`

**Step 1: Rewrite SpeakeasyBotanicals with mouse reactivity**

Replace the entire file:

```tsx
// src/app/speakeasy/_components/SpeakeasyBotanicals.tsx
"use client";

import { useEffect, useRef } from "react";
import { type MotionValue } from "motion/react";
import { SpeakeasyReveal } from "./SpeakeasyReveal";

const BOTANICAL_SLOTS = [
  { id: "top-left", x: "3%", y: "5%", size: "clamp(120px, 18vw, 220px)", rotate: -12 },
  { id: "top-right", x: "75%", y: "3%", size: "clamp(100px, 15vw, 200px)", rotate: 8 },
  { id: "bottom-left", x: "2%", y: "65%", size: "clamp(130px, 20vw, 240px)", rotate: -5 },
  { id: "bottom-right", x: "78%", y: "70%", size: "clamp(110px, 16vw, 210px)", rotate: 15 },
] as const;

/** Parallax shift (px) and flinch threshold (px) */
const PARALLAX_FACTOR = 3;
const FLINCH_RADIUS = 250;
const FLINCH_DISTANCE = 8;

interface SpeakeasyBotanicalsProps {
  mouseX?: MotionValue<number>;
  mouseY?: MotionValue<number>;
}

export function SpeakeasyBotanicals({ mouseX, mouseY }: SpeakeasyBotanicalsProps) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {BOTANICAL_SLOTS.map((slot, i) => (
        <SpeakeasyReveal
          key={slot.id}
          delay={0.4 + i * 0.1}
          y={0}
          className="absolute inset-0"
          duration={1.2}
        >
          <BotanicalSlot slot={slot} index={i} mouseX={mouseX} mouseY={mouseY} />
        </SpeakeasyReveal>
      ))}
    </div>
  );
}

function BotanicalSlot({
  slot,
  index,
  mouseX,
  mouseY,
}: {
  slot: (typeof BOTANICAL_SLOTS)[number];
  index: number;
  mouseX?: MotionValue<number>;
  mouseY?: MotionValue<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mouseX || !mouseY) return;
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const mx = mouseX!.get();
      const my = mouseY!.get();

      // Parallax: shift counter to cursor (relative to viewport center)
      const vw = window.innerWidth / 2;
      const vh = window.innerHeight / 2;
      const px = -((mx - vw) / vw) * PARALLAX_FACTOR;
      const py = -((my - vh) / vh) * PARALLAX_FACTOR;

      // Flinch: shift away from cursor when close
      const dx = cx - mx;
      const dy = cy - my;
      const dist = Math.hypot(dx, dy);
      let fx = 0;
      let fy = 0;
      if (dist < FLINCH_RADIUS && dist > 0) {
        const strength = (1 - dist / FLINCH_RADIUS) * FLINCH_DISTANCE;
        fx = (dx / dist) * strength;
        fy = (dy / dist) * strength;
      }

      el.style.transform = `translate(${px + fx}px, ${py + fy}px)`;
    }

    const unsubX = mouseX.on("change", update);
    const unsubY = mouseY.on("change", update);
    return () => {
      unsubX();
      unsubY();
    };
  }, [mouseX, mouseY]);

  return (
    <div
      ref={ref}
      className="absolute"
      style={{
        left: slot.x,
        top: slot.y,
        width: slot.size,
        height: slot.size,
        transition: "transform 0.3s ease-out",
      }}
    >
      {/* Blurred glow behind the illustration */}
      <div
        className="absolute inset-0"
        style={{
          filter: "blur(40px)",
          opacity: 0.15,
          animation: `speakeasy-drift ${15 + index * 3}s ease-in-out infinite`,
          animationDelay: `${index * -4}s`,
        }}
      >
        <PlaceholderBotanical rotate={slot.rotate} />
      </div>

      {/* The illustration */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.25,
          transform: `rotate(${slot.rotate}deg)`,
          animation: `speakeasy-drift ${18 + index * 2}s ease-in-out infinite`,
          animationDelay: `${index * -3}s`,
        }}
      >
        <PlaceholderBotanical rotate={0} />
      </div>
    </div>
  );
}

function PlaceholderBotanical({ rotate }: { rotate: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M100 10 C120 40, 160 50, 140 90 C120 130, 160 150, 130 180 C110 190, 90 190, 70 180 C40 150, 80 130, 60 90 C40 50, 80 40, 100 10Z"
        fill="#d44444"
        opacity="0.6"
      />
      <path
        d="M85 60 C90 45, 110 45, 115 60 C120 75, 110 85, 100 90 C90 85, 80 75, 85 60Z"
        fill="#a05555"
        opacity="0.4"
      />
    </svg>
  );
}
```

**Step 2: Pass mouse values from SpeakeasyScene**

In `src/app/speakeasy/_components/SpeakeasyScene.tsx`:

Add imports:
```tsx
import { useMousePosition } from "@/hooks/useMousePosition";
import { useCanHover } from "@/hooks/useCanHover";
```

Inside the component function, add:
```tsx
  const { x: mouseX, y: mouseY } = useMousePosition();
  const canHover = useCanHover();
```

Update the `<SpeakeasyBotanicals />` call to pass mouse values:
```tsx
      <SpeakeasyBotanicals mouseX={canHover ? mouseX : undefined} mouseY={canHover ? mouseY : undefined} />
```

**Step 3: Verify**

Move cursor around the page. Botanicals should shift very slightly counter to your cursor direction (parallax). When you move the cursor near a botanical, it should flinch away by a few pixels and return slowly when you move away.

**Step 4: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasyBotanicals.tsx src/app/speakeasy/_components/SpeakeasyScene.tsx
git commit -m "feat(speakeasy): botanical parallax and cursor-flinch effect"
```

---

## Task 8: Mystery — Wall Whispers

Hidden phrases scattered in dark areas, visible only when the cursor's light pool passes over them.

**Files:**
- Create: `src/app/speakeasy/_components/SpeakeasyWhispers.tsx`
- Modify: `src/app/speakeasy/_components/SpeakeasyScene.tsx`

**Step 1: Create SpeakeasyWhispers component**

```tsx
// src/app/speakeasy/_components/SpeakeasyWhispers.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { type MotionValue, motion } from "motion/react";
import { useCanHover } from "@/hooks/useCanHover";

const WHISPERS = [
  { text: "she never left", x: "12%", y: "22%" },
  { text: "the third drink is free", x: "78%", y: "32%" },
  { text: "ask about the painting", x: "82%", y: "78%" },
  { text: "we\u2019ve been expecting you", x: "8%", y: "68%" },
] as const;

/** How close the cursor must be (px) for a whisper to illuminate. */
const REVEAL_RADIUS = 200;

interface SpeakeasyWhispersProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

export function SpeakeasyWhispers({ mouseX, mouseY }: SpeakeasyWhispersProps) {
  const canHover = useCanHover();

  if (!canHover) return <MobileWhispers />;

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 2 }}
      aria-hidden="true"
    >
      {WHISPERS.map((w, i) => (
        <DesktopWhisper key={i} {...w} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  );
}

function DesktopWhisper({
  text,
  x,
  y,
  mouseX,
  mouseY,
}: {
  text: string;
  x: string;
  y: string;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(mouseX.get() - cx, mouseY.get() - cy);
      const opacity = dist < REVEAL_RADIUS ? (1 - dist / REVEAL_RADIUS) * 0.6 : 0;
      el.style.opacity = String(opacity);
    }

    const unsubX = mouseX.on("change", update);
    const unsubY = mouseY.on("change", update);
    return () => {
      unsubX();
      unsubY();
    };
  }, [mouseX, mouseY]);

  return (
    <span
      ref={ref}
      className="absolute font-display italic text-[0.875rem]"
      style={{ left: x, top: y, color: "#a05555", opacity: 0 }}
    >
      {text}
    </span>
  );
}

/** Mobile: one random whisper fades in/out every ~15s */
function MobileWhispers() {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => {
        if (prev >= 0) return -1;
        return Math.floor(Math.random() * WHISPERS.length);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 2 }}
      aria-hidden="true"
    >
      {WHISPERS.map((w, i) => (
        <motion.span
          key={i}
          className="absolute font-display italic text-[0.875rem]"
          style={{ left: w.x, top: w.y, color: "#a05555" }}
          animate={{ opacity: active === i ? 0.5 : 0 }}
          transition={{ duration: 3 }}
        >
          {w.text}
        </motion.span>
      ))}
    </div>
  );
}
```

**Step 2: Wire into SpeakeasyScene**

Add import:
```tsx
import { SpeakeasyWhispers } from "./SpeakeasyWhispers";
```

Add after `<SpeakeasySmoke />`, gated on phase 3:
```tsx
      {phase >= 3 && <SpeakeasyWhispers mouseX={mouseX} mouseY={mouseY} />}
```

**Step 3: Verify**

On desktop, slowly move the cursor toward the corners and edges of the viewport. When you get within ~200px of a whisper position, faint italic text should materialize. Moving away makes it vanish. On mobile, random whispers fade in/out automatically.

**Step 4: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasyWhispers.tsx src/app/speakeasy/_components/SpeakeasyScene.tsx
git commit -m "feat(speakeasy): hidden wall whispers illuminated by cursor"
```

---

## Task 9: Mystery — Time-Gated Reward, Typewriter Description, Smoldering Button

Three interactive details: a patience reward, typewriter text on expand, and a smoldering hover on the cocktail button.

**Files:**
- Modify: `src/app/speakeasy/_components/SpeakeasyScene.tsx`
- Modify: `src/app/speakeasy/_components/SpeakeasyDetails.tsx`
- Modify: `src/styles/theme.css`

**Step 1: Add smolder keyframe to theme.css**

Insert after the smoke keyframes:

```css

@keyframes speakeasy-smolder {
  0% {
    transform: translateY(0) scaleX(1);
    opacity: 0;
  }
  15% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-25px) scaleX(1.8);
    opacity: 0;
  }
}
```

**Step 2: Add time-gated patience reward to SpeakeasyScene**

In `src/app/speakeasy/_components/SpeakeasyScene.tsx`, add state:
```tsx
  const [showPatience, setShowPatience] = useState(false);
```

Add a timer effect (below the phase timer effect):
```tsx
  // Patience reward: "you're still here. good." after 60s
  useEffect(() => {
    if (prefersReducedMotion) return;
    const t = setTimeout(() => setShowPatience(true), 60000);
    return () => clearTimeout(t);
  }, [prefersReducedMotion]);
```

In the content section, after the tagline `<SpeakeasyReveal>` block and before `<SpeakeasyDetails>`, add:
```tsx
              {showPatience && (
                <SpeakeasyReveal delay={0} duration={3}>
                  <p className="font-display italic text-[clamp(0.875rem,2vw,1.125rem)] text-muted-foreground mb-6" style={{ opacity: 0.6 }}>
                    you&apos;re still here. good.
                  </p>
                </SpeakeasyReveal>
              )}
```

**Step 3: Rewrite SpeakeasyDetails with typewriter + smoldering button**

Replace the entire file:

```tsx
// src/app/speakeasy/_components/SpeakeasyDetails.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/constants";
import { SpeakeasyReveal } from "./SpeakeasyReveal";

interface SpeakeasyDetailsProps {
  menuPdfUrl?: string;
}

export function SpeakeasyDetails({ menuPdfUrl }: SpeakeasyDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="w-full">
      {/* Expandable "about the room" trigger + panel */}
      <SpeakeasyReveal delay={1.0}>
        <div>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="speakeasy-about"
            className="cursor-pointer font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground transition-opacity duration-300 hover:opacity-80"
          >
            {isOpen ? "close" : "about the room"}
          </button>

          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                id="speakeasy-about"
                key="details"
                initial={
                  prefersReducedMotion
                    ? false
                    : { gridTemplateRows: "0fr", opacity: 0 }
                }
                animate={{ gridTemplateRows: "1fr", opacity: 1 }}
                exit={{ gridTemplateRows: "0fr", opacity: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : {
                        gridTemplateRows: {
                          duration: 0.6,
                          ease: EASE_OUT_EXPO,
                        },
                        opacity: { duration: 0.4, ease: "easeInOut" },
                      }
                }
                className="grid w-full"
              >
                <div className="overflow-hidden">
                  <div className="font-display italic text-[clamp(0.875rem,2vw,1.0625rem)] leading-[1.65] text-muted-foreground mt-6 max-w-[520px]">
                    {prefersReducedMotion ? (
                      <p>
                        Behind the painting, past the lady with still lips — a room
                        that trades in whispers and well-kept secrets. The cocktails
                        here have no names you&apos;ll remember by morning.
                      </p>
                    ) : (
                      <TypewriterText
                        text="Behind the painting, past the lady with still lips \u2014 a room that trades in whispers and well-kept secrets. The cocktails here have no names you\u2019ll remember by morning."
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SpeakeasyReveal>

      {/* Smoldering menu PDF button */}
      <SpeakeasyReveal delay={1.4} className="mt-6">
        <div className="speakeasy-button-wrap relative inline-block">
          <a
            href={menuPdfUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center justify-center border border-foreground px-8 py-4 font-body text-[0.875rem] font-medium tracking-[0.06em] uppercase text-foreground hover:bg-foreground hover:text-background transition-colors duration-300"
          >
            See Cocktails
          </a>
        </div>
      </SpeakeasyReveal>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const iRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function type() {
      if (iRef.current >= text.length) {
        setTimeout(() => setShowCursor(false), 2000);
        return;
      }
      iRef.current++;
      setDisplayed(text.slice(0, iRef.current));

      const char = text[iRef.current - 1];
      let delay = 35 + Math.random() * 25;
      if (char === "," || char === ";") delay = 180 + Math.random() * 80;
      if (char === "." || char === "!" || char === "?") delay = 280 + Math.random() * 120;
      if (char === "\u2014" || char === "\u2013") delay = 220 + Math.random() * 80;
      if (char === " ") delay = 25 + Math.random() * 15;

      timerRef.current = setTimeout(type, delay);
    }

    // Small initial delay for the panel to expand
    timerRef.current = setTimeout(type, 400);
    return () => clearTimeout(timerRef.current);
  }, [text]);

  return (
    <p>
      {displayed}
      {showCursor && (
        <span
          className="inline-block w-[2px] h-[1em] ml-[1px] align-middle"
          style={{
            backgroundColor: "#d44444",
            animation: "speakeasy-cursor-blink 0.8s step-end infinite",
          }}
        />
      )}
    </p>
  );
}
```

**Step 4: Add smoldering button CSS to theme.css**

Insert after the `speakeasy-smolder` keyframe:

```css

.speakeasy-button-wrap::before,
.speakeasy-button-wrap::after {
  content: "";
  position: absolute;
  bottom: 100%;
  width: 40px;
  height: 30px;
  background: radial-gradient(ellipse, rgba(212,68,68,0.2), transparent 70%);
  filter: blur(8px);
  opacity: 0;
  pointer-events: none;
}

.speakeasy-button-wrap::before {
  left: 25%;
}

.speakeasy-button-wrap::after {
  right: 25%;
}

.speakeasy-button-wrap:hover::before,
.speakeasy-button-wrap:hover::after {
  animation: speakeasy-smolder 2s ease-out infinite;
}

.speakeasy-button-wrap:hover::after {
  animation-delay: 0.6s;
}
```

**Step 5: Verify all three features**

1. **Typewriter:** Click "about the room". Text should type out character by character with a blinking crimson cursor. Pauses at punctuation.
2. **Smoldering button:** Hover over "See Cocktails". Faint smoke tendrils should curl up from the button edges.
3. **Patience reward:** Wait 60 seconds on the page. "you're still here. good." should fade in very slowly below the tagline.

**Step 6: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasyScene.tsx src/app/speakeasy/_components/SpeakeasyDetails.tsx src/styles/theme.css
git commit -m "feat(speakeasy): typewriter text, smoldering button, patience reward"
```

---

## Final: Verify Full Experience End-to-End

After all tasks are complete, do a full walkthrough:

1. Start on the homepage
2. Drag the footer up — iris closes with heartbeat
3. Arrive at darkness — grain visible, nothing else
4. Ember glow rises from below
5. 411 logo stutters on like a neon tube
6. Content fades in slowly
7. Move cursor — crimson light pool follows, smoke wisps drift
8. Cursor near botanicals — they flinch
9. Cursor near edges — hidden whispers illuminate
10. Click "about the room" — text types out
11. Hover "See Cocktails" — button smolders
12. Wait 60s — patience message appears

Check mobile: no mouse effects, breathing candle at bottom, random whispers auto-cycle.

Check `prefers-reduced-motion`: all animations disabled, content appears immediately.
