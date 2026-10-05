import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  // Review queue flags
  isApproved: z.boolean().optional(),
  submittedForReview: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  brnVerified: z.boolean().optional(), // admin confirms BRN/DED license checked
  socialVerified: z.boolean().optional(), // admin confirms social media profiles checked

  // Identity
  name: z.string().min(1).optional(),
  agency: z.string().optional(),
  accountType: z.enum(["agent", "agency"]).optional(),
  role: z.string().optional(),
  brn: z.string().optional(),
  dedLicensed: z.boolean().optional(),
  yearsExperience: z.number().int().min(0).optional(),

  // Contact
  email: z.union([z.literal(""), z.string().email()]).optional(),
  contactEmail: z.union([z.literal(""), z.string().email()]).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),

  // Social
  instagramUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),

  // About
  bio: z.string().optional(),
  specialities: z.string().optional(),
  areas: z.string().optional(),
  languages: z.string().optional(),

  // Public stats / flags
  availabilityStatus: z.enum(["available", "busy"]).optional(),
  isPro: z.boolean().optional(),
  manualForSaleCount: z.number().int().min(0).optional(),
  manualForRentCount: z.number().int().min(0).optional(),
  transactedVolume: z.number().int().min(0).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const current = await prisma.agent.findUnique({
    where: { id },
    select: { isApproved: true, brnVerifiedAt: true, socialVerifiedAt: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const { brnVerified, socialVerified, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };

  if (brnVerified !== undefined) {
    data.brnVerifiedAt = brnVerified ? (current.brnVerifiedAt ?? new Date()) : null;
  }
  if (socialVerified !== undefined) {
    data.socialVerifiedAt = socialVerified ? (current.socialVerifiedAt ?? new Date()) : null;
  }

  const nextBrnVerified = brnVerified ?? Boolean(current.brnVerifiedAt);
  const nextSocialVerified = socialVerified ?? Boolean(current.socialVerifiedAt);
  const nextIsApproved = parsed.data.isApproved ?? current.isApproved;

  if (nextIsApproved && !(nextBrnVerified && nextSocialVerified)) {
    return NextResponse.json(
      { error: "Verify the agent's BRN/license and social media profiles before approving." },
      { status: 400 },
    );
  }

  try {
    const agent = await prisma.agent.update({
      where: { id },
      data,
    });
    return NextResponse.json(agent);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "Email already in use by another agent" }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.agent.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
