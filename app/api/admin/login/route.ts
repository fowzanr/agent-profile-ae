import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE_NAME, computeAdminToken } from "@/lib/adminAuth";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const schema = z.object({ password: z.string().min(1) });

function sha256(value: string): Buffer {
  return crypto.createHash("sha256").update(value).digest();
}

function passwordMatches(candidate: string, expected: string): boolean {
  // Compare hashes of equal length in constant time so response timing can't
  // leak how many characters of the password were guessed correctly.
  return crypto.timingSafeEqual(sha256(candidate), sha256(expected));
}

export async function POST(req: Request) {
  const limit = rateLimit(`admin-login:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD || !passwordMatches(parsed.data.password, process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, computeAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
