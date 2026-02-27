import { useRef, useEffect, useCallback, memo } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from "motion/react";
import { TAPES, SPEAKER_COLORS } from "./types";
import { useTapeDeck } from "./TapeDeckContext";
import { CassettePlayerSVG } from "./CassettePlayerSVG";
import { useCanHover } from "@/hooks/useCanHover";

// ─── Sound Waves ───────────────────────────────────────────────

function SoundWaves({
  playing,
  color,
  side,
}: {
  playing: boolean;
  color: string;
  side: "left" | "right";
}) {
  if (!playing) return null;
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
      style={{ [side === "left" ? "left" : "right"]: -30 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            borderColor: color,
            width: 20,
            height: 20,
            top: -10,
            [side === "left" ? "right" : "left"]: 0,
          }}
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: [0.5, 2 + i * 0.5], opacity: [0.6, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.35,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

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

  const activeTape = loadedTapeId ? TAPES[loadedTapeId] : null;
  const nearTape = nearDeckId ? TAPES[nearDeckId] : null;
  const colors = activeTape
    ? SPEAKER_COLORS[activeTape.id]
    : SPEAKER_COLORS.morning;

  // Drag springs (outer layer)
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const dragSpringX = useSpring(dragX, { stiffness: 200, damping: 22 });
  const dragSpringY = useSpring(dragY, { stiffness: 200, damping: 22 });
  const dragRotate = useTransform(dragSpringX, [-300, 0, 300], [-6, 0, 6]);

  // Beat-bounce springs (inner layer)
  const bumpY = useMotionValue(0);
  const bumpRotate = useMotionValue(0);
  const springY = useSpring(bumpY, { stiffness: 600, damping: 12 });
  const springRotate = useSpring(bumpRotate, { stiffness: 600, damping: 12 });

  // Register deck slot ref with context so tapes can snap to it
  const deckSlotRef = useRef<HTMLDivElement | null>(null);
  const setDeckSlotRef = useCallback(
    (el: HTMLDivElement | null) => {
      deckSlotRef.current = el;
      registerDeckRef(el);
    },
    [registerDeckRef],
  );

  // Keep deck position in sync during drag animation
  useEffect(() => {
    const unsub = dragSpringX.on("change", updateDeckPos);
    const unsub2 = dragSpringY.on("change", updateDeckPos);
    return () => {
      unsub();
      unsub2();
    };
  }, [dragSpringX, dragSpringY, updateDeckPos]);

  const handleDragEnd = useCallback(() => {
    animate(dragX, 0, { type: "spring", stiffness: 150, damping: 18 });
    animate(dragY, 0, { type: "spring", stiffness: 150, damping: 18 });
  }, [dragX, dragY]);

  // Beat bump loop (110 BPM)
  useEffect(() => {
    if (!playing) {
      bumpY.set(0);
      bumpRotate.set(0);
      return;
    }
    let frame: number;
    let beat = 0;
    const interval = (60 / 110) * 1000;
    let lastBeat = performance.now();
    const tick = (now: number) => {
      if (now - lastBeat >= interval) {
        lastBeat = now;
        beat++;
        const down = beat % 2 === 0;
        bumpY.set(down ? -8 : -4);
        bumpRotate.set(down ? -1.5 : 1);
        setTimeout(() => {
          bumpY.set(0);
          bumpRotate.set(0);
        }, 80);
      }
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

  const handleEject = useCallback(() => {
    if (loadedTapeId) eject();
  }, [loadedTapeId, eject]);

  const glowColor = activeTape?.glow ?? "transparent";
  const loaded = !!activeTape;

  // Overlay positions differ between open (no tape) and closed (tape loaded) SVGs
  const pos = loaded
    ? {
        // closed player (534.63 x 427.48)
        buttons: [
          { left: "24.7%", top: "71.6%", width: "15.5%", height: "27.9%" }, // Play
          { left: "42.1%", top: "71.6%", width: "15.4%", height: "27.9%" }, // Stop
          { left: "59.6%", top: "71.6%", width: "15.3%", height: "27.9%" }, // Rewind
          { left: "77.0%", top: "71.7%", width: "15.5%", height: "27.8%" }, // Eject
        ],
        window: { left: "23%", top: "30%", width: "55%", height: "32%" },
        reelLeft: {
          left: "30%",
          top: "38%",
          width: "10%",
          paddingBottom: "10%",
        },
        reelRight: {
          right: "30%",
          top: "38%",
          width: "10%",
          paddingBottom: "10%",
        },
      }
    : {
        // open player (565.5 x 555.39)
        buttons: [
          { left: "24.8%", top: "76.9%", width: "15.4%", height: "23%" }, // Play
          { left: "42.1%", top: "76.9%", width: "15.4%", height: "22.7%" }, // Stop
          { left: "59.6%", top: "76.9%", width: "15.2%", height: "22.7%" }, // Eject
        ],
        window: { left: "27%", top: "32%", width: "46%", height: "22%" },
        reelLeft: { left: "32%", top: "35%", width: "8%", paddingBottom: "8%" },
        reelRight: {
          right: "32%",
          top: "35%",
          width: "8%",
          paddingBottom: "8%",
        },
      };

  return (
    <motion.div
      drag
      dragElastic={0.08}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.03 }}
      whileHover={canHover ? { scale: 1.01 } : undefined}
      className={`cursor-grab active:cursor-grabbing touch-none w-[60%] max-w-[200px] md:w-[40%] md:max-w-[256px] ${className ?? ""}`}
      style={{
        x: dragSpringX,
        y: dragSpringY,
        rotate: dragRotate,
        ...style,
      }}
    >
      {/* Beat-bounce inner layer */}
      <motion.div
        className="relative overflow-visible"
        style={{ y: springY, rotate: springRotate }}
      >
        <SoundWaves
          playing={playing}
          color={colors.speaker + "60"}
          side="left"
        />
        <SoundWaves
          playing={playing}
          color={colors.speaker + "60"}
          side="right"
        />

        <div
          className="relative"
          style={{
            color:
              playing && activeTape
                ? activeTape.accent
                : "var(--muted-foreground)",
            filter:
              playing && activeTape
                ? `drop-shadow(0 0 20px ${glowColor})`
                : "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
            transition: "color 0.8s ease, filter 0.8s ease",
          }}
        >
          <CassettePlayerSVG loaded={loaded} />
          {/* Invisible HTML button overlays — positioned to match SVG button paths */}
          {pos.buttons.map((btn, i) => {
            const handlers = loaded
              ? [handlePlayPause, handleStop, handlePlayPause, handleEject]
              : [handlePlayPause, handleStop, handleEject];
            const labels = loaded
              ? ["Play / Pause", "Stop", "Rewind", "Eject"]
              : ["Play / Pause", "Stop", "Eject"];
            return (
              <button
                key={`${loaded ? "c" : "o"}-${i}`}
                className="absolute bg-transparent hover:bg-white/15 cursor-pointer z-10 transition-colors duration-150"
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
                boxShadow: `inset 0 0 16px ${nearTape.glow}, 0 0 12px ${nearTape.glow}`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Spinning reels when playing */}
        {playing && activeTape && (
          <>
            <motion.div
              className="absolute rounded-full border pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{
                ...pos.reelLeft,
                height: "0",
                borderColor: activeTape.reelColor,
                opacity: 0.5,
                boxShadow: `0 0 6px ${activeTape.glow}`,
              }}
            />
            <motion.div
              className="absolute rounded-full border pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
              style={{
                ...pos.reelRight,
                height: "0",
                borderColor: activeTape.reelColor,
                opacity: 0.5,
                boxShadow: `0 0 6px ${activeTape.glow}`,
              }}
            />
          </>
        )}

        {/* Playback glow pulse in window */}
        {playing && activeTape && (
          <motion.div
            className="absolute pointer-events-none rounded-sm"
            animate={{ opacity: [0.05, 0.2, 0.05] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              ...pos.window,
              background: `radial-gradient(ellipse at center, ${activeTape.glow} 0%, transparent 70%)`,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
});
