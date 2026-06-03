# Overscroll Speakeasy Entry — Design

Date: 2026-06-03

## Goal

Bring back the retired footer-drag entrance to the speakeasy, but rebuild the
**touch** interaction so it is intuitive and bug-free. Desktop keeps its existing
mouse-drag-from-footer behavior.

## Why the old one was buggy on touch

The footer sits at the bottom of the page, so reaching it means scrolling down.
The "swipe up to enter" gesture was therefore the *same* gesture as "scroll down
to read the footer." On top of that, the old touch listeners were registered
`{ passive: true }`, so they could never `preventDefault`. The result on mobile:

- The page never actually followed the finger (the touch path only updated the
  glow CSS variable, never the `translateY`), then teleported on release.
- The pull competed with native scroll + momentum, so commits were unreliable.

## Interaction model

### Touch — overscroll-to-enter

The whole page is a scroll container. Entry keys off the **bottom scroll edge**:

1. **Idle / scrolling** — native scroll runs untouched (passive). No interference.
2. **At bottom** — once `scrollTop + clientHeight >= scrollHeight - 1`, the
   `find it.` line gets a faint breathing glow (the only hint — no chevron).
3. **Commit** — a `touchmove` is intercepted only when ALL hold:
   - the page is at the bottom edge, and
   - the finger is moving **upward** (would overscroll past the end), and
   - movement is vertical-dominant (ignore horizontal swipes), and
   - upward intent exceeds `INTENT_THRESHOLD` (~12px).
   On commit we `preventDefault` for the rest of the gesture → direct
   manipulation. The page `translateY` follows the finger through the
   `applyResistance` power curve (rubber-band). The under-page glow
   (`--speakeasy-progress`) bleeds in proportionally — the reveal teaches the pull.
4. **Release**
   - Past threshold (~40% of `maxDrag`) → page flies up, glow fills, blackout
     iris closes, `router.push('/speakeasy')`.
   - Below threshold → spring snap-back.

iOS specifics:
- `overscroll-behavior-y: contain` on the scroll root neutralizes Safari's native
  rubber-band so it does not fight the gesture.
- We only commit at the true bottom, so Safari bounce never triggers a false
  positive.
- `prefers-reduced-motion`: skip the long fly-up, navigate quickly.

### Desktop — unchanged

Mouse pointer-down on the footer drags the whole page up (lifted verbatim from the
old `useSpeakeasyDrag` pointer path). `pointerType === 'touch'` is ignored by the
pointer handlers; touch is handled entirely by the overscroll path.

## Architecture

```
<div ref={scrollRef} style="overscroll-behavior-y: contain">   ← scroll + CSS var host
  <SpeakeasyGlow />                          ← full-viewport, behind everything
  <motion.div style={{ y: -offsetY }}>       ← the panel that lifts
    <main content (z-10)>
    <footer ref={footerRef} {...pointerHandlers}>   ← desktop grab handle + hint
  </motion.div>
  <BlackoutOverlay active={isTransitioning} />       ← iris on top during commit
</div>
```

### Files

- **`src/hooks/useOverscrollEntry.ts`** (new) — replaces `useSpeakeasyDrag`. Owns
  the touch state machine (idle → at-bottom → committed → transitioning) plus the
  desktop pointer-drag (unchanged). Reuses physics constants, rAF glow writes,
  reduced-motion handling, and safe-timeout cleanup. Returns
  `{ state, scrollRef, footerRef, pointerHandlers }`.
- **`src/app/components/footer/SpeakeasyGlow.tsx`** (restore from git) — full
  viewport glow driven by `--speakeasy-progress`.
- **`src/app/components/footer/BlackoutOverlay.tsx`** (restore from git) — iris
  transition.
- **`src/app/components/footer/Footer.tsx`** — restore grab-handle props
  (`pointerHandlers`, `footerRef`, `isDragging`, `onDragHint`).
- **`src/app/components/footer/FooterContent.tsx`** — restore the `find it.` hint
  with breathing glow (no chevron).
- **`src/app/components/HomePage.tsx`** — wrap page in the `motion.div` panel,
  mount glow + blackout, wire `scrollRef`/`footerRef`/handlers.

### Out of scope

- No commit sound effect (old `heartbeat.ts` stays retired; the merge moved audio
  to the shared AudioContext — a cue can be added later via `audio-unlock`).
- No change to the speakeasy page, the logo→combustion ritual, or reservations.
- No change to desktop drag physics or thresholds.

## Validation

Dev server + responsive checks:
- Mobile (375×812): native scroll works normally; the page lifts only when pulling
  up at the true bottom; glow bleeds in with the pull; commit past threshold enters
  the speakeasy; release below threshold snaps back; horizontal swipes ignored.
- Desktop: mouse-drag from footer still lifts and enters.
- `prefers-reduced-motion`: shortened transition.
