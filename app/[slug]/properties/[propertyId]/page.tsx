import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/adminAuth";
import { PropertyDetailView } from "@/components/PropertyDetailView";

async function getData(slug: string, propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { agent: { omit: { email: true } } },
  });
  if (!property || property.agent.slug !== slug) return null;
  return property;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; propertyId: string }>;
}): Promise<Metadata> {
  const { slug, propertyId } = await params;
  const property = await getData(slug, propertyId);
  if (!property) return { title: "Property not found" };
  return { title: `${property.title} — agentprofile.ae` };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string; propertyId: string }>;
}) {
  const { slug, propertyId } = await params;
  const property = await getData(slug, propertyId);
  if (!property) notFound();

  const [session, isReviewer] = await Promise.all([auth(), isAdminAuthed()]);
  const isOwner = session?.user?.id === property.agentId;
  const isLive = property.agent.isApproved; // this listing existing already satisfies the "at least one listing" gate

  if (!isLive && !isOwner && !isReviewer) notFound();

  if (!isOwner && !isReviewer) {
    await prisma.analyticsEvent
      .create({ data: { agentId: property.agentId, propertyId: property.id, type: "listing_view" } })
      .catch(() => {});
  }

  return <PropertyDetailView property={property} agent={property.agent} />;
}
