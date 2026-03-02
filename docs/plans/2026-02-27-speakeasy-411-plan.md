# 411 Speakeasy Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the immersive 411 speakeasy page with dark romanticism aesthetic, staggered reveal animations, expandable description panel, and botanical illustration slots.

**Architecture:** A self-contained page at `/speakeasy` using a scene orchestrator pattern (mirrors `StageScene`). Scoped CSS custom properties via `data-scene="speakeasy"` avoid polluting the global theme. Motion (framer-motion) handles all animations. Components are composed inside `SpeakeasyScene` which manages reveal sequencing.

**Tech Stack:** Next.js 15, React 19, Motion (framer-motion), Tailwind CSS v4, existing design system primitives.

---

### Task 1: Add speakeasy theme CSS and keyframes

**Files:**
- Modify: `src/styles/theme.css` (append at end, before reduced-motion media query)

**Step 1: Add scoped speakeasy theme variables**

Add the `[data-scene="speakeasy"]` selector with the burgundy color overrides. Place it after the `.theme-night` block (around line 144) but before the `@theme inline` block:

```css
/* 411 Speakeasy — scoped dark romanticism palette */
[data-scene="speakeasy"] {
  --background: #0a0604;
  --foreground: #8b2236;
  --accent: #8b2236;
  --muted-foreground: #6b1d2a;
  --muted: #1a0a0d;
  --border: #3d1520;
  --card: #120608;
}
```

**Step 2: Add speakeasy-specific keyframes**

Add before the `/* Respect reduced motion */` media query block (around line 746):

```css
/* ========================
   SPEAKEASY 411 — Keyframe Animations
   ======================== */
@keyframes speakeasy-glow-pulse {
  0%, 100% { opacity: 0.12; }
  50% { opacity: 0.18; }
}

@keyframes speakeasy-drift {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(3px, -5px) rotate(0.3deg); }
  50% { transform: translate(-2px, 3px) rotate(-0.2deg); }
  75% { transform: translate(4px, 2px) rotate(0.15deg); }
}

@keyframes speakeasy-vignette-breathe {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 0.92; }
}
```

**Step 3: Add reduced-motion overrides for speakeasy**

Inside the existing `@media (prefers-reduced-motion: reduce)` block, add:

```css
[data-scene="speakeasy"] * {
  animation: none !important;
}
```

**Step 4: Verify**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds (CSS is valid)

**Step 5: Commit**

```bash
git add src/styles/theme.css
git commit -m "feat(speakeasy): add scoped 411 theme variables and keyframes"
```

---

### Task 2: Create SpeakeasyBackground component

**Files:**
- Create: `src/app/speakeasy/_components/SpeakeasyBackground.tsx`

**Step 1: Create the _components directory and background component**

```tsx
"use client";

export function SpeakeasyBackground() {
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      {/* Deep black base */}
      <div className="absolute inset-0" style={{ backgroundColor: "#0a0604" }} />

      {/* Burgundy radial glow from below — distant candlelight */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 85%, rgba(107,29,42,0.15) 0%, transparent 70%)",
          animation: "speakeasy-glow-pulse 8s ease-in-out infinite",
        }}
      />

      {/* Heavy vignette — corners near-black */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 50% 50%, transparent 0%, rgba(10,6,4,0.85) 100%)",
          animation: "speakeasy-vignette-breathe 10s ease-in-out infinite",
        }}
      />

      {/* Enhanced noise/grain overlay */}
      <div className="absolute inset-0" style={{ opacity: 0.16 }}>
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

**Step 2: Verify**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasyBackground.tsx
git commit -m "feat(speakeasy): add SpeakeasyBackground with glow, vignette, and grain"
```

---

### Task 3: Create SpeakeasyReveal animation wrapper

**Files:**
- Create: `src/app/speakeasy/_components/SpeakeasyReveal.tsx`

**Step 1: Create the reveal component**

This wraps children in a Motion component that fades in with a configurable delay. Uses the same easing curve as the rest of the site (`EASE_OUT_EXPO`).

```tsx
"use client";

import { motion } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/constants";
import type { ReactNode } from "react";

interface SpeakeasyRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  y?: number;
}

export function SpeakeasyReveal({
  children,
  delay = 0,
  duration = 0.8,
  className,
  y = 12,
}: SpeakeasyRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Step 2: Verify**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasyReveal.tsx
git commit -m "feat(speakeasy): add SpeakeasyReveal staggered fade-in wrapper"
```

---

### Task 4: Create SpeakeasyHeader component

**Files:**
- Create: `src/app/speakeasy/_components/SpeakeasyHeader.tsx`

**Step 1: Create the header with tagline and title**

```tsx
"use client";

import { SpeakeasyReveal } from "./SpeakeasyReveal";

export function SpeakeasyHeader() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* "411" — the centerpiece */}
      <SpeakeasyReveal delay={0}>
        <h1
          className="font-display text-[clamp(4rem,12vw,10rem)] leading-[0.9] tracking-tight"
          style={{
            color: "#8b2236",
            textShadow: "0 0 40px rgba(139,34,54,0.3), 0 0 80px rgba(139,34,54,0.1)",
          }}
        >
          411
        </h1>
      </SpeakeasyReveal>

      {/* Cryptic tagline */}
      <SpeakeasyReveal delay={0.2}>
        <p
          className="font-display italic text-[clamp(1rem,3vw,1.75rem)] mt-6 leading-snug"
          style={{ color: "rgba(107,29,42,0.8)" }}
        >
          what the walls remember
        </p>
      </SpeakeasyReveal>
    </div>
  );
}
```

**Step 2: Verify**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasyHeader.tsx
git commit -m "feat(speakeasy): add SpeakeasyHeader with title and tagline"
```

---

### Task 5: Create SpeakeasyDetails component

**Files:**
- Create: `src/app/speakeasy/_components/SpeakeasyDetails.tsx`

**Step 1: Create the expandable description + menu button**

Uses the same `AnimatePresence` + `gridTemplateRows` pattern from `MenuPanel.tsx` for the expand/collapse animation. The menu PDF URL will be a placeholder until CMS integration.

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/constants";
import { SpeakeasyReveal } from "./SpeakeasyReveal";

interface SpeakeasyDetailsProps {
  menuPdfUrl?: string;
}

export function SpeakeasyDetails({ menuPdfUrl }: SpeakeasyDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      {/* Expandable "about the room" trigger + panel */}
      <SpeakeasyReveal delay={0.6} className="w-full">
        <div className="flex flex-col items-center">
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="cursor-pointer font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase transition-opacity duration-300 hover:opacity-80"
            style={{ color: "rgba(107,29,42,0.4)" }}
          >
            {isOpen ? "close" : "about the room"}
          </button>

          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                key="details"
                initial={{ gridTemplateRows: "0fr", opacity: 0 }}
                animate={{ gridTemplateRows: "1fr", opacity: 1 }}
                exit={{ gridTemplateRows: "0fr", opacity: 0 }}
                transition={{
                  gridTemplateRows: { duration: 0.6, ease: EASE_OUT_EXPO },
                  opacity: { duration: 0.4, ease: "easeInOut" },
                }}
                className="grid w-full"
              >
                <div className="overflow-hidden">
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="font-display italic text-[clamp(0.875rem,2vw,1.0625rem)] leading-[1.65] text-center mt-6"
                    style={{ color: "rgba(107,29,42,0.7)" }}
                  >
                    Behind the painting, past the lady with still lips — a room
                    that trades in whispers and well-kept secrets. The cocktails
                    here have no names you&apos;ll remember by morning.
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SpeakeasyReveal>

      {/* Menu PDF button */}
      <SpeakeasyReveal delay={0.8}>
        <a
          href={menuPdfUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center border px-8 py-4 font-body text-[0.875rem] font-medium tracking-[0.06em] uppercase transition-all duration-400"
          style={{
            color: "#8b2236",
            borderColor: "#8b2236",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#8b2236";
            e.currentTarget.style.color = "#0a0604";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(139,34,54,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#8b2236";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          See Cocktails
        </a>
      </SpeakeasyReveal>
    </div>
  );
}
```

**Step 2: Verify**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasyDetails.tsx
git commit -m "feat(speakeasy): add SpeakeasyDetails with expandable description and menu button"
```

---

### Task 6: Create SpeakeasyBotanicals component

**Files:**
- Create: `src/app/speakeasy/_components/SpeakeasyBotanicals.tsx`

**Step 1: Create the botanical illustration layer**

Ships with placeholder SVG shapes that Leon will replace with custom illustrations. Each botanical element has a drift animation and a blurred duplicate glow behind it.

```tsx
"use client";

import { SpeakeasyReveal } from "./SpeakeasyReveal";

/**
 * Placeholder botanical positions.
 * Replace `src` paths with Leon's custom SVG illustrations.
 * Each slot is absolutely positioned around the viewport edges.
 */
const BOTANICAL_SLOTS = [
  { id: "top-left", x: "3%", y: "5%", size: "clamp(120px, 18vw, 220px)", rotate: -12 },
  { id: "top-right", x: "75%", y: "3%", size: "clamp(100px, 15vw, 200px)", rotate: 8 },
  { id: "bottom-left", x: "2%", y: "65%", size: "clamp(130px, 20vw, 240px)", rotate: -5 },
  { id: "bottom-right", x: "78%", y: "70%", size: "clamp(110px, 16vw, 210px)", rotate: 15 },
] as const;

export function SpeakeasyBotanicals() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {BOTANICAL_SLOTS.map((slot, i) => (
        <SpeakeasyReveal
          key={slot.id}
          delay={0.4 + i * 0.1}
          y={0}
          className="absolute"
          duration={1.2}
        >
          <div
            className="absolute"
            style={{
              left: slot.x,
              top: slot.y,
              width: slot.size,
              height: slot.size,
            }}
          >
            {/* Blurred glow duplicate behind the illustration */}
            <div
              className="absolute inset-0"
              style={{
                filter: "blur(40px)",
                opacity: 0.15,
                animation: `speakeasy-drift ${15 + i * 3}s ease-in-out infinite`,
                animationDelay: `${i * -4}s`,
              }}
            >
              <PlaceholderBotanical rotate={slot.rotate} />
            </div>

            {/* The actual illustration */}
            <div
              className="absolute inset-0"
              style={{
                opacity: 0.25,
                transform: `rotate(${slot.rotate}deg)`,
                animation: `speakeasy-drift ${18 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * -3}s`,
              }}
            >
              <PlaceholderBotanical rotate={0} />
            </div>
          </div>
        </SpeakeasyReveal>
      ))}
    </div>
  );
}

/**
 * Temporary placeholder — replace with Leon's SVG illustrations.
 * This draws a simple organic shape in burgundy.
 */
function PlaceholderBotanical({ rotate }: { rotate: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* Organic vine/thorn placeholder shape */}
      <path
        d="M100 10 C120 40, 160 50, 140 90 C120 130, 160 150, 130 180 C110 190, 90 190, 70 180 C40 150, 80 130, 60 90 C40 50, 80 40, 100 10Z"
        fill="#8b2236"
        opacity="0.6"
      />
      <path
        d="M85 60 C90 45, 110 45, 115 60 C120 75, 110 85, 100 90 C90 85, 80 75, 85 60Z"
        fill="#6b1d2a"
        opacity="0.4"
      />
    </svg>
  );
}
```

**Step 2: Verify**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasyBotanicals.tsx
git commit -m "feat(speakeasy): add SpeakeasyBotanicals with placeholder SVGs and drift animations"
```

---

### Task 7: Create SpeakeasyScene orchestrator and wire up page

**Files:**
- Create: `src/app/speakeasy/_components/SpeakeasyScene.tsx`
- Modify: `src/app/speakeasy/page.tsx`

**Step 1: Create the scene orchestrator**

```tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { SpeakeasyBackground } from "./SpeakeasyBackground";
import { SpeakeasyBotanicals } from "./SpeakeasyBotanicals";
import { SpeakeasyHeader } from "./SpeakeasyHeader";
import { SpeakeasyDetails } from "./SpeakeasyDetails";
import { SpeakeasyReveal } from "./SpeakeasyReveal";

interface SpeakeasySceneProps {
  menuPdfUrl?: string;
}

export function SpeakeasyScene({ menuPdfUrl }: SpeakeasySceneProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      router.push("/");
    }, 600);
  }, [router]);

  return (
    <div
      data-scene="speakeasy"
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: "#0a0604" }}
    >
      <SpeakeasyBackground />
      <SpeakeasyBotanicals />

      {/* Exit fade overlay */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50"
        style={{ backgroundColor: "#0a0604" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {/* Content layer */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <SpeakeasyHeader />

        <div className="mt-12">
          <SpeakeasyDetails menuPdfUrl={menuPdfUrl} />
        </div>

        {/* Return link — quiet, nearly invisible */}
        <SpeakeasyReveal delay={1.0} className="mt-16">
          <button
            onClick={handleExit}
            className="cursor-pointer font-body text-[0.6875rem] tracking-[0.04em] lowercase transition-opacity duration-300 hover:opacity-60"
            style={{ color: "rgba(107,29,42,0.25)" }}
          >
            surface
          </button>
        </SpeakeasyReveal>
      </div>
    </div>
  );
}
```

**Step 2: Update the page entry point**

Replace the entire contents of `src/app/speakeasy/page.tsx`:

```tsx
import type { Metadata } from "next";
import { SpeakeasyScene } from "./_components/SpeakeasyScene";

export const metadata: Metadata = {
  title: "411 — Leche Negra",
  description: "Behind the painting.",
};

export default function SpeakeasyPage() {
  return <SpeakeasyScene />;
}
```

**Step 3: Verify**

Run: `npx next dev` and navigate to `/speakeasy` in the browser.
Expected: Page loads with dark background, burgundy "411" title with text-shadow, tagline below, "about the room" expandable trigger, "See Cocktails" button, "surface" return link. Staggered fade-in animation plays on load. Botanical placeholders visible at corners with slow drift.

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/speakeasy/_components/SpeakeasyScene.tsx src/app/speakeasy/page.tsx
git commit -m "feat(speakeasy): add SpeakeasyScene orchestrator and update page entry"
```

---

### Task 8: Visual polish and animation tuning

**Files:**
- Modify: various `_components/` files as needed based on visual review

**Step 1: Start dev server and review**

Run: `npx next dev`
Navigate to `/speakeasy` and visually verify:

- [ ] Entry animation timing feels right (stagger delays)
- [ ] Burgundy glow pulse is subtle (not distracting)
- [ ] Vignette is heavy enough at corners
- [ ] "411" text-shadow has depth without looking cheesy
- [ ] Expand/collapse panel animates smoothly
- [ ] Button hover state transition is smooth
- [ ] "surface" link is nearly invisible but findable
- [ ] Botanical drift is barely perceptible
- [ ] Noise grain overlay is slightly more visible than main site
- [ ] No layout shift or flash of unstyled content

**Step 2: Test the full flow**

1. Start on `/` (homepage)
2. Drag the footer to trigger speakeasy transition
3. Verify the transition lands on `/speakeasy` with the new design
4. Click "about the room" — panel expands
5. Click "close" — panel collapses
6. Click "surface" — page fades to black, returns to `/`

**Step 3: Test reduced motion**

In browser DevTools, enable `prefers-reduced-motion: reduce`.
Verify: all animations are disabled, content still appears (no stagger, instant display), page still functions.

**Step 4: Test mobile**

Use browser responsive mode (375px width).
Verify: text scales down via `clamp()`, botanical elements don't cause horizontal overflow, content is centered and readable, button is tappable.

**Step 5: Adjust and commit**

Make any needed adjustments to timing, opacity, sizing, or positioning based on the visual review.

```bash
git add -A
git commit -m "feat(speakeasy): visual polish and animation tuning"
```

---

## Notes for Implementation

- **EASE_OUT_EXPO** is imported from `@/lib/constants` — use it for all motion transitions to match site feel.
- **Motion import** is `from "motion/react"` (not `framer-motion`) — check existing components for reference.
- **Botanical SVGs** are placeholders. Leon will provide custom illustrations. The component is structured so he can drop SVG files into `public/images/speakeasy/` and reference them via `<img>` tags or inline SVGs.
- **Menu PDF URL** will come from Sanity CMS eventually. For now it's an optional prop with `#` fallback.
- **The `body::after` noise overlay** from `theme.css` will still render on the speakeasy page (it's global, z-index 9999). The speakeasy's own grain SVG adds to it — this is intentional for a denser texture.
