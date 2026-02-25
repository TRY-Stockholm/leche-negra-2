import logoSrc from "figma:asset/211c09d668e69a7ef5a400d1ec1c613af1c25e91.png";
import { useState, useEffect, useCallback } from "react";
import { MenuPanel, type MenuKey } from "./components/MenuPanel";

type Theme = "morning" | "lunch" | "dinner" | "night";

function getTimeTheme(): Theme {
  const h = new Date().getHours();
  if (h >= 6 && h < 10) return "morning";
  if (h >= 10 && h < 15) return "lunch";
  if (h >= 15 && h < 20) return "dinner";
  return "night";
}

const themeLabels: Record<Theme, string> = {
  morning: "Morning",
  lunch: "Midday",
  dinner: "Evening",
  night: "Night",
};

export default function App() {
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [timeTheme, setTimeTheme] = useState<Theme>(getTimeTheme);
  const [hoverTheme, setHoverTheme] = useState<Theme | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);

  const activeTheme = hoverTheme ?? timeTheme;
  const isLightTheme = activeTheme === "morning" || activeTheme === "lunch";

  // Update time-based theme every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTheme(getTimeTheme());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=59.3326&longitude=18.0649&current=temperature_2m,weather_code&timezone=Europe/Stockholm"
    )
      .then((r) => r.json())
      .then((data) => {
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
        });
      })
      .catch(() => {});
  }, []);

  const weatherLabel = (code: number) => {
    if (code === 0) return "Clear";
    if (code <= 3) return "Cloudy";
    if (code <= 48) return "Fog";
    if (code <= 67) return "Rain";
    if (code <= 77) return "Snow";
    if (code <= 82) return "Showers";
    if (code <= 86) return "Snow";
    return "Storm";
  };

  const onMenuHover = useCallback((theme: Theme) => {
    // Don't change theme on hover if a menu panel is open
    if (!openMenu) setHoverTheme(theme);
  }, [openMenu]);
  const onMenuLeave = useCallback(() => {
    if (!openMenu) setHoverTheme(null);
  }, [openMenu]);

  const menuThemeMap: Record<MenuKey, Theme> = {
    breakfast: "morning",
    lunch: "lunch",
    dinner: "dinner",
    drinks: "night",
  };

  const handleMenuClick = useCallback((menu: MenuKey) => {
    setOpenMenu((prev) => {
      if (prev === menu) {
        setHoverTheme(null);
        return null;
      }
      setHoverTheme(menuThemeMap[menu]);
      return menu;
    });
  }, []);

  const handleMenuClose = useCallback(() => {
    setOpenMenu(null);
    setHoverTheme(null);
  }, []);

  return (
    <div
      className={`min-h-screen bg-background text-foreground font-body theme-${activeTheme}`}
      style={{ transition: "background-color 0.8s ease, color 0.8s ease" }}
    >
      {/* Top Navigation Bar */}
      <nav
        className="flex items-center justify-between px-5 md:px-10 py-3 border-b border-border"
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 500,
          transition: "border-color 0.8s ease",
        }}
      >
        <div className="flex items-center gap-2">
          <a
            href="https://www.google.com/maps/place/Engelbrektsgatan+3,+114+32+Stockholm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-accent transition-colors duration-200"
            style={{ fontSize: "0.6875rem", letterSpacing: "0.04em" }}
          >
            <span className="hidden sm:inline">Engelbrektsgatan 3, 114 32 Stockholm</span>
            <span className="sm:hidden">Engelbrektsg. 3, Sthlm</span>
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-accent">
          {weather && (
            <span className="hidden sm:inline">
              {weather.temp}° — {weatherLabel(weather.code)}
            </span>
          )}
          {weather && (
            <span className="sm:hidden">
              {weather.temp}°
            </span>
          )}
          <span className="text-walnut">|</span>
          <span>
            {new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-52px)]">
        {/* Left Column */}
        <div className="md:border-r border-border px-5 md:px-10 py-8 md:py-12 flex flex-col justify-between">
          {/* Top Section - The Rhythm */}
          <div>
            {/* Eyebrow label */}
            

            {/* Logo */}
            <img
              src={logoSrc}
              alt="Leche Negra"
              className="w-full max-w-[560px] h-auto"
              style={{
                filter: isLightTheme ? "none" : "invert(1)",
                transition: "filter 0.8s ease",
              }}
            />

            {/* Core statement */}
            <div
              className="mt-10 md:mt-16"
              style={{
                fontFamily:
                  '"Playfair Display", "Georgia", "Times New Roman", serif',
                fontSize: "clamp(1.25rem, 3vw, 2rem)",
                lineHeight: 1.15,
                fontWeight: 500,
                letterSpacing: "-0.015em",
              }}
            >
              
              
              
            </div>
          </div>

          {/* Bottom Section - DNA */}
          <div className="mt-16">
            {/* Section label */}
            <p
              className="mb-5 text-muted-foreground"
              style={{
                fontFamily: '"General Sans", "Helvetica Neue", sans-serif',
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span>Menus: </span>
              <em
                style={{
                  fontFamily:
                    '"Playfair Display", "Georgia", "Times New Roman", serif',
                  fontStyle: "italic",
                }}
              >
                Four
              </em>
              <span> Moments</span>
            </p>

            {/* Menu items grid */}
            <div
              style={{
                fontFamily:
                  '"Playfair Display", "Georgia", "Times New Roman", serif',
                fontSize: "clamp(3rem, 8vw, 6.25rem)",
                fontWeight: 500,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              <div className="flex items-baseline flex-wrap">
                <span
                  className="cursor-pointer transition-colors duration-300 hover:text-accent"
                  onMouseEnter={() => onMenuHover("morning")}
                  onMouseLeave={onMenuLeave}
                  onClick={() => handleMenuClick("breakfast")}
                >
                  Breakfast
                </span>
                <span className="text-walnut mx-1">/</span>
                <span
                  className="cursor-pointer transition-colors duration-300 hover:text-accent"
                  onMouseEnter={() => onMenuHover("lunch")}
                  onMouseLeave={onMenuLeave}
                  onClick={() => handleMenuClick("lunch")}
                >
                  Lunch
                </span>
              </div>
              <div className="flex items-baseline flex-wrap">
                <span
                  className="cursor-pointer transition-colors duration-300 hover:text-accent"
                  onMouseEnter={() => onMenuHover("dinner")}
                  onMouseLeave={onMenuLeave}
                  onClick={() => handleMenuClick("dinner")}
                >
                  Dinner
                </span>
                <span className="text-walnut mx-1">/</span>
                <span
                  className="cursor-pointer transition-colors duration-300 hover:text-accent"
                  style={{
                    fontStyle: "italic",
                  }}
                  onMouseEnter={() => onMenuHover("night")}
                  onMouseLeave={onMenuLeave}
                  onClick={() => handleMenuClick("drinks")}
                >
                  Drinks
                </span>
              </div>
            </div>

            {/* Roll-down menu panel */}
            <MenuPanel activeMenu={openMenu} onClose={handleMenuClose} />

            {/* Menu legend */}
            <div
              className="mt-8 grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground"
              style={{
                fontFamily: '"General Sans", "Helvetica Neue", sans-serif',
                fontSize: "0.6875rem",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <span>07:00 – 11:00</span>
              <span>11:30 – 14:30</span>
              <span>17:00 – 22:00</span>
              <span className="text-accent">All Day</span>
            </div>

            {/* Footer */}
            
          </div>
        </div>

        {/* Right Column */}
        <div
          className="border-t md:border-t-0 border-border px-5 md:px-10 py-8 md:py-12 flex flex-col justify-between"
          style={{ transition: "border-color 0.8s ease" }}
        >
          {/* Top Section - Declarations */}
          

          {/* Bottom Section */}
          <div className="mt-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end">
              <div>
                {/* Eyebrow */}
                <p
                  className="mb-4 text-muted-foreground"
                  style={{
                    fontFamily:
                      '"Playfair Display", "Georgia", "Times New Roman", serif',
                    fontStyle: "italic",
                    fontSize: "0.8125rem",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  The Invitation
                </p>
                <div
                  style={{
                    fontFamily:
                      '"Playfair Display", "Georgia", "Times New Roman", serif',
                    fontSize: "clamp(1.75rem, 5vw, 3rem)",
                    lineHeight: 1.15,
                    fontWeight: 500,
                    letterSpacing: "-0.015em",
                  }}
                >
                  <p>Reserve a Table</p>
                  <p>The Bar</p>
                  <p>Find Us</p>
                </div>
              </div>

              <div className="mt-8 md:mt-0 text-right">
                {/* Eyebrow */}
                <p
                  className="mb-4 text-muted-foreground"
                  style={{
                    fontFamily:
                      '"Playfair Display", "Georgia", "Times New Roman", serif',
                    fontStyle: "italic",
                    fontSize: "0.8125rem",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  Inte{" "}
                  <span style={{ fontStyle: "normal" }}>Lagom</span>
                </p>
                <div
                  style={{
                    fontFamily:
                      '"Playfair Display", "Georgia", "Times New Roman", serif',
                    fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  <p className="group cursor-pointer">
                    <span className="text-walnut group-hover:text-accent transition-colors duration-200">
                      [
                    </span>{" "}
                    <span className="group-hover:text-accent transition-colors duration-200">
                      Reserve
                    </span>{" "}
                    <span className="text-walnut group-hover:text-accent transition-colors duration-200">
                      ]
                    </span>
                  </p>
                  <p className="group cursor-pointer">
                    <span className="text-walnut group-hover:text-accent transition-colors duration-200">
                      [
                    </span>{" "}
                    <span className="group-hover:text-accent transition-colors duration-200">
                      Kvällsmeny
                    </span>{" "}
                    <span className="text-walnut group-hover:text-accent transition-colors duration-200">
                      ]
                    </span>
                  </p>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}