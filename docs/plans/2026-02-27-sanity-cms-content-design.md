# Sanity CMS Content Integration — Design Doc

## Scope

Make three categories of content editable via Sanity CMS:

1. **Opening times & restaurant info** — address, email, hours, booking link
2. **Social links** — flexible list (Instagram, TikTok, Facebook, etc.)
3. **Menu PDFs** — one uploadable PDF per menu (breakfast, lunch, dinner, drinks)

Press gallery is already in Sanity and out of scope.

## Sanity Schemas

### `siteSettings` (singleton)

Single document for core restaurant info.

| Field          | Type   | Notes                          |
|----------------|--------|--------------------------------|
| `address`      | string | e.g. "Engelbrektsgatan 3, Stockholm" |
| `addressMapUrl`| url    | Google Maps link                |
| `email`        | string | Contact email                   |
| `openingHours` | string | e.g. "Open Daily from 07:00"   |
| `bookingUrl`   | url    | "Book a Table" destination      |

### `socialLink` (document, list)

One document per social platform. Flexible — add/remove as needed.

| Field      | Type   | Notes                     |
|------------|--------|---------------------------|
| `platform` | string | e.g. "Instagram", "TikTok" |
| `url`      | url    | Profile URL                |
| `order`    | number | Sort order                 |

### `menu` (document, 4 entries)

One document per menu. Holds the PDF and metadata displayed in the menu panel.

| Field   | Type   | Notes                              |
|---------|--------|------------------------------------|
| `title` | string | e.g. "Breakfast"                   |
| `hours` | string | e.g. "07:00 – 11:00"              |
| `intro` | text   | Poetic description shown in panel  |
| `pdf`   | file   | Uploaded PDF menu                  |
| `order` | number | Sort order                         |

## Data Flow

1. **Server-side fetch** — query all three types in `page.tsx` and `layout.tsx`
2. **Props threading** — pass data to `FooterContent`, `MenuPanel`, `NavBar`
3. **"See Menu" button** — links to Sanity-hosted PDF URL for the active menu
4. **Social links** — dynamically rendered in footer from `socialLink` documents
5. **Existing interactive menus** — hardcoded items/prices in `menus.ts` remain unchanged; PDF is an addition

## Files Affected

- `src/sanity/schemaTypes/` — new schema files + updated index
- `src/sanity/structure.ts` — singleton handling for siteSettings
- `src/app/page.tsx` — fetch queries, pass props
- `src/app/layout.tsx` — fetch siteSettings for metadata
- `src/app/components/MenuPanel.tsx` — accept menu data as props, link PDF
- `src/app/components/footer/FooterContent.tsx` — accept settings + socials as props
- `src/app/components/NavBar.tsx` — accept booking URL as prop

## Out of Scope

- Interactive menu items/prices (stays hardcoded in `menus.ts`)
- Weather poems, ticker messages
- Visual editing / live preview
- Press gallery (already done)
