import { useRef, useEffect, useCallback } from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from 'motion/react'
import { TAPES, SPEAKER_COLORS } from './types'
import { useTapeDeck } from './TapeDeckContext'
import { CassettePlayerSVG } from './CassettePlayerSVG'
import { CassetteTapeSVG } from './CassetteTape'

// ─── Sound Waves ───────────────────────────────────────────────

function SoundWaves({ playing, color, side }: { playing: boolean; color: string; side: 'left' | 'right' }) {
  if (!playing) return null
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
      style={{ [side === 'left' ? 'left' : 'right']: -30 }}
    >
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            borderColor: color,
            width: 20,
            height: 20,
            top: -10,
            [side === 'left' ? 'right' : 'left']: 0,
          }}
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: [0.5, 2 + i * 0.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.35, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ─── Cassette Player Component ─────────────────────────────────

export function CassettePlayer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { loadedTapeId, playing, nearDeckId, registerDeckRef, play, pause, eject } = useTapeDeck()

  const activeTape = loadedTapeId ? TAPES[loadedTapeId] : null
  const nearTape = nearDeckId ? TAPES[nearDeckId] : null
  const colors = activeTape ? SPEAKER_COLORS[activeTape.id] : SPEAKER_COLORS.morning

  // Drag springs (outer layer)
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const dragSpringX = useSpring(dragX, { stiffness: 200, damping: 22 })
  const dragSpringY = useSpring(dragY, { stiffness: 200, damping: 22 })
  const dragRotate = useTransform(dragSpringX, [-300, 0, 300], [-6, 0, 6])

  // Beat-bounce springs (inner layer)
  const bumpY = useMotionValue(0)
  const bumpRotate = useMotionValue(0)
  const springY = useSpring(bumpY, { stiffness: 600, damping: 12 })
  const springRotate = useSpring(bumpRotate, { stiffness: 600, damping: 12 })

  // Register deck slot ref with context so tapes can snap to it
  const deckSlotRef = useRef<HTMLDivElement | null>(null)
  const setDeckSlotRef = useCallback((el: HTMLDivElement | null) => {
    deckSlotRef.current = el
    registerDeckRef(el)
  }, [registerDeckRef])

  // Re-register on drag spring changes so deck position stays in sync
  useEffect(() => {
    const unsub = dragSpringX.on('change', () => { registerDeckRef(deckSlotRef.current) })
    const unsub2 = dragSpringY.on('change', () => { registerDeckRef(deckSlotRef.current) })
    return () => { unsub(); unsub2() }
  }, [dragSpringX, dragSpringY, registerDeckRef])

  const handleDragEnd = useCallback(() => {
    animate(dragX, 0, { type: 'spring', stiffness: 150, damping: 18 })
    animate(dragY, 0, { type: 'spring', stiffness: 150, damping: 18 })
  }, [dragX, dragY])

  // Beat bump loop (110 BPM)
  useEffect(() => {
    if (!playing) { bumpY.set(0); bumpRotate.set(0); return }
    let frame: number
    let beat = 0
    const interval = (60 / 110) * 1000
    let lastBeat = performance.now()
    const tick = (now: number) => {
      if (now - lastBeat >= interval) {
        lastBeat = now
        beat++
        const down = beat % 2 === 0
        bumpY.set(down ? -8 : -4)
        bumpRotate.set(down ? -1.5 : 1)
        setTimeout(() => { bumpY.set(0); bumpRotate.set(0) }, 80)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, bumpY, bumpRotate])

  const handlePlayPause = useCallback(() => {
    if (!loadedTapeId) return
    if (playing) pause()
    else play()
  }, [loadedTapeId, playing, play, pause])

  const handleStop = useCallback(() => {
    if (loadedTapeId) eject()
  }, [loadedTapeId, eject])

  const handleEject = useCallback(() => {
    if (loadedTapeId) eject()
  }, [loadedTapeId, eject])

  const glowColor = activeTape?.glow ?? 'transparent'

  return (
    <motion.div
      drag
      dragElastic={0.08}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.03 }}
      whileHover={{ scale: 1.01 }}
      className={`cursor-grab active:cursor-grabbing touch-none w-[56%] max-w-[192px] md:w-[40%] md:max-w-[256px] ${className ?? ''}`}
      style={{
        x: dragSpringX, y: dragSpringY, rotate: dragRotate,
        ...style,
      }}
    >
      {/* Beat-bounce inner layer */}
      <motion.div className="relative overflow-visible" style={{ y: springY, rotate: springRotate }}>
        <SoundWaves playing={playing} color={colors.speaker + '60'} side="left" />
        <SoundWaves playing={playing} color={colors.speaker + '60'} side="right" />

        <div
          className="relative"
          style={{
            color: playing && activeTape ? activeTape.accent : 'var(--muted-foreground)',
            filter: playing && activeTape ? `drop-shadow(0 0 20px ${glowColor})` : 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
            transition: 'color 0.8s ease, filter 0.8s ease',
          }}
        >
          <CassettePlayerSVG />
          {/* Invisible HTML button overlays — positioned to match SVG button paths */}
          <button
            className="absolute bg-transparent hover:bg-white/15 cursor-pointer z-10 transition-colors duration-150"
            style={{ left: '24.8%', top: '76.9%', width: '15.4%', height: '23%' }}
            onPointerDown={e => e.stopPropagation()}
            onClick={handlePlayPause}
            aria-label="Play / Pause"
          />
          <button
            className="absolute bg-transparent hover:bg-white/15 cursor-pointer z-10 transition-colors duration-150"
            style={{ left: '42.1%', top: '76.9%', width: '15.4%', height: '22.7%' }}
            onPointerDown={e => e.stopPropagation()}
            onClick={handleStop}
            aria-label="Stop"
          />
          <button
            className="absolute bg-transparent hover:bg-white/15 cursor-pointer z-10 transition-colors duration-150"
            style={{ left: '59.6%', top: '76.9%', width: '15.2%', height: '22.7%' }}
            onPointerDown={e => e.stopPropagation()}
            onClick={handleEject}
            aria-label="Eject"
          />
        </div>

        {/* Deck slot ref for proximity detection */}
        <div
          ref={setDeckSlotRef}
          className="absolute pointer-events-none"
          style={{ left: '27%', top: '32%', width: '46%', height: '22%' }}
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
                left: '27%', top: '32%', width: '46%', height: '22%',
                boxShadow: `inset 0 0 16px ${nearTape.glow}, 0 0 12px ${nearTape.glow}`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Loaded tape in cassette window */}
        <AnimatePresence>
          {activeTape && (
            <motion.div
              className="absolute flex items-center justify-center pointer-events-none overflow-hidden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ left: '27%', top: '32%', width: '46%', height: '22%' }}
            >
              <CassetteTapeSVG
                tape={activeTape}
                className="w-full h-full"
                style={{ filter: `drop-shadow(0 0 4px ${activeTape.glow})` }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spinning reels when playing */}
        {playing && activeTape && (
          <>
            <motion.div
              className="absolute rounded-full border pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{
                left: '32%', top: '35%',
                width: '8%', height: '0',
                paddingBottom: '8%',
                borderColor: activeTape.reelColor,
                opacity: 0.5,
                boxShadow: `0 0 6px ${activeTape.glow}`,
              }}
            />
            <motion.div
              className="absolute rounded-full border pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
              style={{
                right: '32%', top: '35%',
                width: '8%', height: '0',
                paddingBottom: '8%',
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
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              left: '27%', top: '32%', width: '46%', height: '22%',
              background: `radial-gradient(ellipse at center, ${activeTape.glow} 0%, transparent 70%)`,
            }}
          />
        )}

      </motion.div>
    </motion.div>
  )
}
