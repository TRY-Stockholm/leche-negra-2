# Performance & Vercel Cost Optimization

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate unnecessary serverless function invocations, reduce bandwidth costs, and trim JS bundle size.

**Architecture:** Replace `force-dynamic` with ISR revalidation on all 3 server pages, compress audio assets with ffmpeg, dynamic-import GSAP, delete unused audio file, and add font preload.

**Tech Stack:** Next.js 16, Sanity CMS, ffmpeg, GSAP, motion/react

---

### Task 1: Replace force-dynamic with ISR revalidation

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/press/page.tsx`
- Modify: `src/app/speakeasy/page.tsx`
- Modify: `src/sanity/lib/client.ts`

**Step 1:** In `src/app/page.tsx` — remove `export const dynamic = "force-dynamic"`, remove the `freshClient` override, use the default `client` (which has `useCdn: true`), and add `export const revalidate = 60`.

**Step 2:** In `src/app/press/page.tsx` — remove `export const dynamic = "force-dynamic"` and add `export const revalidate = 60`.

**Step 3:** In `src/app/speakeasy/page.tsx` — remove `export const dynamic = "force-dynamic"`, remove the `sanity` override with `useCdn: false`, use the default `client`, and add `export const revalidate = 60`.

---

### Task 2: Compress audio files with ffmpeg

**Step 1:** Compress the 4 cassette music tracks to ~128kbps MP3 (sufficient for background music):

```bash
for f in lofi-jazz arabesque silicon; do
  ffmpeg -i public/music/$f.mp3 -b:a 128k -ac 2 public/music/$f.opt.mp3 && mv public/music/$f.opt.mp3 public/music/$f.mp3
done
```

**Step 2:** Convert `small-step.wav` (260KB) to MP3 and update the reference:

```bash
ffmpeg -i public/music/small-step.wav -b:a 128k -ac 2 public/music/small-step.mp3 && rm public/music/small-step.wav
```

Update `src/app/components/tape-deck/types.ts` line 40: change `"/music/small-step.wav"` to `"/music/small-step.mp3"`.

**Step 3:** Compress the 6 stage stems to ~128kbps M4A:

```bash
for f in public/audio/stage/playful-waltz_stem-*.m4a; do
  ffmpeg -i "$f" -b:a 128k -ac 2 "${f%.m4a}.opt.m4a" && mv "${f%.m4a}.opt.m4a" "$f"
done
```

**Step 4:** Delete the unused `suiyue.mp3` (5.6 MB, not referenced anywhere in code).

```bash
rm public/music/suiyue.mp3
```

---

### Task 3: Dynamic-import GSAP in press components

**Files:**
- Modify: `src/app/press/_components/PressLightbox.tsx`
- Modify: `src/app/press/_components/useCanvasDrag.ts`

**Step 1:** In `PressLightbox.tsx` — replace top-level `import gsap from "gsap"` with a lazy import inside the effects. Since gsap is only used in `useEffect` callbacks, import it dynamically there.

**Step 2:** In `useCanvasDrag.ts` — same pattern, replace top-level `import gsap from "gsap"` with dynamic import inside the callback where it's used.

---

### Task 4: Add font preload hint

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1:** Add a `rel="preload"` link for the General Sans font CSS before the stylesheet link to eliminate the render-blocking waterfall.

---
