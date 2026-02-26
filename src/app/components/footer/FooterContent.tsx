"use client";

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

export function FooterContent({
  onTentacleHover,
}: {
  onTentacleHover: (active: boolean) => void;
}) {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 md:p-10">
      {/* Top row */}
      <div className="flex items-start justify-between">
        {/* Trigger text — top left */}
        <button
          className="pointer-events-auto leading-snug text-foreground/40 hover:text-foreground transition-colors duration-500 cursor-pointer text-left"
          onMouseEnter={() => onTentacleHover(true)}
          onMouseLeave={() => onTentacleHover(false)}
          onTouchStart={() => onTentacleHover(true)}
          onTouchEnd={() => onTentacleHover(false)}
        >
          <span className="font-display text-[clamp(1rem,2vw,1.5rem)] italic">
            not everything is on the menu.
          </span>
          <br />
          <span className="font-display text-[clamp(1rem,2vw,1.5rem)] font-bold not-italic">
            go deeper.
          </span>
        </button>

        <div className="flex gap-3 pointer-events-auto">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/70 hover:text-accent transition-colors duration-300"
            aria-label="Instagram"
          >
            <InstagramIcon />
          </a>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2 text-foreground/60">
          <div className="flex items-center gap-2 text-[0.75rem] tracking-[0.06em] uppercase font-body">
            <MapPinIcon />
            <span>Engelbrektsgatan 3, Stockholm</span>
          </div>
          <div className="flex items-center gap-2 text-[0.75rem] tracking-[0.06em] uppercase font-body">
            <MailIcon />
            <span>hola@lechenegra.se</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-end gap-3 md:gap-6">
          <nav className="flex gap-4 pointer-events-auto">
            {["Book a Table", "Menus", "Press", "Find Us"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[0.6875rem] font-body font-medium tracking-[0.06em] uppercase text-foreground/50 hover:text-foreground transition-colors duration-300"
              >
                {link}
              </a>
            ))}
          </nav>
          <span className="text-[0.625rem] font-body tracking-[0.06em] uppercase text-foreground/30">
            &copy; {new Date().getFullYear()} Leche Negra
          </span>
        </div>
      </div>
    </div>
  );
}
