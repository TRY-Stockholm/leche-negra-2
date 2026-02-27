"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";
import type { SceneConfig, Presentation } from "./scenes";

/** How long the cursor must stay still before the video ignites */
const DWELL_MS = 200;
/** Movement beyond this resets the dwell timer */
const MOVE_THRESHOLD = 8;
/** Minimum time the preloader stays visible */
const PRELOADER_MIN_MS = 2000;
/** Inset from viewport edge for resting position */
const REST_INSET = 48;

const SPRING_CONFIG = { damping: 25, stiffness: 200, mass: 0.5 };

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
  const [holding, setHolding] = useState(false);
  const anchorRef = useRef<{ x: number; y: number } | null>(null);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restPosRef = useRef({ x: 0, y: 0 });

  // Derived cursor dimensions from scene config
  const cursorH = scene.cursorDisplayHeight;
  const cursorW = cursorH * (scene.cursorWidth / scene.cursorHeight);
  const offsetX = cursorW * scene.cursorOffsetX;
  const offsetY = cursorH * scene.cursorOffsetY;

  // Motion spring values — drive the lighter position
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, SPRING_CONFIG);
  const springY = useSpring(cursorY, SPRING_CONFIG);

  // Compute resting position (bottom-right corner) and park lighter there
  useEffect(() => {
    if (!active) return;
    const update = () => {
      restPosRef.current = {
        x: window.innerWidth - cursorW - REST_INSET,
        y: window.innerHeight - cursorH - REST_INSET,
      };
      if (!holding) {
        cursorX.set(restPosRef.current.x);
        cursorY.set(restPosRef.current.y);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [active, cursorW, cursorH, cursorX, cursorY, holding]);

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

  const clearDwell = useCallback(() => {
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    anchorRef.current = null;
  }, []);

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

  const isOverPainting = useCallback(
    (x: number, y: number) => {
      const el = paintingRef.current;
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      );
    },
    [],
  );

  // Click lighter to pick it up — it becomes the cursor permanently
  const handleLighterPickUp = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (showVideo || holding) return;
      setHolding(true);
      cursorX.set(e.clientX - offsetX);
      cursorY.set(e.clientY - offsetY);
    },
    [holding, showVideo, cursorX, cursorY, offsetX, offsetY],
  );

  // Move lighter + dwell detection (only when holding)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!holding) return;

      const { clientX: x, clientY: y } = e;
      cursorX.set(x - offsetX);
      cursorY.set(y - offsetY);

      const overPainting = isOverPainting(x, y);

      // Once ignited, keep burning regardless of movement
      if (showVideo) return;

      const anchor = anchorRef.current;
      if (anchor) {
        const dx = x - anchor.x;
        const dy = y - anchor.y;
        if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
          clearDwell();
          anchorRef.current = { x, y };
          if (overPainting) {
            dwellTimerRef.current = setTimeout(ignite, DWELL_MS);
          }
        }
      } else {
        anchorRef.current = { x, y };
        if (overPainting) {
          dwellTimerRef.current = setTimeout(ignite, DWELL_MS);
        }
      }

      if (!overPainting) {
        clearDwell();
        anchorRef.current = { x, y };
      }
    },
    [
      holding,
      showVideo,
      cursorX,
      cursorY,
      offsetX,
      offsetY,
      clearDwell,
      ignite,
      isOverPainting,
    ],
  );

  // Cleanup on deactivate
  useEffect(() => {
    if (!active) {
      clearDwell();
      setShowVideo(false);
      setHolding(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [active, clearDwell]);


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
          className="fixed inset-0 z-50 cursor-none select-none"
          style={{ backgroundColor: scene.background }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onPointerMove={ready ? handlePointerMove : undefined}
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

                {/* "Torch me" hint on painting — appears after lighter picked up */}
                {holding && !showVideo && (
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

                {/* Lighter — rests in corner, click to pick up */}
                {cursorHtml && (
                  <>
                    {/* "Grab me" hint near lighter — hidden once picked up */}
                    {!holding && !showVideo && (
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
                    <motion.div
                      ref={lighterRef}
                      className={`${scene.cursorClassName} fixed top-0 left-0`}
                      style={{
                        width: cursorW,
                        height: cursorH,
                        x: springX,
                        y: springY,
                        pointerEvents:
                          !holding && !showVideo ? "auto" : "none",
                      }}
                      onPointerDown={handleLighterPickUp}
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
