import { useRef, useEffect, useCallback, memo } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { TAPES } from "./types";
import { useTapeDeck } from "./TapeDeckContext";
import { GramophoneSVG } from "./GramophoneSVG";
import { useCanHover } from "@/hooks/useCanHover";
import { useIsMobile } from "@/hooks/useIsMobile";
// ─── Cassette Player Component ─────────────────────────────────

export const CassettePlayer = memo(function CassettePlayer({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const {
    loadedTapeId,
    playing,
    nearDeckId,
    registerDeckRef,
    updateDeckPos,
    play,
    pause,
    eject,
  } = useTapeDeck();
  const canHover = useCanHover();
  const isMobile = useIsMobile();
  const draggable = !isMobile;

  const activeTape = loadedTapeId ? TAPES[loadedTapeId] : null;
  const nearTape = nearDeckId ? TAPES[nearDeckId] : null;

  // Drag springs (outer layer)
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-300, 0, 300], [-6, 0, 6]);

  // Idle "hum" springs — tiny grounded motion while playing
  const bumpY = useMotionValue(0);
  const bumpRotate = useMotionValue(0);
  const springY = useSpring(bumpY, { stiffness: 220, damping: 22 });
  const springRotate = useSpring(bumpRotate, { stiffness: 220, damping: 22 });

  // Register deck slot ref with context so tapes can snap to it
  const deckSlotRef = useRef<HTMLDivElement | null>(null);
  const setDeckSlotRef = useCallback(
    (el: HTMLDivElement | null) => {
      deckSlotRef.current = el;
      registerDeckRef(el);
    },
    [registerDeckRef],
  );

  // Keep deck position in sync whenever the gramophone moves
  useEffect(() => {
    const unsub = dragX.on("change", updateDeckPos);
    const unsub2 = dragY.on("change", updateDeckPos);
    return () => {
      unsub();
      unsub2();
    };
  }, [dragX, dragY, updateDeckPos]);

  // Idle hum — tiny vertical bob + tiny tilt, like the cabinet vibrating with the
  // needle. No horizontal drift (the gramophone is sitting on something).
  useEffect(() => {
    if (!playing) {
      bumpY.set(0);
      bumpRotate.set(0);
      return;
    }
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      // Three sines on incommensurate periods so it never lines up — peak ~5px
      const y =
        Math.sin((t / 1.9) * Math.PI * 2) * 2.6 +
        Math.sin((t / 0.95) * Math.PI * 2 + Math.PI / 4) * 1.4 +
        Math.sin((t / 0.45) * Math.PI * 2) * 0.7;
      // Tilt rocks with the rhythm — peak ~2.3°
      const rot =
        Math.sin((t / 3.1) * Math.PI * 2) * 1.3 +
        Math.sin((t / 1.4) * Math.PI * 2 + Math.PI / 3) * 0.6 +
        Math.sin((t / 0.7) * Math.PI * 2) * 0.35;
      bumpY.set(y);
      bumpRotate.set(rot);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, bumpY, bumpRotate]);

  const handlePlayPause = useCallback(() => {
    if (!loadedTapeId) return;
    if (playing) pause();
    else play();
  }, [loadedTapeId, playing, play, pause]);

  const handleStop = useCallback(() => {
    if (loadedTapeId) eject();
  }, [loadedTapeId, eject]);

  const loaded = !!activeTape;

  // Overlay positions over the gramophone (viewBox ~330 x 448; geometry stable across states)
  const pos = {
    buttons: [
      { left: "29%", top: "71%", width: "9%", height: "13%" }, // Play switch
      { left: "38%", top: "71%", width: "9%", height: "13%" }, // Stop switch
    ],
    // Turntable area — proximity / snap target for incoming vinyl
    window: { left: "20%", top: "50%", width: "44%", height: "18%" },
  };

  return (
    <motion.div
      drag={draggable}
      dragElastic={0.08}
      dragMomentum={false}
      onDrag={updateDeckPos}
      onDragEnd={updateDeckPos}
      whileDrag={draggable ? { scale: 1.03 } : undefined}
      whileHover={canHover ? { scale: 1.01 } : undefined}
      className={`${draggable ? "cursor-grab active:cursor-grabbing touch-none" : ""} w-[58%] max-w-[210px] md:w-[55%] md:max-w-[360px] ${className ?? ""}`}
      style={{
        x: dragX,
        y: dragY,
        rotate: dragRotate,
        ...style,
      }}
    >
      {/* Beat-bounce inner layer */}
      <motion.div
        className="relative overflow-visible"
        style={{ y: springY, rotate: springRotate }}
      >
        <div
          className="relative"
          style={{
            color: "var(--foreground)",
            filter: playing
              ? "drop-shadow(0 0 22px rgba(228,49,34,0.45))"
              : "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
            transition: "color 0.8s ease, filter 0.8s ease",
          }}
        >
          <GramophoneSVG loaded={loaded} playing={playing} />
          {/* Invisible HTML button overlays — positioned to match the gramophone's switches */}
          {pos.buttons.map((btn, i) => {
            const handlers = [handlePlayPause, handleStop];
            const labels = ["Play / Pause", "Stop"];
            return (
              <button
                key={i}
                className="absolute bg-transparent cursor-pointer z-10"
                style={btn}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handlers[i]}
                aria-label={labels[i]}
              />
            );
          })}
        </div>

        {/* Deck slot ref for proximity detection */}
        <div
          ref={setDeckSlotRef}
          className="absolute pointer-events-none"
          style={pos.window}
        />

        {/* Proximity glow when tape approaches */}
        <AnimatePresence>
          {nearTape && (
            <motion.div
              className="absolute pointer-events-none rounded-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.15, 0.4, 0.15] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{
                ...pos.window,
                boxShadow:
                  "inset 0 0 16px rgba(228,49,34,0.55), 0 0 12px rgba(228,49,34,0.45)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Playback glow pulse in window */}
        {playing && activeTape && (
          <motion.div
            className="absolute pointer-events-none rounded-sm"
            animate={{ opacity: [0.05, 0.2, 0.05] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              ...pos.window,
              background:
                "radial-gradient(ellipse at center, rgba(228,49,34,0.55) 0%, transparent 70%)",
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
});
