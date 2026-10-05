import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/authTokens";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const limit = rateLimit(`reset-password:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({
    where: { passwordResetTokenHash: hashToken(parsed.data.token) },
    select: { id: true, passwordResetExpiresAt: true },
  });

  if (!agent || !agent.passwordResetExpiresAt || agent.passwordResetExpiresAt < new Date()) {
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
