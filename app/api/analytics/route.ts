import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const LEAD_TYPES = new Set(["whatsapp_click", "call_click", "email_click", "book_click"]);
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const agentId = session.user.id;
  const since30 = new Date(Date.now() - 30 * DAY_MS);

  const [events, properties] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { agentId },
      select: { type: true, propertyId: true, createdAt: true },
    }),
    prisma.property.findMany({
      where: { agentId },
      select: { id: true, title: true },
    }),
  ]);

  const titleById = new Map(properties.map((p) => [p.id, p.title]));

  const dailyMap = new Map<string, { date: string; profileViews: number; listingViews: number; leads: number }>();
  for (let i = 29; i >= 0; i--) {
    const key = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
    dailyMap.set(key, { date: key, profileViews: 0, listingViews: 0, leads: 0 });
  }

  const leadsByChannel = { whatsapp: 0, call: 0, email: 0, book: 0 };
  const listingStats = new Map<string, { views: number; leads: number }>();

  let totalProfileViews = 0;
  let totalListingViews = 0;
  let totalLeads = 0;
  let totalShares = 0;

  for (const ev of events) {
    const dayKey = ev.createdAt.toISOString().slice(0, 10);
    const bucket = dailyMap.get(dayKey);

    if (ev.type === "profile_view") {
      totalProfileViews++;
      if (bucket) bucket.profileViews++;
    } else if (ev.type === "listing_view") {
      totalListingViews++;
      if (bucket) bucket.listingViews++;
      if (ev.propertyId) {
        const s = listingStats.get(ev.propertyId) ?? { views: 0, leads: 0 };
        s.views++;
        listingStats.set(ev.propertyId, s);
      }
    } else if (LEAD_TYPES.has(ev.type)) {
      totalLeads++;
      if (bucket) bucket.leads++;
      const channel = ev.type.replace("_click", "") as "whatsapp" | "call" | "email" | "book";
      leadsByChannel[channel]++;
      if (ev.propertyId) {
        const s = listingStats.get(ev.propertyId) ?? { views: 0, leads: 0 };
        s.leads++;
        listingStats.set(ev.propertyId, s);
      }
    } else if (ev.type === "share") {
      totalShares++;
    }
  }

  const last30Events = events.filter((e) => e.createdAt >= since30);
  const last30 = {
    profileViews: last30Events.filter((e) => e.type === "profile_view").length,
    listingViews: last30Events.filter((e) => e.type === "listing_view").length,
    leads: last30Events.filter((e) => LEAD_TYPES.has(e.type)).length,
  };

  const topListings = [...listingStats.entries()]
    .map(([id, v]) => ({ id, title: titleById.get(id) ?? "Untitled listing", ...v }))
    .sort((a, b) => b.views + b.leads - (a.views + a.leads))
    .slice(0, 5);

  return NextResponse.json({
    totals: { profileViews: totalProfileViews, listingViews: totalListingViews, leads: totalLeads, shares: totalShares },
    last30,
    daily: [...dailyMap.values()],
    leadsByChannel,
    topListings,
  });
}
