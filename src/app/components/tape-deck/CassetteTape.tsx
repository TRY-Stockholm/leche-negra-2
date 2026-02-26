import { useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { TAPES } from './types'
import type { TapeConfig } from './types'
import { useTapeDeck } from './TapeDeckContext'

// ─── Cassette Tape SVG ─────────────────────────────────────────

function CassetteTapeSVG({ tape }: { tape: TapeConfig }) {
  return (
    <svg viewBox="0 0 130 82" className="w-full max-w-[130px]" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}>
      <rect x="2" y="2" width="126" height="78" rx="5" fill={tape.shell} stroke={tape.accent} strokeWidth="0.8" opacity="0.9" />
      <rect x="6" y="6" width="118" height="70" rx="3" fill={tape.shell} stroke={tape.accent} strokeWidth="0.3" opacity="0.5" />
      <rect x="14" y="8" width="102" height="28" rx="2" fill="#faf0e6" opacity="0.9" />
      <text x="65" y="20" textAnchor="middle" fontSize="5.5" fill="#1a0a0f" fontFamily="Georgia, serif" letterSpacing="1.5">{tape.label}</text>
      <text x="65" y="28" textAnchor="middle" fontSize="3" fill="#666" fontFamily="monospace" letterSpacing="0.8">{tape.sublabel}</text>
      <line x1="20" y1="32" x2="110" y2="32" stroke={tape.accent} strokeWidth="0.3" opacity="0.5" />
      <rect x="22" y="40" width="86" height="28" rx="3" fill="#0a0508" stroke="#333" strokeWidth="0.5" />
      <circle cx="44" cy="54" r="10" fill="none" stroke={tape.reelColor} strokeWidth="0.6" opacity="0.5" />
      <circle cx="44" cy="54" r="4" fill={tape.reelColor} opacity="0.2" />
      <circle cx="44" cy="54" r="2" fill="#0a0508" />
      <circle cx="86" cy="54" r="10" fill="none" stroke={tape.reelColor} strokeWidth="0.6" opacity="0.5" />
      <circle cx="86" cy="54" r="4" fill={tape.reelColor} opacity="0.2" />
      <circle cx="86" cy="54" r="2" fill="#0a0508" />
      <path d="M54 54 L76 54" fill="none" stroke={tape.reelColor} strokeWidth="0.4" opacity="0.3" />
      <circle cx="12" cy="72" r="2" fill="#0a0508" stroke="#333" strokeWidth="0.3" />
      <circle cx="118" cy="72" r="2" fill="#0a0508" stroke="#333" strokeWidth="0.3" />
      <rect x="38" y="72" width="8" height="6" rx="1" fill="#0a0508" stroke="#333" strokeWidth="0.3" />
      <rect x="84" y="72" width="8" height="6" rx="1" fill="#0a0508" stroke="#333" strokeWidth="0.3" />
      <rect x="58" y="72" width="14" height="6" rx="1" fill="#0a0508" stroke="#333" strokeWidth="0.3" />
    </svg>
  )
}

// ─── CassetteTape Component ────────────────────────────────────

export function CassetteTape({
  id,
  className,
  style,
}: {
  id: string
  className?: string
  style?: React.CSSProperties
}) {
  const tape = TAPES[id]
  const { loadedTapeId, nearDeckId, handleTapeDrag, handleTapeDragEnd } = useTapeDeck()

  const isLoaded = loadedTapeId === id
  const isNearDeck = nearDeckId === id
  const elRef = useRef<HTMLDivElement>(null)

  const onDrag = useCallback(() => {
    if (!elRef.current) return
    const rect = elRef.current.getBoundingClientRect()
    handleTapeDrag(id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
  }, [id, handleTapeDrag])

  const onDragEnd = useCallback(() => {
    handleTapeDragEnd(id)
  }, [id, handleTapeDragEnd])

  if (isLoaded) return null

  return (
    <div className={className} style={style}>
      <motion.div
        ref={elRef}
        drag
        dragElastic={0.08}
        dragMomentum={false}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        whileDrag={{ scale: 1.08, zIndex: 50 }}
        whileHover={{ scale: 1.04 }}
        className="cursor-grab active:cursor-grabbing touch-none relative"
        style={{ zIndex: 12 }}
      >
        <div className="absolute -inset-4" />
        {isNearDeck && tape && (
          <motion.div
            className="absolute -inset-3 rounded pointer-events-none"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{
              border: `1px solid ${tape.accent}`,
              boxShadow: `0 0 15px ${tape.glow}`,
            }}
          />
        )}
        {tape && <CassetteTapeSVG tape={tape} />}
      </motion.div>
    </div>
  )
}
