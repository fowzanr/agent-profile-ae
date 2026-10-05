import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyCreateSchema } from "@/lib/propertySchema";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = propertyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const count = await prisma.property.count({ where: { agentId: session.user.id } });

  const property = await prisma.property.create({
    data: {
      ...parsed.data,
      rentalPeriod: parsed.data.listingType === "rent" ? parsed.data.rentalPeriod : null,
      handoverNote: parsed.data.handoverNote || null,
      plotArea: parsed.data.plotArea || null,
      completionPercent: parsed.data.status === "offplan" ? parsed.data.completionPercent || null : null,
      expectedRentYearly: parsed.data.listingType === "sale" ? parsed.data.expectedRentYearly || null : null,
      image1: parsed.data.image1 || null,
      image2: parsed.data.image2 || null,
      image3: parsed.data.image3 || null,
      isFeatured: Boolean(parsed.data.isFeatured),
      imageSeed: (count % 5) + 1,
      agentId: session.user.id,
    },
  });

  return NextResponse.json(property);
}
