import { useCallback, useRef, useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { TAPES } from './types'
import type { TapeConfig } from './types'
import { useTapeDeck } from './TapeDeckContext'

// ─── Cassette Tape SVG ─────────────────────────────────────────

let tapeContentCache: string | null = null

export function CassetteTapeSVG({ tape, className, style }: { tape: TapeConfig; className?: string; style?: React.CSSProperties }) {
  const [svgContent, setSvgContent] = useState(tapeContentCache)

  useEffect(() => {
    if (tapeContentCache) { setSvgContent(tapeContentCache); return }
    fetch('/cassete-non-angled.svg')
      .then(r => r.text())
      .then(text => {
        const match = text.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
        if (match) {
          tapeContentCache = match[1]
          setSvgContent(match[1])
        }
      })
  }, [])

  // Replace #fff with the tape's accent color
  const colored = svgContent?.replaceAll('fill="#fff"', `fill="${tape.accent}"`) ?? null

  return (
    <svg
      viewBox="0 0 316.19 190.17"
      className={className ?? 'w-full max-w-[130px]'}
      fill={tape.shell}
      style={style ?? { filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}
      dangerouslySetInnerHTML={colored ? { __html: colored } : undefined}
    />
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
