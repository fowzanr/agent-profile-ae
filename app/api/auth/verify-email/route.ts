import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/authTokens";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  const limit = rateLimit(`verify-email:${getClientIp(req)}`, 20, 15 * 60 * 1000);
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({
    where: { emailVerificationTokenHash: hashToken(parsed.data.token) },
    select: { id: true, emailVerificationExpiresAt: true },
  });

  if (!agent || !agent.emailVerificationExpiresAt || agent.emailVerificationExpiresAt < new Date()) {
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 400 });
  }

  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
