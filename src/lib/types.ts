export type Theme = "morning" | "lunch" | "dinner" | "night";

export type MenuKey = "breakfast" | "lunch" | "dinner" | "drinks";

export interface MenuItem {
  name: string;
  description?: string;
  price?: string;
  italic?: boolean;
}

export interface MenuSection {
  label: string;
  hours: string;
  intro: string;
  items: MenuItem[];
}
