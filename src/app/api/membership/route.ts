import { writeClient } from "@/sanity/lib/writeClient";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-().]{6,20}$/;

// Simple in-memory rate limiter: max 5 requests per IP per minute
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(ip, timestamps);

  // Prevent unbounded map growth
  if (hits.size > 10_000) {
    for (const [key, vals] of hits) {
      if (vals.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return timestamps.length > MAX_REQUESTS;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, email, phone, instagram } = body as {
    name?: string;
    email?: string;
    phone?: string;
    instagram?: string;
  };

  if (!name || !email || !phone) {
    return Response.json(
      { error: "Name, email, and phone are required." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  if (!PHONE_RE.test(phone)) {
    return Response.json(
      { error: "Please enter a valid phone number." },
      { status: 400 }
    );
  }

  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return Response.json(
      { error: "Submissions are not configured yet." },
      { status: 503 }
    );
  }

  try {
    await writeClient.create({
      _type: "membershipRequest",
      name: String(name).slice(0, 100),
      email: String(email).slice(0, 200),
      phone: String(phone).slice(0, 30),
      instagram: instagram ? String(instagram).slice(0, 60) : undefined,
      status: "pending",
      submittedAt: new Date().toISOString(),
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
