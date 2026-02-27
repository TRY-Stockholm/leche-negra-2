# Lighter Drag-and-Drop Easter Egg Design

## Summary

Replace the lighter's click-to-pick-up + dwell-to-ignite interaction with drag-and-drop, matching the cassette tape pattern used elsewhere in the app. The lighter ignites the painting immediately on drop, removing the 1-second hover delay.

## Drag Interaction

The lighter element uses Motion's `drag` prop with the same config as `CassetteTape.tsx`:

- `drag` — free movement in both axes
- `dragElastic={0.08}` — stiff, controlled feel
- `dragMomentum={false}` — stops where released
- `whileDrag={{ scale: 1.08, zIndex: 50 }}` — lifts visually while dragging
- Starting position: bottom-right corner (unchanged)

Removed:
- Click-to-pick-up flow (`holding` state, pointer tracking via `useMotionValue`/`useSpring`, `onPointerMove`)
- Dwell timer logic (`DWELL_MS`, `MOVE_THRESHOLD`, dwell refs)

## Proximity Detection & Visual Feedback

During drag, continuously check lighter center position against painting rect using `getBoundingClientRect()` — same pattern as `handleTapeDrag` in `TapeDeckContext.tsx`.

- Snap distance: ~120px
- When near: painting frame gets a warm pulsing orange/red glow (0.8s loop, `AnimatePresence` for exit)
- Mirrors the tape/deck glow pattern with fire-themed colors

## Drop & Ignition Sequence

When released within snap distance:

1. Spring animation moves lighter to painting center (~300ms, `stiffness: 200, damping: 25`)
2. Lighter fades to opacity 0 over ~300ms
3. `ignite()` fires immediately as spring completes — video starts playing
4. Video fades in (700ms opacity transition), plays burn effect
5. Video ends — `onDismiss()` closes modal

When released outside snap distance: lighter springs back to bottom-right resting position.

## Hints

- "Grab Me" hint: unchanged, disappears on drag start
- "Torch Me" hint: shows on drag start (instead of on pick-up), disappears when lighter enters snap range (glow takes over)

## What Changes

File: `EasterEggScene.tsx`
- Replace pointer tracking with Motion `drag` prop
- Remove `holding` state, `useMotionValue`/`useSpring` for x/y, `onPointerMove`
- Remove dwell timer logic
- Add proximity detection against painting rect
- Add painting frame glow component
- Add drop handler: animate to center, fade out, ignite
- Update hint triggers

## What Stays the Same

- `scenes.ts` — no changes
- Video playback / `ignite()` / `extinguish()` core logic
- Lighter starting position (bottom-right)
- Lighter SVG + fire CSS animations (`theme.css`)
- Preloader, presentation modes
- `NeonLogo.tsx` long-press trigger
- `HomePage.tsx` state management
- All assets (SVGs, GIFs, video)
