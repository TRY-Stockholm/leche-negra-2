# Sanity CMS Content Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make opening hours, social links, booking URL, and menu PDFs editable via Sanity Studio.

**Architecture:** Three new Sanity schema types (`siteSettings` singleton, `socialLink` list, `menu` list). A server-component wrapper fetches all CMS data and passes it as props to the existing client components. The "See Menu" button links to Sanity-hosted PDF URLs.

**Tech Stack:** Sanity 4, next-sanity, Next.js 15 (App Router), TypeScript

**Design doc:** `docs/plans/2026-02-27-sanity-cms-content-design.md`

---

### Task 1: Create `siteSettings` schema

**Files:**
- Create: `src/sanity/schemaTypes/siteSettings.ts`

**Step 1: Create the schema file**

```typescript
// src/sanity/schemaTypes/siteSettings.ts
import { defineType, defineField } from 'sanity'
import { CogIcon } from '@sanity/icons'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'address',
      type: 'string',
      title: 'Address',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'addressMapUrl',
      type: 'url',
      title: 'Address Map URL',
      description: 'Google Maps link for the address',
      validation: (rule) => rule.uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'email',
      type: 'string',
      title: 'Email',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'openingHours',
      type: 'string',
      title: 'Opening Hours',
      description: 'e.g. "Open Daily from 07:00"',
    }),
    defineField({
      name: 'bookingUrl',
      type: 'url',
      title: 'Booking URL',
      description: 'Link for the "Book a Table" buttons',
      validation: (rule) => rule.uri({ scheme: ['https', 'http'] }),
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Site Settings' }
    },
  },
})
```

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to siteSettings

**Step 3: Commit**

```bash
git add src/sanity/schemaTypes/siteSettings.ts
git commit -m "feat: add siteSettings Sanity schema"
```

---

### Task 2: Create `socialLink` schema

**Files:**
- Create: `src/sanity/schemaTypes/socialLink.ts`

**Step 1: Create the schema file**

```typescript
// src/sanity/schemaTypes/socialLink.ts
import { defineType, defineField } from 'sanity'
import { LinkIcon } from '@sanity/icons'

export const socialLink = defineType({
  name: 'socialLink',
  title: 'Social Link',
  type: 'document',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'platform',
      type: 'string',
      title: 'Platform',
      description: 'e.g. Instagram, TikTok, Facebook',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      type: 'url',
      title: 'URL',
      validation: (rule) => rule.required().uri({ scheme: ['https', 'http'] }),
    }),
    defineField({
      name: 'order',
      type: 'number',
      title: 'Sort Order',
      description: 'Lower numbers appear first',
    }),
  ],
  orderings: [
    {
      title: 'Sort Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'platform', subtitle: 'url' },
  },
})
```

**Step 2: Commit**

```bash
git add src/sanity/schemaTypes/socialLink.ts
git commit -m "feat: add socialLink Sanity schema"
```

---

### Task 3: Create `menu` schema

**Files:**
- Create: `src/sanity/schemaTypes/menu.ts`

**Step 1: Create the schema file**

```typescript
// src/sanity/schemaTypes/menu.ts
import { defineType, defineField } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'

export const menu = defineType({
  name: 'menu',
  title: 'Menu',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'e.g. Breakfast, Lunch, Dinner, Drinks',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hours',
      type: 'string',
      title: 'Hours',
      description: 'e.g. "07:00 – 11:00"',
    }),
    defineField({
      name: 'intro',
      type: 'text',
      title: 'Introduction',
      description: 'Poetic description shown when the menu panel opens',
      rows: 3,
    }),
    defineField({
      name: 'pdf',
      type: 'file',
      title: 'Menu PDF',
      description: 'Upload the full menu as a PDF',
      options: { accept: 'application/pdf' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      type: 'number',
      title: 'Sort Order',
      description: 'Lower numbers appear first',
    }),
  ],
  orderings: [
    {
      title: 'Sort Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'hours' },
  },
})
```

**Step 2: Commit**

```bash
git add src/sanity/schemaTypes/menu.ts
git commit -m "feat: add menu Sanity schema with PDF upload"
```

---

### Task 4: Register schemas and update Studio structure

**Files:**
- Modify: `src/sanity/schemaTypes/index.ts`
- Modify: `src/sanity/structure.ts`

**Step 1: Update schema index to register all three types**

```typescript
// src/sanity/schemaTypes/index.ts
import { type SchemaTypeDefinition } from 'sanity'
import { pressImage } from './pressImage'
import { siteSettings } from './siteSettings'
import { socialLink } from './socialLink'
import { menu } from './menu'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [pressImage, siteSettings, socialLink, menu],
}
```

**Step 2: Update Studio structure with singleton pattern and grouping**

```typescript
// src/sanity/structure.ts
import type { StructureResolver } from 'sanity/structure'

const SINGLETONS = ['siteSettings']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Singleton: Site Settings
      S.listItem()
        .title('Site Settings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings'),
        ),

      S.divider(),

      // Filter out singletons from the auto-generated list
      ...S.documentTypeListItems().filter(
        (listItem) => !SINGLETONS.includes(listItem.getId() as string),
      ),
    ])
```

**Step 3: Verify the dev server starts and Studio loads**

Run: `npm run dev` — open `http://localhost:3000/studio`
Expected: Studio shows "Site Settings" at top, divider, then Menu, Press Image, Social Link lists below

**Step 4: Commit**

```bash
git add src/sanity/schemaTypes/index.ts src/sanity/structure.ts
git commit -m "feat: register CMS schemas and configure Studio structure"
```

---

### Task 5: Add GROQ queries

**Files:**
- Create: `src/sanity/queries.ts`

**Step 1: Create the queries file**

```typescript
// src/sanity/queries.ts
import { defineQuery } from 'next-sanity'

export const SITE_SETTINGS_QUERY = defineQuery(
  `*[_type == "siteSettings"][0] {
    address,
    addressMapUrl,
    email,
    openingHours,
    bookingUrl
  }`
)

export const SOCIAL_LINKS_QUERY = defineQuery(
  `*[_type == "socialLink"] | order(order asc, _createdAt asc) {
    _id,
    platform,
    url
  }`
)

export const MENUS_QUERY = defineQuery(
  `*[_type == "menu"] | order(order asc, _createdAt asc) {
    _id,
    title,
    hours,
    intro,
    "pdfUrl": pdf.asset->url
  }`
)
```

**Step 2: Commit**

```bash
git add src/sanity/queries.ts
git commit -m "feat: add GROQ queries for site settings, socials, and menus"
```

---

### Task 6: Add CMS TypeScript types

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add types for CMS data**

Append to `src/lib/types.ts`:

```typescript
// CMS types
export interface SiteSettings {
  address: string | null;
  addressMapUrl: string | null;
  email: string | null;
  openingHours: string | null;
  bookingUrl: string | null;
}

export interface SocialLink {
  _id: string;
  platform: string;
  url: string;
}

export interface CMSMenu {
  _id: string;
  title: string;
  hours: string | null;
  intro: string | null;
  pdfUrl: string | null;
}
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add TypeScript types for CMS data"
```

---

### Task 7: Create server wrapper for homepage

The homepage `page.tsx` is `"use client"`, so we need a server component that fetches data and passes it down.

**Files:**
- Modify: `src/app/page.tsx` — rename the current default export, wrap in server component

**Step 1: Restructure page.tsx**

The current `page.tsx` exports `App` as default (a client component). We need to:
1. Move the client component to keep it as-is but accept CMS props
2. Add a server-component default export that fetches and passes data

Refactor `src/app/page.tsx`:

At the top, add imports for Sanity client and queries:

```typescript
import { client } from "@/sanity/lib/client";
import { SITE_SETTINGS_QUERY, SOCIAL_LINKS_QUERY, MENUS_QUERY } from "@/sanity/queries";
import type { SiteSettings, SocialLink, CMSMenu } from "@/lib/types";
```

Change the default export from `App` to a new server component. Move the `"use client"` directive and all existing code into a separate file or use a pattern where the server component wraps the client component.

**Approach:** Extract the client component to `src/app/components/HomePage.tsx` and make `page.tsx` a server component.

1. Create `src/app/components/HomePage.tsx` — move ALL content from current `page.tsx` into this file (keep `"use client"` directive). Update its props interface to accept `siteSettings`, `socialLinks`, and `menus`. Pass them through to `MenuPanel`, `NavBar`, and `Footer`.

2. Rewrite `src/app/page.tsx` as a server component:

```typescript
import { client } from "@/sanity/lib/client";
import { SITE_SETTINGS_QUERY, SOCIAL_LINKS_QUERY, MENUS_QUERY } from "@/sanity/queries";
import HomePage from "./components/HomePage";

export default async function Page() {
  const [siteSettings, socialLinks, menus] = await Promise.all([
    client.fetch(SITE_SETTINGS_QUERY),
    client.fetch(SOCIAL_LINKS_QUERY),
    client.fetch(MENUS_QUERY),
  ]);

  return (
    <HomePage
      siteSettings={siteSettings}
      socialLinks={socialLinks}
      menus={menus}
    />
  );
}
```

**Step 2: Verify the site renders without errors**

Run: `npm run dev` — open `http://localhost:3000`
Expected: Same visual result as before (CMS data will be null/empty until content is added in Studio)

**Step 3: Commit**

```bash
git add src/app/page.tsx src/app/components/HomePage.tsx
git commit -m "feat: extract client HomePage, add server-side CMS data fetching"
```

---

### Task 8: Wire CMS data into MenuPanel

**Files:**
- Modify: `src/app/components/MenuPanel.tsx`

**Step 1: Update MenuPanel to accept CMS menus and use PDF URL**

Update the component props to accept an optional `menus` array from CMS. When available, use CMS data for hours/intro. The "See Menu" button links to `pdfUrl`.

Key changes:
- Add `menus` prop of type `CMSMenu[]`
- Find the matching CMS menu by comparing `activeMenu` key to CMS `title` (lowercase)
- If CMS menu found, use its `hours` and `intro`; otherwise fall back to hardcoded `menus.ts`
- "See Menu" button: if `pdfUrl` exists, set `href` to the PDF URL with `target="_blank"`; otherwise hide the button
- "Book a Table" button: accept `bookingUrl` prop and use it as `href`

**Step 2: Pass the data from HomePage.tsx**

Thread `menus` and `siteSettings.bookingUrl` through to `<MenuPanel>`.

**Step 3: Verify**

Run: `npm run dev` — open a menu panel
Expected: Still renders with hardcoded fallback data. "See Menu" button hidden (no PDFs yet). "Book a Table" still shows.

**Step 4: Commit**

```bash
git add src/app/components/MenuPanel.tsx src/app/components/HomePage.tsx
git commit -m "feat: wire CMS menu data and PDF links into MenuPanel"
```

---

### Task 9: Wire CMS data into FooterContent

**Files:**
- Modify: `src/app/components/footer/FooterContent.tsx`
- Modify: `src/app/components/footer/Footer.tsx`
- Modify: `src/app/components/HomePage.tsx`

**Step 1: Update FooterContent props**

Add `siteSettings` and `socialLinks` props. Replace hardcoded values:
- Address text → `siteSettings.address` (fallback: "Engelbrektsgatan 3, Stockholm")
- Address link → `siteSettings.addressMapUrl` (fallback: current Google Maps URL)
- Email → `siteSettings.email` (fallback: "hola@lechenegra.se")
- Instagram link → dynamic `socialLinks` array (render one icon-link per social)

For social link icons: use the platform name to render a generic external-link icon. The current `InstagramIcon` SVG can stay for "Instagram" platform; for others, use the platform name as text or a generic link icon.

**Step 2: Update Footer.tsx to pass props through**

`Footer` currently takes no props. Add `siteSettings` and `socialLinks` props, pass them to `FooterContent`.

**Step 3: Thread data from HomePage**

Pass `siteSettings` and `socialLinks` to `<Footer>`.

**Step 4: Verify**

Run: `npm run dev` — check footer
Expected: Footer shows hardcoded fallback values (no CMS data yet). No visual change.

**Step 5: Commit**

```bash
git add src/app/components/footer/FooterContent.tsx src/app/components/footer/Footer.tsx src/app/components/HomePage.tsx
git commit -m "feat: wire CMS site settings and social links into footer"
```

---

### Task 10: Wire booking URL into NavBar

**Files:**
- Modify: `src/app/components/NavBar.tsx`
- Modify: `src/app/components/HomePage.tsx`

**Step 1: Update NavBar to accept bookingUrl prop**

Add optional `bookingUrl` prop. Replace the `href="#book"` on both "Book a Table" links (desktop + mobile) with `bookingUrl ?? "#book"`.

**Step 2: Thread from HomePage**

Pass `siteSettings?.bookingUrl` to `<NavBar>`.

**Step 3: Verify**

Run: `npm run dev` — check nav
Expected: "Book a Table" still shows `#book` (no CMS data yet).

**Step 4: Commit**

```bash
git add src/app/components/NavBar.tsx src/app/components/HomePage.tsx
git commit -m "feat: wire CMS booking URL into NavBar"
```

---

### Task 11: Add seed content in Sanity Studio

**Files:** None (Studio UI work)

**Step 1: Open Studio and create seed content**

Go to `http://localhost:3000/studio`:

1. **Site Settings** — click "Site Settings", fill in:
   - Address: "Engelbrektsgatan 3, Stockholm"
   - Address Map URL: "https://maps.google.com/?q=Engelbrektsgatan+3,+Stockholm"
   - Email: "hola@lechenegra.se"
   - Opening Hours: "Open Daily from 07:00"
   - Booking URL: (leave empty or add a placeholder)
   - Publish the document

2. **Social Link** — create one entry:
   - Platform: "Instagram"
   - URL: "https://instagram.com/lechenegra"
   - Order: 1
   - Publish

3. **Menu** — create 4 entries (use placeholder PDFs or skip PDF for now):
   - Breakfast (order: 1, hours: "07:00 – 11:00")
   - Lunch (order: 2, hours: "11:30 – 14:30")
   - Dinner (order: 3, hours: "17:00 – 22:00")
   - Drinks (order: 4, hours: "All Day")
   - Publish all

**Step 2: Verify the site renders CMS data**

Refresh `http://localhost:3000`
Expected: Footer shows CMS address/email, Instagram link works, menu panels show CMS hours/intro if provided.

**Step 3: Commit** (no code changes — this is content seeding)

---

### Task 12: Final verification and cleanup

**Step 1: Full-page check**

- Homepage loads without errors
- Menu panels open, show hours/intro from CMS (with hardcoded fallbacks)
- "See Menu" button links to PDF when available, hidden when not
- "Book a Table" uses CMS booking URL
- Footer shows CMS address, email, social links
- Studio at `/studio` shows clean structure: Site Settings at top, then Menu, Press Image, Social Link
- Press page still works

**Step 2: Run type check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit any cleanup**

```bash
git add -A
git commit -m "feat: complete Sanity CMS integration for settings, socials, and menus"
```
