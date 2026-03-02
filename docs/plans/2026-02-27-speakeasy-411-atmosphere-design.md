# 411 Speakeasy — Dark Romanticism Atmosphere Design

Addendum to the base 411 design. Three layers: theatrical entrance, living atmosphere, interactive mystery.

## 1. The Entrance — A Descent Into Darkness

### During the drag (homepage side)

- As `--speakeasy-progress` increases, if audio is playing it should low-pass filter and decay — sound swallowed by thickening walls
- Grain overlay intensifies during drag — reality getting grittier

### The blackout (between pages)

- Instead of an instant black overlay, a **slow iris close** — circular vignette contracting from edges to center over ~1.5s, like a camera aperture or consciousness narrowing
- During blackout: a single **low heartbeat pulse** (two thuds, ~0.8s apart). Felt more than heard. The moment of "am I supposed to be here?"

### The arrival (speakeasy page load)

- Total darkness for ~800ms. Nothing renders. Black + grain only.
- A **warm ember glow** fades in at the bottom of the viewport — the crimson radial gradient starting from 0 and breathing up over ~2s, like a single candle being lit
- The 411 logo flickers on like a dying neon tube warming up — aggressive stutter: off-on-off-off-on-ON. Not a smooth fade.
- Content reveals are much slower than current (1.5-2s stagger instead of 0.2s) — eyes adjusting to darkness

## 2. The Living Room — Atmosphere In Motion

### Smoke / haze

- 2-3 translucent smoke wisps drifting horizontally across the viewport, very slowly (30-40s crossing time)
- CSS-only: soft radial gradients with `mix-blend-mode: screen`, using extended `speakeasy-drift` patterns at viewport scale
- Very low opacity (~0.03-0.06) — barely conscious perception, but the space feels *humid*

### Mouse-reactive lighting

- A radial gradient light pool (~300px radius, soft crimson) follows the cursor with heavy easing (lerped, trailing ~200ms). Like holding a candle — wherever you look, faint warm glow. The rest stays in shadow.
- Mobile (no hover): light pool anchors center-bottom and breathes, simulating a candle on the table

### Depth through parallax

- Botanical layer shifts slightly counter to cursor direction (2-3px) — creates sense they're on a different plane, like wallpaper behind glass
- Grain overlay stays fixed (on the "lens"), content moves with page, botanicals float between — three depth planes

### Vignette

- Heavier than current. Corners **nearly black**. Readable area feels like a pool of dim light in the screen's center — claustrophobic, intimate. Looking through a keyhole.

## 3. Interactive Mystery — Rewarding the Curious

### Hidden hover reveals

- Scattered in dark areas outside the main content zone: phrases rendered in `#1a0a0a` on `#0a0604` — invisible until the cursor's light pool illuminates them
- Atmospheric graffiti — whispers in the walls:
  - *"she never left"*
  - *"the third drink is free"*
  - *"ask about the painting"*
- Not functional, purely atmospheric
- Mobile: one phrase randomly fades in and out every ~15s (no hover available)

### Botanical flinch

- When cursor passes near a botanical illustration, it subtly recoils — 2-3px shift away from cursor, like a living thing flinching from light
- Returns slowly when cursor moves away
- Makes the decorations feel alive

### Time-gated patience reward

- After 60+ seconds on the page, a new line fades in below the tagline: *"you're still here. good."*
- Very slow fade (3s). Only appears once per session.

### Typewriter description

- When "about the room" is expanded, text types out character by character at uneven pace — like someone whispering in the dark
- Pauses at commas and em dashes
- Crimson blinking cursor

### Smoldering cocktail button

- On hover, a faint smoke tendril curls up from button edges — CSS pseudo-element animation
- Like the button itself is smoldering

## Technical Notes

- All mouse-reactive effects use `requestAnimationFrame` with lerped values — no jank
- All effects gated behind `useCanHover()` / `prefers-reduced-motion` — graceful mobile and accessibility fallbacks
- Heartbeat audio is a tiny inline base64 clip or Web Audio API oscillator — no external asset loading
- Smoke wisps are pure CSS (no canvas, no WebGL) — gradient elements with keyframe animations
- Hidden text elements use `aria-hidden="true"` — decorative only, not confusing for screen readers
- Time-gated content uses `setTimeout` with session flag in `useState` — no persistence needed

## Decisions

- Iris close over instant blackout — more theatrical, worth the extra 1s
- Heartbeat is two thuds not continuous — restraint over cheese
- Hidden text is non-functional atmospheric — no gameplay, no unlockables, just vibes
- Typewriter effect on description only, not everywhere — one moment of slowness, not annoying
- Smoke is CSS-only — no canvas/WebGL complexity for subtle background effect
- Mobile gets breathing candle + random whisper reveals — different but still atmospheric
