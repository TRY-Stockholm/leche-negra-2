# Stage Scene Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port the interactive audio-reactive stage scene from leche-negra to leche-negra-2, with compressed audio, no spotlights/lamps, mobile pan-to-musician, and the current site's theming.

**Architecture:** A `/stage` route renders a full-screen layered scene. StageScene manages state + audio loop. Visual layers read `--audio-level` from a CSS custom property (no React re-renders). Tone.js handles 6 audio stems with per-stem gain nodes. Mobile uses horizontal drag with tap-to-pan; desktop uses mouse parallax + clickable hotspots.

**Tech Stack:** Next.js 15 (App Router), React 19, Motion (framer-motion v12), Tone.js (lazy-loaded), Canvas 2D (particles), CSS custom properties for audio reactivity.

---

## Prerequisites

Before starting implementation, these manual steps must be completed:

### Copy SVG asset
```bash
cp /Users/leonmcvey/Documents/Projects/leche-negra/public/images/lecheFINAL.svg /Users/leonmcvey/Documents/Projects/leche-negra-2/public/images/lecheFINAL.svg
```

### Convert audio stems from WAV to AAC
```bash
mkdir -p /Users/leonmcvey/Documents/Projects/leche-negra-2/public/audio/stage
for i in 01 02 03 04 05 06; do
  ffmpeg -i "/Users/leonmcvey/Documents/Projects/leche-negra/public/audio/stage/classical_stems/playful-waltz_stem-${i}.wav" \
    -c:a aac -b:a 192k \
    "/Users/leonmcvey/Documents/Projects/leche-negra-2/public/audio/stage/playful-waltz_stem-${i}.m4a"
done
```

### Install Tone.js
```bash
cd /Users/leonmcvey/Documents/Projects/leche-negra-2 && npm install tone
```

---

## Task 1: Types & Configuration

**Files:**
- Create: `src/app/stage/_components/types.ts`
- Create: `src/app/stage/_components/stage-config.ts`

**Step 1: Create types file**

```ts
// src/app/stage/_components/types.ts
export interface InstrumentConfig {
  id: string;
  name: string;
  audioFile: string;
  /** Position as percentage (0-100) within the SVG scene */
  position: { x: number; y: number };
  /** Hex color for glow/UI elements */
  color: string;
}
```

**Step 2: Create stage config**

The instrument positions need to match the actual musician locations in `lecheFINAL.svg`. The SVG viewBox is `0 0 1957.16 1080.1`. The musician group positions (approximate center of each group, as percentage of viewBox):

- Drummer: roughly x:35%, y:50%
- Sax: roughly x:50%, y:48%
- Violinist: roughly x:65%, y:50%
- Trumpet: roughly x:78%, y:48%
- Upright (bass): roughly x:88%, y:50%
- Strings/Pad (stem-01): no musician visual, position at x:15%, y:45%

Note: these positions are estimates. After the SVG is loaded in the browser, visually verify and adjust positions to align glows/hotspots with the actual musician silhouettes. The original project had misaligned spotlights — getting these right is a key goal.

```ts
// src/app/stage/_components/stage-config.ts
import type { InstrumentConfig } from "./types";

export const STAGE_BPM = 110;
export const STAGE_BARS = 8;
export const LOOP_DURATION = (60 / STAGE_BPM) * 4 * STAGE_BARS; // ~17.45s

export const instruments: InstrumentConfig[] = [
  {
    id: "stem-01",
    name: "Strings",
    audioFile: "/audio/stage/playful-waltz_stem-01.m4a",
    position: { x: 15, y: 45 },
    color: "#D4AF37",
  },
  {
    id: "stem-02",
    name: "Drums",
    audioFile: "/audio/stage/playful-waltz_stem-02.m4a",
    position: { x: 35, y: 50 },
    color: "#C9A96E",
  },
  {
    id: "stem-03",
    name: "Saxophone",
    audioFile: "/audio/stage/playful-waltz_stem-03.m4a",
    position: { x: 50, y: 48 },
    color: "#B8860B",
  },
  {
    id: "stem-04",
    name: "Violin",
    audioFile: "/audio/stage/playful-waltz_stem-04.m4a",
    position: { x: 65, y: 50 },
    color: "#DAA520",
  },
  {
    id: "stem-05",
    name: "Trumpet",
    audioFile: "/audio/stage/playful-waltz_stem-05.m4a",
    position: { x: 78, y: 48 },
    color: "#CD853F",
  },
  {
    id: "stem-06",
    name: "Bass",
    audioFile: "/audio/stage/playful-waltz_stem-06.m4a",
    position: { x: 88, y: 50 },
    color: "#D4AF37",
  },
];

/**
 * Maps SVG group IDs to stem IDs.
 * stem-01 (Strings/Pad) has no musician visual in the SVG.
 */
export const MUSICIAN_LAYERS: Record<string, string[]> = {
  "stem-02": ["Drummer"],
  "stem-03": ["Sax"],
  "stem-04": ["Violinist"],
  "stem-05": ["Trumpet"],
  "stem-06": ["Upright"],
};
```

**Step 3: Commit**

```bash
git add src/app/stage/_components/types.ts src/app/stage/_components/stage-config.ts
git commit -m "feat(stage): add types and instrument config"
```

---

## Task 2: Audio Engine

**Files:**
- Create: `src/app/stage/_components/AudioEngine.ts`

**Step 1: Create AudioEngine class**

Port directly from the original with minimal changes. The API stays the same: `init()`, `unlock()`, `toggle()`, `getLevel()`, `setVolume()`, `muteAll()`, `dispose()`.

```ts
// src/app/stage/_components/AudioEngine.ts
import type { InstrumentConfig } from "./types";

type ToneModule = typeof import("tone");

export class StageAudioEngine {
  private Tone: ToneModule | null = null;
  private players: Map<string, InstanceType<ToneModule["Player"]>> = new Map();
  private gains: Map<string, InstanceType<ToneModule["Gain"]>> = new Map();
  private masterGain: InstanceType<ToneModule["Gain"]> | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserData: Uint8Array | null = null;
  private isInitialized = false;
  private _isUnlocked = false;

  get isUnlocked(): boolean {
    return this._isUnlocked;
  }

  async init(instruments: InstrumentConfig[]): Promise<void> {
    if (this.isInitialized) return;

    const Tone = await import("tone");
    this.Tone = Tone;

    this.masterGain = new Tone.Gain(0.8).toDestination();

    const ctx = Tone.getContext().rawContext;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;
    this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);
    this.masterGain.connect(this.analyser as unknown as AudioNode);

    instruments.forEach((inst) => {
      const gain = new Tone.Gain(0).connect(this.masterGain!);
      const player = new Tone.Player({
        url: inst.audioFile,
        loop: true,
        fadeIn: 0.2,
        fadeOut: 0.2,
      }).connect(gain);

      this.players.set(inst.id, player);
      this.gains.set(inst.id, gain);
    });

    await Tone.loaded();
    this.isInitialized = true;
  }

  async unlock(): Promise<void> {
    if (!this.Tone) return;
    await this.Tone.start();
    this._isUnlocked = true;

    this.players.forEach((player) => {
      if (player.loaded) player.start();
    });
  }

  toggle(instrumentId: string): boolean {
    if (!this.Tone || !this._isUnlocked) return false;

    const gain = this.gains.get(instrumentId);
    if (!gain) return false;

    const isActive = gain.gain.value > 0.5;
    const now = this.Tone.now();

    if (isActive) {
      gain.gain.rampTo(0, 0.2, now);
      return false;
    } else {
      gain.gain.rampTo(1, 0.2, now);
      return true;
    }
  }

  isActive(instrumentId: string): boolean {
    const gain = this.gains.get(instrumentId);
    if (!gain) return false;
    return gain.gain.value > 0.5;
  }

  getLevel(): number {
    if (!this.analyser || !this.analyserData) return 0;
    this.analyser.getByteTimeDomainData(this.analyserData);
    let sum = 0;
    for (let i = 0; i < this.analyserData.length; i++) {
      const v = (this.analyserData[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / this.analyserData.length) * 3.5);
  }

  setVolume(value: number): void {
    if (!this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, value));
    this.masterGain.gain.rampTo(clamped, 0.1);
  }

  muteAll(): void {
    if (!this.Tone) return;
    const now = this.Tone.now();
    this.gains.forEach((gain) => {
      gain.gain.rampTo(0, 0.2, now);
    });
  }

  dispose(): void {
    this.players.forEach((player) => {
      player.stop();
      player.dispose();
    });
    this.gains.forEach((gain) => gain.dispose());
    this.masterGain?.dispose();
    this.analyser?.disconnect();
    this.players.clear();
    this.gains.clear();
    this.masterGain = null;
    this.analyser = null;
    this.analyserData = null;
    this.Tone = null;
    this.isInitialized = false;
    this._isUnlocked = false;
  }
}
```

**Step 2: Verify build**

```bash
cd /Users/leonmcvey/Documents/Projects/leche-negra-2 && npm run build
```

Expected: Build succeeds (AudioEngine is not imported by anything yet, but should have no syntax errors).

**Step 3: Commit**

```bash
git add src/app/stage/_components/AudioEngine.ts
git commit -m "feat(stage): add Tone.js audio engine"
```

---

## Task 3: CSS Animations

**Files:**
- Modify: `src/styles/theme.css`

**Step 1: Add stage keyframe animations and utility classes**

Add these at the end of `src/styles/theme.css`, before the closing of any layer block or at the bottom of the file. These are the same animations from the original, plus the glow zone utility class:

```css
/* ========================
   STAGE — Keyframe Animations
   ======================== */
@keyframes stage-pulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.08); opacity: 0.15; }
}

@keyframes candle-flicker {
  0%, 100% { opacity: 1; }
  25% { opacity: 0.8; }
  50% { opacity: 1; }
  75% { opacity: 0.6; }
}

@keyframes vignette-breathe {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.55; }
}

@keyframes haze-drift-1 {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(3vw, -2vh); }
  50% { transform: translate(-2vw, 3vh); }
  75% { transform: translate(4vw, 1vh); }
}

@keyframes haze-drift-2 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(-4vw, 2vh); }
  66% { transform: translate(2vw, -3vh); }
}

@keyframes haze-drift-3 {
  0%, 100% { transform: translate(0, 0); }
  30% { transform: translate(2vw, 4vh); }
  60% { transform: translate(-3vw, -1vh); }
}

@keyframes godray-sway {
  0%, 100% { transform: translateX(-50%) rotate(var(--ray-base-angle, 0deg)); }
  50% { transform: translateX(-50%) rotate(calc(var(--ray-base-angle, 0deg) + 2deg)); }
}

@keyframes bokeh-float {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(8px, -12px); }
  50% { transform: translate(-5px, 8px); }
  75% { transform: translate(10px, -5px); }
}

/* ========================
   STAGE — Glow Zones (audio-reactive via --audio-level)
   ======================== */
.stage-glow-zone {
  position: absolute;
  transform: translate(-50%, -50%);
  width: clamp(140px, 18vw, 240px);
  height: clamp(140px, 18vw, 240px);
  border-radius: 50%;
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.8s ease;
  pointer-events: none;
}

.stage-glow-zone[data-active] {
  opacity: calc(0.45 + var(--audio-level, 0) * 0.55);
  transition: opacity 0.12s ease;
}
```

**Step 2: Commit**

```bash
git add src/styles/theme.css
git commit -m "feat(stage): add stage keyframe animations and glow styles"
```

---

## Task 4: useIsMobile Hook

**Files:**
- Create: `src/hooks/useIsMobile.ts`

**Step 1: Create the hook**

The original project uses a width-based mobile check (768px). leche-negra-2 already has `useCanHover` but we need a width-based one for the stage (some effects are disabled on small screens regardless of hover capability).

```ts
// src/hooks/useIsMobile.ts
import { useState, useEffect } from "react";

/** Returns true when viewport width is below 768px. */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
```

**Step 2: Commit**

```bash
git add src/hooks/useIsMobile.ts
git commit -m "feat: add useIsMobile hook"
```

---

## Task 5: SceneBackground (SVG + Parallax + Mobile Drag + Pan-to-Musician)

**Files:**
- Create: `src/app/stage/_components/SceneBackground.tsx`

**Step 1: Create the component**

This is the most complex component. It loads the SVG inline, sets up musician visibility masks, handles desktop parallax and mobile drag, and implements the pan-to-musician feature.

Key changes from original:
- Uses `motion/react` instead of `framer-motion`
- Adds `panToMusician(stemId)` callback for mobile tap-to-pan
- Uses leche-negra-2's color variables where possible
- Exposes `panToMusician` via a ref callback prop so StageScene can call it

```tsx
// src/app/stage/_components/SceneBackground.tsx
"use client";

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { instruments, MUSICIAN_LAYERS } from "./stage-config";

const SVG_NS = "http://www.w3.org/2000/svg";
const MASK_STROKE_WIDTH = 40;

export interface SceneBackgroundHandle {
  panToMusician: (stemId: string) => void;
}

interface SceneBackgroundProps {
  activeCount: number;
  activeInstruments: Set<string>;
}

function blackenForMask(el: SVGElement) {
  el.setAttribute("fill", "black");
  el.setAttribute("stroke", "black");
  el.setAttribute("stroke-width", String(MASK_STROKE_WIDTH));
  el.setAttribute("stroke-linejoin", "round");
  el.removeAttribute("opacity");
  el.style.cssText = "";
  for (const child of Array.from(el.children)) {
    if (child instanceof SVGElement) blackenForMask(child);
  }
}

export const SceneBackground = forwardRef<SceneBackgroundHandle, SceneBackgroundProps>(
  function SceneBackground({ activeCount, activeInstruments }, ref) {
    const isMobile = useIsMobile();
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const musicianGroupsRef = useRef<Map<string, SVGGElement[]>>(new Map());
    const maskClonesRef = useRef<Map<string, SVGGElement[]>>(new Map());
    const bgGroupRef = useRef<SVGGElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [panMax, setPanMax] = useState(0);
    const [svgLoaded, setSvgLoaded] = useState(false);

    // Mobile drag position
    const panX = useMotionValue(0);

    // Desktop parallax
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const parallaxX = useSpring(mouseX, { stiffness: 120, damping: 20 });
    const parallaxY = useSpring(mouseY, { stiffness: 120, damping: 20 });
    const desktopX = useTransform(parallaxX, (v: number) => v * -8);
    const desktopY = useTransform(parallaxY, (v: number) => v * -5);

    // Pan-to-musician: animate panX to center the musician
    const panToMusician = useCallback(
      (stemId: string) => {
        if (!isMobile || !svgRef.current) return;

        const inst = instruments.find((i) => i.id === stemId);
        if (!inst) return;

        const svg = svgRef.current;
        const vb = svg.viewBox.baseVal;
        const svgAR = vb.width / vb.height;
        const vh = window.innerHeight;
        const fullWidth = vh * svgAR;
        const vw = window.innerWidth;

        // Convert instrument x% to pixel offset, then calculate pan to center it
        const musicianPixelX = (inst.position.x / 100) * fullWidth;
        const targetPan = -(musicianPixelX - vw / 2);

        // Clamp to drag bounds
        const clamped = Math.max(-panMax, Math.min(panMax, targetPan));

        // Animate using spring
        panX.set(clamped);
      },
      [isMobile, panMax, panX],
    );

    useImperativeHandle(ref, () => ({ panToMusician }), [panToMusician]);

    // Inline the SVG and set up layers + mask
    useEffect(() => {
      const container = svgContainerRef.current;
      if (!container) return;

      fetch("/images/lecheFINAL.svg")
        .then((r) => r.text())
        .then((text) => {
          container.innerHTML = text;
          const svg = container.querySelector("svg");
          if (!svg) return;

          svgRef.current = svg;
          svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
          svg.style.width = "100%";
          svg.style.height = "100%";
          svg.style.position = "absolute";
          svg.style.inset = "0";

          const vb = svg.viewBox.baseVal;

          // Create mask for Background
          let defs = svg.querySelector("defs");
          if (!defs) {
            defs = document.createElementNS(SVG_NS, "defs");
            svg.insertBefore(defs, svg.firstChild);
          }

          const mask = document.createElementNS(SVG_NS, "mask");
          mask.id = "bg-cutout";
          mask.setAttribute("maskUnits", "userSpaceOnUse");
          mask.setAttribute("x", String(vb.x));
          mask.setAttribute("y", String(vb.y));
          mask.setAttribute("width", String(vb.width));
          mask.setAttribute("height", String(vb.height));

          const whiteRect = document.createElementNS(SVG_NS, "rect");
          whiteRect.setAttribute("x", String(vb.x));
          whiteRect.setAttribute("y", String(vb.y));
          whiteRect.setAttribute("width", String(vb.width));
          whiteRect.setAttribute("height", String(vb.height));
          whiteRect.setAttribute("fill", "white");
          mask.appendChild(whiteRect);

          const blurFilter = document.createElementNS(SVG_NS, "filter");
          blurFilter.id = "mask-blur";
          blurFilter.setAttribute("x", "-50%");
          blurFilter.setAttribute("y", "-50%");
          blurFilter.setAttribute("width", "200%");
          blurFilter.setAttribute("height", "200%");
          const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
          blur.setAttribute("stdDeviation", "8");
          blurFilter.appendChild(blur);
          defs.appendChild(blurFilter);
          defs.appendChild(mask);

          const bg = svg.querySelector<SVGGElement>("#Background");
          if (bg) {
            bg.style.opacity = "0.3";
            bg.style.transition = "opacity 1s ease";
            bg.setAttribute("mask", "url(#bg-cutout)");
            bgGroupRef.current = bg;
          }

          // Musician layers
          const groups = new Map<string, SVGGElement[]>();
          const maskClones = new Map<string, SVGGElement[]>();

          for (const [stemId, layerIds] of Object.entries(MUSICIAN_LAYERS)) {
            const layers: SVGGElement[] = [];
            const clones: SVGGElement[] = [];

            for (const id of layerIds) {
              const el = svg.querySelector<SVGGElement>(`#${CSS.escape(id)}`);
              if (!el) continue;

              el.style.opacity = "0";
              el.style.transition = "opacity 0.6s ease, filter 0.6s ease";
              layers.push(el);

              const clone = el.cloneNode(true) as SVGGElement;
              clone.removeAttribute("id");
              blackenForMask(clone);
              clone.setAttribute("filter", "url(#mask-blur)");
              clone.style.opacity = "0";
              clone.style.transition = "opacity 0.4s ease";
              mask.appendChild(clone);
              clones.push(clone);
            }

            if (layers.length > 0) {
              groups.set(stemId, layers);
              maskClones.set(stemId, clones);
            }
          }

          musicianGroupsRef.current = groups;
          maskClonesRef.current = maskClones;
          setSvgLoaded(true);
        });
    }, []);

    // Configure SVG sizing for mobile vs desktop
    useEffect(() => {
      if (!svgLoaded) return;
      const svg = svgRef.current;
      if (!svg) return;

      const vb = svg.viewBox.baseVal;
      if (!vb.width || !vb.height) return;

      if (isMobile) {
        const svgAR = vb.width / vb.height;
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const fullWidth = vh * svgAR;
        const overflow = Math.max(0, fullWidth - vw);

        svg.setAttribute("preserveAspectRatio", "xMinYMid meet");
        svg.style.width = `${fullWidth}px`;
        svg.style.height = "100%";
        svg.style.inset = "auto";
        svg.style.top = "0";
        svg.style.left = `${-overflow / 2}px`;

        setPanMax(overflow / 2);
      } else {
        svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.inset = "0";
        svg.style.top = "";
        svg.style.left = "";
        setPanMax(0);
      }
    }, [isMobile, svgLoaded]);

    // Update musician visibility + mask
    useEffect(() => {
      musicianGroupsRef.current.forEach((layers, stemId) => {
        const isActive = activeInstruments.has(stemId);

        layers.forEach((el) => {
          el.style.opacity = isActive ? "1" : "0";
          el.style.filter = isActive
            ? "drop-shadow(0 0 18px rgba(201,169,110,0.5)) drop-shadow(0 0 40px rgba(201,169,110,0.25))"
            : "none";
        });

        maskClonesRef.current.get(stemId)?.forEach((clone) => {
          clone.style.opacity = isActive ? "1" : "0";
        });
      });
    }, [activeInstruments]);

    // Update background opacity based on active count
    useEffect(() => {
      if (bgGroupRef.current) {
        bgGroupRef.current.style.opacity = String(0.25 + (activeCount / 6) * 0.35);
      }
    }, [activeCount]);

    // Desktop mouse parallax
    useEffect(() => {
      if (isMobile) return;

      const onMove = (e: MouseEvent) => {
        mouseX.set(e.clientX / window.innerWidth - 0.5);
        mouseY.set(e.clientY / window.innerHeight - 0.5);
      };

      window.addEventListener("mousemove", onMove, { passive: true });
      return () => window.removeEventListener("mousemove", onMove);
    }, [isMobile, mouseX, mouseY]);

    return (
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-charcoal, #1a1210)" }}
        aria-hidden="true"
      >
        {isMobile ? (
          <motion.div
            className="absolute inset-0"
            style={{ x: panX, willChange: "transform", touchAction: "pan-y" }}
            drag="x"
            dragConstraints={{ left: -panMax, right: panMax }}
            dragElastic={0.12}
            dragMomentum
            dragTransition={{ power: 0.3, timeConstant: 200 }}
          >
            <div ref={svgContainerRef} className="absolute inset-0" />
          </motion.div>
        ) : (
          <motion.div
            className="absolute inset-[-12px]"
            style={{ x: desktopX, y: desktopY, scale: 1.03, willChange: "transform" }}
          >
            <div ref={svgContainerRef} className="absolute inset-0" />
          </motion.div>
        )}
      </div>
    );
  },
);
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/stage/_components/SceneBackground.tsx
git commit -m "feat(stage): add SceneBackground with SVG inlining, parallax, and mobile pan"
```

---

## Task 6: Visual Layers — GlowLayer, HazeLayer, GodRayLayer, BokehLayer, ParticleCanvas

**Files:**
- Create: `src/app/stage/_components/GlowLayer.tsx`
- Create: `src/app/stage/_components/HazeLayer.tsx`
- Create: `src/app/stage/_components/GodRayLayer.tsx`
- Create: `src/app/stage/_components/BokehLayer.tsx`
- Create: `src/app/stage/_components/ParticleCanvas.tsx`

**Step 1: Create GlowLayer**

Direct port — glow zones positioned at each instrument, using CSS `--audio-level` for reactivity.

```tsx
// src/app/stage/_components/GlowLayer.tsx
"use client";

import { instruments } from "./stage-config";

interface GlowLayerProps {
  activeInstruments: Set<string>;
}

export function GlowLayer({ activeInstruments }: GlowLayerProps) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {instruments.map((inst) => {
        const isActive = activeInstruments.has(inst.id);
        return (
          <div
            key={inst.id}
            data-active={isActive || undefined}
            className="stage-glow-zone"
            style={{
              left: `${inst.position.x}%`,
              top: `${inst.position.y}%`,
              background: `radial-gradient(circle, ${inst.color}40 0%, ${inst.color}18 35%, transparent 70%)`,
            }}
          />
        );
      })}
    </div>
  );
}
```

**Step 2: Create HazeLayer**

```tsx
// src/app/stage/_components/HazeLayer.tsx
"use client";

import { useIsMobile } from "@/hooks/useIsMobile";

interface HazeLayerProps {
  activeCount: number;
}

export function HazeLayer({ activeCount }: HazeLayerProps) {
  const isMobile = useIsMobile();
  const baseOpacity = isMobile ? 0.5 : 1;
  const visible = activeCount >= 2;
  const intensity = Math.min(1, (activeCount - 1) / 4);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: visible ? intensity * baseOpacity : 0,
        transition: "opacity 2s ease",
        mixBlendMode: "screen",
      }}
      aria-hidden="true"
    >
      <div
        className="absolute"
        style={{
          left: "15%", top: "20%", width: "45vw", height: "50vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,169,110,0.06) 0%, transparent 70%)",
          animation: "haze-drift-1 35s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "40%", top: "10%", width: "50vw", height: "60vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(212,175,55,0.05) 0%, transparent 70%)",
          animation: "haze-drift-2 45s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "55%", top: "25%", width: "40vw", height: "45vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,169,110,0.07) 0%, transparent 70%)",
          animation: "haze-drift-3 55s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "25%", top: "40%", width: "55vw", height: "40vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(212,175,55,0.04) 0%, transparent 70%)",
          animation: "haze-drift-1 60s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}
```

**Step 3: Create GodRayLayer**

```tsx
// src/app/stage/_components/GodRayLayer.tsx
"use client";

import { useIsMobile } from "@/hooks/useIsMobile";

const RAYS = [
  { x: 28, angle: -3, w: 40, h: 70, delay: 0 },
  { x: 50, angle: 1, w: 50, h: 80, delay: 2 },
  { x: 72, angle: -2, w: 35, h: 65, delay: 4 },
  { x: 86, angle: 2, w: 30, h: 55, delay: 1 },
];

interface GodRayLayerProps {
  activeCount: number;
}

export function GodRayLayer({ activeCount }: GodRayLayerProps) {
  const isMobile = useIsMobile();
  if (isMobile) return null;

  const visible = activeCount >= 4;
  const intensity = Math.min(1, (activeCount - 3) / 3);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: visible ? intensity : 0,
        transition: "opacity 2s ease",
      }}
      aria-hidden="true"
    >
      {RAYS.map((ray, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${ray.x}%`,
            top: 0,
            width: `${ray.w}px`,
            height: `${ray.h}vh`,
            transform: `translateX(-50%) rotate(${ray.angle}deg) scaleY(${visible ? 1 : 0})`,
            transformOrigin: "top center",
            transition: "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
            background: "linear-gradient(180deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 50%, transparent 100%)",
            animation: `godray-sway ${8 + i * 2}s ease-in-out infinite`,
            animationDelay: `${ray.delay}s`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
```

**Step 4: Create BokehLayer**

```tsx
// src/app/stage/_components/BokehLayer.tsx
"use client";

import { useIsMobile } from "@/hooks/useIsMobile";

const BOKEH_CIRCLES = [
  { x: 8, y: 25, size: 100, opacity: 0.06, duration: 20, delay: 0 },
  { x: 75, y: 15, size: 80, opacity: 0.05, duration: 18, delay: 3 },
  { x: 45, y: 70, size: 120, opacity: 0.04, duration: 25, delay: 5 },
  { x: 90, y: 55, size: 60, opacity: 0.07, duration: 16, delay: 2 },
  { x: 20, y: 60, size: 90, opacity: 0.05, duration: 22, delay: 7 },
  { x: 60, y: 30, size: 70, opacity: 0.06, duration: 19, delay: 4 },
  { x: 35, y: 80, size: 50, opacity: 0.08, duration: 15, delay: 1 },
];

interface BokehLayerProps {
  activeCount: number;
}

export function BokehLayer({ activeCount }: BokehLayerProps) {
  const isMobile = useIsMobile();
  const circles = isMobile ? BOKEH_CIRCLES.slice(0, 3) : BOKEH_CIRCLES;
  const visible = activeCount >= 3;
  const intensity = Math.min(1, (activeCount - 2) / 3);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: visible ? intensity : 0,
        transition: "opacity 2.5s ease",
      }}
      aria-hidden="true"
    >
      {circles.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            opacity: b.opacity,
            background: "radial-gradient(circle, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.1) 40%, transparent 70%)",
            animation: `bokeh-float ${b.duration}s ease-in-out infinite`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
```

**Step 5: Create ParticleCanvas**

```tsx
// src/app/stage/_components/ParticleCanvas.tsx
"use client";

import { useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ParticleCanvasProps {
  activeCount: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
}

export function ParticleCanvas({ activeCount }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const activeCountRef = useRef(activeCount);
  activeCountRef.current = activeCount;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = isMobile ? 0.33 : 0.5;
    const maxParticles = isMobile ? 80 : 150;
    const minParticles = isMobile ? 30 : 60;

    const resize = () => {
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
    };
    resize();
    window.addEventListener("resize", resize);

    const createParticle = (): Particle => {
      const baseAlpha = 0.15 + Math.random() * 0.25;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.1,
        size: 1 + Math.random() * 1.5,
        alpha: baseAlpha,
        baseAlpha,
      };
    };

    particlesRef.current = [];

    const tick = () => {
      const count = activeCountRef.current;
      const targetCount =
        count >= 5
          ? Math.round(minParticles + ((count - 4) / 2) * (maxParticles - minParticles))
          : 0;
      const speed = 0.3 + (count / 6) * 1.2;

      const stageEl = canvas.closest("main");
      const audioLevel = parseFloat(
        stageEl?.style.getPropertyValue("--audio-level") || "0",
      );

      while (particlesRef.current.length < targetCount) {
        particlesRef.current.push(createParticle());
      }
      if (particlesRef.current.length > targetCount) {
        particlesRef.current.length = targetCount;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        const audioPush = audioLevel * 0.5;
        p.x += (Math.random() - 0.5) * audioPush;
        p.y += (Math.random() - 0.5) * audioPush;
        p.alpha = p.baseAlpha + audioLevel * 0.15;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      particlesRef.current = [];
    };
  }, [isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width: "100%", height: "100%", opacity: 0.8 }}
      aria-hidden="true"
    />
  );
}
```

**Step 6: Verify build**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add src/app/stage/_components/GlowLayer.tsx src/app/stage/_components/HazeLayer.tsx src/app/stage/_components/GodRayLayer.tsx src/app/stage/_components/BokehLayer.tsx src/app/stage/_components/ParticleCanvas.tsx
git commit -m "feat(stage): add visual layers — glow, haze, god rays, bokeh, particles"
```

---

## Task 7: UI Components — InstrumentToolbar, SceneHotspots, VolumeControl

**Files:**
- Create: `src/app/stage/_components/InstrumentToolbar.tsx`
- Create: `src/app/stage/_components/SceneHotspots.tsx`
- Create: `src/app/stage/_components/VolumeControl.tsx`

**Step 1: Create InstrumentToolbar**

Same as original but the `onToggle` callback receives the stem ID, and the parent (StageScene) decides whether to also pan on mobile.

```tsx
// src/app/stage/_components/InstrumentToolbar.tsx
"use client";

import { instruments } from "./stage-config";

interface InstrumentToolbarProps {
  activeInstruments: Set<string>;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

export function InstrumentToolbar({
  activeInstruments,
  onToggle,
  disabled,
}: InstrumentToolbarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30"
      role="toolbar"
      aria-label="Instrument controls"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(0deg, rgba(10,6,5,0.85) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="relative flex items-center justify-center gap-3 px-4 pb-5 pt-10 md:gap-5"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        {instruments.map((inst) => {
          const isActive = activeInstruments.has(inst.id);
          return (
            <button
              key={inst.id}
              onClick={() => !disabled && onToggle(inst.id)}
              disabled={disabled}
              className="group flex flex-col items-center gap-1.5 px-2 py-2 transition-opacity duration-300 md:px-0 md:py-0"
              style={{ opacity: disabled ? 0.2 : 1, minHeight: 44, minWidth: 44 }}
              aria-label={`${inst.name} — ${isActive ? "playing" : "muted"}`}
              aria-pressed={isActive}
            >
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: isActive ? 12 : 7,
                  height: isActive ? 12 : 7,
                  backgroundColor: isActive ? inst.color : "rgba(168,154,140,0.3)",
                  boxShadow: isActive
                    ? `0 0 8px ${inst.color}60, 0 0 16px ${inst.color}30`
                    : "none",
                }}
              />
              <span
                className="font-mono text-[9px] uppercase tracking-[0.12em] transition-colors duration-300"
                style={{ color: isActive ? inst.color : "rgba(168,154,140,0.5)" }}
              >
                {inst.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Create SceneHotspots**

Desktop-only clickable zones over musician positions.

```tsx
// src/app/stage/_components/SceneHotspots.tsx
"use client";

import { useState, useCallback } from "react";
import { instruments } from "./stage-config";

interface SceneHotspotsProps {
  activeInstruments: Set<string>;
  onToggle: (id: string) => void;
  disabled: boolean;
}

export function SceneHotspots({
  activeInstruments,
  onToggle,
  disabled,
}: SceneHotspotsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback(
    (id: string) => {
      if (!disabled) onToggle(id);
    },
    [disabled, onToggle],
  );

  return (
    <div className="absolute inset-0 z-20">
      {instruments.map((inst) => {
        const isActive = activeInstruments.has(inst.id);
        const isHovered = hoveredId === inst.id;

        return (
          <button
            key={inst.id}
            disabled={disabled}
            onClick={() => handleClick(inst.id)}
            onMouseEnter={() => setHoveredId(inst.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="absolute flex items-center justify-center transition-[background] duration-300"
            style={{
              left: `${inst.position.x}%`,
              top: `${inst.position.y}%`,
              transform: "translate(-50%, -50%)",
              width: "clamp(70px, 10vw, 120px)",
              height: "clamp(90px, 13vw, 150px)",
              cursor: disabled ? "default" : "pointer",
              borderRadius: "50%",
              background:
                isHovered && !disabled
                  ? `radial-gradient(circle, ${inst.color}18 0%, transparent 70%)`
                  : "transparent",
            }}
            aria-label={`${inst.name} — ${isActive ? "playing, click to mute" : "click to play"}`}
            aria-pressed={isActive}
          >
            <span
              className="absolute -top-8 whitespace-nowrap rounded-[2px] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-opacity duration-200"
              style={{
                backgroundColor: "rgba(26,18,16,0.92)",
                color: isActive ? inst.color : "#A89A8C",
                border: `1px solid ${isActive ? inst.color + "40" : "rgba(61,47,40,0.5)"}`,
                backdropFilter: "blur(4px)",
                opacity: isHovered && !disabled ? 1 : 0,
                pointerEvents: "none",
              }}
            >
              {inst.name}
            </span>
            {isActive && (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: `1px solid ${inst.color}30`,
                  animation: "stage-pulse 2s ease-in-out infinite",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
```

**Step 3: Create VolumeControl**

```tsx
// src/app/stage/_components/VolumeControl.tsx
"use client";

import { useCallback } from "react";

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (value: number) => void;
  onMuteAll: () => void;
}

export function VolumeControl({ volume, onVolumeChange, onMuteAll }: VolumeControlProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onVolumeChange(parseFloat(e.target.value));
    },
    [onVolumeChange],
  );

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-[2px] px-4 py-3"
      style={{
        backgroundColor: "rgba(26, 18, 16, 0.85)",
        border: "1px solid rgba(61, 47, 40, 0.5)",
        backdropFilter: "blur(8px)",
      }}
    >
      <label
        htmlFor="stage-volume"
        className="font-mono text-[10px] uppercase tracking-[0.1em]"
        style={{ color: "#A89A8C" }}
      >
        Vol
      </label>
      <input
        id="stage-volume"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={handleChange}
        className="h-1 w-20 cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, #c9a96e 0%, #c9a96e ${volume * 100}%, #3D2F28 ${volume * 100}%, #3D2F28 100%)`,
        }}
        aria-label="Master volume"
      />
      <button
        onClick={onMuteAll}
        className="min-h-8 rounded-[2px] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors duration-300 hover:bg-[rgba(201,169,110,0.1)]"
        style={{
          color: "#A89A8C",
          border: "1px solid rgba(61, 47, 40, 0.5)",
        }}
        aria-label="Mute all instruments"
      >
        Reset
      </button>
    </div>
  );
}
```

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/app/stage/_components/InstrumentToolbar.tsx src/app/stage/_components/SceneHotspots.tsx src/app/stage/_components/VolumeControl.tsx
git commit -m "feat(stage): add toolbar, hotspots, and volume control"
```

---

## Task 8: StageScene Main Component

**Files:**
- Create: `src/app/stage/_components/StageScene.tsx`

**Step 1: Create StageScene**

This is the main orchestrator. Key differences from original:
- No SpotlightLayer, LampLayer, or AwakeningFlash
- Preloader with "Be creative" text instead of StageIntro + AudioUnlockOverlay
- On mobile, toggling a stem also pans to that musician (via SceneBackground ref)
- Uses Motion (AnimatePresence) for preloader transitions
- Uses site's night-theme colors

```tsx
// src/app/stage/_components/StageScene.tsx
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { instruments } from "./stage-config";
import { useIsMobile } from "@/hooks/useIsMobile";
import { StageAudioEngine } from "./AudioEngine";
import { SceneBackground } from "./SceneBackground";
import type { SceneBackgroundHandle } from "./SceneBackground";
import { GlowLayer } from "./GlowLayer";
import { HazeLayer } from "./HazeLayer";
import { GodRayLayer } from "./GodRayLayer";
import { BokehLayer } from "./BokehLayer";
import { ParticleCanvas } from "./ParticleCanvas";
import { SceneHotspots } from "./SceneHotspots";
import { InstrumentToolbar } from "./InstrumentToolbar";
import { VolumeControl } from "./VolumeControl";

const PRELOADER_MIN_MS = 2000;

export function StageScene() {
  const isMobile = useIsMobile();
  const engineRef = useRef<StageAudioEngine | null>(null);
  const stageRef = useRef<HTMLElement>(null);
  const bgRef = useRef<SceneBackgroundHandle>(null);
  const rafRef = useRef<number>(0);

  const [activeInstruments, setActiveInstruments] = useState<Set<string>>(new Set());
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [phase, setPhase] = useState<"preloader" | "ready" | "scene">("preloader");
  const [volume, setVolume] = useState(0.8);

  // Initialize audio engine
  useEffect(() => {
    const engine = new StageAudioEngine();
    engineRef.current = engine;

    const minTimer = new Promise((r) => setTimeout(r, PRELOADER_MIN_MS));

    engine.init(instruments).then(() => {
      minTimer.then(() => setPhase("ready"));
    });

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Audio-reactive loop: sets --audio-level on <main>
  useEffect(() => {
    if (!isAudioUnlocked) return;
    const el = stageRef.current;
    if (!el) return;

    const tick = () => {
      const level = engineRef.current?.getLevel() ?? 0;
      el.style.setProperty("--audio-level", level.toFixed(3));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isAudioUnlocked]);

  const handleUnlock = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;

    await engine.unlock();
    setIsAudioUnlocked(true);
    setPhase("scene");
  }, []);

  const handleToggle = useCallback(
    (id: string) => {
      const engine = engineRef.current;
      if (!engine) return;

      const wasActive = engine.isActive(id);
      const nowActive = engine.toggle(id);

      setActiveInstruments((prev) => {
        const next = new Set(prev);
        if (nowActive) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });

      // On mobile, pan to musician when activating (not deactivating)
      if (isMobile && nowActive && !wasActive) {
        bgRef.current?.panToMusician(id);
      }
    },
    [isMobile],
  );

  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value);
    engineRef.current?.setVolume(value);
  }, []);

  const handleMuteAll = useCallback(() => {
    engineRef.current?.muteAll();
    setActiveInstruments(new Set());
  }, []);

  const activeCount = activeInstruments.size;

  return (
    <main
      ref={stageRef}
      className="relative h-screen w-screen overflow-hidden"
      style={{ backgroundColor: "var(--color-charcoal, #1a1210)" }}
    >
      {/* Preloader / Audio unlock overlay */}
      <AnimatePresence>
        {phase !== "scene" && (
          <motion.div
            key="preloader"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ backgroundColor: "var(--color-charcoal, #1a1210)" }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201,169,110,0.06) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />

            <AnimatePresence mode="wait">
              {phase === "preloader" ? (
                <motion.p
                  key="loading"
                  className="font-display italic text-[clamp(1.5rem,4vw,2.5rem)]"
                  style={{ color: "var(--color-cream, #f5f0e8)", opacity: 0.7 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  Be creative
                </motion.p>
              ) : (
                <motion.button
                  key="unlock"
                  onClick={handleUnlock}
                  className="flex flex-col items-center gap-6 rounded-[2px] border px-12 py-8 transition-all duration-500 hover:border-[var(--color-brass,#c9a96e)] hover:bg-[rgba(201,169,110,0.1)]"
                  style={{
                    borderColor: "rgba(201, 169, 110, 0.3)",
                    color: "var(--color-cream, #f5f0e8)",
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  autoFocus
                >
                  <span className="font-display text-2xl tracking-[-0.02em]">
                    Be creative
                  </span>
                  <span
                    className="font-mono text-xs uppercase tracking-[0.12em]"
                    style={{ color: "#A89A8C" }}
                  >
                    Tap to begin
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <p
              className="absolute bottom-8 font-mono text-[10px] uppercase tracking-[0.1em]"
              style={{ color: "#A89A8C", opacity: 0.5 }}
            >
              Best experienced with headphones
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene layers — always mounted, revealed after unlock */}
      <div
        className="absolute inset-0 transition-all duration-[1500ms] ease-out"
        style={{
          opacity: isAudioUnlocked ? 1 : 0.12,
          filter: `hue-rotate(${-5 + activeCount * 2.6}deg) saturate(${0.7 + activeCount * 0.1}) brightness(${1 + activeCount * 0.018})`,
        }}
      >
        <SceneBackground
          ref={bgRef}
          activeCount={activeCount}
          activeInstruments={activeInstruments}
        />
        <GlowLayer activeInstruments={activeInstruments} />
        <HazeLayer activeCount={activeCount} />
        <GodRayLayer activeCount={activeCount} />

        {/* Candle glows */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="absolute bottom-[15%] left-[8%] h-20 w-20 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(201,169,110,0.18) 0%, transparent 70%)",
              animation: "candle-flicker 3s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-[18%] right-[12%] h-16 w-16 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)",
              animation: "candle-flicker 4s ease-in-out infinite 1s",
            }}
          />
          <div
            className="absolute bottom-[20%] left-[45%] h-14 w-14 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(201,169,110,0.1) 0%, transparent 70%)",
              animation: "candle-flicker 5s ease-in-out infinite 2s",
            }}
          />
        </div>

        {/* Dynamic vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse ${30 + activeCount * 9}% ${25 + activeCount * 7}% at 50% 50%, transparent 0%, rgba(26,18,16,0.8) 100%)`,
            animation: activeCount === 0 ? "vignette-breathe 6s ease-in-out infinite" : "none",
            opacity: activeCount === 0 ? 1 : Math.max(0.35, 0.8 - activeCount * 0.08),
            transition: "opacity 1.5s ease",
          }}
          aria-hidden="true"
        />

        <ParticleCanvas activeCount={activeCount} />

        {/* Grain overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: isMobile ? 0.02 : 0.06 }}
          aria-hidden="true"
        >
          <svg width="100%" height="100%">
            <filter id="stage-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#stage-grain)" />
          </svg>
        </div>

        <BokehLayer activeCount={activeCount} />
      </div>

      {/* Desktop hotspots */}
      {!isMobile && (
        <SceneHotspots
          activeInstruments={activeInstruments}
          onToggle={handleToggle}
          disabled={!isAudioUnlocked}
        />
      )}

      {/* Volume control */}
      {isAudioUnlocked && (
        <VolumeControl
          volume={volume}
          onVolumeChange={handleVolumeChange}
          onMuteAll={handleMuteAll}
        />
      )}

      {/* Instrument toolbar */}
      <InstrumentToolbar
        activeInstruments={activeInstruments}
        onToggle={handleToggle}
        disabled={!isAudioUnlocked}
      />

      {/* Screen reader live region */}
      <div className="sr-only" role="status" aria-live="polite">
        {activeInstruments.size === 0
          ? "No instruments playing"
          : `Playing: ${Array.from(activeInstruments).join(", ")}`}
      </div>
    </main>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/stage/_components/StageScene.tsx
git commit -m "feat(stage): add main StageScene orchestrator"
```

---

## Task 9: Page Route

**Files:**
- Create: `src/app/stage/page.tsx`

**Step 1: Create the page**

```tsx
// src/app/stage/page.tsx
import type { Metadata } from "next";
import { StageScene } from "./_components/StageScene";

export const metadata: Metadata = {
  title: "The Stage — Leche Negra",
  description: "Step downstairs. Compose your own soundscape.",
};

export default function StagePage() {
  return <StageScene />;
}
```

**Step 2: Verify dev server**

```bash
npm run dev
```

Open `http://localhost:3000/stage` in the browser. Verify:
- Preloader appears with "Be creative" text
- After loading, "Tap to begin" button appears
- Clicking begins the scene
- Toolbar shows 6 stem buttons at the bottom
- Toggling stems reveals musicians and activates visual layers

**Step 3: Commit**

```bash
git add src/app/stage/page.tsx
git commit -m "feat(stage): add /stage page route"
```

---

## Task 10: Position Tuning & Polish

This task is manual and iterative. After the scene is running:

**Step 1: Tune musician positions in stage-config.ts**

Open `/stage` in the browser, toggle each stem one at a time, and verify:
- The glow zone aligns with the musician silhouette
- The hotspot (desktop) is centered on the musician
- The mobile pan centers the musician in the viewport

Adjust `position.x` and `position.y` values in `stage-config.ts` until everything lines up. Use browser devtools to inspect the SVG and find exact group positions if needed.

**Step 2: Verify all progressive reveal thresholds**

Toggle stems incrementally and verify:
- 0 stems: dark scene, vignette breathing
- 1 stem: musician + glow visible
- 2 stems: haze appears
- 3 stems: bokeh fades in
- 4 stems: god rays appear (desktop only)
- 5 stems: particle dust motes
- 6 stems: full warmth, all layers

**Step 3: Test mobile**

On a mobile device or responsive mode:
- Verify SVG is wider than viewport and draggable
- Tap a stem → musician appears AND viewport pans to them
- Tap an active stem → it deactivates, no pan
- Free drag works after a pan
- Toolbar is accessible at bottom with safe area inset

**Step 4: Commit final adjustments**

```bash
git add -A
git commit -m "fix(stage): tune musician positions and polish"
```
