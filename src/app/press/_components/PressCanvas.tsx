"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";
import { useCanvasDrag } from "./useCanvasDrag";
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
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  depth: number;
  zIndex: number;
}

function placeItems(images: PressImageDoc[], quotes: PressQuoteDoc[]): PlacedItem[] {
  const items: CanvasItem[] = [];

  let qi = 0;
  images.forEach((doc, i) => {
    items.push({ kind: "image", doc, idx: i });
    if ((i + 1) % 3 === 0 && qi < quotes.length) {
      items.push({ kind: "quote", doc: quotes[qi], idx: qi });
      qi++;
    }
  });
  while (qi < quotes.length) {
    items.push({ kind: "quote", doc: quotes[qi], idx: qi });
    qi++;
  }

  const placed: PlacedItem[] = [];
  const PADDING = 80;

  items.forEach((item, i) => {
    const rng = seeded(i * 7919 + 31);

    let w: number, h: number;
    if (item.kind === "image") {
      const dims = item.doc.image.asset.metadata?.dimensions;
      const sizeClass = rng();
      const baseW = sizeClass < 0.3 ? 180 : sizeClass < 0.7 ? 280 : 400;
      const aspect = dims ? dims.height / dims.width : 0.75;
      w = baseW;
      h = Math.round(baseW * aspect);
    } else {
      w = 220 + rng() * 120;
      h = 80 + rng() * 60;
    }

    const x = PADDING + rng() * (TILE_W - w - PADDING * 2);
    const y = PADDING + rng() * (TILE_H - h - PADDING * 2);
    const rotation = (rng() - 0.5) * 8;
    const depth = rng() < 0.35 ? 0.15 : 0;

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

  const onUpdate = useCallback((x: number, y: number) => {
    setPan({ x, y });
    clearTimeout(idleTimer.current);
    driftTween.current?.kill();
    idleTimer.current = setTimeout(() => startDrift(), 3000);
  }, []);

  const { handlers, stateRef } = useCanvasDrag({ onUpdate });

  const placed = useMemo(() => placeItems(images, quotes), [images, quotes]);
  const imageItems = useMemo(
    () => placed.filter((p): p is PlacedItem & { item: { kind: "image"; doc: PressImageDoc } } => p.item.kind === "image"),
    [placed],
  );

  // Ambient drift when idle
  const startDrift = useCallback(() => {
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

  useEffect(() => {
    idleTimer.current = setTimeout(() => startDrift(), 4000);
    return () => {
      clearTimeout(idleTimer.current);
      driftTween.current?.kill();
    };
  }, [startDrift]);

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

  // Viewport dimensions for culling (SSR-safe)
  const [viewport, setViewport] = useState({ w: 1920, h: 1080 });
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Empty state
  if (images.length === 0 && quotes.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0604] flex items-center justify-center">
        <div className="text-center">
          <p className="font-display italic text-[#f0ebe3]/40 text-lg mb-2">nothing here yet.</p>
          <Link
            href="/studio"
            className="font-body text-[0.6875rem] tracking-[0.06em] uppercase text-[#c9a96e] hover:text-[#f0ebe3] transition-colors duration-300"
          >
            Add images in Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-[#0a0604] select-none"
      style={{ cursor: lightboxIdx !== null ? "default" : "grab", touchAction: "none" }}
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

      {/* Drag hint */}
      <DragHint />

      {/* Canvas items */}
      {placed.map((p) => {
        const parallax = 1 + p.depth * 0.3;
        const screenX = wrap(p.x - pan.x * parallax, TILE_W) - TILE_W / 2;
        const screenY = wrap(p.y - pan.y * parallax, TILE_H) - TILE_H / 2;

        const margin = 400;
        const centerX = screenX + viewport.w / 2;
        const centerY = screenY + viewport.h / 2;

        if (
          centerX + p.w < -margin ||
          centerX > viewport.w + margin ||
          centerY + p.h < -margin ||
          centerY > viewport.h + margin
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

        const imgDoc = p.item.doc;
        const isHovered = hovered === imgDoc._id;
        const imageIndex = imageItems.findIndex(
          (pi) => pi.item.doc._id === imgDoc._id,
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

      {/* Lightbox — placeholder import until Task 5 */}
      {lightboxIdx !== null && (
        <PressLightboxPlaceholder
          images={imageItems.map((p) => p.item.doc)}
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

/* ── Temporary Lightbox Placeholder (replaced in Task 5) ── */
function PressLightboxPlaceholder({
  images,
  activeIndex,
  onClose,
  onNavigate,
}: {
  images: PressImageDoc[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const active = images[activeIndex];
  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(10, 6, 4, 0.92)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-6 text-[#a89a8c] hover:text-[#f0ebe3] transition-colors duration-200 text-2xl z-10 normal-case tracking-normal"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
      >
        &times;
      </button>
      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-[#a89a8c] hover:text-[#f0ebe3] transition-colors duration-200 text-3xl z-10 normal-case tracking-normal"
            onClick={(e) => { e.stopPropagation(); onNavigate((activeIndex - 1 + images.length) % images.length); }}
            aria-label="Previous"
          >
            &#8249;
          </button>
          <button
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-[#a89a8c] hover:text-[#f0ebe3] transition-colors duration-200 text-3xl z-10 normal-case tracking-normal"
            onClick={(e) => { e.stopPropagation(); onNavigate((activeIndex + 1) % images.length); }}
            aria-label="Next"
          >
            &#8250;
          </button>
        </>
      )}
      <Image
        src={urlFor(active.image).width(1800).url()}
        alt={active.image.alt || active.title}
        width={1800}
        height={1200}
        className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain"
        sizes="90vw"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase text-[#a89a8c]/60">
          {active.title}
        </span>
      </div>
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
