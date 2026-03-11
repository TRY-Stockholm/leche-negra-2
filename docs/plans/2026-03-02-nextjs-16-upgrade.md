# Next.js 16 Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade leche-negra from Next.js 15 to Next.js 16

**Architecture:** This is a straightforward dependency upgrade. The project has minimal exposure to breaking changes — no middleware, no async request APIs, no AMP, no legacy image, no eslint config, no parallel routes. The main changes are: bumping packages, removing the `--turbopack` flag from dev script, and verifying the build compiles.

**Tech Stack:** Next.js 16, React 19.2, TypeScript 5, npm

---

### Task 1: Upgrade dependencies

**Files:**
- Modify: `package.json`
- Regenerate: `package-lock.json`

**Step 1: Install latest Next.js and React**

Run:
```bash
npm install next@latest react@latest react-dom@latest
```

**Step 2: Upgrade type packages**

Run:
```bash
npm install -D @types/react@latest @types/react-dom@latest
```

**Step 3: Verify installation succeeded**

Run: `node -e "console.log(require('next/package.json').version)"`
Expected: `16.x.x`

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: upgrade next to v16, react to 19.2"
```

---

### Task 2: Update package.json scripts

**Files:**
- Modify: `package.json`

Next.js 16 uses Turbopack by default — the `--turbopack` flag is no longer needed.

**Step 1: Remove `--turbopack` flag from dev script**

In `package.json`, change:
```json
"dev": "next dev --turbopack",
```
to:
```json
"dev": "next dev",
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: remove --turbopack flag (default in next 16)"
```

---

### Task 3: Verify build compiles

**Files:** None (verification only)

**Step 1: Run production build**

Run:
```bash
npm run build
```
Expected: Build succeeds with no errors.

**Step 2: If build fails due to webpack config detection**

This project has no custom webpack config, so it should build fine with Turbopack by default. If any dependency injects webpack config, add `--turbopack` explicitly to the build script.

**Step 3: Run dev server smoke test**

Run:
```bash
npm run dev
```
Expected: Dev server starts without errors on localhost:3000. Kill it after verifying startup.

---

### Task 4: Check for next-sanity compatibility

**Files:** None (verification only)

**Step 1: Check that next-sanity works with Next.js 16**

The project uses `next-sanity@^11.6.12`. After the upgrade, verify the build didn't break any Sanity-related pages by checking the build output from Task 3.

**Step 2: If next-sanity is incompatible, upgrade it**

Run:
```bash
npm install next-sanity@latest
```

---

### Task 5: Final commit and verify

**Step 1: Run the full build one more time**

Run:
```bash
npm run build
```
Expected: Clean build, no warnings related to deprecated APIs.

**Step 2: Verify no remaining Next.js 15-specific patterns**

The project has no:
- ❌ middleware.ts (no rename to proxy.ts needed)
- ❌ Async request APIs (cookies/headers/params/searchParams — no await migration needed)
- ❌ next/amp usage (removed in v16)
- ❌ next/legacy/image (deprecated in v16)
- ❌ serverRuntimeConfig / publicRuntimeConfig (removed in v16)
- ❌ experimental_ppr (removed in v16)
- ❌ Parallel routes (no default.js files needed)
- ❌ ESLint / next lint config (removed in v16)
- ❌ unstable_cacheLife / unstable_cacheTag imports (not used)

This upgrade is clean. The only weather route uses `{ next: { revalidate: 1800 } }` which remains supported.
