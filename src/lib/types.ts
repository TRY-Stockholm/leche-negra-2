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
