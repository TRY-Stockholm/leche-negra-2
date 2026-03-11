# Press Infinity Canvas — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static press gallery with a GSAP-powered infinite drag canvas where press images and editorial quotes float like scattered polaroids on a dark table.

**Architecture:** Full-viewport canvas with pointer-drag panning and GSAP-driven inertia. Items are placed within a repeating tile (3000×2400px) that wraps seamlessly in all directions via modulo math. Two parallax layers create depth. Click-to-lightbox uses GSAP FLIP-style animation from canvas position to centered fullscreen. Sanity CMS provides both press images and press quotes.

**Tech Stack:** GSAP 3 (core + @gsap/react), React 19, Next.js 15, Sanity CMS, Tailwind CSS 4

---

### Task 1: Install GSAP

**Files:**
- Modify: `package.json`

**Step 1: Install gsap and the React hook package**

Run:
```bash
npm install gsap @gsap/react
```

**Step 2: Verify installation**

Run:
```bash
node -e "require('gsap'); console.log('gsap OK')"
```
Expected: `gsap OK`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add gsap and @gsap/react"
```

---

### Task 2: Create pressQuote Sanity Schema

**Files:**
- Create: `src/sanity/schemaTypes/pressQuote.ts`
- Modify: `src/sanity/schemaTypes/index.ts`

**Step 1: Create the schema file**

```typescript
// src/sanity/schemaTypes/pressQuote.ts
import { defineType, defineField } from 'sanity'
import { BlockquoteIcon } from '@sanity/icons'

export const pressQuote = defineType({
  name: 'pressQuote',
  title: 'Press Quote',
  type: 'document',
  icon: BlockquoteIcon,
  fields: [
    defineField({
      name: 'text',
      type: 'text',
      title: 'Quote Text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      type: 'number',
      title: 'Sort Order',
      description: 'Lower numbers appear first',
    }),
  ],
  preview: {
    select: { title: 'text' },
    prepare({ title }) {
      return {
        title: title?.length > 60 ? title.slice(0, 60) + '…' : title,
      }
    },
  },
})
```

**Step 2: Register in schema index**

In `src/sanity/schemaTypes/index.ts`, add the import and include in the types array:

```typescript
import { pressQuote } from './pressQuote'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [pressImage, siteSettings, socialLink, menu, pressQuote],
}
```

**Step 3: Commit**

```bash
git add src/sanity/schemaTypes/pressQuote.ts src/sanity/schemaTypes/index.ts
git commit -m "feat(sanity): add pressQuote document type"
```

---

### Task 3: Update Press Page Server Component & Query

**Files:**
- Modify: `src/app/press/page.tsx`

**Step 1: Rewrite page.tsx**

Replace the entire file. Fetch both `pressImage` and `pressQuote` documents and pass them to the new canvas component.

```tsx
// src/app/press/page.tsx
import { client } from "@/sanity/lib/client";
import { PressCanvas } from "./_components/PressCanvas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Press — Leche Negra",
  description: "Press images and editorial quotes.",
};

const PRESS_IMAGES_QUERY = `*[_type == "pressImage"] | order(order asc, _createdAt asc) {
  _id,
  title,
  image {
    asset->{ _id, url, metadata { lqip, dimensions { width, height } } },
    alt,
    hotspot,
    crop
  }
}`;

const PRESS_QUOTES_QUERY = `*[_type == "pressQuote"] | order(order asc, _createdAt asc) {
  _id,
  text
}`;

export default async function PressPage() {
  const [images, quotes] = await Promise.all([
    client.fetch(PRESS_IMAGES_QUERY),
    client.fetch(PRESS_QUOTES_QUERY),
  ]);

  return <PressCanvas images={images} quotes={quotes} />;
}
```

**Step 2: Commit**

```bash
git add src/app/press/page.tsx
git commit -m "feat(press): fetch images + quotes, pass to canvas"
```

---

### Task 4: Build PressCanvas — Core Infinite Canvas with GSAP Drag

This is the main component. It renders a full-viewport dark canvas with drag-to-pan, GSAP inertia, and infinite tiling.

**Files:**
- Create: `src/app/press/_components/PressCanvas.tsx`
- Create: `src/app/press/_components/useCanvasDrag.ts`

**Architecture notes:**
- The canvas is a `position: fixed; inset: 0` container
- Items are absolutely positioned within it
- We track `panX` and `panY` as the camera offset
- Each item's rendered position = `((itemX - panX) % tileW + tileW + tileW/2) % tileW - tileW/2`
- This creates seamless wrapping — items loop back when panned past the tile boundary
- The tile is 3000×2400px (a good size for ~20-30 items with breathing room)
- Items are placed using a seeded random based on their index (deterministic layout)

**Step 1: Create the drag hook**

`src/app/press/_components/useCanvasDrag.ts` — handles pointer events, velocity tracking, and GSAP inertia tween on release.

```typescript
"use client";

import { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";

interface DragState {
  panX: number;
  panY: number;
}

interface UseCanvasDragOptions {
  onUpdate: (x: number, y: number) => void;
}

export function useCanvasDrag({ onUpdate }: UseCanvasDragOptions) {
  const state = useRef<DragState>({ panX: 0, panY: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const rafId = useRef<number>(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Don't drag if clicking an image (let it open lightbox)
    if ((e.target as HTMLElement).closest("[data-press-item]")) return;

    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    lastTime.current = performance.now();

    // Kill any running inertia tween
    tweenRef.current?.kill();

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;

      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      const now = performance.now();
      const dt = Math.max(now - lastTime.current, 1);

      // Exponential moving average for smooth velocity
      const factor = 0.8;
      velocity.current.x = factor * (dx / dt) * 1000 + (1 - factor) * velocity.current.x;
      velocity.current.y = factor * (dy / dt) * 1000 + (1 - factor) * velocity.current.y;

      lastPointer.current = { x: e.clientX, y: e.clientY };
      lastTime.current = now;

      state.current.panX -= dx;
      state.current.panY -= dy;
      onUpdate(state.current.panX, state.current.panY);
    },
    [onUpdate],
  );

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;

    // Inertia: coast based on current velocity
    const vx = -velocity.current.x;
    const vy = -velocity.current.y;
    const speed = Math.sqrt(vx * vx + vy * vy);

    if (speed > 50) {
      const target = {
        x: state.current.panX + vx * 0.8,
        y: state.current.panY + vy * 0.8,
      };

      const proxy = { x: state.current.panX, y: state.current.panY };
      tweenRef.current = gsap.to(proxy, {
        x: target.x,
        y: target.y,
        duration: Math.min(speed / 800, 2.5),
        ease: "power3.out",
        onUpdate: () => {
          state.current.panX = proxy.x;
          state.current.panY = proxy.y;
          onUpdate(proxy.x, proxy.y);
        },
      });
    }
  }, [onUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp },
    stateRef: state,
  };
}
```

**Step 2: Create the main PressCanvas component**

`src/app/press/_components/PressCanvas.tsx`:

```tsx
"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";
import { useCanvasDrag } from "./useCanvasDrag";
import { PressLightbox } from "./PressLightbox";
import gsap from "gsap";

/* ── Types ── */
interface SanityImage {
  asset: {
    _id: string;
    url: string;
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
  };
  alt?: string;
  hotspot?: { x: number; y: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

interface PressImageDoc {
  _id: string;
  title: string;
  image: SanityImage;
}

interface PressQuoteDoc {
  _id: string;
  text: string;
}

type CanvasItem =
  | { kind: "image"; doc: PressImageDoc; idx: number }
  | { kind: "quote"; doc: PressQuoteDoc; idx: number };

/* ── Constants ── */
const TILE_W = 3000;
const TILE_H = 2400;

/* Seeded random — deterministic layout per item index */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ── Item placement ── */
interface PlacedItem {
  item: CanvasItem;
  x: number;           // position in tile
  y: number;
  w: number;           // rendered size
  h: number;
  rotation: number;    // degrees
  depth: number;       // 0 = near, 1 = far (parallax multiplier)
  zIndex: number;
}

function placeItems(images: PressImageDoc[], quotes: PressQuoteDoc[]): PlacedItem[] {
  const items: CanvasItem[] = [];

  // Interleave images and quotes
  let qi = 0;
  images.forEach((doc, i) => {
    items.push({ kind: "image", doc, idx: i });
    // Insert a quote roughly every 3-4 images
    if ((i + 1) % 3 === 0 && qi < quotes.length) {
      items.push({ kind: "quote", doc: quotes[qi], idx: qi });
      qi++;
    }
  });
  // Append remaining quotes
  while (qi < quotes.length) {
    items.push({ kind: "quote", doc: quotes[qi], idx: qi });
    qi++;
  }

  const placed: PlacedItem[] = [];
  const PADDING = 80;

  items.forEach((item, i) => {
    const rng = seeded(i * 7919 + 31);

    // Image sizes — varied
    let w: number, h: number;
    if (item.kind === "image") {
      const dims = item.doc.image.asset.metadata?.dimensions;
      const sizeClass = rng();
      const baseW = sizeClass < 0.3 ? 180 : sizeClass < 0.7 ? 280 : 400;
      const aspect = dims ? dims.height / dims.width : 0.75;
      w = baseW;
      h = Math.round(baseW * aspect);
    } else {
      // Quote blocks — wider, shorter
      w = 220 + rng() * 120;
      h = 80 + rng() * 60;
    }

    const x = PADDING + rng() * (TILE_W - w - PADDING * 2);
    const y = PADDING + rng() * (TILE_H - h - PADDING * 2);
    const rotation = (rng() - 0.5) * 8; // -4 to +4 degrees
    const depth = rng() < 0.35 ? 0.15 : 0; // 35% of items on far layer

    placed.push({
      item,
      x,
      y,
      w,
      h,
      rotation,
      depth,
      zIndex: depth > 0 ? 1 : 10,
    });
  });

  return placed;
}

/* ── Wrap helper — infinite tiling ── */
function wrap(value: number, max: number): number {
  return ((value % max) + max) % max;
}

/* ── Component ── */
export function PressCanvas({
  images,
  quotes,
}: {
  images: PressImageDoc[];
  quotes: PressQuoteDoc[];
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const driftTween = useRef<gsap.core.Tween | null>(null);
  const driftProxy = useRef({ x: 0, y: 0 });
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const isDragging = useRef(false);

  const onUpdate = useCallback((x: number, y: number) => {
    isDragging.current = true;
    setPan({ x, y });
    // Reset idle drift
    clearTimeout(idleTimer.current);
    driftTween.current?.kill();
    idleTimer.current = setTimeout(() => startDrift(), 3000);
  }, []);

  const { handlers, stateRef } = useCanvasDrag({ onUpdate });

  const placed = useMemo(() => placeItems(images, quotes), [images, quotes]);
  const imageItems = useMemo(
    () => placed.filter((p) => p.item.kind === "image"),
    [placed],
  );

  // Ambient drift when idle
  const startDrift = useCallback(() => {
    isDragging.current = false;
    driftProxy.current = { x: stateRef.current.panX, y: stateRef.current.panY };

    driftTween.current = gsap.to(driftProxy.current, {
      x: `+=${40 + Math.random() * 60}`,
      y: `+=${20 + Math.random() * 40}`,
      duration: 30,
      ease: "none",
      repeat: -1,
      onUpdate: () => {
        stateRef.current.panX = driftProxy.current.x;
        stateRef.current.panY = driftProxy.current.y;
        setPan({ x: driftProxy.current.x, y: driftProxy.current.y });
      },
    });
  }, [stateRef]);

  // Start idle drift on mount
  useEffect(() => {
    idleTimer.current = setTimeout(() => startDrift(), 4000);
    return () => {
      clearTimeout(idleTimer.current);
      driftTween.current?.kill();
    };
  }, [startDrift]);

  // Stop drift on any pointer interaction
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      clearTimeout(idleTimer.current);
      driftTween.current?.kill();
      handlers.onPointerDown(e);
    },
    [handlers],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      handlers.onPointerUp(e);
      idleTimer.current = setTimeout(() => startDrift(), 3000);
    },
    [handlers, startDrift],
  );

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight")
        setLightboxIdx((i) =>
          i !== null ? (i + 1) % imageItems.length : null,
        );
      if (e.key === "ArrowLeft")
        setLightboxIdx((i) =>
          i !== null ? (i - 1 + imageItems.length) % imageItems.length : null,
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, imageItems.length]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-[#0a0604] select-none"
      style={{ cursor: "grab", touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Back nav — fixed top-left */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-10 py-3 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto text-[0.6875rem] font-body font-medium tracking-[0.04em] uppercase text-[#a89a8c] hover:text-[#f0ebe3] transition-colors duration-300"
        >
          &larr; Back
        </Link>
        <span className="font-display italic text-[#f0ebe3]/60 text-sm">
          Press
        </span>
      </nav>

      {/* Drag hint — fades out after first interaction */}
      <DragHint />

      {/* Canvas items */}
      {placed.map((p, i) => {
        const parallax = 1 + p.depth * 0.3;
        const screenX = wrap(p.x - pan.x * parallax, TILE_W) - TILE_W / 2;
        const screenY = wrap(p.y - pan.y * parallax, TILE_H) - TILE_H / 2;

        // Cull off-screen items (with generous margin)
        const margin = 400;
        const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
        const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
        const centerX = screenX + vw / 2;
        const centerY = screenY + vh / 2;

        if (
          centerX + p.w < -margin ||
          centerX > vw + margin ||
          centerY + p.h < -margin ||
          centerY > vh + margin
        ) {
          return null;
        }

        if (p.item.kind === "quote") {
          return (
            <div
              key={p.item.doc._id}
              className="absolute pointer-events-none"
              style={{
                left: `calc(50% + ${screenX}px)`,
                top: `calc(50% + ${screenY}px)`,
                width: p.w,
                transform: `rotate(${p.rotation}deg)`,
                zIndex: p.zIndex,
                opacity: p.depth > 0 ? 0.5 : 0.8,
              }}
            >
              <p
                className="font-display italic text-[#f0ebe3]/40 leading-snug"
                style={{
                  fontSize: `clamp(0.875rem, ${p.w / 14}px, 1.5rem)`,
                  textShadow: "0 0 30px rgba(201,169,110,0.08)",
                }}
              >
                {p.item.doc.text}
              </p>
            </div>
          );
        }

        // Image item
        const imgDoc = p.item.doc;
        const isHovered = hovered === imgDoc._id;
        const imageIndex = imageItems.findIndex(
          (pi) => pi.item.kind === "image" && pi.item.doc._id === imgDoc._id,
        );

        return (
          <div
            key={imgDoc._id}
            data-press-item
            data-item-id={imgDoc._id}
            className="absolute transition-[transform,box-shadow] duration-300 ease-out"
            style={{
              left: `calc(50% + ${screenX}px)`,
              top: `calc(50% + ${screenY}px)`,
              width: p.w,
              height: p.h,
              transform: `rotate(${p.rotation}deg) scale(${isHovered ? 1.05 : 1}) translateY(${isHovered ? -8 : 0}px)`,
              zIndex: isHovered ? 40 : p.zIndex,
              cursor: "pointer",
              boxShadow: isHovered
                ? "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,110,0.15)"
                : "0 4px 20px rgba(0,0,0,0.4)",
              opacity: p.depth > 0 ? 0.7 : 1,
            }}
            onPointerEnter={() => setHovered(imgDoc._id)}
            onPointerLeave={() => setHovered(null)}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx(imageIndex);
            }}
          >
            <Image
              src={urlFor(imgDoc.image).width(p.w * 2).height(p.h * 2).url()}
              alt={imgDoc.image.alt || imgDoc.title}
              width={p.w}
              height={p.h}
              className="w-full h-full object-cover block"
              sizes={`${p.w}px`}
              placeholder={imgDoc.image.asset.metadata?.lqip ? "blur" : "empty"}
              blurDataURL={imgDoc.image.asset.metadata?.lqip}
              draggable={false}
            />
          </div>
        );
      })}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <PressLightbox
          images={imageItems.map((p) => (p.item as { kind: "image"; doc: PressImageDoc }).doc)}
          activeIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
        />
      )}

      {/* Subtle vignette overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-30"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, #0a0604 100%)",
        }}
      />
    </div>
  );
}

/* ── Drag hint ── */
function DragHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    const hide = () => setVisible(false);
    window.addEventListener("pointerdown", hide, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none transition-opacity duration-1000"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="text-center">
        <p className="font-display italic text-[#f0ebe3]/30 text-lg mb-1">
          drag to explore
        </p>
        <p className="font-body text-[#a89a8c]/30 text-xs uppercase tracking-[0.08em]">
          click any image to view
        </p>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/press/_components/PressCanvas.tsx src/app/press/_components/useCanvasDrag.ts
git commit -m "feat(press): infinite canvas with GSAP drag, inertia, parallax, and tiling"
```

---

### Task 5: Build PressLightbox Component

**Files:**
- Create: `src/app/press/_components/PressLightbox.tsx`

**Step 1: Create the lightbox**

Uses GSAP to animate the image from its canvas position (read via `getBoundingClientRect` on the `[data-item-id]` element) to a centered fullscreen view. Dismissal reverses the animation.

```tsx
"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import gsap from "gsap";

interface PressImageDoc {
  _id: string;
  title: string;
  image: {
    asset: {
      _id: string;
      url: string;
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
    };
    alt?: string;
  };
}

interface PressLightboxProps {
  images: PressImageDoc[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PressLightbox({
  images,
  activeIndex,
  onClose,
  onNavigate,
}: PressLightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const active = images[activeIndex];

  // Entrance animation
  useEffect(() => {
    if (!overlayRef.current) return;

    // Fade in backdrop
    gsap.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out" },
    );

    // Find the source element on canvas
    const sourceEl = document.querySelector(
      `[data-item-id="${active._id}"]`,
    ) as HTMLElement | null;

    if (sourceEl && imgRef.current) {
      const rect = sourceEl.getBoundingClientRect();
      const img = imgRef.current;

      // Animate from source rect to center
      gsap.fromTo(
        img,
        {
          position: "fixed",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          opacity: 0.8,
        },
        {
          left: "50%",
          top: "50%",
          xPercent: -50,
          yPercent: -50,
          width: "auto",
          height: "auto",
          maxWidth: "90vw",
          maxHeight: "85vh",
          opacity: 1,
          duration: 0.5,
          ease: "power3.out",
          clearProps: "position,left,top,width,height",
        },
      );
    }
  }, [active._id]);

  const handleClose = useCallback(() => {
    if (!overlayRef.current) {
      onClose();
      return;
    }
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: onClose,
    });
  }, [onClose]);

  const dims = active.image.asset.metadata?.dimensions;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(10, 6, 4, 0.92)", backdropFilter: "blur(8px)" }}
      onClick={handleClose}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-6 text-[#a89a8c] hover:text-[#f0ebe3] transition-colors duration-200 text-2xl z-10 normal-case tracking-normal"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        aria-label="Close"
      >
        &times;
      </button>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-[#a89a8c] hover:text-[#f0ebe3] transition-colors duration-200 text-3xl z-10 normal-case tracking-normal"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((activeIndex - 1 + images.length) % images.length);
            }}
            aria-label="Previous image"
          >
            &#8249;
          </button>
          <button
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-[#a89a8c] hover:text-[#f0ebe3] transition-colors duration-200 text-3xl z-10 normal-case tracking-normal"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((activeIndex + 1) % images.length);
            }}
            aria-label="Next image"
          >
            &#8250;
          </button>
        </>
      )}

      {/* Image */}
      <Image
        ref={imgRef}
        src={urlFor(active.image).width(1800).url()}
        alt={active.image.alt || active.title}
        width={dims?.width || 1800}
        height={dims?.height || 1200}
        className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain"
        sizes="90vw"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Image title */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase text-[#a89a8c]/60">
          {active.title}
        </span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/press/_components/PressLightbox.tsx
git commit -m "feat(press): GSAP-animated lightbox with FLIP-style entrance"
```

---

### Task 6: Cleanup Old Press Gallery & Verify

**Files:**
- Delete: `src/app/press/PressGallery.tsx` (replaced by new canvas)

**Step 1: Remove old file**

```bash
rm src/app/press/PressGallery.tsx
```

**Step 2: Verify dev server builds**

```bash
npm run dev
```

Visit `http://localhost:3000/press` — should see the infinite canvas with scattered items.

**Step 3: Commit**

```bash
git add -A src/app/press/
git commit -m "feat(press): replace masonry gallery with infinite canvas"
```

---

### Task 7: Polish — Reduced Motion, Mobile Touch, Edge Cases

**Files:**
- Modify: `src/app/press/_components/PressCanvas.tsx`

**Step 1: Add reduced motion respect**

Wrap ambient drift in a `prefers-reduced-motion` check. If reduced motion, disable drift and reduce parallax to 0.

**Step 2: Handle empty state**

If no images and no quotes, show the "No press images yet" message (same as before, linking to Studio).

**Step 3: Handle touch devices**

The pointer events already work for touch, but add `touch-action: none` to prevent browser scroll/zoom. Already included in the container style.

**Step 4: Commit**

```bash
git add src/app/press/_components/PressCanvas.tsx
git commit -m "fix(press): reduced motion support, empty state, mobile touch"
```
