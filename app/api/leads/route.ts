import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { TIME_PATTERN, availabilityOf, formatBookingTime, isBookable } from "@/lib/booking";

const createSchema = z.object({
  agentId: z.string().min(1),
  propertyId: z.string().optional().nullable(),
  name: z.string().min(1).max(100),
  contact: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  channel: z.enum(["form", "book"]).optional(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date").optional(),
  preferredTime: z.string().regex(TIME_PATTERN, "Pick a valid time").optional(),
  // "whatsapp" when the visitor also sent the request to the agent from their own WhatsApp.
  via: z.enum(["whatsapp"]).optional(),
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
    select: { contactEmail: true, email: true, bookingDays: true, bookingStartTime: true, bookingEndTime: true, bookingSlotMinutes: true },
  });
  if (!agent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const viaWhatsApp = parsed.data.via === "whatsapp";
  const contact = parsed.data.contact?.trim() || (viaWhatsApp ? "Their WhatsApp number" : "");
  if (!contact) {
    return NextResponse.json({ error: "Add a phone number or email" }, { status: 400 });
  }

  const isBooking = parsed.data.channel === "book";
  const { preferredDate, preferredTime } = parsed.data;
  if (isBooking) {
    if (!preferredDate || !preferredTime) {
      return NextResponse.json({ error: "Pick a day and time for your viewing" }, { status: 400 });
    }
    if (!isBookable(availabilityOf(agent), preferredDate, preferredTime)) {
      return NextResponse.json({ error: "That time isn't available any more. Pick another slot." }, { status: 400 });
    }
  }
  const when = preferredDate && preferredTime ? formatBookingTime(preferredDate, preferredTime) : "";
  const message = [
    viaWhatsApp ? "Sent via WhatsApp" : null,
    when ? `Preferred time: ${when}` : null,
    parsed.data.message || null,
  ].filter(Boolean).join("\n\n");

  const lead = await prisma.lead.create({
    data: {
      agentId: parsed.data.agentId,
      propertyId: parsed.data.propertyId || null,
      name: parsed.data.name,
      contact,
      message: message || null,
      channel: parsed.data.channel ?? "form",
    },
  });

  const notifyEmail = agent.contactEmail || agent.email;
  if (notifyEmail) {
    const kind = isBooking ? "booking request" : "message";
    await sendEmail({
      to: notifyEmail,
      subject: `New ${kind} from ${parsed.data.name}${viaWhatsApp ? " (via WhatsApp)" : ""} — agentprofile.ae`,
      text: [
        `You have a new ${kind} on your agentprofile.ae page.`,
        "",
        `Name: ${parsed.data.name}`,
        `Contact: ${contact}`,
        when ? `Preferred time: ${when}` : "",
        parsed.data.message ? `\nMessage:\n${parsed.data.message}` : "",
        "",
        viaWhatsApp
          ? "They were also asked to send this to you on WhatsApp. Look for their message there to confirm the viewing."
          : isBooking
            ? "Reply to them directly to confirm the viewing."
            : "",
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
