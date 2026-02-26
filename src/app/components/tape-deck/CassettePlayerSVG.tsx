'use client'

import { useState, useEffect, useRef } from 'react'

let svgContentCache: string | null = null

interface CassettePlayerSVGProps {
  className?: string
  style?: React.CSSProperties
  onPlay?: () => void
  onStop?: () => void
  onEject?: () => void
}

export function CassettePlayerSVG({ className, style, onPlay, onStop, onEject }: CassettePlayerSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [svgContent, setSvgContent] = useState(svgContentCache)

  // Stable refs for callbacks so the effect doesn't re-run on every render
  const onPlayRef = useRef(onPlay)
  const onStopRef = useRef(onStop)
  const onEjectRef = useRef(onEject)
  onPlayRef.current = onPlay
  onStopRef.current = onStop
  onEjectRef.current = onEject

  useEffect(() => {
    if (svgContentCache) {
      setSvgContent(svgContentCache)
      return
    }
    fetch('/cassete-filled.svg')
      .then(r => r.text())
      .then(text => {
        // Extract content between <svg> tags
        const match = text.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
        if (match) {
          const hoverStyles = `<style>
            #PlayButton, #StopButton, #LoadButton { transition: opacity 0.15s ease; }
            #PlayButton:hover, #StopButton:hover, #LoadButton:hover { opacity: 0.7; }
          </style>`
          let inner = match[1].replaceAll('fill="#fff"', 'fill="var(--background)"')

          // Move button paths to end of SVG so they render on top of all
          // decorative/shading elements that would otherwise intercept clicks
          const buttonIds = ['PlayButton', 'StopButton', 'LoadButton']
          const extracted: string[] = []
          for (const id of buttonIds) {
            const re = new RegExp(`<path\\s[^>]*id="${id}"[^/]*/?>`, 'i')
            const m = inner.match(re)
            if (m) {
              extracted.push(m[0])
              inner = inner.replace(m[0], '')
            }
          }

          const content = hoverStyles + inner + extracted.join('\n')
          svgContentCache = content
          setSvgContent(content)
        }
      })
  }, [])

  // Attach click handlers to SVG button paths
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !svgContent) return

    const buttons = [
      { id: 'PlayButton', ref: onPlayRef },
      { id: 'StopButton', ref: onStopRef },
      { id: 'LoadButton', ref: onEjectRef },
    ] as const

    const cleanups: (() => void)[] = []

    for (const { id, ref } of buttons) {
      const el = svg.querySelector<SVGPathElement>(`#${id}`)
      if (!el) continue

      el.style.cursor = 'pointer'
      el.style.pointerEvents = 'auto'

      // Stop pointerdown from bubbling so Motion's drag doesn't capture it
      const onPointerDown = (e: Event) => { e.stopPropagation() }
      el.addEventListener('pointerdown', onPointerDown)
      cleanups.push(() => el.removeEventListener('pointerdown', onPointerDown))

      const onClick = (e: Event) => {
        e.stopPropagation()
        ref.current?.()
      }
      el.addEventListener('click', onClick)
      cleanups.push(() => el.removeEventListener('click', onClick))
    }

    return () => cleanups.forEach(fn => fn())
  }, [svgContent])

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 565.5 555.39"
      fill="currentColor"
      className={className}
      style={style}
      dangerouslySetInnerHTML={svgContent ? { __html: svgContent } : undefined}
    />
  )
}
