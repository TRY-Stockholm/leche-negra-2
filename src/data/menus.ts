import type { MenuKey, MenuSection } from "@/lib/types";

export const menus: Record<MenuKey, MenuSection> = {
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
