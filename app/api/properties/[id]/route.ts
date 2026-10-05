import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { propertyUpdateSchema } from "@/lib/propertySchema";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });

  if (!property || property.agentId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });

  if (!property || property.agentId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = propertyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = { ...data };

  if (data.isFeatured !== undefined && data.isFeatured === property.isFeatured) {
    delete updateData.isFeatured;
  }

  if (data.listingType !== undefined || data.rentalPeriod !== undefined) {
    const listingType = data.listingType ?? property.listingType;
    updateData.rentalPeriod = listingType === "rent" ? (data.rentalPeriod ?? property.rentalPeriod) : null;
  }
  if (data.handoverNote !== undefined) updateData.handoverNote = data.handoverNote || null;
  if (data.plotArea !== undefined) updateData.plotArea = data.plotArea || null;
  if (data.completionPercent !== undefined || data.status !== undefined) {
    const status = data.status ?? property.status;
    updateData.completionPercent = status === "offplan" ? (data.completionPercent ?? property.completionPercent) || null : null;
  }
  if (data.expectedRentYearly !== undefined || data.listingType !== undefined) {
    const listingType = data.listingType ?? property.listingType;
    updateData.expectedRentYearly = listingType === "sale" ? (data.expectedRentYearly ?? property.expectedRentYearly) || null : null;
  }
  if (data.image1 !== undefined) updateData.image1 = data.image1 || null;
  if (data.image2 !== undefined) updateData.image2 = data.image2 || null;
  if (data.image3 !== undefined) updateData.image3 = data.image3 || null;

  const updated = await prisma.property.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
