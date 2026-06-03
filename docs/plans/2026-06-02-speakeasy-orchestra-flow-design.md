# Design — Experiment flow & landing reservations

Date: 2026-06-02

## Goal

Restructure the site's two hidden "experiments" into a nested discovery, and make
the landing reservations call-to-action always visible and actionable.

- **First experiment** (hold the logo): play the floral-combustion video ritual,
  then deliver the user into the speakeasy (Noctuaires).
- **Second experiment** (the orchestra, `/stage`): reachable via a button inside
  the speakeasy.
- **Landing reservations**: always show "Reservations now open"; replace the
  past opening-date line ("Tuesday, April 21") with a "Book a table" action that
  opens the existing WaiterAid booking widget. Great on mobile and desktop.

Constraint: keep the existing vibe and feeling throughout.

## Current state

- Holding the logo (`NeonLogo` long-press) calls `handleLongPressComplete`, which
  cycles `pickNextEgg` over `[floral-combustion scene, /stage]`. First press shows
  the `EasterEggScene` video; second press routes to `/stage`.
- `EasterEggScene` ritual: preloader → drag the Zippo lighter onto the painting →
  ignite → video plays → on `ended` it calls `onDismiss` (back to landing).
- The speakeasy (`/speakeasy`, Noctuaires) is reached only by dragging the footer
  ("there's a room downstairs / find it"). Its `NoctuairesHero` action row has
  "request membership" and "see cocktails →".
- `/stage` ("The Stage") is the orchestra / soundscape experiment.
- Booking is a WaiterAid widget: a button with `class="waiteraid-widget"` and
  `data-hash={BOOKING_WIDGET_HASH}` (used by the navbar). The widget script is
  loaded globally in `layout.tsx`.
- `OpeningCountdown` shows a countdown until `OPENING_DATE` (2026-04-21, now past),
  then "Reservations now open" + a localized date line.

## Changes

### 1. Logo → floral-combustion → speakeasy
- `scenes.ts`: remove the now-unused `EASTER_EGGS`, `pickNextEgg`, and `EasterEgg`
  type. Keep `SCENES`, `SceneConfig`, `Presentation`.
- `HomePage.tsx`: `handleLongPressComplete` always opens `SCENES[0]` (floral
  combustion). Remove `eggIndexRef` and the stage branch. Pass an `onComplete`
  that does `router.push("/speakeasy")` to `EasterEggScene`.
- `EasterEggScene.tsx`: add optional `onComplete?: () => void`. The video `ended`
  handler calls `onComplete` if provided, otherwise `onDismiss`. ESC keeps calling
  `onDismiss` (escape hatch back to the landing).
- Hand-off is seamless: scene background `#460b08` == speakeasy preloader color.

### 2. Orchestra button in the speakeasy
- `NoctuairesHero.tsx`: add a "the orchestra →" link in the action row, styled like
  "see cocktails →" (uppercase, `tracking-[0.06em]`, `text-muted-foreground`,
  hover opacity). Navigates to `/stage`. Let the row `flex-wrap` so the three
  links sit cleanly on mobile.

### 3. Landing reservations — always open + Book a table
- `OpeningCountdown.tsx`: retire the countdown. Always render "Reservations now
  open" (keep the neon glow). Replace the date line with a "Book a table" CTA —
  a `waiteraid-widget` button carrying `data-hash={BOOKING_WIDGET_HASH}`, styled
  in the `font-display italic` accent vibe with an arrow and hover. Remove the
  unused `useCountdown` hook and `OPENING_DATE` import. Ensure bottom spacing so
  it is never clipped on mobile or desktop.

## Left as-is
- Footer drag-to-speakeasy ("there's a room downstairs / find it") stays as a
  second, on-brand entry point.
- The "Opening for reservations" eyebrow stays as a small label above the headline.

## Validation
- Preview at mobile (375×812) and desktop:
  - Landing: "Reservations now open" + "Book a table" always visible, unclipped.
  - Hold logo → lighter ritual → video → lands in speakeasy.
  - Speakeasy: "the orchestra →" present and routes to `/stage`.
  - Confirm vibe preserved; desktop disc/gramophone layout unchanged.
