"use client";

import { useState, useEffect } from "react";

interface Weather {
  temp: number;
  code: number;
}

export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);

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

  return weather;
}
