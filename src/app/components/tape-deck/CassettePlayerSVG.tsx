'use client'

import { useState, useEffect } from 'react'

let svgContentCache: string | null = null

interface CassettePlayerSVGProps {
  className?: string
  style?: React.CSSProperties
}

export function CassettePlayerSVG({ className, style }: CassettePlayerSVGProps) {
  const [svgContent, setSvgContent] = useState(svgContentCache)

  useEffect(() => {
    if (svgContentCache) {
      setSvgContent(svgContentCache)
      return
    }
    fetch('/cassete-filled.svg')
      .then(r => r.text())
      .then(text => {
        const match = text.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
        if (match) {
          const content = match[1].replaceAll('fill="#fff"', 'fill="var(--background)"')
          svgContentCache = content
          setSvgContent(content)
        }
      })
  }, [])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 565.5 555.39"
      fill="currentColor"
      className={className}
      style={style}
      dangerouslySetInnerHTML={svgContent ? { __html: svgContent } : undefined}
    />
  )
}
