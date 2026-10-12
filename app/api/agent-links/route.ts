import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LINK_KINDS } from "@/lib/featuredLinks";

const MAX_LINKS = 12;

const linkSchema = z.object({
  label: z.string().trim().min(1, "Give the link a short label").max(40),
  url: z
    .string()
    .trim()
    .url("Enter a full link, starting with https://")
    .refine((u) => /^https?:\/\//i.test(u), "Enter a full link, starting with https://"),
  kind: z.enum(LINK_KINDS).nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const count = await prisma.agentLink.count({ where: { agentId: session.user.id } });
  if (count >= MAX_LINKS) {
    return NextResponse.json({ error: `You can add up to ${MAX_LINKS} links` }, { status: 400 });
  }
  const link = await prisma.agentLink.create({
    data: { ...parsed.data, kind: parsed.data.kind ?? null, agentId: session.user.id, order: count },
  });

  return NextResponse.json(link);
}
