# Mobile Experience Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish the mobile homepage so it feels like an intentional mobile experience — fix menu button layout, reorganize the tape deck zone, add touch discoverability wobble, and add tap feedback.

**Architecture:** All changes are CSS/layout and Motion animation props scoped below the `md` breakpoint (< 768px). Desktop is completely unchanged. Four independent tasks that can be committed separately.

**Tech Stack:** React 19, Tailwind CSS 4, Motion (Framer Motion), existing `useCanHover` hook.

---

### Task 1: Reformat Menu Buttons for Mobile

**Files:**
- Modify: `src/app/components/HomePage.tsx:117-172`

**Step 1: Change mobile grid to single column with inline time**

In `HomePage.tsx`, replace the menu buttons container and button markup (lines 119-171) with a layout that uses `grid-cols-1` on mobile and keeps `md:flex` for desktop. Each button becomes a row with name left, time right.

Replace lines 119-171:
```tsx
<div className="grid grid-cols-1 gap-y-4 md:flex md:gap-y-6 md:gap-x-3 lg:gap-12">
  {[
    {
      key: "breakfast" as MenuKey,
      time: "07:00 – 11:00",
      label: "Breakfast",
      desktopSize: "text-[clamp(2.5rem,5vw,5.5rem)]",
    },
    {
      key: "lunch" as MenuKey,
      time: "11:30 – 14:30",
      label: "Lunch",
      desktopSize: "text-[clamp(2.5rem,6vw,5.5rem)]",
    },
    {
      key: "dinner" as MenuKey,
      time: "17:00 – 22:00",
      label: "Dinner",
      desktopSize: "text-[clamp(2.5rem,5vw,5.5rem)]",
    },
    {
      key: "drinks" as MenuKey,
      time: "All Day",
      label: "Drinks",
      desktopSize: "text-[clamp(2.5rem,5vw,5.5rem)]",
    },
  ].map((item) => {
    const active = openMenu === item.key;
    return (
      <motion.button
        key={item.key}
        className="cursor-pointer text-left capitalize"
        onClick={() => handleMenuClick(item.key)}
        whileTap={{ scale: 0.97 }}
        style={{
          textShadow: active
            ? "0 0 8px var(--accent), 0 0 20px var(--accent), 0 0 60px var(--accent)"
            : "none",
          transition: "text-shadow 0.5s ease",
        }}
      >
        {/* Mobile: inline row (name left, time right) */}
        <div className="flex items-baseline justify-between md:hidden">
          <span
            className={`font-display text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[0.95] italic`}
          >
            {item.label}
          </span>
          <span
            className={`font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase ${item.key === "drinks" ? "text-accent" : "text-muted-foreground"}`}
          >
            {item.time}
          </span>
        </div>
        {/* Desktop: stacked (time above name) — unchanged */}
        <div className="hidden md:block">
          <span
            className={`block mb-2 font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase ${item.key === "drinks" ? "text-accent" : "text-muted-foreground"}`}
          >
            {item.time}
          </span>
          <span
            className={`font-display ${item.desktopSize} font-medium leading-[0.95] italic`}
          >
            {item.label}
          </span>
        </div>
      </motion.button>
    );
  })}
</div>
```

Note: This changes `<button>` to `<motion.button>` — add `motion` to the imports from `motion/react` at the top of the file.

**Step 2: Add motion import**

At the top of `HomePage.tsx`, add:
```tsx
import { motion } from "motion/react";
```

**Step 3: Verify visually**

Run: `npm run dev`
- On mobile viewport (375px): menu buttons should be single-column rows with name left, time right, ~1.75rem italic display font.
- On desktop viewport (1024px+): menu buttons should look identical to before (horizontal flex, large type, time stacked above).

**Step 4: Commit**

```bash
git add src/app/components/HomePage.tsx
git commit -m "feat(mobile): reformat menu buttons as single-column list"
```

---

### Task 2: Reorganize Tape Deck Zone for Mobile

**Files:**
- Modify: `src/app/components/HomePage.tsx:182-207`

**Step 1: Restructure tape layout as 2x2 cluster below player on mobile**

Replace the cassette player container (line 183-185) and all four CassetteTape placements (lines 188-207) with a single tape deck zone that arranges as a compact column (player + 2x2 grid) on mobile and keeps the current scattered layout on desktop.

Replace lines 182-207:
```tsx
{/* Cassette player — right side on desktop, centered on mobile */}
<div className="col-span-12 row-start-2 flex flex-col items-center py-4 overflow-visible md:col-start-7 md:col-span-5 md:row-start-1 md:row-span-3 md:self-center md:py-0">
  <CassettePlayer />
  {/* Mobile: 2x2 tape grid below player */}
  <div className="grid grid-cols-2 gap-3 mt-4 md:hidden">
    <CassetteTape id="morning" style={{ rotate: "-5deg" }} />
    <CassetteTape id="midday" style={{ rotate: "3deg" }} />
    <CassetteTape id="evening" style={{ rotate: "7deg" }} />
    <CassetteTape id="night" style={{ rotate: "-3deg" }} />
  </div>
</div>

{/* Desktop: Cassette tapes — scattered (hidden on mobile, shown via grid placement on md+) */}
<CassetteTape
  id="morning"
  className="hidden md:block md:col-start-7 md:col-span-2 md:row-start-2 md:self-start md:mt-8"
  style={{ rotate: "-5deg" }}
/>
<CassetteTape
  id="midday"
  className="hidden md:block md:col-start-11 md:col-span-2 md:row-start-1 md:self-center"
  style={{ rotate: "3deg" }}
/>
<CassetteTape
  id="evening"
  className="hidden md:block md:col-start-9 md:col-span-2 md:row-start-2 md:self-start md:mt-12"
  style={{ rotate: "7deg" }}
/>
<CassetteTape
  id="night"
  className="hidden md:block md:col-start-11 md:col-span-2 md:row-start-2 md:self-start md:mt-4"
  style={{ rotate: "-3deg" }}
/>
```

Note: This renders tapes twice (mobile grid + desktop scattered), but `hidden`/`md:block` ensures only one set renders visually. The TapeDeck context handles tape state by `id`, so both instances share state. Since a loaded tape returns `null` from `CassetteTape`, there's no duplication issue.

**Step 2: Adjust logo padding**

On line 103, change `pt-8` to `pt-6` for mobile:
```tsx
<div className="col-span-12 row-start-1 self-start pt-6 md:col-span-5 md:pt-16">
```

**Step 3: Update menu section row**

On line 118, change `row-start-4` to `row-start-3` since tapes are now inside the player zone (row 2) instead of their own row:
```tsx
<div className="col-span-12 self-end row-start-3 pb-4 lg:pb-8">
```

Wait — the menu section was already `row-start-4` and tapes were in `row-start-2`, player in `row-start-3`. With tapes now inside the player div in `row-start-2`, the menu section should move to `row-start-3`:
```tsx
<div className="col-span-12 self-end row-start-3 pb-4 md:row-start-4 lg:pb-8">
```

Use `md:row-start-4` to preserve desktop layout where the scattered tapes still occupy their own rows.

**Step 4: Verify visually**

Run: `npm run dev`
- On mobile (375px): Player centered with 2x2 tape grid directly below. Compact, cohesive zone. Logo slightly closer to top.
- On desktop (1024px+): Tapes scattered in their original grid positions, player on the right. Identical to before.

**Step 5: Commit**

```bash
git add src/app/components/HomePage.tsx
git commit -m "feat(mobile): reorganize tape deck as compact 2x2 cluster"
```

---

### Task 3: Add Wobble Animation for Touch Discoverability

**Files:**
- Modify: `src/app/components/tape-deck/CassetteTape.tsx:76-104`

**Step 1: Add wobble animation to CassetteTape on touch devices**

In `CassetteTape.tsx`, add a wobble animation that plays once on mount for touch devices. Modify the `motion.div` (line 78-103) to include an `animate` prop that runs a subtle rotation sequence on mount.

Add wobble config inside the component, before the `if (isLoaded)` check (after line 62):

```tsx
// Wobble on mount for touch devices — hints tapes are interactive
const wobbleRotation = useMemo(() => {
  const rotations: Record<string, number[]> = {
    morning: [0, -3, 2.5, -1.5, 0],
    midday: [0, 2.5, -3, 1.5, 0],
    evening: [0, -2, 3, -2, 0],
    night: [0, 3, -2.5, 1, 0],
  }
  return rotations[id] ?? [0, -3, 2, 0]
}, [id])

const wobbleDelay = useMemo(() => {
  const delays: Record<string, number> = {
    morning: 1.0,
    midday: 1.15,
    evening: 1.3,
    night: 1.45,
  }
  return delays[id] ?? 1.0
}, [id])
```

Then on the `motion.div` (line 78), add wobble animation for touch devices:

```tsx
<motion.div
  ref={elRef}
  drag
  dragElastic={0.08}
  dragMomentum={false}
  onDrag={onDrag}
  onDragEnd={onDragEnd}
  whileDrag={{ scale: 1.08, zIndex: 50 }}
  whileHover={canHover ? { scale: 1.04 } : undefined}
  whileTap={{ scale: 1.06 }}
  {...(!canHover ? {
    animate: { rotate: wobbleRotation },
    transition: {
      rotate: {
        duration: 0.6,
        ease: "easeInOut",
        delay: wobbleDelay,
      },
    },
  } : {})}
  className="cursor-grab active:cursor-grabbing touch-none relative w-fit"
  style={{ zIndex: 12 }}
>
```

Note: `whileTap={{ scale: 1.06 }}` is also added here (Task 4 touch feedback), since we're already modifying this element.

**Step 2: Add useMemo import**

At the top of `CassetteTape.tsx` (line 1), ensure `useMemo` is imported (it already is from the existing `useMemo` on line 29 area — check if it's in the import list on line 1). Looking at line 1: `import { useCallback, useRef, useState, useEffect, memo, useMemo } from 'react'` — `useMemo` is already imported.

**Step 3: Verify visually**

Run: `npm run dev`
- Use Chrome DevTools to toggle device toolbar (mobile mode).
- On page load, tapes should sit still for ~1 second, then each wobble slightly in sequence (staggered 150ms apart). The wobble is subtle (2-3 degrees) and plays once.
- On desktop (hover device): no wobble animation.

**Step 4: Commit**

```bash
git add src/app/components/tape-deck/CassetteTape.tsx
git commit -m "feat(mobile): add wobble animation for tape discoverability on touch"
```

---

### Task 4: Verify & Polish

This task is for visual verification and any small tweaks discovered during testing.

**Step 1: Full mobile walkthrough**

Run: `npm run dev`

Check on a real phone or Chrome DevTools mobile simulation (375px, 390px, 414px widths):

1. Logo visible at top with slight padding
2. Tape deck zone: player centered, 2x2 tape grid below with rotations
3. Tapes wobble after ~1s delay (touch mode only)
4. Tapping a tape gives scale feedback before dragging
5. Dragging a tape to the player still works (snap detection)
6. Menu buttons: single column, name left, time right
7. Tapping a menu button: brief scale-down pulse + glow
8. Menu panel opens/closes correctly
9. Scroll to see full menu list if needed
10. Footer still looks correct

**Step 2: Desktop regression check**

Check on desktop viewport (1024px+):
1. Menu buttons: horizontal flex with large stacked type (unchanged)
2. Tapes: scattered in grid positions (unchanged)
3. Player: right side, vertically centered (unchanged)
4. No wobble animation on desktop
5. Hover effects still work on tapes and buttons

**Step 3: Fix any issues found**

Address any spacing, sizing, or interaction issues discovered during testing.

**Step 4: Commit any fixes**

```bash
git add -u
git commit -m "fix(mobile): polish spacing and layout tweaks"
```
