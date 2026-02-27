# Stage Scene Design

## Overview

An interactive audio-reactive stage scene at `/stage` where users toggle 6 instrumental stems to progressively reveal musicians and atmospheric visual layers. Ported from the original leche-negra project with adjustments to visuals, mobile interaction, and entry flow.

## Route & Entry

- Lives at `/stage` as its own page route, keeping heavy assets off the homepage
- Entry via a dedicated trigger on the homepage (link/button — placement TBD)
- Navigation to `/stage` begins the scene experience

## Initialization Flow

1. **Preloader** — Dark screen, "Be creative" in italic display font. Assets load in background (SVG, Tone.js, audio buffers). Minimum 2s display.
2. **Audio unlock** — Preloader text transitions to "Tap to begin". User tap fires `Tone.start()`, all stems begin playing (muted via gain=0).
3. **Scene reveal** — Stage fades in over ~1.5s. Dark idle state: musicians hidden, no glows, vignette closed. Grain overlay + idle vignette breathing are the only movement. Toolbar visible at bottom with 6 unlit stem indicators.
4. **Playing** — User toggles stems via toolbar (mobile + desktop) or hotspots (desktop). Progressive visual reveal.
5. **Exit** — Escape key or close/back button returns to homepage.

## Assets

### SVG

- `lecheFINAL.svg` (279KB, viewBox 0 0 1957.16 1080.1) — main stage illustration
- Contains musician groups: Drummer, Saxguy, Violinist, Trumpet, Upright
- Background group always visible; musician groups toggle with stem state

### Audio

- 6 stems of "Playful Waltz" at 110 BPM, 8-bar loop (~17.45s)
- **Compressed to AAC (.m4a)** — ~2-3MB each, ~15MB total (down from 138MB WAV)
- Stem mapping:
  - stem-01: Strings/Pad
  - stem-02: Drums
  - stem-03: Saxophone
  - stem-04: Violin
  - stem-05: Trumpet
  - stem-06: Bass

## File Structure

```
src/app/stage/
├── page.tsx                    # Server component — minimal shell
├── _components/
│   ├── StageScene.tsx          # Main client component — state + audio loop
│   ├── AudioEngine.ts          # Tone.js wrapper (lazy-loaded)
│   ├── stage-config.ts         # Stem definitions, thresholds, colors
│   ├── SceneBackground.tsx     # Main SVG + musician visibility + parallax/drag
│   ├── GlowLayer.tsx           # 6 instrument glow zones (audio-reactive)
│   ├── HazeLayer.tsx           # Atmospheric haze blobs
│   ├── GodRayLayer.tsx         # Desktop-only light rays (4+ stems)
│   ├── BokehLayer.tsx          # Floating bokeh circles
│   ├── ParticleCanvas.tsx      # Canvas dust motes (5+ stems)
│   ├── SceneHotspots.tsx       # Desktop clickable zones over musicians
│   ├── InstrumentToolbar.tsx   # Bottom toolbar with stem toggles
│   └── VolumeControl.tsx       # Master volume + reset
```

## Visual Layers (bottom to top)

| # | Layer | Trigger | Behavior |
|---|-------|---------|----------|
| 1 | SceneBackground | Per-stem toggle | Musicians fade in/out. Background always visible. |
| 2 | GlowLayer | Per-stem + audio level | 6 radial gradients at musician positions. Opacity: `0.45 + audioLevel * 0.55`. Only visible when stem is active. |
| 3 | HazeLayer | 2+ stems | 4 haze blobs with slow CSS drift (35-60s cycles). Opacity scales with stem count. |
| 4 | GodRayLayer | 4+ stems, desktop only | 4 ceiling rays with sway animation (8-14s). Skipped on mobile. |
| 5 | BokehLayer | 3+ stems | Floating circles (15-25s drift). Desktop: 7, Mobile: 3. |
| 6 | ParticleCanvas | 5+ stems | 2D canvas dust motes. Audio-reactive speed/brightness. Desktop: 150 particles. Mobile: 80 at 0.33x resolution. |
| 7 | Vignette | Always | Radial gradient. Idle: breathing animation (6s). More stems = vignette opens up. |
| 8 | Grain | Always | SVG fractal noise. Same as current site. Desktop: 6%, Mobile: 2%. |

### Color temperature shift

Applied via CSS `filter` on the main wrapper, interpolated by active stem count:

- 0 stems: cold, desaturated (dark idle state)
- 6 stems: warm gold, fully saturated

Colors use the current site's CSS custom properties — `var(--background)`, `var(--foreground)`, `var(--accent)` (brass/gold).

## Audio Engine

Tone.js-based, lazy-loaded via dynamic `import("tone")`.

- Per-stem gain nodes — toggle ramps 0↔1 over 0.2s
- Master gain — user-controllable, default 0.8
- Analyser — FFT 256, smoothing 0.85, feeds `getLevel()` returning amplified RMS (0-1)
- All stems start on unlock (synced), muted — toggling only changes gain
- `requestAnimationFrame` loop reads `getLevel()`, sets `--audio-level` CSS custom property on the scene wrapper — no React re-renders

## Audio Reactivity

All visual layers read `--audio-level` (0-1) from CSS custom property at 60fps.

No React state is involved in the audio→visual pipeline. The rAF loop calls `engineRef.current.getLevel()` and writes directly to the DOM via `stageRef.current.style.setProperty('--audio-level', level)`.

## Interaction

### Desktop

- Full SVG fits viewport, no scrolling
- Subtle mouse parallax (cursor tracking with spring physics)
- Clickable hotspots over musician positions for toggling stems
- Toolbar at bottom also available
- Hotspots show tooltip on hover with instrument name

### Mobile

- SVG wider than viewport — horizontal drag to explore
- Touch drag with momentum/inertia, constrained to SVG bounds
- **Tap-to-pan**: tapping a stem in the toolbar:
  1. Toggles the stem (musician fades in/out, audio activates)
  2. Smoothly pans viewport to center that musician (~400ms ease-out)
- Tapping an already-active stem toggles it off but does NOT pan
- After any pan, user can still freely drag

### Toolbar (both platforms)

- Fixed at bottom of screen
- 6 circular indicators, one per stem
- Inactive: dim outline in stem's color
- Active: filled with color + subtle pulse animation

### Volume Control

- Master volume slider
- Reset/mute-all button

## Theming

Uses the current site's design language:

- Colors from CSS custom properties (--background, --foreground, --accent)
- Same SVG fractal noise overlay used across the site
- Display font (Playfair Display) for preloader text
- No new color palette — everything derives from existing theme

## Progressive Reveal Thresholds

| Active Stems | Layers Visible |
|-------------|----------------|
| 0 | Vignette (breathing), grain |
| 1 | + That musician, its glow |
| 2 | + Haze layer |
| 3 | + Bokeh circles |
| 4 | + God rays (desktop) |
| 5 | + Particle canvas |
| 6 | Full warmth, all layers active |

## Key Differences from Original

1. **No spotlights or lamps** — removed for a leaner visual stack
2. **Compressed audio** — AAC (.m4a) instead of WAV, ~15MB vs ~138MB
3. **Mobile pan-to-musician** — tapping a stem pans the viewport to that musician
4. **Scene entry** — preloader with "Be creative" text, not a button-based entry
5. **Site theming** — uses leche-negra-2's CSS custom properties and noise overlay
6. **Spotlight alignment** — glow zones positioned to match actual musician locations in SVG (fixing original misalignment)
7. **Own route** — `/stage` instead of embedded in homepage, for performance isolation
