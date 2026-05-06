'use client'

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

const cache: Record<string, string> = {}

const VARIANTS = {
  empty: { src: '/gramo-empty.svg', viewBox: '0 0 330.54 448.37' },
  loaded: { src: '/gramo-loaded.svg', viewBox: '0 0 329.49 451.38' },
  playing: { src: '/gramo-playing.svg', viewBox: '0 0 331.98 447.29' },
} as const

type Variant = keyof typeof VARIANTS

interface GramophoneSVGProps {
  loaded?: boolean
  playing?: boolean
  className?: string
  style?: React.CSSProperties
}

function deriveState(loaded?: boolean, playing?: boolean): Variant {
  if (loaded && playing) return 'playing'
  if (loaded) return 'loaded'
  return 'empty'
}

export function GramophoneSVG({ loaded, playing, className, style }: GramophoneSVGProps) {
  const state = deriveState(loaded, playing)

  const [contents, setContents] = useState<Record<Variant, string | null>>({
    empty: cache.empty ?? null,
    loaded: cache.loaded ?? null,
    playing: cache.playing ?? null,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const emptyRef = useRef<SVGSVGElement>(null)
  const loadedRef = useRef<SVGSVGElement>(null)
  const playingRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(Object.keys(VARIANTS) as Variant[]).forEach((key) => {
      if (cache[key]) return
      fetch(VARIANTS[key].src)
        .then((r) => r.text())
        .then((text) => {
          if (cancelled) return
          const match = text.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
          if (!match) return
          cache[key] = match[1]
          setContents((c) => ({ ...c, [key]: match[1] }))
        })
        .catch(() => {})
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Crossfade between states
  useGSAP(
    () => {
      const map: Record<Variant, SVGSVGElement | null> = {
        empty: emptyRef.current,
        loaded: loadedRef.current,
        playing: playingRef.current,
      }
      ;(Object.keys(map) as Variant[]).forEach((v) => {
        const el = map[v]
        if (!el) return
        gsap.to(el, {
          opacity: v === state ? 1 : 0,
          duration: 0.45,
          ease: 'power2.out',
          overwrite: true,
        })
      })
    },
    { scope: containerRef, dependencies: [state] },
  )

  const sharedSvgProps = {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'currentColor',
    stroke: 'currentColor',
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', ...style }}
    >
      <svg
        ref={emptyRef}
        {...sharedSvgProps}
        viewBox={VARIANTS.empty.viewBox}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          opacity: state === 'empty' ? 1 : 0,
        }}
        dangerouslySetInnerHTML={contents.empty ? { __html: contents.empty } : undefined}
      />
      <svg
        ref={loadedRef}
        {...sharedSvgProps}
        viewBox={VARIANTS.loaded.viewBox}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: state === 'loaded' ? 1 : 0,
          pointerEvents: 'none',
        }}
        dangerouslySetInnerHTML={contents.loaded ? { __html: contents.loaded } : undefined}
      />
      <svg
        ref={playingRef}
        {...sharedSvgProps}
        viewBox={VARIANTS.playing.viewBox}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: state === 'playing' ? 1 : 0,
          pointerEvents: 'none',
        }}
        dangerouslySetInnerHTML={contents.playing ? { __html: contents.playing } : undefined}
      />
    </div>
  )
}
