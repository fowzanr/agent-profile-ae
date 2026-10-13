import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/siteUrl";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { REPORT_REASON_VALUES, reportReasonLabel } from "@/lib/reports";

const schema = z
  .object({
    agentId: z.string().min(1),
    reason: z.enum(REPORT_REASON_VALUES),
    details: z.string().trim().max(1000).optional(),
    contact: z.string().trim().max(200).optional(),
  })
  .refine((d) => d.reason !== "other" || (d.details?.length ?? 0) > 0, {
    message: "Tell us a little about what's wrong",
    path: ["details"],
  });

export async function POST(req: Request) {
  const limit = rateLimit(`report:${getClientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({ where: { id: parsed.data.agentId }, select: { id: true, name: true, slug: true } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const report = await prisma.report.create({
    data: {
      agentId: agent.id,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
      contact: parsed.data.contact || null,
    },
  });

  const notify = process.env.ADMIN_EMAIL;
  if (notify) {
    await sendEmail({
      to: notify,
      subject: `Profile reported: ${agent.name} (/${agent.slug})`,
      text: [
        `A visitor reported ${agent.name}'s profile on agentprofile.ae.`,
        "",
        `Reason: ${reportReasonLabel(parsed.data.reason)}`,
        parsed.data.details ? `Details: ${parsed.data.details}` : "",
        parsed.data.contact ? `Reporter contact: ${parsed.data.contact}` : "Reporter left no contact details.",
        "",
        `Profile: ${siteUrl()}/${agent.slug}`,
        `Review in admin: ${siteUrl()}/admin/reports`,
      ]
        .filter((line, i, all) => line !== "" || all[i - 1] !== "")
        .join("\n"),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: report.id });
}
