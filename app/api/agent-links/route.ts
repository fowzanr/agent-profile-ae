import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const linkSchema = z.object({
  label: z.string().min(1).max(40),
  url: z.string().url(),
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
  const link = await prisma.agentLink.create({
    data: { ...parsed.data, agentId: session.user.id, order: count },
  });

  return NextResponse.json(link);
}
