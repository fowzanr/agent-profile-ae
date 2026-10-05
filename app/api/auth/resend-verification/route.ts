import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/authTokens";
import { siteUrl } from "@/lib/siteUrl";
import { sendEmail } from "@/lib/email";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const schema = z.object({ email: z.string().email() });
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const limit = rateLimit(`resend-verification:${getClientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  // Always respond the same way regardless of whether the account exists or
  // is already verified — otherwise this endpoint could be used to check
  // which emails have accounts.
  const genericResponse = NextResponse.json({ ok: true });

  const agent = await prisma.agent.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, emailVerifiedAt: true },
  });
  if (!agent || agent.emailVerifiedAt) return genericResponse;

  const verificationToken = generateToken();
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      emailVerificationTokenHash: hashToken(verificationToken),
      emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  });

  const verifyLink = `${siteUrl()}/verify-email?token=${verificationToken}`;
  const result = await sendEmail({
    to: parsed.data.email,
    subject: "Confirm your email — agentprofile.ae",
    text: [
      `Hi ${agent.name},`,
      "",
      "Confirm your email to finish setting up your agentprofile.ae page:",
      verifyLink,
      "",
      "This link expires in 24 hours.",
    ].join("\n"),
  }).catch(() => ({ sent: false }));

  if (!result.sent) {
    console.warn(`[dev] email not configured — verification link for ${parsed.data.email}: ${verifyLink}`);
  }

  return genericResponse;
}
