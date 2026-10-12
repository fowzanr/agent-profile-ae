import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LINK_KINDS } from "@/lib/featuredLinks";

const patchSchema = z.object({
  label: z.string().trim().min(1).max(40).optional(),
  kind: z.enum(LINK_KINDS).nullable().optional(),
  pinned: z.boolean().optional(),
});

async function ownLink(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const link = await prisma.agentLink.findUnique({ where: { id } });
  if (!link || link.agentId !== session.user.id) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { link };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { link, error } = await ownLink(id);
  if (error) return error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Only one pinned link per agent: pinning this one unpins the rest.
  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.pinned) {
      await tx.agentLink.updateMany({ where: { agentId: link.agentId, pinned: true, NOT: { id } }, data: { pinned: false } });
    }
    return tx.agentLink.update({ where: { id }, data: parsed.data });
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await ownLink(id);
  if (error) return error;

  await prisma.agentLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
