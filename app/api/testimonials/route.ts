import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  quote: z.string().min(1).max(600),
  author: z.string().min(1).max(80),
  rating: z.coerce.number().int().min(1).max(5),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const testimonial = await prisma.testimonial.create({
    data: { ...parsed.data, agentId: session.user.id },
  });

  return NextResponse.json(testimonial);
}
