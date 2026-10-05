import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
  const body = await req.json().catch(() => null);
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
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
