import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const createSchema = z.object({
  agentId: z.string().min(1),
  propertyId: z.string().optional().nullable(),
  name: z.string().min(1).max(100),
  contact: z.string().min(1).max(200),
  message: z.string().max(2000).optional(),
  channel: z.enum(["form", "book"]).optional(),
});

export async function POST(req: Request) {
  const limit = rateLimit(`lead:${getClientIp(req)}`, 10, 10 * 60 * 1000);
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: parsed.data.agentId },
    select: { contactEmail: true },
  });
  if (!agent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const lead = await prisma.lead.create({
    data: {
      agentId: parsed.data.agentId,
      propertyId: parsed.data.propertyId || null,
      name: parsed.data.name,
      contact: parsed.data.contact,
      message: parsed.data.message || null,
      channel: parsed.data.channel ?? "form",
    },
  });

  if (agent.contactEmail) {
    const kind = parsed.data.channel === "book" ? "booking request" : "message";
    await sendEmail({
      to: agent.contactEmail,
      subject: `New ${kind} from ${parsed.data.name} — agentprofile.ae`,
      text: [
        `You have a new ${kind} on your agentprofile.ae page.`,
        "",
        `Name: ${parsed.data.name}`,
        `Contact: ${parsed.data.contact}`,
        parsed.data.message ? `\nMessage:\n${parsed.data.message}` : "",
      ].join("\n"),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: lead.id });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { agentId: session.user.id },
    include: { property: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(
    leads.map((l) => ({
      id: l.id,
      name: l.name,
      contact: l.contact,
      message: l.message,
      channel: l.channel,
      propertyTitle: l.property?.title ?? null,
      createdAt: l.createdAt,
    })),
  );
}
