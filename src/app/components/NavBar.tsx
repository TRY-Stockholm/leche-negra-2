import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { weatherPoem } from "@/lib/constants";

const WAITERAID_HASH = "dd34bd1ef6c76ba44556cd74fbb9fd3";

interface NavBarProps {
  weather: { temp: number; code: number } | null;
  bookingUrl?: string | null;
}

function useNightCountdown() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const night = new Date(now);
      night.setHours(0, 0, 0, 0);
      night.setDate(night.getDate() + 1);
      if (now >= night) return "Midnight";
      const diff = night.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      if (h > 0) return `${h}h ${m}m til night`;
      return `${m}m til night`;
    };
    setLabel(compute());
    const id = setInterval(() => setLabel(compute()), 30_000);
    return () => clearInterval(id);
  }, []);

  return label;
}

const NAV_LINKS = [
  { href: "#menus", label: "Menus" },
  { href: "/press", label: "Press" },
  {
    href: "https://maps.google.com/?q=Engelbrektsgatan+3,+Stockholm",
    label: "Find Us",
    external: true,
  },
] as const;

export const NavBar = memo(function NavBar({ weather }: NavBarProps) {
  const countdown = useNightCountdown();
  const [open, setOpen] = useState(false);

  // Lock body scroll when menu is open
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

  return (
    <>
      <nav className="squiggly-border-b flex items-center justify-between px-5 md:px-10 py-3 md:py-6 text-xs tracking-[0.08em] uppercase font-medium relative z-50">
        {/* Left side */}
        <div className="flex items-center gap-3 sm:gap-4 text-[0.6875rem] tracking-[0.04em]">
          {/* Hamburger toggle — mobile only */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="md:hidden text-muted-foreground hover:text-accent transition-colors duration-200 p-1"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <motion.line
                x1="2" x2="14"
                animate={open ? { y1: 8, y2: 8, rotate: 45 } : { y1: 4, y2: 4, rotate: 0 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: "center" }}
              />
              <motion.line
                x1="2" y1="8" x2="14" y2="8"
                animate={{ opacity: open ? 0 : 1 }}
                transition={{ duration: 0.15 }}
              />
              <motion.line
                x1="2" x2="14"
                animate={open ? { y1: 8, y2: 8, rotate: -45 } : { y1: 12, y2: 12, rotate: 0 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: "center" }}
              />
            </svg>
          </button>

          {/* Desktop links */}
          <button
            className="waiteraid-widget hidden md:inline nav-bracket text-muted-foreground hover:text-accent transition-colors duration-200 cursor-pointer"
            data-hash={WAITERAID_HASH}
          >
            Book a Table
          </button>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              {...("external" in link
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="hidden md:inline nav-bracket text-muted-foreground hover:text-accent transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 text-[0.6875rem] tracking-[0.04em]">
          {/* Desktop: weather + countdown */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3 text-accent">
            {weather && (
              <span className="font-display italic text-[0.6875rem] tracking-[0.02em] normal-case">
                {weather.temp}&deg; &mdash;{" "}
                {weatherPoem(weather.code, weather.temp)}
              </span>
            )}
            <span className="text-muted-foreground">|</span>
            {countdown && <span>{countdown}</span>}
          </div>

          {/* Book a Table — mobile only, always visible */}
          <button
            className="waiteraid-widget md:hidden nav-bracket text-muted-foreground hover:text-accent transition-colors duration-200 cursor-pointer"
            data-hash={WAITERAID_HASH}
          >
            Book a Table
          </button>
        </div>
      </nav>

      {/* ── Full-page mobile overlay ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-background md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-2 px-8">
              {/* Nav links */}
              <motion.button
                className="waiteraid-widget font-display italic text-[2rem] text-accent-foreground hover:text-accent transition-colors duration-200 py-2 cursor-pointer"
                data-hash={WAITERAID_HASH}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.35,
                  delay: 0.08,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                Book a Table
              </motion.button>
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  {...("external" in link
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="font-display italic text-[2rem] text-accent-foreground hover:text-accent transition-colors duration-200 py-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.08 + (i + 1) * 0.06,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  {link.label}
                </motion.a>
              ))}

              {/* Divider */}
              <motion.div
                className="w-16 h-px bg-muted-foreground/30 my-4"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              />

              {/* Weather + countdown */}
              <motion.div
                className="flex flex-col items-center gap-1 text-accent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                {weather && (
                  <span className="font-display italic text-sm tracking-[0.02em] normal-case">
                    {weather.temp}&deg; &mdash;{" "}
                    {weatherPoem(weather.code, weather.temp)}
                  </span>
                )}
                {countdown && (
                  <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    {countdown}
                  </span>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
