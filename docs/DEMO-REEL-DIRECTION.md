# Leche Negra — Demo Reel Direction

> *"there's a room downstairs. find it."*

---

## What This Is

Leche Negra is a restaurant in Stockholm. The website is not a restaurant website. It's a place — a digital speakeasy with time-shifting moods, draggable cassette tapes, hidden rooms, interactive music, and poetic weather. Every pixel breathes. Every interaction whispers something back.

This document is a shot-by-shot direction guide for a demo reel that captures the soul of the experience.

---

## The Vibe

**Think:** Wong Kar-wai meets a Stockholm jazz bar at 2AM. Warm amber light through smoke. The bartender already knows your name. Neon hums. Vinyl crackles. Time slows down.

**Color language:** Deep ink blacks (#0f0a08), warm cream (#f0ebe3), brass gold (#c9a96e), and a single red (#e43122) that pulses like a heartbeat.

**Typography:** Playfair Display italic for headlines — elegant, unhurried. General Sans for body — clean, modern, doesn't try too hard.

**Motion philosophy:** Nothing snaps. Everything breathes, drifts, stutters to life like a neon tube warming up. Spring physics, not linear easing. 0.8 seconds between worlds.

**Sound:** This site has a soundtrack. Lofi jazz in the morning. Arabesque in the evening. Silicon at midnight. The demo should let us hear it.

---

## Structure: Three Acts

The demo reel should move through three acts — mirroring how a guest would discover the site, fall in, and find the hidden room. Total runtime: 90–120 seconds.

---

### ACT I — "The Surface" (0:00–0:35)

**Purpose:** Establish the restaurant, the aesthetic, and the time-shifting system.

#### Shot 1: Cold Open (0:00–0:05)
- **What:** Black screen. The neon logo flickers to life character by character.
- **Technical detail:** The logo uses a `neon-flicker` animation — 4-second cycle with subtle 4–8% opacity dips per character, staggered. Gold glow bleeds outward (drop-shadow cascade: 0 0 7px, 0 0 14px, 0 0 35px).
- **Mood:** You just walked in off the street. Your eyes adjust.
- **Sound:** Ambient room tone. A single note sustains.

#### Shot 2: The Homepage Reveals (0:05–0:15)
- **What:** Camera pulls back to reveal the full homepage. The navigation appears — weather ("soft rain taps the glass"), a countdown to midnight, "Book a Table" glowing in brass.
- **Technical detail:** Nav includes real-time poetic weather from OpenMeteo API. Countdown format: "Xh Ym til night." After 20:00 it reads simply "Midnight."
- **Key elements to show:**
  - The ticker marquee scrolling across the bottom: *"Breakfast / Lunch / Dinner / Drinks • Touch the Cassettes • Stockholm • Open Daily from 07:00 • Leche Negra •"*
  - 12-column grid layout, everything breathing in warm cream on deep black
  - The custom cursor — a bespoke pointer that follows with spring physics (damping: 40, stiffness: 400)

#### Shot 3: Time Shifts (0:15–0:25)
- **What:** Quick montage showing the four time-based themes morphing into each other.
- **Technical detail:** The site runs a `ThemeContext` that auto-shifts at 06:00 (morning), 10:00 (lunch), 15:00 (dinner), 20:00 (night). Each theme changes CSS custom properties over 0.8s:
  - **Morning:** Pale golden background (#fff5d1), espresso text (#2d2a26) — sunlight on linen
  - **Lunch:** Same warmth continues
  - **Dinner:** Dark descent begins (#1a1210 bg) — the lights go down
  - **Night:** Full ink (#0f0a08) — the city disappears
- **Show:** Click each menu button (Breakfast 07–11, Lunch 11:30–14:30, Dinner 17–22, Drinks All Day) to manually trigger theme shifts. The entire page cross-fades.
- **Copy to feature:** Each menu has a voice:
  - Breakfast: *"Before the city gets loud. Coffee first, then bread, then whatever the morning asks for."*
  - Dinner: *"The lights go down. The menu gets longer. Stay for one course or close the place — we're not counting."*
  - Drinks: *"The bar opens when we do and closes when it has to. Espresso at eight, mezcal at midnight — same counter."*

#### Shot 4: The Menus (0:25–0:35)
- **What:** Open a menu panel. Items and prices appear with staggered fade-ins (0.5s, 0.2s delay).
- **Technical detail:** Menu content is CMS-driven (Sanity). Grid collapse/expand animation at 0.6s with cubic-bezier easing. Each item shows name, description, and price. "Book a Table" CTA fades in last (0.3s delay).
- **Mood:** Intimate. Like reading a menu by candlelight.

---

### ACT II — "The Tapes" (0:35–1:05)

**Purpose:** Showcase the cassette tape system and the interactive music layer. This is the hook — the thing nobody expects from a restaurant website.

#### Shot 5: Discovering the Tapes (0:35–0:45)
- **What:** Four cassette tapes are scattered around the player on the homepage. The cursor hovers over one — it wobbles (0.6s mount animation, different rotation per tape). Each tape has its own color palette and label.
- **Technical detail:** Tape variants:
  - **Morning:** "LOFI JAZZ" / "Side A — Le Matin"
  - **Midday:** "SUIYUE" / "Side A — Midi"
  - **Evening:** "ARABESQUE" / "Side A — Le Soir"
  - **Night:** "SILICON" / "Side A — Minuit"
- **Each tape has:** unique shell color, accent color, reel color, and glow color. They're rendered as styled components with SVG reels and label typography.

#### Shot 6: Loading a Tape (0:45–0:55)
- **What:** Drag a tape toward the deck. As it gets close, a proximity glow pulses (0.8s cycle, opacity 0.15→0.4). It snaps into the player with spring physics (stiffness 200, damping 22).
- **Technical detail:** The `TapeDeckContext` manages state — tape insertion triggers the theme to shift to match the tape's time period. The player component shows spinning reels (3s and 2.2s rotation cycles) and sound wave rings emanating outward (1.2s, scale 0.5→2.5, fade to transparent).
- **Sound:** Music starts. The beat drops at 110 BPM. The player physically bounces to the beat (alternating -8px / -4px vertical offset).
- **Key moment:** The ENTIRE SITE changes mood when a tape loads. Background, text, accents — all shift. Music becomes the atmosphere.

#### Shot 7: The Stage (0:55–1:05)
- **What:** Cut to `/stage` — the interactive music composition interface.
- **Technical detail:** 6 instrument stems (Strings, Drums, Saxophone, Violin, Trumpet, Bass) at 110 BPM in 8-bar loops (17.45s). Stems are loaded via Tone.js. Each toggle fades a stem in/out. Audio levels drive CSS variable `--audio-level` which controls glow zone opacity in real-time (0.12s transition when active, 0.8s when idle). Mix-blend-mode: screen for additive light.
- **Show:** Toggle instruments on one by one. The screen fills with layered glow, haze, god rays, and bokeh particles as the mix builds.
- **Mood:** You're the DJ. The restaurant is your instrument. The visuals respond to what you create.
- **Copy on screen:** "BPM: 110 | Tempo: Playful Waltz | Loop: 17.45s"

---

### ACT III — "The Room Downstairs" (1:05–1:40)

**Purpose:** The reveal. The hidden speakeasy. This is what makes the site unforgettable.

#### Shot 8: The Hint (1:05–1:10)
- **What:** Back on the homepage. Camera drifts to the footer. Faint text: *"there's a room downstairs. find it."*
- **Mood:** A dare. The site is talking to you now.

#### Shot 9: The Drag (1:10–1:20)
- **What:** The cursor grabs the footer and drags upward. A resistance curve provides physical feedback — it gets harder to pull. A glow progress indicator builds as the drag approaches 40% threshold (300px).
- **Technical detail:** During drag, a blackout overlay fades in (0.5s). A heartbeat audio track begins playing. At threshold, the transition triggers — `router.push('/speakeasy')`.
- **Mood:** You're pulling back a curtain. Something shifts behind the wall.

#### Shot 10: The Entrance Sequence (1:20–1:35)
- **What:** The speakeasy loads in phases — this is choreographed like a scene, not a page load:
  - **Phase -1 (t=0):** Preloader. White text on black: *"Be quiet."* Holds for 2.5 seconds.
  - **Phase 0 (t=2.5s):** Total darkness. 800ms of nothing. Your eyes adjust again.
  - **Phase 1 (t=3.3s):** A single ember glow fades in over 2 seconds. A radial light pool appears — you can almost feel warmth.
  - **Phase 2 (t=5.3s):** The neon logo stutters on with a tube-warmup animation (~1.2s). Not a fade — a stutter. Specific opacity keyframes mimicking gas ignition.
  - **Phase 3 (t=6.7s):** Content reveals in staggered waves. Grain texture. Smoke rising from the bottom. A vignette breathes (0.85→0.92 opacity, 2s cycle).
- **Sound:** Ambient speakeasy atmosphere. Muffled music. Ice in a glass.

#### Shot 11: The Whispers (1:35–1:40)
- **What:** Move the mouse toward the edges of the screen. Text appears and disappears based on cursor proximity (200px base range, 300px near edges):
  - *"the ice melts differently down here"*
  - *"ask about the painting"*
  - *"the bartender knows your name already"*
  - *"no one remembers who found this room first"*
- **Technical detail:** On mobile, whispers distribute vertically along scroll. Timed reveals at 45s (*"last call was hours ago"*) and 90s (*"the stairs go further down than you think"*). At 60s in Phase 3: *"you're still here. good."* — a patience reward.
- **Mood:** The room is alive. It noticed you.

---

### OUTRO (1:40–1:50)

- Fade to black.
- The neon logo flickers one last time.
- Address: **Engelbrektsgatan 3, Stockholm**
- Beat. Silence.

---

## Press Page — Bonus Footage

If the reel runs long or needs a B-roll section, the `/press` page offers visual richness:

- **Canvas mode:** Press images and editorial quotes scattered across an infinite draggable canvas — art gallery style. Seeded random placement ensures deterministic layouts. Items rotate -4° to +4°. Three size classes (180px, 280px, 400px). Drag to explore.
- **Gallery mode:** Clean grid of press images. Click for lightbox.
- **Toggle between views** for a satisfying mode-switch moment.

---

## Easter Eggs Worth Capturing

1. **Logo long-press:** Hold the neon logo. Intensity scales over time — vibration tightens (0.05s→0.02s), flicker accelerates (0.6s→0.08s), glow expands (14px→35px→90px). Release triggers scene transitions.
2. **Rude cursor:** 12% random chance (10s cooldown) the custom cursor briefly flashes a "rude" state — a different SVG entirely. Blink and you miss it.
3. **Weather poetry:** The nav bar doesn't show "Partly Cloudy." It shows *"clouds drift like slow smoke."* Snow becomes *"snow falls without a sound."* Fog becomes *"the city breathes in mist."*

---

## Technical Craft Worth Highlighting

For a developer-facing cut or case study version:

| Layer | Stack |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, CSS custom properties, dynamic theming |
| Animation | Framer Motion (spring physics), GSAP (timelines), CSS keyframes |
| Audio | Tone.js (synthesis/playback), Web Audio API (real-time frequency analysis) |
| CMS | Sanity (headless), next-sanity integration |
| Interactions | Pointer events, drag physics, proximity detection, MutationObserver |
| Performance | LQIP image placeholders, code splitting, lazy loading |

---

## Tone Guide for Voiceover / Text Cards

If the demo uses voiceover or text overlays, match the site's voice:

- **Short sentences.** Fragments are fine.
- **Present tense.** Everything is happening now.
- **Second person.** You walk in. You hear it. You find it.
- **Understated.** Never explain the magic. Let them see it.
- **Warm, not cold.** This isn't minimal for minimalism's sake. It's intimate.

Examples:
- "The site knows what time it is."
- "Four tapes. Four moods. One bar."
- "Drag down. Find the room."
- "The whispers only appear if you look for them."

---

## Pacing Notes

- **Never rush.** The site doesn't rush. The demo shouldn't either.
- **Let animations complete.** The 0.8s theme transitions, the 2.5s preloader, the 1.2s neon stutter — these are choreography, not loading states. Show them fully.
- **Hold on the speakeasy entrance.** This is the climax. Give it room.
- **End quiet.** The site ends quiet. So should the reel.

---

*Leche Negra. Engelbrektsgatan 3, Stockholm.*
*The bar opens when we do and closes when it has to.*
