# Menu Modal Design

## Summary

Replace the nav "Menus" link (currently `#menus` anchor) with a full-screen modal overlay that lets users pick a menu, then view its content — all without leaving the overlay.

## Behavior

### Step 1: Picker

- Clicking "Menus" in the nav (desktop inline link or mobile overlay link) opens a full-screen fixed overlay.
- On mobile, the hamburger overlay closes first, then the MenuModal opens.
- The overlay shows 4 links centered vertically: Breakfast, Lunch, Dinner, Drinks.
- Links styled identically to the mobile nav overlay: `font-display italic text-[2rem]`, staggered fade-in animation.
- Escape key or a Close link dismisses the modal.
- Body scroll is locked while open.

### Step 2: Viewer

- Selecting a menu transitions the overlay content to show the selected menu's details.
- Content matches existing MenuPanel style: hours subtitle, italic intro paragraph, menu items (name, description, price), Book a Table CTA, optional PDF link.
- A "Back" link returns to the picker. A "Close" link dismisses entirely.
- Transition between picker and viewer uses fade/slide animation (AnimatePresence mode="wait").

## Architecture

- **New file**: `src/app/components/MenuModal.tsx`
- **NavBar change**: "Menus" link gets an `onMenuClick` callback prop instead of `href="#menus"`.
- **HomePage change**: Manages `menuModalOpen` boolean state, passes it + CMS menu data to MenuModal.
- Existing inline MenuPanel on the homepage is untouched.

## Props

```ts
interface MenuModalProps {
  open: boolean;
  onClose: () => void;
  cmsMenus?: CMSMenu[];
}
```

## Styling

- Full-screen overlay: `fixed inset-0 z-40 bg-background`
- Picker links: match mobile nav overlay exactly
- Viewer content: match existing MenuPanel typography and layout
- Animations: Framer Motion, consistent with existing patterns
