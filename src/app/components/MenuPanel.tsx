import { motion, AnimatePresence } from "motion/react";

type MenuKey = "breakfast" | "lunch" | "dinner" | "drinks";

interface MenuItem {
  name: string;
  description?: string;
  price?: string;
  italic?: boolean;
}

interface MenuSection {
  label: string;
  hours: string;
  intro: string;
  items: MenuItem[];
}

const menus: Record<MenuKey, MenuSection> = {
  breakfast: {
    label: "Morning",
    hours: "07:00 – 11:00",
    intro:
      "The quiet hours. Precision in a cup. Stillness on a plate. We begin each day the same way — with discipline, warmth, and without hurry.",
    items: [
      { name: "Espresso", description: "Single origin, rotating", price: "45" },
      { name: "Café con Leche", description: "Oat or whole", price: "58" },
      { name: "Tartine", description: "Sourdough, cultured butter, sea salt", price: "72" },
      { name: "Granola", description: "House-made, seasonal fruit, skyr", price: "88" },
      { name: "Eggs", description: "Two ways. Toast. Nothing more.", price: "95" },
      { name: "Juice", description: "Cold-pressed, daily", price: "62", italic: true },
    ],
  },
  lunch: {
    label: "Midday",
    hours: "11:30 – 14:30",
    intro:
      "Generous but never heavy. The midday meal is democratic — honest ingredients, careful hands, a table for everyone. No pretense. Real flavour.",
    items: [
      { name: "Soup", description: "Seasonal, bread on the side", price: "95" },
      { name: "Salad", description: "Market greens, house vinaigrette", price: "115" },
      { name: "Sandwich", description: "Open-faced, daily selection", price: "125" },
      { name: "Pasta", description: "Fresh, simple, correct", price: "145" },
      { name: "Fish", description: "Catch of the day, vegetables", price: "175" },
      { name: "Dessert", description: "One option. Always worth it.", price: "85", italic: true },
    ],
  },
  dinner: {
    label: "Evening",
    hours: "17:00 – 22:00",
    intro:
      "The room changes. Candles appear. The kitchen shifts gear. Dinner at Leche Negra is not an event — it is a feeling. Arrive hungry. Leave warm.",
    items: [
      { name: "Bread & Butter", description: "Sourdough, whipped, smoked", price: "65" },
      { name: "Ceviche", description: "Daily catch, tiger's milk, herbs", price: "155" },
      { name: "Tartare", description: "Hand-cut, capers, egg yolk", price: "165" },
      { name: "Pasta", description: "Handmade, seasonal ragu", price: "185" },
      { name: "Whole Fish", description: "For the table, roasted, herb oil", price: "345" },
      { name: "Steak", description: "Dry-aged, bone marrow, greens", price: "385" },
      { name: "Cheese", description: "Nordic selection, honey, walnut", price: "145", italic: true },
    ],
  },
  drinks: {
    label: "Night",
    hours: "All Day",
    intro:
      "The bar is the spine of the house. Morning espresso to midnight mezcal — a continuous thread. We pour with conviction. We never pour light.",
    items: [
      { name: "Negroni", description: "Classic. No variations needed.", price: "155" },
      { name: "Mezcal Sour", description: "Espadín, citrus, egg white", price: "165" },
      { name: "Natural Wine", description: "Glass, rotating selection", price: "135" },
      { name: "House Red", description: "Bottle, Spanish or Italian", price: "485" },
      { name: "Espresso Martini", description: "Leche Negra blend", price: "175" },
      { name: "Non-Alcoholic", description: "Seasonal shrub, tonic", price: "95", italic: true },
    ],
  },
};

const playfair =
  '"Playfair Display", "Georgia", "Times New Roman", serif';
const generalSans =
  '"General Sans", "Helvetica Neue", sans-serif';

export function MenuPanel({
  activeMenu,
  onClose,
}: {
  activeMenu: MenuKey | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {activeMenu && (
        <motion.div
          key={activeMenu}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.4, ease: "easeInOut" },
          }}
          style={{ overflow: "hidden" }}
        >
          <div
            className="border-t border-border pt-8 pb-4 mt-6"
            style={{ transition: "border-color 0.8s ease" }}
          >
            {/* Header */}
            <div className="flex items-baseline justify-between mb-6">
              <div className="flex items-baseline gap-3">
                <span
                  style={{
                    fontFamily: generalSans,
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                  }}
                  className="text-muted-foreground"
                >
                  {menus[activeMenu].hours}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-accent cursor-pointer"
                style={{
                  fontFamily: generalSans,
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                }}
              >
                Close
              </button>
            </div>

            {/* Intro text */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-muted-foreground mb-8"
              style={{
                fontFamily: playfair,
                fontStyle: "italic",
                fontSize: "clamp(0.875rem, 2vw, 1.0625rem)",
                lineHeight: 1.6,
                maxWidth: "520px",
              }}
            >
              {menus[activeMenu].intro}
            </motion.p>

            {/* Menu items */}
            <div className="space-y-0">
              {menus[activeMenu].items.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.15 + i * 0.06,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex items-baseline justify-between py-2 border-b border-border"
                  style={{
                    transition: "border-color 0.8s ease",
                  }}
                >
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span
                      style={{
                        fontFamily: playfair,
                        fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                        fontWeight: 500,
                        fontStyle: item.italic ? "italic" : "normal",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.name}
                    </span>
                    {item.description && (
                      <span
                        className="text-muted-foreground hidden sm:inline"
                        style={{
                          fontFamily: generalSans,
                          fontSize: "0.75rem",
                          fontWeight: 400,
                          letterSpacing: "0.01em",
                        }}
                      >
                        {item.description}
                      </span>
                    )}
                  </div>
                  {item.price && (
                    <span
                      className="text-accent ml-4 shrink-0"
                      style={{
                        fontFamily: generalSans,
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {item.price}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Footer note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-muted-foreground mt-6"
              style={{
                fontFamily: generalSans,
                fontSize: "0.625rem",
                fontWeight: 400,
                letterSpacing: "0.04em",
                textTransform: "uppercase" as const,
              }}
            >
              Prices in SEK. Menu changes with the season.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { MenuKey };
