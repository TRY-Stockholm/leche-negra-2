# Lighter Drag-and-Drop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the lighter's click-to-pick-up + dwell-to-ignite interaction with drag-and-drop that ignites the painting on drop.

**Architecture:** Refactor `EasterEggScene.tsx` to use Motion's `drag` prop (matching `CassetteTape.tsx` pattern), proximity detection via `getBoundingClientRect()`, and a snap-to-center + ignite sequence on drop. Remove pointer tracking, holding state, and dwell timer.

**Tech Stack:** Motion (Framer Motion) `drag`, `animate()`, `AnimatePresence`, React refs

---

### Task 1: Strip old interaction system

**Files:**
- Modify: `src/app/components/EasterEggScene.tsx`

**Step 1: Remove dead constants and imports**

Remove these constants (lines 12-15):
```tsx
// DELETE these:
const DWELL_MS = 1000;
const MOVE_THRESHOLD = 8;
```

Remove `useMotionValue` and `useSpring` from the motion/react import (line 7-8). Keep `motion`, `AnimatePresence`. Add `animate` import for later tasks.

Updated import:
```tsx
import {
  motion,
  animate,
  AnimatePresence,
} from "motion/react";
```

**Step 2: Remove old state and refs**

Remove from the component body:
- `const [holding, setHolding] = useState(false);` (line 130)
- `const anchorRef = useRef<{ x: number; y: number } | null>(null);` (line 131)
- `const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);` (line 132)
- `const cursorX = useMotionValue(0);` (line 142)
- `const cursorY = useMotionValue(0);` (line 143)
- `const springX = useSpring(cursorX, SPRING_CONFIG);` (line 144)
- `const springY = useSpring(cursorY, SPRING_CONFIG);` (line 145)
- `const SPRING_CONFIG = { damping: 25, stiffness: 200, mass: 0.5 };` (line 21)

**Step 3: Remove old handlers**

Remove entirely:
- `clearDwell` callback (lines 214-220)
- `handleLighterPickUp` callback (lines 258-267)
- `handlePointerMove` callback (lines 270-316)
- `isOverPainting` callback (lines 242-255)

**Step 4: Remove old rest-position effect**

Remove the `useEffect` that computes resting position and sets `cursorX`/`cursorY` (lines 148-163).

**Step 5: Simplify cleanup effect**

Update the cleanup effect (lines 319-329) to remove references to `clearDwell` and `holding`:
```tsx
useEffect(() => {
  if (!active) {
    setShowVideo(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }
}, [active]);
```

**Step 6: Remove onPointerMove from container**

On the outer `motion.div` (line 351), remove `onPointerMove={ready ? handlePointerMove : undefined}`.

**Step 7: Verify it compiles**

Run: `npx next build 2>&1 | head -30` or `npx tsc --noEmit`
Expected: May have errors from JSX still referencing removed variables — that's fine, we fix those in next task.

**Step 8: Commit**

```
git add -A && git commit -m "refactor: strip old lighter interaction system"
```

---

### Task 2: Add drag-and-drop to the lighter

**Files:**
- Modify: `src/app/components/EasterEggScene.tsx`

**Step 1: Add dragging state and proximity state**

Add new state variables in the component body (replacing the removed ones):
```tsx
const [dragging, setDragging] = useState(false);
const [nearPainting, setNearPainting] = useState(false);
```

**Step 2: Add snap distance constant**

At the top of the file (where the old constants were):
```tsx
/** Euclidean distance threshold for snap-to-painting */
const SNAP_DISTANCE = 120;
```

**Step 3: Add proximity detection helper**

Add a helper function (above the component or inside it as a callback):
```tsx
const getDistance = useCallback(
  (lighterEl: HTMLDivElement) => {
    const paintingEl = paintingRef.current;
    if (!paintingEl) return Infinity;
    const lr = lighterEl.getBoundingClientRect();
    const pr = paintingEl.getBoundingClientRect();
    const lx = lr.left + lr.width / 2;
    const ly = lr.top + lr.height / 2;
    const px = pr.left + pr.width / 2;
    const py = pr.top + pr.height / 2;
    return Math.sqrt((lx - px) ** 2 + (ly - py) ** 2);
  },
  [],
);
```

**Step 4: Add drag handler**

```tsx
const onDrag = useCallback(() => {
  if (!lighterRef.current) return;
  const dist = getDistance(lighterRef.current);
  setNearPainting(dist <= SNAP_DISTANCE);
}, [getDistance]);
```

**Step 5: Add drag start/end handlers**

```tsx
const onDragStart = useCallback(() => {
  setDragging(true);
}, []);

const onDragEnd = useCallback(() => {
  setDragging(false);
  setNearPainting(false);
  if (!lighterRef.current) return;
  const dist = getDistance(lighterRef.current);
  if (dist <= SNAP_DISTANCE) {
    // Snap lighter to painting center, fade out, then ignite
    const pr = paintingRef.current?.getBoundingClientRect();
    const lr = lighterRef.current.getBoundingClientRect();
    if (pr && lighterRef.current) {
      const targetX = pr.left + pr.width / 2 - lr.width / 2;
      const targetY = pr.top + pr.height / 2 - lr.height / 2;
      // Get current position for animation
      const currentX = lr.left;
      const currentY = lr.top;
      const el = lighterRef.current;
      // Animate to center
      el.style.position = 'fixed';
      el.style.left = `${currentX}px`;
      el.style.top = `${currentY}px`;
      el.style.transform = 'none';
      animate(el, {
        left: targetX,
        top: targetY,
        opacity: 0,
      }, {
        duration: 0.3,
        ease: [0.2, 0, 0, 1],
        onComplete: () => {
          ignite();
        },
      });
    }
  }
}, [getDistance, ignite]);
```

**Step 6: Update the lighter JSX**

Replace the lighter `motion.div` and its wrapper. The lighter should now use Motion's `drag` prop and be positioned in the bottom-right via CSS (not motion values):

```tsx
{cursorHtml && !showVideo && (
  <>
    {/* "Grab me" hint near lighter — hidden once dragging */}
    {!dragging && (
      <img
        src="/GrabMe.gif"
        alt=""
        className="fixed pointer-events-none select-none"
        style={{
          width: 70,
          right: REST_INSET + cursorW + 12,
          bottom: REST_INSET + cursorH - 10,
        }}
      />
    )}
    {/* "Torch me" hint on painting — appears while dragging, hides when near */}
    {dragging && !nearPainting && (
      <img
        src="/TorchMe.gif"
        alt=""
        className="absolute pointer-events-none select-none"
        style={{
          width: 70,
          left: paintingRef.current
            ? paintingRef.current.getBoundingClientRect().left - 36
            : 0,
          top: paintingRef.current
            ? paintingRef.current.getBoundingClientRect().top - 36
            : 0,
        }}
      />
    )}
    <motion.div
      ref={lighterRef}
      className={`${scene.cursorClassName} fixed cursor-grab active:cursor-grabbing touch-none`}
      style={{
        width: cursorW,
        height: cursorH,
        right: REST_INSET,
        bottom: REST_INSET,
      }}
      drag
      dragElastic={0.08}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.08, zIndex: 50 }}
      dangerouslySetInnerHTML={{ __html: cursorHtml }}
    />
  </>
)}
```

Note: The old "Torch Me" hint was outside this block and triggered by `holding`. It's now inside and triggered by `dragging && !nearPainting`.

**Step 7: Remove the old standalone TorchMe hint**

Delete the old `{holding && !showVideo && (` block (around lines 426-441 in original) that rendered TorchMe.gif — it's been moved into the lighter block above.

**Step 8: Also remove `cursor-none` from the outer container**

The outer `motion.div` has `className="fixed inset-0 z-50 cursor-none select-none"`. Change `cursor-none` to `cursor-default` since we're no longer hiding the system cursor (the lighter is a draggable element, not a cursor replacement):
```tsx
className="fixed inset-0 z-50 cursor-default select-none"
```

**Step 9: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors)

**Step 10: Commit**

```
git add -A && git commit -m "feat: add drag-and-drop to lighter element"
```

---

### Task 3: Add painting proximity glow

**Files:**
- Modify: `src/app/components/EasterEggScene.tsx`

**Step 1: Add glow element to the painting container**

Inside the painting `div` (the one with `ref={paintingRef}`), after the video element and before the presentation overlays, add:

```tsx
{/* Proximity glow when lighter is near */}
<AnimatePresence>
  {nearPainting && (
    <motion.div
      className="absolute -inset-2 pointer-events-none rounded"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.2, 0.5, 0.2] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, repeat: Infinity }}
      style={{
        boxShadow:
          "inset 0 0 20px rgba(255,107,0,0.6), 0 0 15px rgba(255,68,0,0.4)",
      }}
    />
  )}
</AnimatePresence>
```

Place this **after** the `<video>` and **before** the presentation overlays (`ArtDecoFrame`, `VignetteOverlay`), so it sits between the content and the frame.

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```
git add -A && git commit -m "feat: add painting proximity glow on lighter drag"
```

---

### Task 4: Manual testing and polish

**Step 1: Run dev server**

```
npm run dev
```

**Step 2: Test the full flow**

1. Long-press the NeonLogo to trigger the easter egg
2. Verify lighter appears in bottom-right with "Grab Me" hint
3. Drag the lighter — verify "Grab Me" disappears, "Torch Me" appears near painting
4. Drag lighter near painting — verify orange glow appears, "Torch Me" disappears
5. Drop lighter on painting — verify it animates to center, fades out, video plays
6. Drag lighter away from painting — verify glow disappears
7. Drop lighter far from painting — verify it snaps back to original position
8. Test on mobile viewport (Chrome DevTools device mode) — verify touch drag works
9. Press Escape — verify modal closes

**Step 3: Fix any issues found during testing**

Common things to check:
- Lighter position after drag-end snap-back (Motion resets transform)
- `touch-none` CSS is needed on the lighter to prevent scroll interference
- Video autoplay on mobile may need user gesture — but the drag is already a gesture
- The `animate()` call on drag-end may conflict with Motion's internal drag state — if so, use `useAnimate` hook instead

**Step 4: Final commit**

```
git add -A && git commit -m "feat: lighter drag-and-drop easter egg complete"
```
