'use client'

import { useState, useEffect } from 'react'

const cache: Record<string, string> = {}

const VARIANTS = {
  open: { src: '/cassete-filled.svg', viewBox: '0 0 565.5 555.39' },
  closed: { src: '/casseteplayerwithcasseteclosed.svg', viewBox: '0 0 534.63 427.48' },
} as const

interface CassettePlayerSVGProps {
  loaded?: boolean
  className?: string
  style?: React.CSSProperties
}

export function CassettePlayerSVG({ loaded, className, style }: CassettePlayerSVGProps) {
  const variant = loaded ? 'closed' : 'open'
  const { src, viewBox } = VARIANTS[variant]
  const [svgContent, setSvgContent] = useState(cache[variant] ?? null)

  useEffect(() => {
    if (cache[variant]) {
      setSvgContent(cache[variant])
      return
    }
    fetch(src)
      .then(r => r.text())
      .then(text => {
        const match = text.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
        if (match) {
          const content = match[1].replaceAll('fill="#fff"', 'fill="var(--background)"')
          cache[variant] = content
          setSvgContent(content)
        }
      })
  }, [variant, src])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="currentColor"
      className={className}
      style={style}
      dangerouslySetInnerHTML={svgContent ? { __html: svgContent } : undefined}
    />
  )
}
