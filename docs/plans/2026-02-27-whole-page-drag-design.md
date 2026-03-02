# Whole-Page Speakeasy Drag — Design

## Concept

Refactor the speakeasy entrance so the **entire page lifts as one panel** when dragged from the footer, revealing a full-viewport warm glow underneath. The page is a heavy slab sitting on top of a hidden room — grab the bottom edge and heave it up.

## What Changes

The current implementation moves only the footer. This refactor makes the footer + main content move together as a single rigid panel. The drag physics, threshold, and transition sequence stay the same. The glow layer expands from footer-height to full-viewport.

## Interaction Flow

### 1. Resting State

The page sits flat. Behind it, a full-viewport glow layer is always mounted but invisible — the page covers it completely. No visual hint of the glow unless you drag.

### 2. The Nudge Hint

Hover (desktop) or tap (mobile) on "go deeper" text. The entire page nudges up ~6px and springs back — signaling the page is loose and can be moved.

### 3. The Drag

Pointer down on the footer area initiates the drag. The entire page (main content + footer) translates upward together. Heavy resistance — power curve exponent before threshold, lighter after.

As the page lifts, the bottom edge reveals the glow layer underneath. The glow intensifies with drag progress via the `--speakeasy-progress` CSS custom property.

### 4. The Threshold & Transition

~40% of max drag distance. Past threshold, resistance drops (latch releasing).

On release past threshold:
1. Whole page flies upward off viewport — spring-snappy curve: `cubic-bezier(0.16, 1, 0.3, 1)` over ~400ms
2. Glow fills screen briefly (~300ms)
3. Blackout fades in — `cubic-bezier(0.22, 1, 0.36, 1)` over 300ms with 200ms delay
4. Navigate to `/speakeasy`

On release below threshold:
- Rubber-band snap back — spring-smooth: `cubic-bezier(0.22, 1, 0.36, 1)` over ~350ms

## Animation Curves

Following Emil Kowalski's principles: ease-out as default, custom cubic-bezier for personality, springs for physical motion.

| Animation | Curve | Duration |
|-----------|-------|----------|
| Nudge hint (up) | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring-bounce) | 200ms |
| Nudge hint (settle back) | `cubic-bezier(0.22, 1, 0.36, 1)` (spring-smooth) | 300ms |
| Snap-back (below threshold) | `type: "spring", stiffness: 200, damping: 25` | ~350ms |
| Fly-up (past threshold) | `type: "spring", stiffness: 300, damping: 30` | ~400ms |
| Blackout fade-in | `cubic-bezier(0.22, 1, 0.36, 1)` | 300ms, 200ms delay |
| Glow intensity during drag | Driven by CSS custom property, no transition (direct) | Realtime |

## Implementation Changes

### Files Modified

- **`HomePage.tsx`** — Wrap the outer page div in a `motion.div` that receives the drag `y` offset. This is the "panel" that lifts. Attach `containerRef` here for CSS custom property updates.
- **`Footer.tsx`** — Simplify back to a regular `footer`. Remove `motion.footer`, remove direct drag state. Instead, accept pointer handler props from the parent and spread them onto the footer. The footer is just the grab-handle, not the moving element.
- **`FooterContent.tsx`** — No changes needed. Already has the right trigger behavior.
- **`SpeakeasyGlow.tsx`** — Change from `bottom: 0` / `height: 500px` to `inset: 0` / full viewport. Reposition the radial gradient to center near the bottom of the screen.
- **`useSpeakeasyDrag.ts`** — No physics changes. The hook returns the same state. The only difference is that the consumer applies `y` to the page wrapper instead of the footer.
- **`BlackoutOverlay.tsx`** — No changes needed.

### Architecture

```
<div ref={containerRef}>                    ← CSS custom property host
  <SpeakeasyGlow />                         ← full-viewport, behind everything
  <motion.div style={{ y: -offsetY }}>      ← the "panel" that moves
    <main content (z-10)>
      <NavBar />
      <grid with logo, menus, cassettes />
    </main content>
    <footer onPointerDown/Move/Up/Cancel>   ← grab handle, doesn't move independently
      <FooterContent />
    </footer>
  </motion.div>
  <BlackoutOverlay />                       ← on top during transition
</div>
```

### Out of Scope

- No changes to drag physics or threshold values
- No changes to the speakeasy page itself
- No sound effects
- No new dependencies
