"use client";

import { useState, useEffect } from "react";

interface Weather {
  temp: number;
  code: number;
}

export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then((data) => setWeather(data))
      .catch(() => {});
  }, []);

  return weather;
}
