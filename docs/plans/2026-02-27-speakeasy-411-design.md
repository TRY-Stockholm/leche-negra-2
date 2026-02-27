# 411 Speakeasy Page — Design

## Overview

The 411 speakeasy page is an immersive, atmosphere-first landing page accessed via the existing footer drag-to-enter mechanic. It presents a cocktail menu PDF link wrapped in a dark romanticism experience — lush, decadent, gothic-literary. A tonal departure from the main site's art deco language.

The real-world 411 is hidden behind a painting of a lady in black and white with blue lips, inside the Leche Negra building. The digital page captures that threshold-crossing feeling.

## Content

- **Cryptic tagline** — short, evocative, whispered. Positioned at the top.
- **"411"** — large typographic centerpiece.
- **Expandable description** — a collapsible panel (same pattern as main site menu) hiding 2-3 atmospheric sentences about the space. Trigger text like "about the room".
- **Menu PDF button** — links to the cocktail menu PDF in a new tab.
- **Return link** — small, nearly invisible, exits back to the main site.
- **No nav bar, no footer** — 411 is self-contained. You're in a different space.

## Visual Direction

### Palette

Monochromatic burgundy on black. No cream, no brass — a complete departure from the main site.

- Background: `#0a0604` or darker (deepest black)
- Primary text: `#8b2236` (carmine) — brightest burgundy, used for "411" and button
- Secondary text: `#6b1d2a` (burgundy) at ~80% opacity — tagline, description
- Muted text: darkest burgundy, nearly invisible — trigger text, return link
- Accent: `#8b2236` — button borders, hover glows
- No cream, no brass, no blue (the painting's blue lips stay in the physical space)

### Aesthetic

**Dark romanticism, not art deco.** Organic rather than geometric. Victorian underworld parlor meets forbidden poetry.

- Lush botanical illustrations (custom SVGs by Leon) — vines, thorns, roses
- Heavy vignette darkening the edges
- Soft burgundy radial glow from below (distant candlelight)
- Enhanced film grain/noise texture
- No neon effects, no geometric brackets, no ticker

### Lighting & Atmosphere

- Radial gradient centered low on page, burgundy-tinted (`rgba(107,29,42,0.15)`), fading to black
- Heavy vignette — corners near-black
- Film grain overlay from existing design system, slightly increased opacity
- Botanical illustrations at 20-30% opacity with `filter: blur(40px)` duplicate halos behind them

### Typography

- **"411"**: Playfair Display, `clamp(4rem, 12vw, 10rem)`, carmine (`#8b2236`), faint burgundy text-shadow
- **Tagline**: Playfair Display italic, `clamp(1.5rem, 4vw, 3rem)`, muted burgundy at ~80%
- **Description**: Playfair Display italic, body size, muted burgundy
- **Button/labels**: General Sans uppercase, wide tracking, carmine
- **Return link**: General Sans lowercase, darkest burgundy

Hierarchy through size and opacity — not color variation. Everything is burgundy; brightness determines importance.

## Animation

All subtle, all slow. The page feels alive but still.

### Entry Reveal

Content appears in stages over ~1.5s on page load — like eyes adjusting to darkness:

1. "411" title fades in first
2. Tagline follows (~200ms delay)
3. Botanical illustrations drift in from edges (~400ms delay)
4. Button and description trigger appear last (~600ms delay)

### Ambient

- Botanical elements: very slow drift/sway, ~15-20s cycle. Barely perceptible.
- Central burgundy glow: slow pulse, `opacity 0.12 -> 0.18`, ~8s cycle. Breathing candlelight.
- All animations respect `prefers-reduced-motion` — static fallbacks only.

### Interactive

- Expandable description: smooth height animation with spring physics (matches main site menu pattern), text fades in ~200ms after panel opens.
- Menu button hover: slow burgundy glow blooms behind it (~0.4s), then border fills solid burgundy with black text.
- Return link: on hover, opacity increases slightly. That's it.

### Exit

Return link triggers: page fades to black, then navigates to `/`. No dramatic mechanic — you slip back out quietly.

## Component Architecture

```
src/app/speakeasy/
├── page.tsx                      — server component, page entry
├── _components/
│   ├── SpeakeasyScene.tsx        — client orchestrator, manages reveal state
│   ├── SpeakeasyHeader.tsx       — tagline + "411" title
│   ├── SpeakeasyDetails.tsx      — expandable description + menu PDF button
│   ├── SpeakeasyBotanicals.tsx   — SVG illustration positioning + drift animations
│   ├── SpeakeasyBackground.tsx   — vignette, radial glow, noise layers
│   └── SpeakeasyReveal.tsx       — staggered fade-in wrapper component
```

### Component Responsibilities

**SpeakeasyScene** — orchestrator. Manages entry reveal sequencing, composes children. Similar role to `StageScene` in the stage feature.

**SpeakeasyBackground** — all atmospheric layers: deep black base, burgundy radial glow, heavy vignette, enhanced noise. Pure CSS/SVG, no heavy assets.

**SpeakeasyBotanicals** — positions illustration SVGs absolutely around content. Applies drift animations and blur glow duplicates. Ships with placeholder slots for Leon's artwork.

**SpeakeasyHeader** — the tagline and "411" title. Pure presentational.

**SpeakeasyDetails** — the expandable panel with description text, and the menu PDF button below it. Handles expand/collapse state internally.

**SpeakeasyReveal** — wraps content groups in Motion components with staggered fade-in on mount. Takes a `delay` prop for sequencing.

### Theme Scoping

Colors scoped via `data-scene="speakeasy"` attribute on the root div. CSS custom properties override locally:

```css
[data-scene="speakeasy"] {
  --background: #0a0604;
  --foreground: #8b2236;
  --accent: #8b2236;
  --muted-foreground: #6b1d2a;
}
```

No global theme pollution. Self-contained.

## Decisions

- Menu is a PDF link button, not an inline menu — matches main site pattern
- No nav bar or footer on the speakeasy page — self-contained experience
- Monochromatic burgundy palette — no cream or brass from main site
- Blue lips detail stays physical-only — not referenced digitally
- Botanical illustrations are custom SVGs by Leon — placeholder slots in code
- Exit is a quiet fade, not a dramatic reverse transition
- Entry uses existing drag-to-enter mechanic (already built)
