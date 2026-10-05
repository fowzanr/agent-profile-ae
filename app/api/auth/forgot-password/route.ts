import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/authTokens";
import { siteUrl } from "@/lib/siteUrl";
import { sendEmail } from "@/lib/email";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const schema = z.object({ email: z.string().email() });
const RESET_TTL_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  const limit = rateLimit(`forgot-password:${getClientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  // Always the same response whether or not the account exists — a
  // different response here would let someone probe which emails have
  // accounts on the platform.
  const genericResponse = NextResponse.json({ ok: true });

  const agent = await prisma.agent.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true },
  });
  if (!agent) return genericResponse;

  const resetToken = generateToken();
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      passwordResetTokenHash: hashToken(resetToken),
      passwordResetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const resetLink = `${siteUrl()}/reset-password?token=${resetToken}`;
  const result = await sendEmail({
    to: parsed.data.email,
    subject: "Reset your password — agentprofile.ae",
    text: [
      `Hi ${agent.name},`,
      "",
      "Someone requested a password reset for your agentprofile.ae account. If this was you, set a new password here:",
      resetLink,
      "",
      "This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.",
    ].join("\n"),
  }).catch(() => ({ sent: false }));

  if (!result.sent) {
    console.warn(`[dev] email not configured — password reset link for ${parsed.data.email}: ${resetLink}`);
  }

  return genericResponse;
}
