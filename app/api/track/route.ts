import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

const trackSchema = z.object({
  agentId: z.string().min(1),
  type: z.enum([
    "profile_view",
    "listing_view",
    "whatsapp_click",
    "call_click",
    "email_click",
    "book_click",
    "share",
  ]),
  propertyId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  // Fire-and-forget beacon — the client never reads the response, so a
  // rate-limited or malformed request just gets silently dropped rather
  // than surfaced as an error.
  const limit = rateLimit(`track:${getClientIp(req)}`, 60, 60 * 1000);
  if (!limit.ok) return new NextResponse(null, { status: 204 });

  const body = await req.json().catch(() => null);
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(null, { status: 204 });
  }

  const { agentId, type, propertyId } = parsed.data;

  try {
    await prisma.analyticsEvent.create({
      data: { agentId, type, propertyId: propertyId ?? null },
    });
  } catch {
    // best-effort — a bad/deleted agentId or propertyId shouldn't error out the visitor's action
  }

  return new NextResponse(null, { status: 204 });
}
