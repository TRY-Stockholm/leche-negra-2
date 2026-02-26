import { useState, useEffect } from "react";
import { weatherPoem } from "@/lib/constants";

interface NavBarProps {
  weather: { temp: number; code: number } | null;
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

export function NavBar({ weather }: NavBarProps) {
  const countdown = useNightCountdown();

  return (
    <nav
      className="flex items-center justify-between px-5 md:px-10 py-3 border-b border-border text-xs tracking-[0.08em] uppercase font-medium"
    >
      <div className="flex items-center gap-2">
        <a
          href="https://www.google.com/maps/place/Engelbrektsgatan+3,+114+32+Stockholm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-accent transition-colors duration-200 text-[0.6875rem] tracking-[0.04em]"
        >
          <span className="hidden sm:inline">Engelbrektsgatan 3, 114 32 Stockholm</span>
          <span className="sm:hidden">Engelbrektsg. 3, Sthlm</span>
        </a>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 text-accent">
        {weather && (
          <span className="hidden sm:inline font-display italic text-[0.6875rem] tracking-[0.02em] normal-case">
            {weather.temp}&deg; &mdash; {weatherPoem(weather.code, weather.temp)}
          </span>
        )}
        {weather && (
          <span className="sm:hidden">
            {weather.temp}&deg;
          </span>
        )}
        <span className="text-muted-foreground">|</span>
        {countdown && <span>{countdown}</span>}
      </div>
    </nav>
  );
}
