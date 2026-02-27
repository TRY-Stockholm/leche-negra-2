# Mobile Experience Redesign — Refined Grid

## Summary

Polish the mobile experience so it feels intentional rather than a compressed desktop. Keep the same structure and mental model but fix proportions, improve discoverability of interactive elements, and add touch-native feedback.

All changes apply below the `md` breakpoint (< 768px). Desktop is unchanged.

## 1. Menu Buttons

**Problem**: 2x2 grid with oversized display type feels cramped on mobile.

**Solution**: Single-column stack on mobile. Each button is a row with menu name (left) and time (right) on the same line. Typography scaled to `clamp(1.75rem,4vw,2.5rem)` — still display font, italic, but proportioned for mobile.

```
Breakfast                07:00 – 11:00
Lunch                    11:30 – 14:30
Dinner                   17:00 – 22:00
Drinks                        All Day
```

Above `md`: no change (horizontal flex with large type).

## 2. Tape Deck Zone

**Problem**: Tapes are spread as a flat horizontal strip in row 2 (`col-span-3` each), visually disconnected from the player in row 3. Cramped and no indication they're draggable.

**Solution**: Combine player and tapes into one zone. Player stays centered. Tapes rearranged as a 2x2 cluster below/around the player rather than a single row. Each tape keeps its rotation (`-5deg`, `3deg`, `7deg`, `-3deg`) for the organic scattered feel.

**Wobble animation** (touch devices only): On mount, after ~1s delay, tapes play a subtle 2-3 degree oscillation that runs once or twice then settles. Each tape staggered by 100-150ms so they don't move in unison. Implemented via Motion `animate` with a short keyframe sequence.

## 3. Spacing & Proportions

**Problem**: Uneven vertical rhythm — tape row has excessive padding while menu area is tight.

**Changes** (mobile only):
- Logo: `pt-6` (from `pt-8`)
- Tape deck zone: reduce `pb-8` on tapes — the 2x2 cluster is more vertically compact
- Menu section: `pb-4` stays as-is
- Goal: on a 375-390px phone, logo + tape deck + first 2-3 menu items visible without scrolling

## 4. Touch Feedback & Polish

- **Tape tap feedback**: `whileTap={{ scale: 1.06 }}` on tapes — immediate response when touching before drag
- **Menu button tap feedback**: `whileTap={{ scale: 0.97 }}` — brief press-in on tap, complementing the existing text-shadow glow
- **Wobble stagger**: each tape delayed 100-150ms apart for organic feel

## Out of Scope

- Easter egg scene (long-press already works on touch)
- Footer layout (already responsive)
- Navbar/hamburger menu (works well)
- Custom cursor (already disabled on touch devices)
- Desktop layout (unchanged)
