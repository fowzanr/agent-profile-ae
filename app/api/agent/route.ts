import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BRN_PATTERN, SLUG_PATTERN, RESERVED_SLUGS } from "@/lib/validation";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  agency: z.string().optional(),
  role: z.string().min(2).optional(),
  brn: z.string().regex(BRN_PATTERN, "Enter a valid RERA BRN — numbers only (3–7 digits)").optional(),
  dedLicensed: z.boolean().optional(),
  bio: z.string().optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  contactEmail: z.union([z.literal(""), z.string().email()]).optional(),
  instagramUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  tiktokUrl: z.string().optional().nullable(),
  specialities: z.string().optional(),
  areas: z.string().optional(),
  languages: z.string().optional(),
  accountType: z.enum(["agent", "agency"]).optional(),
  photoUrl: z.string().optional().nullable(),
  onboarded: z.boolean().optional(),
  submittedForReview: z.boolean().optional(),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers, and hyphens only")
    .optional(),
  availabilityStatus: z.enum(["available", "busy"]).optional(),
  manualForSaleCount: z.coerce.number().int().min(0).max(999).optional(),
  manualForRentCount: z.coerce.number().int().min(0).max(999).optional(),
  transactedVolume: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = { ...data };
  if (data.instagramUrl !== undefined) updateData.instagramUrl = data.instagramUrl || null;
  if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl || null;
  if (data.tiktokUrl !== undefined) updateData.tiktokUrl = data.tiktokUrl || null;
  if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl || null;
  if (data.transactedVolume !== undefined) updateData.transactedVolume = data.transactedVolume === "" ? null : data.transactedVolume;

  if (data.slug !== undefined) {
    const current = await prisma.agent.findUnique({
      where: { id: session.user.id },
      select: { slug: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (RESERVED_SLUGS.has(data.slug)) {
      return NextResponse.json({ error: "That URL isn't available" }, { status: 409 });
    }
    if (data.slug !== current.slug) {
      const taken = await prisma.agent.findUnique({ where: { slug: data.slug } });
      if (taken) {
        return NextResponse.json({ error: "That URL is already taken" }, { status: 409 });
      }
    }
  }

  const agent = await prisma.agent.update({
    where: { id: session.user.id },
    data: updateData,
  });

  return NextResponse.json({
    slug: agent.slug,
    submittedForReview: agent.submittedForReview,
    isApproved: agent.isApproved,
  });
}
