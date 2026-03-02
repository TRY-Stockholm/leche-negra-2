# Hidden Speakeasy Entrance — Design

## Concept

Leche Negra has a real speakeasy behind a hidden door. The website mirrors this: the `/speakeasy` page is only accessible by physically dragging up the footer to reveal what's underneath. No visible links, no navigation — you have to discover it.

## Interaction Flow

### 1. The Trigger

The existing footer text — *"not everything is on the menu."* **"go deeper."** — stays as the hint. The tentacle animation is removed entirely and replaced with the drag-to-reveal mechanic.

**Desktop:** Hovering the text subtly shifts the footer up by a few pixels (like it's loose, not bolted down), signaling it can be moved. The cursor changes to a grab cursor. Click-and-drag upward initiates the pull.

**Mobile:** Tapping the text triggers the same subtle lift — a small bounce that says "pull me." Then a swipe-up gesture on the footer area initiates the pull.

### 2. The Drag

The footer is draggable upward with heavy resistance — spring physics with high damping and low stiffness. It should feel like dragging a stone panel. The drag is capped at ~60% of the footer height.

As the footer lifts, a gap appears between the page content and the footer, revealing what's underneath: a dark void with a warm, dim amber/candlelight glow emanating from the center. Subtle noise texture overlay for atmosphere. This layer sits behind the footer at all times but is only visible when the footer lifts.

### 3. The Threshold

A visual threshold exists at ~40% of the drag distance. As the user approaches it:

- The glow underneath intensifies slightly
- The resistance decreases, like a latch releasing

**Below threshold (release):** The footer snaps back down with a spring animation (rubber band feel). The glow fades. Nothing happens.

**Past threshold (release or continued drag):**

1. The footer accelerates upward off the top of the viewport with momentum (spring with high stiffness, no bounce)
2. The warm glow briefly fills the screen (~300ms)
3. A quick fade to black (~200ms)
4. Navigation to `/speakeasy` fires during the blackout
5. The speakeasy page loads with its own entrance animation

### 4. The Hidden Layer

A fixed div that lives behind the footer at all times:

- `position: fixed`, `bottom: 0`, full width, same height as footer
- Background: very dark (#0a0604 or similar)
- Radial gradient glow in the center — warm amber/candlelight color, soft edges
- CSS noise texture overlay at low opacity
- z-index between the page content and the footer
- Zero performance cost when not visible — just CSS, no JS until drag starts

## Implementation

### Components Modified

- **Footer.tsx** — Replace tentacle state with drag state. Add the hidden glow layer behind the footer. Wire up the drag mechanic.
- **FooterContent.tsx** — Update trigger text handlers. Remove `onTentacleHover` prop, replace with drag initiation.
- **Tentacle.tsx** — Delete entirely.

### New Files

- **SpeakeasyGlow.tsx** — The hidden layer component (dark background + radial glow + noise). Mostly CSS.
- **useSpeakeasyDrag.ts** — Custom hook encapsulating drag logic: pointer tracking, spring physics with resistance, threshold detection, and navigation trigger.
- **/app/speakeasy/page.tsx** — The speakeasy page (placeholder for now, just needs to exist for navigation).

### Tech Choices

- **Motion library** (already in project) for spring physics and exit animation
- **useRouter** from Next.js for programmatic navigation during blackout
- **Pointer events** (not touch/mouse separately) for unified desktop + mobile handling
- **CSS custom properties** for glow intensity, animated with drag progress without re-renders

### Out of Scope

- No preloading of speakeasy page content during drag
- No sound effects (can add later)
- No analytics tracking of the interaction
- No fallback link — the hidden entrance is the only way in
