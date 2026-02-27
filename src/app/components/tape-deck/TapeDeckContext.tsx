import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { ReactNode, RefObject } from 'react'
import { TAPES } from './types'

type TapeDeckContextValue = {
  loadedTapeId: string | null
  playing: boolean
  nearDeckId: string | null
  deckPosRef: RefObject<{ x: number; y: number }>
  nearDeckIdRef: RefObject<string | null>
  registerDeckRef: (el: HTMLDivElement | null) => void
  updateDeckPos: () => void
  handleTapeDrag: (id: string, screenCenter: { x: number; y: number }) => void
  handleTapeDragEnd: (id: string) => void
  play: () => void
  pause: () => void
  eject: () => void
}

const TapeDeckContext = createContext<TapeDeckContextValue | null>(null)

export function useTapeDeck() {
  const ctx = useContext(TapeDeckContext)
  if (!ctx) throw new Error('useTapeDeck must be used within <TapeDeckProvider>')
  return ctx
}

const SNAP_DISTANCE = 120

function getProximity(
  a: { x: number; y: number },
  b: { x: number; y: number },
  snapDistance: number,
) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  return { distance, isNear: distance < snapDistance }
}

export function TapeDeckProvider({ children }: { children: ReactNode }) {
  const [loadedTapeId, setLoadedTapeId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [nearDeckId, setNearDeckId] = useState<string | null>(null)

  const deckPosRef = useRef({ x: 0, y: 0 })
  const nearDeckIdRef = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const deckElRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  // Update deck position from the registered element
  const updateDeckPos = useCallback(() => {
    if (!deckElRef.current) return
    const rect = deckElRef.current.getBoundingClientRect()
    deckPosRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }, [])

  const registerDeckRef = useCallback((el: HTMLDivElement | null) => {
    // Clean up old observer
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    deckElRef.current = el
    if (el) {
      updateDeckPos()
      // Observe size changes (also triggers on layout shifts)
      observerRef.current = new ResizeObserver(updateDeckPos)
      observerRef.current.observe(el)
    }
  }, [updateDeckPos])

  // Also update on scroll/resize
  useEffect(() => {
    window.addEventListener('resize', updateDeckPos)
    window.addEventListener('scroll', updateDeckPos, true)
    return () => {
      window.removeEventListener('resize', updateDeckPos)
      window.removeEventListener('scroll', updateDeckPos, true)
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [updateDeckPos])

  // Audio helpers
  const startAudio = useCallback((track: string) => {
    if (!audioRef.current) { audioRef.current = new Audio(); audioRef.current.loop = true }
    audioRef.current.src = track
    audioRef.current.play()
  }, [])

  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
  }, [])

  useEffect(() => () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null } }, [])

  // Tape drag — called on every drag frame by CassetteTape
  const handleTapeDrag = useCallback((id: string, screenCenter: { x: number; y: number }) => {
    // Re-read deck position each frame (it may have moved via drag/scroll)
    updateDeckPos()
    const prox = getProximity(screenCenter, deckPosRef.current, SNAP_DISTANCE)
    const next = prox.isNear ? id : null
    if (next !== nearDeckIdRef.current) {
      nearDeckIdRef.current = next
      setNearDeckId(next)
    }
  }, [updateDeckPos])

  const handleTapeDragEnd = useCallback((id: string) => {
    if (nearDeckIdRef.current === id) {
      const tape = TAPES[id]
      if (tape) {
        setLoadedTapeId(id)
        setPlaying(true)
        startAudio(tape.track)
      }
    }
    nearDeckIdRef.current = null
    setNearDeckId(null)
  }, [startAudio])

  // Transport
  const play = useCallback(() => {
    if (!loadedTapeId) return
    const tape = TAPES[loadedTapeId]
    if (tape) { setPlaying(true); startAudio(tape.track) }
  }, [loadedTapeId, startAudio])

  const pause = useCallback(() => {
    setPlaying(false); stopAudio()
  }, [stopAudio])

  const eject = useCallback(() => {
    setPlaying(false); stopAudio(); setLoadedTapeId(null)
  }, [stopAudio])

  const value = useMemo(() => ({
    loadedTapeId,
    playing,
    nearDeckId,
    deckPosRef,
    nearDeckIdRef,
    registerDeckRef,
    updateDeckPos,
    handleTapeDrag,
    handleTapeDragEnd,
    play,
    pause,
    eject,
  }), [loadedTapeId, playing, nearDeckId, registerDeckRef, handleTapeDrag, handleTapeDragEnd, play, pause, eject, updateDeckPos])

  return (
    <TapeDeckContext.Provider value={value}>
      {children}
    </TapeDeckContext.Provider>
  )
}
