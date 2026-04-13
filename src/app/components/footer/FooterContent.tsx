"use client";

import type { SiteSettings, SocialLink } from "@/lib/types";
import { BOOKING_WIDGET_HASH } from "@/lib/constants";

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  );
}

interface FooterContentProps {
  onDragHint: () => void;
  siteSettings?: SiteSettings | null;
  socialLinks?: SocialLink[];
  isDragging?: boolean;
}

export function FooterContent({
  onDragHint,
  siteSettings,
  socialLinks,
  isDragging,
}: FooterContentProps) {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between px-5 py-6 md:px-10 md:py-10">
      {/* Top row */}
      <div className="flex items-start justify-between">
        {/* Trigger text — top left */}
        <div
          className="pointer-events-auto leading-snug text-foreground/60 hover:text-foreground transition-colors duration-500 text-left select-none"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onMouseEnter={onDragHint}
          onTouchStart={onDragHint}
        >
          <span className="font-display text-[clamp(1rem,2vw,1.5rem)] italic">
            there's a room downstairs.
          </span>
          <br />
          <span className="font-display text-[clamp(1rem,2vw,1.5rem)] font-bold not-italic">
            find it.
          </span>
        </div>

        <div className="flex gap-3 pointer-events-auto">
          {(socialLinks && socialLinks.length > 0) ? (
            socialLinks.map((link) => (
              <a
                key={link._id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/70 hover:text-accent transition-colors duration-300 text-[0.6875rem] font-body font-medium tracking-[0.06em] uppercase"
                aria-label={link.platform}
              >
                {link.platform}
              </a>
            ))
          ) : (
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-accent transition-colors duration-300"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-3 md:gap-4">
        <div className="flex flex-col gap-2 text-foreground/60">
          <a
            href={siteSettings?.addressMapUrl ?? "https://maps.google.com/?q=Engelbrektsgatan+3,+Stockholm"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[0.75rem] tracking-[0.06em] uppercase font-body pointer-events-auto hover:text-foreground transition-colors duration-300"
          >
            <MapPinIcon />
            <span>{siteSettings?.address ?? "Engelbrektsgatan 3, Stockholm"}</span>
          </a>
          <a
            href={`mailto:${siteSettings?.email ?? "hola@lechenegra.se"}`}
            className="flex items-center gap-2 text-[0.75rem] tracking-[0.06em] uppercase font-body hover:text-accent transition-colors duration-200"
          >
            <MailIcon />
            <span>{siteSettings?.email ?? "hola@lechenegra.se"}</span>
          </a>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-end gap-3 md:gap-6">
          <nav className="flex gap-4 pointer-events-auto">
            {["Book a Table", "Menus", "Press", "Find Us"].map((link) =>
              link === "Book a Table" ? (
                <button
                  key={link}
                  className="waiteraid-widget text-[0.6875rem] font-body font-medium tracking-[0.06em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 cursor-pointer py-1"
                  data-hash={BOOKING_WIDGET_HASH}
                >
                  {link}
                </button>
              ) : (
                <a
                  key={link}
                  href="#"
                  className="text-[0.6875rem] font-body font-medium tracking-[0.06em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 py-1"
                >
                  {link}
                </a>
              ),
            )}
          </nav>
          <span className="text-[0.6875rem] font-body tracking-[0.06em] uppercase text-foreground/50">
            &copy; {new Date().getFullYear()} Leche Negra
          </span>
        </div>
      </div>
    </div>
  );
}
