const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=59.3326&longitude=18.0649&current=temperature_2m,weather_code&timezone=Europe/Stockholm";

export async function GET() {
  try {
    const res = await fetch(WEATHER_URL, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = await res.json();

    return Response.json(
      {
        temp: Math.round(data.current.temperature_2m),
        code: data.current.weather_code,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    );
  } catch {
    return Response.json(
      { temp: null, code: null },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  }
}
