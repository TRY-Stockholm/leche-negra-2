import { useRef, useEffect, useCallback, useMemo } from 'react'
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

// ─── EQ Bars ───────────────────────────────────────────────────

function EqBars({ playing, color, side }: { playing: boolean; color: string; side: 'left' | 'right' }) {
  const delayBase = side === 'left' ? 0 : 0.15
  const keyframes = useMemo(
    () => Array.from({ length: 5 }, () => [0.3, 0.6 + Math.random() * 0.4, 0.2, 0.8 + Math.random() * 0.2, 0.4]),
    [],
  )
  return (
    <div className="flex items-end gap-[2px] h-8">
      {keyframes.map((scaleY, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-sm origin-bottom"
          style={{ backgroundColor: color }}
          animate={playing ? {
            scaleY,
            opacity: [0.6, 1, 0.5, 0.9, 0.6],
          } : { scaleY: 0.15, opacity: 0.2 }}
          transition={playing ? {
            duration: 0.4 + i * 0.08,
            repeat: Infinity,
            delay: delayBase + i * 0.06,
            ease: 'easeInOut',
          } : { duration: 0.4 }}
        />
      ))}
    </div>
  )
}

// ─── Speaker Cone ──────────────────────────────────────────────

function SpeakerCone({ playing, color, glow }: { playing: boolean; color: string; glow: string }) {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      {playing && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <svg viewBox="0 0 80 80" className="w-full h-full">
        <circle cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
        <circle cx="40" cy="40" r="22" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
        <circle cx="40" cy="40" r="14" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
        <circle cx="40" cy="40" r="8" fill={color} opacity="0.25" />
        <circle cx="40" cy="40" r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
        <circle cx="40" cy="40" r="3" fill={color} opacity="0.5" />
      </svg>
    </div>
  )
}

// ─── Loaded Cassette in Deck ───────────────────────────────────

function LoadedCassette({ playing, tape }: { playing: boolean; tape: { label: string; sublabel: string; shell: string; accent: string; reelColor: string } }) {
  return (
    <div className="relative w-28 h-16">
      <svg viewBox="0 0 112 64" className="w-full h-full">
        <rect x="4" y="4" width="104" height="56" rx="4" fill="#0a0508" stroke="#333" strokeWidth="0.8" />
        <rect x="8" y="8" width="96" height="48" rx="2" fill={tape.shell} stroke={tape.accent} strokeWidth="0.3" opacity="0.6" />
        <rect x="24" y="10" width="64" height="16" rx="1" fill="#faf0e6" opacity="0.7" />
        <text x="56" y="19" textAnchor="middle" fontSize="4" fill="#1a0a0f" fontFamily="Georgia, serif" letterSpacing="1">{tape.label}</text>
        <text x="56" y="24" textAnchor="middle" fontSize="2.5" fill="#666" fontFamily="monospace">{tape.sublabel}</text>
        <motion.g
          animate={playing ? { rotate: 360 } : { rotate: 0 }}
          transition={playing ? { duration: 2, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
          style={{ transformOrigin: '32px 42px' }}
        >
          <circle cx="32" cy="42" r="10" fill="none" stroke={tape.reelColor} strokeWidth="0.8" opacity="0.5" />
          <circle cx="32" cy="42" r="3.5" fill={tape.reelColor} opacity="0.3" />
          <line x1="32" y1="32" x2="32" y2="35" stroke={tape.reelColor} strokeWidth="0.5" opacity="0.4" />
          <line x1="32" y1="49" x2="32" y2="52" stroke={tape.reelColor} strokeWidth="0.5" opacity="0.4" />
        </motion.g>
        <motion.g
          animate={playing ? { rotate: 360 } : { rotate: 0 }}
          transition={playing ? { duration: 1.6, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
          style={{ transformOrigin: '80px 42px' }}
        >
          <circle cx="80" cy="42" r="10" fill="none" stroke={tape.reelColor} strokeWidth="0.8" opacity="0.5" />
          <circle cx="80" cy="42" r="3.5" fill={tape.reelColor} opacity="0.3" />
          <line x1="80" y1="32" x2="80" y2="35" stroke={tape.reelColor} strokeWidth="0.5" opacity="0.4" />
          <line x1="80" y1="49" x2="80" y2="52" stroke={tape.reelColor} strokeWidth="0.5" opacity="0.4" />
        </motion.g>
        <path d="M42 42 L70 42" fill="none" stroke={tape.reelColor} strokeWidth="0.4" opacity="0.3" />
      </svg>
    </div>
  )
}

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

// ─── Boombox Body SVG ──────────────────────────────────────────

function BoomboxBody({ activeTapeId, brandName, brandSubtitle }: { activeTapeId: string | null; brandName: string; brandSubtitle: string }) {
  const chrome = '#c9a84c'
  const chromeDark = '#a07830'
  const body = '#1a1018'
  const bodyLight = '#2a1828'
  const speakerColor = activeTapeId ? SPEAKER_COLORS[activeTapeId]?.speaker ?? '#444' : '#444'
  const activeTape = activeTapeId ? TAPES[activeTapeId] : null

  return (
    <svg viewBox="0 0 500 280" className="w-full h-full" style={{ filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.6))' }}>
      <rect x="20" y="50" width="460" height="200" rx="12" fill={body} stroke="#333" strokeWidth="1" />
      <rect x="24" y="54" width="452" height="192" rx="10" fill={bodyLight} opacity="0.3" />
      <path d="M160 50 Q160 20 200 15 L300 15 Q340 20 340 50" fill="none" stroke={chrome} strokeWidth="5" strokeLinecap="round" />
      <path d="M160 50 Q160 22 200 17 L300 17 Q340 22 340 50" fill="none" stroke={chromeDark} strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* Left speaker grille */}
      <circle cx="110" cy="160" r="60" fill="#0a0508" stroke="#333" strokeWidth="1" />
      <circle cx="110" cy="160" r="56" fill="none" stroke={speakerColor} strokeWidth="0.3" opacity="0.2" />
      {Array.from({ length: 5 }).map((_, ring) => {
        const r = 12 + ring * 10
        const count = 6 + ring * 4
        return Array.from({ length: count }).map((_, j) => {
          const angle = (j / count) * Math.PI * 2
          return <circle key={`l-${ring}-${j}`} cx={110 + Math.cos(angle) * r} cy={160 + Math.sin(angle) * r} r="1.5" fill={speakerColor} opacity="0.12" />
        })
      })}

      {/* Right speaker grille */}
      <circle cx="390" cy="160" r="60" fill="#0a0508" stroke="#333" strokeWidth="1" />
      <circle cx="390" cy="160" r="56" fill="none" stroke={speakerColor} strokeWidth="0.3" opacity="0.2" />
      {Array.from({ length: 5 }).map((_, ring) => {
        const r = 12 + ring * 10
        const count = 6 + ring * 4
        return Array.from({ length: count }).map((_, j) => {
          const angle = (j / count) * Math.PI * 2
          return <circle key={`r-${ring}-${j}`} cx={390 + Math.cos(angle) * r} cy={160 + Math.sin(angle) * r} r="1.5" fill={speakerColor} opacity="0.12" />
        })
      })}

      {/* Center panel */}
      <rect x="175" y="60" width="150" height="40" rx="3" fill="#0a0508" stroke="#333" strokeWidth="0.5" />
      <rect x="185" y="105" width="130" height="75" rx="6" fill="#0a0508" stroke={activeTape ? activeTape.accent + '60' : '#333'} strokeWidth={activeTape ? 1.2 : 0.8} />
      {!activeTape && (
        <>
          <line x1="220" y1="140" x2="280" y2="140" stroke="#333" strokeWidth="0.5" strokeDasharray="4,3" />
          <text x="250" y="148" textAnchor="middle" fontSize="4" fill="#ffffff10" fontFamily="monospace" letterSpacing="2">INSERT TAPE</text>
        </>
      )}
      <rect x="195" y="190" width="110" height="30" rx="4" fill="#0a0508" stroke="#444" strokeWidth="0.6" />
      <line x1="232" y1="193" x2="232" y2="217" stroke="#333" strokeWidth="0.4" />
      <line x1="268" y1="193" x2="268" y2="217" stroke="#333" strokeWidth="0.4" />
      <circle cx="185" cy="235" r="10" fill="#0f0a0d" stroke={chrome} strokeWidth="1" />
      <circle cx="185" cy="235" r="3" fill={chrome} opacity="0.4" />
      <circle cx="315" cy="235" r="10" fill="#0f0a0d" stroke={chrome} strokeWidth="1" />
      <circle cx="315" cy="235" r="3" fill={chrome} opacity="0.4" />
      <line x1="30" y1="52" x2="470" y2="52" stroke={chrome} strokeWidth="0.5" opacity="0.3" />
      <line x1="30" y1="248" x2="470" y2="248" stroke={chrome} strokeWidth="0.5" opacity="0.3" />
      <text x="250" y="80" textAnchor="middle" fontSize="8" fill={chrome} fontFamily="Georgia, serif" letterSpacing="4" opacity="0.6">{brandName}</text>
      <text x="250" y="96" textAnchor="middle" fontSize="4.5" fill={chrome} fontFamily="monospace" letterSpacing="2" opacity="0.3">{brandSubtitle}</text>
      <rect x="50" y="250" width="30" height="6" rx="3" fill="#0a0508" />
      <rect x="420" y="250" width="30" height="6" rx="3" fill="#0a0508" />
    </svg>
  )
}

// ─── Boombox Component ─────────────────────────────────────────

export function Boombox({
  className,
  style,
  brandName = 'LECHE NEGRA',
  brandSubtitle = 'TAPE DECK',
}: {
  className?: string
  style?: React.CSSProperties
  brandName?: string
  brandSubtitle?: string
}) {
  const { loadedTapeId, playing, nearDeckId, registerDeckRef, play, pause, eject } = useTapeDeck()

  const activeTape = loadedTapeId ? TAPES[loadedTapeId] : null
  const colors = activeTape ? SPEAKER_COLORS[activeTape.id] : SPEAKER_COLORS.morning

  // Drag springs (outer layer — boombox drag)
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const dragSpringX = useSpring(dragX, { stiffness: 200, damping: 22 })
  const dragSpringY = useSpring(dragY, { stiffness: 200, damping: 22 })
  const dragRotate = useTransform(dragSpringX, [-300, 0, 300], [-6, 0, 6])

  // Bump springs (inner layer — beat bounce)
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

  const handleBoomboxDragEnd = useCallback(() => {
    animate(dragX, 0, { type: 'spring', stiffness: 150, damping: 18 })
    animate(dragY, 0, { type: 'spring', stiffness: 150, damping: 18 })
  }, [dragX, dragY])

  // Beat bump loop
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

  const nearTape = nearDeckId ? TAPES[nearDeckId] : null

  return (
    <motion.div
      drag
      dragElastic={0.08}
      dragMomentum={false}
      onDragEnd={handleBoomboxDragEnd}
      whileDrag={{ scale: 1.03 }}
      whileHover={{ scale: 1.01 }}
      className={`cursor-grab active:cursor-grabbing touch-none w-[85%] max-w-[280px] md:w-[55%] md:max-w-[380px] ${className ?? ''}`}
      style={{
        x: dragSpringX, y: dragSpringY, rotate: dragRotate,
        ...style,
      }}
    >
      <div className="absolute -inset-6" />

      {/* Bump inner layer */}
      <motion.div className="relative overflow-visible" style={{ y: springY, rotate: springRotate }}>
        <SoundWaves playing={playing} color={colors.speaker + '60'} side="left" />
        <SoundWaves playing={playing} color={colors.speaker + '60'} side="right" />
        <BoomboxBody activeTapeId={loadedTapeId} brandName={brandName} brandSubtitle={brandSubtitle} />

        {/* Speakers */}
        <div className="absolute" style={{ left: '10.5%', top: '33%', width: '18%' }}>
          <SpeakerCone playing={playing} color={colors.speaker} glow={colors.glow} />
        </div>
        <div className="absolute" style={{ right: '10.5%', top: '33%', width: '18%' }}>
          <SpeakerCone playing={playing} color={colors.speaker} glow={colors.glow} />
        </div>

        {/* EQ */}
        <div className="absolute" style={{ left: '34%', top: '25%' }}>
          <EqBars playing={playing} color={colors.eq} side="left" />
        </div>
        <div className="absolute" style={{ right: '34%', top: '25%' }}>
          <EqBars playing={playing} color={colors.eq} side="right" />
        </div>

        {/* Deck slot ref — registered with context */}
        <div ref={setDeckSlotRef} className="absolute pointer-events-none" style={{ left: '37%', top: '37%', width: '26%', height: '27%' }} />

        {/* Deck slot glow when tape is near */}
        <AnimatePresence>
          {nearTape && (
            <motion.div
              className="absolute pointer-events-none rounded"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{
                left: '37%', top: '37%', width: '26%', height: '27%',
                boxShadow: `inset 0 0 20px ${nearTape.glow}, 0 0 15px ${nearTape.glow}`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Loaded cassette */}
        {activeTape && (
          <motion.div
            className="absolute flex items-center justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ left: '37%', top: '37%', width: '26%', height: '27%' }}
          >
            <LoadedCassette playing={playing} tape={activeTape} />
          </motion.div>
        )}

        {/* Transport buttons */}
        <div className="absolute flex items-center" style={{ zIndex: 15, left: '39%', top: '68%', width: '22%', height: '10.7%' }}>
          <motion.button
            onClick={handlePlayPause}
            className="flex-1 h-full flex items-center justify-center cursor-pointer"
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            whileTap={{ scale: 0.92 }}
            style={{ borderRight: '1px solid #333' }}
            disabled={!loadedTapeId}
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4">
              {loadedTapeId && playing ? (
                <>
                  <rect x="4" y="3" width="4" height="14" rx="1" fill={activeTape ? activeTape.accent : '#666'} />
                  <rect x="12" y="3" width="4" height="14" rx="1" fill={activeTape ? activeTape.accent : '#666'} />
                </>
              ) : (
                <polygon points="5,3 5,17 17,10" fill={loadedTapeId ? (activeTape?.accent ?? '#666') : '#333'} />
              )}
            </svg>
          </motion.button>
          <motion.button
            onClick={loadedTapeId ? pause : undefined}
            className="flex-1 h-full flex items-center justify-center cursor-pointer"
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            whileTap={{ scale: 0.92 }}
            style={{ borderRight: '1px solid #333' }}
            disabled={!loadedTapeId}
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5">
              <rect x="4" y="4" width="12" height="12" rx="1" fill={loadedTapeId ? '#888' : '#333'} />
            </svg>
          </motion.button>
          <motion.button
            onClick={loadedTapeId ? eject : undefined}
            className="flex-1 h-full flex items-center justify-center cursor-pointer"
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            whileTap={{ scale: 0.92 }}
            disabled={!loadedTapeId}
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5">
              <polygon points="3,13 10,5 17,13" fill={loadedTapeId ? '#888' : '#333'} />
              <rect x="3" y="15" width="14" height="2" rx="0.5" fill={loadedTapeId ? '#888' : '#333'} />
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
