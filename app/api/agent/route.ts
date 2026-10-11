import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BRN_PATTERN, SLUG_PATTERN, RESERVED_SLUGS } from "@/lib/validation";
import { BIO_MAX_LENGTH } from "@/lib/constants";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  agency: z.string().optional(),
  role: z.string().min(2).optional(),
  brn: z.string().regex(BRN_PATTERN, "Enter a valid RERA BRN — numbers only (3–7 digits)").optional(),
  dedLicensed: z.boolean().optional(),
  bio: z.string().max(BIO_MAX_LENGTH, `Bio must be ${BIO_MAX_LENGTH} characters or fewer`).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  contactEmail: z.union([z.literal(""), z.string().email()]).optional(),
  instagramUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  tiktokUrl: z.string().optional().nullable(),
  facebookUrl: z.string().optional().nullable(),
  youtubeUrl: z.string().optional().nullable(),
  pinterestUrl: z.string().optional().nullable(),
  spotifyUrl: z.string().optional().nullable(),
  specialities: z.string().optional(),
  areas: z.string().optional(),
  languages: z.string().optional(),
  accountType: z.enum(["agent", "agency"]).optional(),
  photoUrl: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  photoSourceUrl: z.string().optional().nullable(),
  coverSourceUrl: z.string().optional().nullable(),
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
  if (data.facebookUrl !== undefined) updateData.facebookUrl = data.facebookUrl || null;
  if (data.youtubeUrl !== undefined) updateData.youtubeUrl = data.youtubeUrl || null;
  if (data.pinterestUrl !== undefined) updateData.pinterestUrl = data.pinterestUrl || null;
  if (data.spotifyUrl !== undefined) updateData.spotifyUrl = data.spotifyUrl || null;
  if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl || null;
  if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl || null;
  if (data.photoSourceUrl !== undefined) updateData.photoSourceUrl = data.photoSourceUrl || null;
  if (data.coverSourceUrl !== undefined) updateData.coverSourceUrl = data.coverSourceUrl || null;
  if (data.transactedVolume !== undefined) updateData.transactedVolume = data.transactedVolume === "" ? null : data.transactedVolume;

  if (data.slug !== undefined || data.submittedForReview === true) {
    const current = await prisma.agent.findUnique({
      where: { id: session.user.id },
      select: { slug: true, emailVerifiedAt: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (data.slug !== undefined) {
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

    if (data.submittedForReview === true && !current.emailVerifiedAt) {
      return NextResponse.json(
        { error: "Confirm your email before submitting your profile for review." },
        { status: 400 },
      );
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
