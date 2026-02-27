"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  motion,
  animate,
  AnimatePresence,
} from "motion/react";
import type { SceneConfig, Presentation } from "./scenes";

/** Minimum time the preloader stays visible */
const PRELOADER_MIN_MS = 2000;
/** Inset from viewport edge for resting position */
const REST_INSET = 48;
/** Maximum distance (px) from painting center to snap-ignite */
const SNAP_DISTANCE = 120;

/** Module-level SVG cache keyed by scene id */
const svgCache: Record<string, string> = {};

/* ── Presentation: framed (art deco gallery painting) ── */

function ArtDecoFrame() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 533"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="396" height="529" rx="2" stroke="var(--color-brass, #c9a96e)" strokeWidth="2" />
      <rect x="10" y="10" width="380" height="513" rx="1" stroke="var(--color-brass, #c9a96e)" strokeWidth="1" opacity="0.7" />
      <path d="M2 40 L2 2 L40 2" stroke="var(--color-brass, #c9a96e)" strokeWidth="3" />
      <path d="M10 50 L10 10 L50 10" stroke="var(--color-brass, #c9a96e)" strokeWidth="1.5" opacity="0.6" />
      <line x1="20" y1="2" x2="20" y2="20" stroke="var(--color-brass, #c9a96e)" strokeWidth="1" opacity="0.4" />
      <line x1="2" y1="20" x2="20" y2="20" stroke="var(--color-brass, #c9a96e)" strokeWidth="1" opacity="0.4" />
      <path d="M398 40 L398 2 L360 2" stroke="var(--color-brass, #c9a96e)" strokeWidth="3" />
      <path d="M390 50 L390 10 L350 10" stroke="var(--color-brass, #c9a96e)" strokeWidth="1.5" opacity="0.6" />
      <line x1="380" y1="2" x2="380" y2="20" stroke="var(--color-brass, #c9a96e)" strokeWidth="1" opacity="0.4" />
      <line x1="398" y1="20" x2="380" y2="20" stroke="var(--color-brass, #c9a96e)" strokeWidth="1" opacity="0.4" />
      <path d="M2 493 L2 531 L40 531" stroke="var(--color-brass, #c9a96e)" strokeWidth="3" />
      <path d="M10 483 L10 523 L50 523" stroke="var(--color-brass, #c9a96e)" strokeWidth="1.5" opacity="0.6" />
      <line x1="20" y1="531" x2="20" y2="513" stroke="var(--color-brass, #c9a96e)" strokeWidth="1" opacity="0.4" />
      <line x1="2" y1="513" x2="20" y2="513" stroke="var(--color-brass, #c9a96e)" strokeWidth="1" opacity="0.4" />
      <path d="M398 493 L398 531 L360 531" stroke="var(--color-brass, #c9a96e)" strokeWidth="3" />
      <path d="M390 483 L390 523 L350 523" stroke="var(--color-brass, #c9a96e)" strokeWidth="1.5" opacity="0.6" />
      <line x1="380" y1="531" x2="380" y2="513" stroke="var(--color-brass, #c9a96e)" strokeWidth="1" opacity="0.4" />
      <line x1="398" y1="513" x2="380" y2="513" stroke="var(--color-brass, #c9a96e)" strokeWidth="1" opacity="0.4" />
      <g opacity="0.5">
        <line x1="200" y1="2" x2="200" y2="18" stroke="var(--color-brass, #c9a96e)" strokeWidth="1.5" />
        <line x1="185" y1="2" x2="190" y2="16" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.75" />
        <line x1="215" y1="2" x2="210" y2="16" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.75" />
        <line x1="170" y1="2" x2="180" y2="14" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.75" />
        <line x1="230" y1="2" x2="220" y2="14" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.75" />
        <line x1="155" y1="3" x2="172" y2="13" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.5" />
        <line x1="245" y1="3" x2="228" y2="13" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.5" />
      </g>
      <g opacity="0.5">
        <line x1="200" y1="531" x2="200" y2="515" stroke="var(--color-brass, #c9a96e)" strokeWidth="1.5" />
        <line x1="185" y1="531" x2="190" y2="517" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.75" />
        <line x1="215" y1="531" x2="210" y2="517" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.75" />
        <line x1="170" y1="531" x2="180" y2="519" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.75" />
        <line x1="230" y1="531" x2="220" y2="519" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.75" />
        <line x1="155" y1="530" x2="172" y2="520" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.5" />
        <line x1="245" y1="530" x2="228" y2="520" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.5" />
      </g>
      <line x1="5" y1="80" x2="5" y2="453" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.5" opacity="0.3" />
      <line x1="395" y1="80" x2="395" y2="453" stroke="var(--color-brass, #c9a96e)" strokeWidth="0.5" opacity="0.3" />
      <polygon points="5,270 9,264 5,258 1,264" fill="var(--color-brass, #c9a96e)" opacity="0.4" />
      <polygon points="395,270 399,264 395,258 391,264" fill="var(--color-brass, #c9a96e)" opacity="0.4" />
    </svg>
  );
}

/* ── Presentation: vignette (candlelit darkness, warm glow) ── */

function VignetteOverlay() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        inset: "-40%",
        background:
          "radial-gradient(ellipse 40% 45% at 50% 50%, transparent 0%, rgba(10,8,6,0.4) 50%, rgba(10,8,6,0.85) 70%, #0a0806 90%)",
      }}
    />
  );
}

/* ── Presentation: dissolve (edges fade into smoke/nothing) ── */

const DISSOLVE_MASK =
  "radial-gradient(ellipse 80% 78% at 50% 50%, black 40%, transparent 100%)";

function presentationContainerStyle(p: Presentation): React.CSSProperties {
  if (p === "dissolve") {
    return {
      WebkitMaskImage: DISSOLVE_MASK,
      maskImage: DISSOLVE_MASK,
    };
  }
  return {};
}

/* ── Main component ── */

export function EasterEggScene({
  scene,
  active,
  onDismiss,
}: {
  scene: SceneConfig;
  active: boolean;
  onDismiss: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const paintingRef = useRef<HTMLDivElement>(null);
  const lighterRef = useRef<HTMLDivElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [cursorHtml, setCursorHtml] = useState<string | null>(
    svgCache[scene.id] ?? null,
  );
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [nearPainting, setNearPainting] = useState(false);

  // Derived cursor dimensions from scene config
  const cursorH = scene.cursorDisplayHeight;
  const cursorW = cursorH * (scene.cursorWidth / scene.cursorHeight);

  // Load and cache the cursor SVG
  useEffect(() => {
    if (svgCache[scene.id]) {
      setCursorHtml(svgCache[scene.id]);
      return;
    }
    fetch(scene.cursorSvg)
      .then((r) => r.text())
      .then((text) => {
        svgCache[scene.id] = text;
        setCursorHtml(text);
      });
  }, [scene.id, scene.cursorSvg]);

  // Preload assets, then reveal scene after minimum display time
  useEffect(() => {
    if (!active) {
      setReady(false);
      return;
    }

    let cancelled = false;
    const minTimer = new Promise((r) => setTimeout(r, PRELOADER_MIN_MS));

    const imgLoad = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = scene.still;
    });

    const svgLoad = svgCache[scene.id]
      ? Promise.resolve()
      : fetch(scene.cursorSvg)
          .then((r) => r.text())
          .then((text) => {
            svgCache[scene.id] = text;
            if (!cancelled) setCursorHtml(text);
          });

    Promise.all([minTimer, imgLoad, svgLoad]).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [active, scene.id, scene.cursorSvg, scene.still]);

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const ignite = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    vid.play().catch(() => {});
    setShowVideo(true);
    const handleEnded = () => {
      onDismissRef.current();
      vid.removeEventListener("ended", handleEnded);
    };
    vid.addEventListener("ended", handleEnded);
  }, []);

  const getDistance = useCallback(
    (lighterEl: HTMLDivElement) => {
      const paintingEl = paintingRef.current;
      if (!paintingEl) return Infinity;
      const lr = lighterEl.getBoundingClientRect();
      const pr = paintingEl.getBoundingClientRect();
      const lx = lr.left + lr.width / 2;
      const ly = lr.top + lr.height / 2;
      const px = pr.left + pr.width / 2;
      const py = pr.top + pr.height / 2;
      return Math.sqrt((lx - px) ** 2 + (ly - py) ** 2);
    },
    [],
  );

  const onDrag = useCallback(() => {
    if (!lighterRef.current) return;
    const dist = getDistance(lighterRef.current);
    setNearPainting(dist <= SNAP_DISTANCE);
  }, [getDistance]);

  const onDragStart = useCallback(() => {
    setDragging(true);
  }, []);

  const onDragEnd = useCallback(() => {
    setDragging(false);
    setNearPainting(false);
    if (!lighterRef.current) return;
    const dist = getDistance(lighterRef.current);
    if (dist <= SNAP_DISTANCE) {
      const pr = paintingRef.current?.getBoundingClientRect();
      const lr = lighterRef.current.getBoundingClientRect();
      if (pr && lighterRef.current) {
        const targetX = pr.left + pr.width / 2 - lr.width / 2;
        const targetY = pr.top + pr.height / 2 - lr.height / 2;
        const currentX = lr.left;
        const currentY = lr.top;
        const el = lighterRef.current;
        el.style.position = 'fixed';
        el.style.left = `${currentX}px`;
        el.style.top = `${currentY}px`;
        el.style.transform = 'none';
        animate(el, {
          left: targetX,
          top: targetY,
          opacity: 0,
        }, {
          duration: 0.3,
          ease: [0.2, 0, 0, 1],
          onComplete: () => {
            ignite();
          },
        });
      }
    }
  }, [getDistance, ignite]);

  // Cleanup on deactivate
  useEffect(() => {
    if (!active) {
      setShowVideo(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, onDismiss]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-50 cursor-default select-none"
          style={{ backgroundColor: scene.background }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Noise overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.12,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
            }}
          />

          <AnimatePresence mode="wait">
            {!ready ? (
              <motion.div
                key="preloader"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <motion.p
                  className="font-display italic text-[clamp(1.5rem,4vw,2.5rem)] text-foreground"
                  style={{ opacity: 0.7 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                >
                  {scene.preloaderText}
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="scene"
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Centered image/video */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    ref={paintingRef}
                    className="relative overflow-hidden"
                    style={{
                      width: "min(720px, 90vw)",
                      maxHeight: "85vh",
                      aspectRatio: "3 / 4",
                      ...presentationContainerStyle(scene.presentation),
                    }}
                  >
                    <img
                      src={scene.still}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-cover outline-none"
                    />

                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover outline-none transition-opacity duration-700 ease-out"
                      style={{ opacity: showVideo ? 1 : 0 }}
                      src={scene.video}
                      muted
                      playsInline
                      preload="auto"
                    />

                    {scene.presentation === "framed" && <ArtDecoFrame />}
                    {scene.presentation === "vignette" && <VignetteOverlay />}
                  </div>
                </div>

                {cursorHtml && !showVideo && (
                  <>
                    {/* "Grab me" hint near lighter — hidden once dragging */}
                    {!dragging && (
                      <img
                        src="/GrabMe.gif"
                        alt=""
                        className="fixed pointer-events-none select-none"
                        style={{
                          width: 70,
                          right: REST_INSET + cursorW + 12,
                          bottom: REST_INSET + cursorH - 10,
                        }}
                      />
                    )}
                    {/* "Torch me" hint on painting — appears while dragging, hides when near */}
                    {dragging && !nearPainting && (
                      <img
                        src="/TorchMe.gif"
                        alt=""
                        className="absolute pointer-events-none select-none"
                        style={{
                          width: 70,
                          left: paintingRef.current
                            ? paintingRef.current.getBoundingClientRect().left - 36
                            : 0,
                          top: paintingRef.current
                            ? paintingRef.current.getBoundingClientRect().top - 36
                            : 0,
                        }}
                      />
                    )}
                    <motion.div
                      ref={lighterRef}
                      className={`${scene.cursorClassName} fixed cursor-grab active:cursor-grabbing touch-none`}
                      style={{
                        width: cursorW,
                        height: cursorH,
                        right: REST_INSET,
                        bottom: REST_INSET,
                      }}
                      drag
                      dragElastic={0.08}
                      dragMomentum={false}
                      onDragStart={onDragStart}
                      onDrag={onDrag}
                      onDragEnd={onDragEnd}
                      whileDrag={{ scale: 1.08, zIndex: 50 }}
                      dangerouslySetInnerHTML={{ __html: cursorHtml }}
                    />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
