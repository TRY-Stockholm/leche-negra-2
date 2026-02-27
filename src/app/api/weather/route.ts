const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=59.3326&longitude=18.0649&current=temperature_2m,weather_code&timezone=Europe/Stockholm";

export async function GET() {
  const res = await fetch(WEATHER_URL, { next: { revalidate: 1800 } });
  const data = await res.json();

  return Response.json({
    temp: Math.round(data.current.temperature_2m),
    code: data.current.weather_code,
  });
}
