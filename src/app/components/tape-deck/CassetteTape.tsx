import { useCallback, useRef, useState, useEffect, memo } from 'react'
import { motion, useDragControls } from 'motion/react'
import { TAPES } from './types'
import type { TapeConfig } from './types'
import { useTapeDeck } from './TapeDeckContext'
import { useCanHover } from '@/hooks/useCanHover'

// ─── Vinyl Disc SVG ────────────────────────────────────────────

let vinylContentCache: string | null = null

const WOBBLE_ROTATIONS: Record<string, number[]> = {
  morning: [0, -12, 10, -6, 0],
  midday: [0, 10, -12, 6, 0],
  evening: [0, -8, 12, -8, 0],
  night: [0, 12, -10, 4, 0],
}

const WOBBLE_DELAYS: Record<string, number> = {
  morning: 1.0,
  midday: 1.15,
  evening: 1.3,
  night: 1.45,
}

export const CassetteTapeSVG = memo(function CassetteTapeSVG({ tape, className, style }: { tape: TapeConfig; className?: string; style?: React.CSSProperties }) {
  const [svgContent, setSvgContent] = useState(vinylContentCache)

  useEffect(() => {
    if (vinylContentCache) { setSvgContent(vinylContentCache); return }
    fetch('/VINYL.svg')
      .then(r => r.text())
      .then(text => {
        const match = text.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
        if (match) {
          vinylContentCache = match[1]
          setSvgContent(match[1])
        }
      })
  }, [])

  return (
    <svg
      viewBox="0 0 704.48 704.46"
      className={className ?? 'w-full max-w-[120px]'}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinejoin="round"
      style={
        style ?? {
          color: 'var(--foreground)',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
        }
      }
      dangerouslySetInnerHTML={svgContent ? { __html: svgContent } : undefined}
    />
  )
})

// ─── CassetteTape Component ────────────────────────────────────

export const CassetteTape = memo(function CassetteTape({
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
  const canHover = useCanHover()
  const dragControls = useDragControls()

  const isLoaded = loadedTapeId === id
  const isNearDeck = nearDeckId === id
  const elRef = useRef<HTMLDivElement>(null)

  // Touch arming: a disc must be pressed-and-held to "lift" before it drags, so a
  // normal swipe over it scrolls the page instead of getting trapped. Because the
  // disc keeps `touch-action: none` (needed for free, any-direction dragging onto
  // the gramophone below it), the page can't scroll natively from a touch that
  // starts here — so during the pre-lift phase we forward the finger to the page.
  const [lifted, setLifted] = useState(false)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPt = useRef({ x: 0, y: 0 })
  const lastY = useRef(0)
  const liftedRef = useRef(false)
  const scrollingRef = useRef(false)

  const LIFT_MS = 250
  const MOVE_SLOP = 8

  // Wobble on mount for touch devices — hints tapes are interactive
  const wobbleRotation = WOBBLE_ROTATIONS[id] ?? [0, -3, 2, 0]
  const wobbleDelay = WOBBLE_DELAYS[id] ?? 1.0

  const onDrag = useCallback(() => {
    if (!elRef.current) return
    const rect = elRef.current.getBoundingClientRect()
    handleTapeDrag(id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
  }, [id, handleTapeDrag])

  const onDragEnd = useCallback(() => {
    handleTapeDragEnd(id)
  }, [id, handleTapeDragEnd])

  const clearPress = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Desktop / any hover-capable pointer: drag immediately, same as before.
      if (canHover || e.pointerType === 'mouse') {
        dragControls.start(e)
        return
      }
      // Touch: arm a press-and-hold. Movement before it fires means "scroll".
      // Keep the native event — the React synthetic one is nulled after dispatch,
      // but we start the drag from the deferred timeout below.
      const native = e.nativeEvent
      startPt.current = { x: e.clientX, y: e.clientY }
      lastY.current = e.clientY
      liftedRef.current = false
      scrollingRef.current = false
      clearPress()
      pressTimer.current = setTimeout(() => {
        liftedRef.current = true
        setLifted(true)
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8)
        dragControls.start(native)
      }, LIFT_MS)
    },
    [canHover, dragControls, clearPress],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Once lifted, framer-motion owns the gesture.
      if (liftedRef.current || canHover) return

      const dyStep = e.clientY - lastY.current
      lastY.current = e.clientY

      if (!scrollingRef.current) {
        const movedX = Math.abs(e.clientX - startPt.current.x)
        const movedY = Math.abs(e.clientY - startPt.current.y)
        if (movedX > MOVE_SLOP || movedY > MOVE_SLOP) {
          // Moved before the hold completed → it's a scroll, not a pickup.
          scrollingRef.current = true
          clearPress()
        }
      }

      // Forward the swipe to the page (no native scroll while touch-action: none).
      if (scrollingRef.current) window.scrollBy(0, -dyStep)
    },
    [canHover, clearPress],
  )

  const endPress = useCallback(() => {
    clearPress()
    scrollingRef.current = false
    if (liftedRef.current) {
      liftedRef.current = false
      setLifted(false)
    }
  }, [clearPress])

  useEffect(() => () => clearPress(), [clearPress])

  if (isLoaded) return null

  return (
    <div className={className} style={style}>
      <motion.div
        ref={elRef}
        drag
        dragListener={false}
        dragControls={dragControls}
        dragElastic={0.08}
        dragMomentum={false}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onDrag={onDrag}
        onDragEnd={() => { onDragEnd(); endPress() }}
        whileHover={canHover ? { scale: 1.04 } : undefined}
        animate={{ rotate: wobbleRotation, scale: lifted ? 1.1 : 1 }}
        transition={{
          rotate: { duration: 0.6, ease: 'easeInOut', delay: wobbleDelay },
          scale: { duration: 0.18, ease: 'easeOut' },
        }}
        className="cursor-grab active:cursor-grabbing touch-none relative w-fit"
        style={{ zIndex: lifted ? 50 : 12 }}
      >
        <div className="absolute -inset-4" />
        {isNearDeck && tape && (
          <motion.div
            className="absolute -inset-2 rounded-full pointer-events-none"
            animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.97, 1.03, 0.97] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            style={{
              border: "1.5px solid rgba(228,49,34,0.85)",
              boxShadow:
                "0 0 18px 2px rgba(228,49,34,0.55), inset 0 0 14px rgba(228,49,34,0.3)",
            }}
          />
        )}
        {tape && <CassetteTapeSVG tape={tape} />}
      </motion.div>
    </div>
  )
})
