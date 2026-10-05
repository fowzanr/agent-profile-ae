import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { BRN_PATTERN } from "@/lib/validation";

const signupSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  slug: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agency: z.string().optional(),
  role: z.string().min(2, "Enter your job role"),
  bio: z.string().optional(),
  brn: z.string().regex(BRN_PATTERN, "Enter a valid RERA BRN — numbers only (3–7 digits)"),
});

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, slug: claimedSlug, email, password, agency, role, bio, brn } = parsed.data;

  const existing = await prisma.agent.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const baseSlug = slugify(claimedSlug ?? "") || slugify(name) || "agent";
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.agent.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const agent = await prisma.agent.create({
    data: {
      slug,
      email,
      passwordHash,
      name,
      agency: agency ?? "",
      brn,
      avatarInitials: initialsOf(name),
      role,
      bio: bio ?? "",
      yearsExperience: 0,
      whatsapp: "",
      phone: "",
      contactEmail: email,
      specialities: "",
      areas: "",
      languages: "English",
    },
  });

  return NextResponse.json({ slug: agent.slug });
}
