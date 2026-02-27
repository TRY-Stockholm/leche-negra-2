# Menu Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the nav "Menus" link with a full-screen modal that lets users pick a menu (Breakfast, Lunch, Dinner, Drinks) then view its content inline.

**Architecture:** New `MenuModal` component with two internal states (picker / viewer). NavBar gets an `onMenuClick` callback prop. HomePage manages modal open state and passes CMS data.

**Tech Stack:** React 19, Motion (Framer Motion), Tailwind CSS 4, TypeScript

---

### Task 1: Create MenuModal component

**Files:**
- Create: `src/app/components/MenuModal.tsx`

**Step 1: Create the MenuModal with picker view**

```tsx
"use client";

import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { MenuKey, CMSMenu } from "@/lib/types";
import { menus } from "@/data/menus";

const MENU_OPTIONS: { key: MenuKey; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "drinks", label: "Drinks" },
];

const MENU_KEY_TO_TITLE: Record<MenuKey, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  drinks: "Drinks",
};

const WAITERAID_HASH = "dd34bd1ef6c76ba44556cd74fbb9fd3";

interface MenuModalProps {
  open: boolean;
  onClose: () => void;
  cmsMenus?: CMSMenu[];
}

export const MenuModal = memo(function MenuModal({
  open,
  onClose,
  cmsMenus,
}: MenuModalProps) {
  const [selectedMenu, setSelectedMenu] = useState<MenuKey | null>(null);

  // Reset selection when modal closes
  useEffect(() => {
    if (!open) setSelectedMenu(null);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedMenu) {
          setSelectedMenu(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, selectedMenu, onClose]);

  const cmsMenu = selectedMenu
    ? cmsMenus?.find(
        (m) =>
          m.title.toLowerCase() ===
          MENU_KEY_TO_TITLE[selectedMenu].toLowerCase(),
      )
    : undefined;

  const menuData = selectedMenu ? menus[selectedMenu] : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center justify-center h-full px-8">
            <AnimatePresence mode="wait">
              {!selectedMenu ? (
                /* ── Picker view ── */
                <motion.div
                  key="picker"
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {MENU_OPTIONS.map((option, i) => (
                    <motion.button
                      key={option.key}
                      onClick={() => setSelectedMenu(option.key)}
                      className="font-display italic text-[2rem] text-accent-foreground hover:text-accent transition-colors duration-200 py-2 cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.08 + i * 0.06,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    >
                      {option.label}
                    </motion.button>
                  ))}

                  {/* Close link */}
                  <motion.button
                    onClick={onClose}
                    className="mt-6 font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground hover:text-accent transition-colors duration-200 cursor-pointer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    Close
                  </motion.button>
                </motion.div>
              ) : (
                /* ── Viewer view ── */
                <motion.div
                  key={selectedMenu}
                  className="flex flex-col items-center max-w-[520px] w-full overflow-y-auto max-h-[80vh]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {/* Hours */}
                  <span className="font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground mb-4">
                    {cmsMenu?.hours ?? menuData!.hours}
                  </span>

                  {/* Title */}
                  <h2 className="font-display italic text-[2rem] mb-6">
                    {MENU_KEY_TO_TITLE[selectedMenu]}
                  </h2>

                  {/* Intro */}
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="text-muted-foreground mb-8 font-display italic text-[clamp(0.875rem,2vw,1.0625rem)] leading-[1.6] text-center"
                  >
                    {cmsMenu?.intro ?? menuData!.intro}
                  </motion.p>

                  {/* Menu items */}
                  <div className="w-full space-y-4 mb-8">
                    {menuData!.items.map((item, i) => (
                      <motion.div
                        key={item.name}
                        className="flex justify-between items-baseline gap-4"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.2 + i * 0.05,
                          duration: 0.4,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                      >
                        <div>
                          <span
                            className={`font-display text-[clamp(0.9375rem,1.5vw,1.0625rem)] ${item.italic ? "italic text-muted-foreground" : ""}`}
                          >
                            {item.name}
                          </span>
                          {item.description && (
                            <span className="text-muted-foreground font-body text-[0.75rem] ml-2">
                              {item.description}
                            </span>
                          )}
                        </div>
                        {item.price && (
                          <span className="font-body text-[0.75rem] text-muted-foreground whitespace-nowrap">
                            {item.price}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex flex-col sm:flex-row gap-3 mb-8"
                  >
                    <button
                      className="waiteraid-widget inline-flex items-center justify-center border border-foreground px-8 py-4 font-display text-[clamp(0.875rem,1.5vw,1.0625rem)] font-medium tracking-[0.04em] uppercase hover:bg-foreground hover:text-background transition-colors duration-300 cursor-pointer"
                      data-hash={WAITERAID_HASH}
                    >
                      Book a Table
                    </button>
                    {cmsMenu?.pdfUrl && (
                      <a
                        href={cmsMenu.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center border border-muted-foreground/40 px-8 py-4 font-display text-[clamp(0.875rem,1.5vw,1.0625rem)] font-medium tracking-[0.04em] uppercase hover:border-foreground transition-colors duration-300"
                      >
                        See Menu
                      </a>
                    )}
                  </motion.div>

                  {/* Back + Close */}
                  <div className="flex gap-6">
                    <button
                      onClick={() => setSelectedMenu(null)}
                      className="font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground hover:text-accent transition-colors duration-200 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={onClose}
                      className="font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground hover:text-accent transition-colors duration-200 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
```

**Step 2: Verify file compiles**

Run: `npx next build --no-lint 2>&1 | head -20` or just `npx tsc --noEmit`
Expected: No type errors related to MenuModal.

**Step 3: Commit**

```bash
git add src/app/components/MenuModal.tsx
git commit -m "feat: add MenuModal component with picker and viewer views"
```

---

### Task 2: Wire NavBar to trigger MenuModal

**Files:**
- Modify: `src/app/components/NavBar.tsx`

**Step 1: Add `onMenuClick` prop and replace "Menus" link**

Changes to NavBar:

1. Add `onMenuClick` to the `NavBarProps` interface:
   ```ts
   interface NavBarProps {
     weather: { temp: number; code: number } | null;
     bookingUrl?: string | null;
     onMenuClick?: () => void;
   }
   ```

2. Update the component signature to destructure `onMenuClick`:
   ```ts
   export const NavBar = memo(function NavBar({ weather, onMenuClick }: NavBarProps) {
   ```

3. Remove "Menus" from `NAV_LINKS` array — it becomes a special-cased button. The array becomes:
   ```ts
   const NAV_LINKS = [
     { href: "/press", label: "Press" },
     {
       href: "https://maps.google.com/?q=Engelbrektsgatan+3,+Stockholm",
       label: "Find Us",
       external: true,
     },
   ] as const;
   ```

4. In the desktop links section (line ~110), add a "Menus" button before the `NAV_LINKS.map(...)`:
   ```tsx
   <button
     onClick={onMenuClick}
     className="hidden md:inline nav-bracket text-muted-foreground hover:text-accent transition-colors duration-200 cursor-pointer"
   >
     Menus
   </button>
   ```

5. In the mobile overlay links section (line ~175), add a "Menus" button. Insert it as the first item after "Book a Table" (before the `NAV_LINKS.map`), with matching stagger animation at index 1 (delay `0.08 + 1 * 0.06`):
   ```tsx
   <motion.button
     onClick={() => {
       setOpen(false);
       onMenuClick?.();
     }}
     className="font-display italic text-[2rem] text-accent-foreground hover:text-accent transition-colors duration-200 py-2 cursor-pointer"
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
     exit={{ opacity: 0, y: -10 }}
     transition={{
       duration: 0.35,
       delay: 0.08 + 1 * 0.06,
       ease: [0.25, 0.46, 0.45, 0.94],
     }}
   >
     Menus
   </motion.button>
   ```

   Then update the `NAV_LINKS.map` delay to account for the extra item: change `delay: 0.08 + (i + 1) * 0.06` to `delay: 0.08 + (i + 2) * 0.06`.

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```bash
git add src/app/components/NavBar.tsx
git commit -m "feat: wire NavBar Menus link to onMenuClick callback"
```

---

### Task 3: Wire HomePage to manage MenuModal state

**Files:**
- Modify: `src/app/components/HomePage.tsx`

**Step 1: Add state and render MenuModal**

1. Add import at top:
   ```ts
   import { MenuModal } from "./MenuModal";
   ```

2. In `PageContent`, add state:
   ```ts
   const [menuModalOpen, setMenuModalOpen] = useState(false);
   ```

3. Add callback:
   ```ts
   const handleNavMenuClick = useCallback(() => {
     setMenuModalOpen(true);
   }, []);
   ```

4. Pass callback to NavBar:
   ```tsx
   <NavBar weather={weather} bookingUrl={siteSettings?.bookingUrl} onMenuClick={handleNavMenuClick} />
   ```

5. Render MenuModal after NavBar (inside the `relative z-10` div):
   ```tsx
   <MenuModal
     open={menuModalOpen}
     onClose={() => setMenuModalOpen(false)}
     cmsMenus={menus}
   />
   ```

**Step 2: Verify it builds and works**

Run: `npm run dev`
- Click "Menus" on desktop nav → modal opens with 4 menu choices
- Click a menu → transitions to viewer with items, hours, intro, CTAs
- Press Escape → goes back to picker, then closes
- Click "Back" → returns to picker
- Click "Close" → closes modal
- On mobile: open hamburger, tap "Menus" → hamburger closes, modal opens

**Step 3: Commit**

```bash
git add src/app/components/HomePage.tsx
git commit -m "feat: wire MenuModal to HomePage and NavBar"
```
