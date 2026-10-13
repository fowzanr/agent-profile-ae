import { prisma } from "@/lib/prisma";
import { LISTINGS_ENABLED } from "@/lib/constants";

export async function getAgentBySlug(slug: string) {
  const agent = await prisma.agent.findUnique({
    where: { slug },
    // Public page: secrets are omitted globally; the login email is private too.
    omit: { email: true },
    include: {
      properties: { orderBy: { createdAt: "desc" } },
      testimonials: { orderBy: { createdAt: "desc" } },
      links: { orderBy: { order: "asc" } },
    },
  });

  if (!agent) return null;

  const forSaleCount = LISTINGS_ENABLED
    ? agent.properties.filter((p) => p.listingType === "sale").length
    : agent.manualForSaleCount;
  const forRentCount = LISTINGS_ENABLED
    ? agent.properties.filter((p) => p.listingType === "rent").length
    : agent.manualForRentCount;

  return {
    agent,
    stats: { forSaleCount, forRentCount },
  };
}
