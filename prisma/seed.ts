import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// SEED_MODE=production-demo seeds ahmed for a live database: hidden (not approved),
// obviously fake contact details, and a random password printed once.
const productionDemo = process.env.SEED_MODE === "production-demo";
const demo = productionDemo
  ? {
      email: "ahmed@example.com",
      phone: "971500000000",
      brn: "000000",
      password: randomBytes(12).toString("base64url"),
      social: (url: string) => new URL(url).origin,
      leadPhone: (n: string) => n.replace(/\d(?=\d{0,3}$)/g, "0"),
    }
  : {
      email: "ahmed@vantage.ae",
      phone: "971501234567",
      brn: "41527",
      password: "password123",
      social: (url: string) => url,
      leadPhone: (n: string) => n,
    };

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(demo.password, 10);
  const now = new Date();

  await prisma.agent.deleteMany({ where: { slug: "ahmed" } });

  const ahmed = await prisma.agent.create({
    data: {
      slug: "ahmed",
      email: demo.email,
      passwordHash,
      emailVerifiedAt: now,
      name: "Ahmed Al Falasi",
      agency: "Vantage Real Estate",
      avatarInitials: "AF",
      photoUrl: "/seed/ahmed-photo.svg",
      photoSourceUrl: "/seed/ahmed-photo.svg",
      coverUrl: "/seed/ahmed-cover.svg",
      coverSourceUrl: "/seed/ahmed-cover.svg",
      accountType: "agent",
      brn: demo.brn,
      dedLicensed: true,
      role: "Luxury & Off-Plan Specialist",
      bio: "Luxury & off-plan specialist at Vantage Real Estate\nPalm Jumeirah · Dubai Marina · Business Bay\nSame-day replies · Arabic, English, Hindi",
      yearsExperience: 8,
      whatsapp: demo.phone,
      phone: demo.phone,
      contactEmail: demo.email,
      instagramUrl: demo.social("https://instagram.com/ahmed.vantage"),
      facebookUrl: demo.social("https://facebook.com/ahmed.vantage"),
      linkedinUrl: demo.social("https://linkedin.com/in/ahmed-al-falasi"),
      tiktokUrl: demo.social("https://tiktok.com/@ahmed.vantage"),
      youtubeUrl: demo.social("https://youtube.com/@ahmedvantage"),
      pinterestUrl: demo.social("https://pinterest.com/ahmedvantage"),
      bookingMode: "form",
      spotifyUrl: demo.social("https://open.spotify.com/show/dubai-property-talk"),
      websiteUrl: productionDemo ? "https://example.com" : "https://vantage.ae",
      specialities: "Residential Sales, Off-Plan Sales, Luxury Leasing, Investment Advisory",
      areas: "Palm Jumeirah, Dubai Marina, Business Bay, Downtown Dubai, JVC",
      languages: "Arabic, English, Hindi",
      onboarded: true,
      isPro: true,
      submittedForReview: !productionDemo,
      isApproved: !productionDemo,
      brnVerifiedAt: productionDemo ? null : now,
      socialVerifiedAt: productionDemo ? null : now,
      isVerified: !productionDemo,
      availabilityStatus: "available",
      manualForSaleCount: 12,
      manualForRentCount: 7,
      transactedVolume: 45500000,
      links: {
        create: [
          { label: "Palm Jumeirah villa tour", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", kind: "video", pinned: true, order: 0 },
          { label: "Dubai Property Minute", url: "https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl", kind: "audio", order: 1 },
          { label: "Off-Plan Investing 101", url: productionDemo ? "https://example.com/course" : "https://vantage.teachable.com/p/off-plan-101", kind: "course", order: 2 },
          { label: "Dubai Buyers Circle", url: productionDemo ? "https://example.com/community" : "https://chat.whatsapp.com/DubaiBuyersCircle", kind: "community", order: 3 },
          { label: "Vantage Real Estate", url: productionDemo ? "https://example.com" : "https://vantage.ae", kind: "website", order: 4 },
        ],
      },
      properties: {
        create: [
          {
            title: "Signature Villa, Frond D",
            location: "Palm Jumeirah — Signature Villa, Frond D",
            price: 18500000,
            listingType: "sale",
            status: "ready",
            beds: 6,
            baths: 7,
            sqft: 9800,
            description:
              "A beachfront signature villa on Frond D with private pool, direct beach access, and unobstructed sea views. Recently upgraded interiors, smart-home fit-out, and a four-car covered driveway. Vacant on transfer.",
            imageSeed: 1,
            propertyType: "Villa",
            furnishing: "unfurnished",
            ownership: "freehold",
            usage: "residential",
            hasParking: true,
            hasBalcony: true,
            plotArea: 14000,
            expectedRentYearly: 950000,
          },
          {
            title: "Marina Gate II",
            location: "Dubai Marina — Marina Gate II",
            price: 3200000,
            listingType: "sale",
            status: "ready",
            beds: 2,
            baths: 3,
            sqft: 1450,
            description: "A high-floor two-bedroom in Marina Gate II with full Marina views and access to the building's pool, gym, and direct mall walkway.",
            imageSeed: 2,
            propertyType: "Apartment",
            furnishing: "unfurnished",
            ownership: "freehold",
            usage: "residential",
            hasParking: true,
            hasBalcony: true,
            expectedRentYearly: 185000,
          },
          {
            title: "Burj Vista",
            location: "Downtown Dubai — Burj Vista",
            price: 210000,
            listingType: "rent",
            status: "ready",
            rentalPeriod: "yearly",
            beds: 1,
            baths: 2,
            sqft: 890,
            description: "A one-bedroom in Burj Vista with Burj Khalifa and fountain views, steps from Dubai Mall.",
            imageSeed: 4,
            propertyType: "Apartment",
            furnishing: "furnished",
            ownership: "freehold",
            usage: "residential",
            hasParking: true,
            hasBalcony: true,
          },
          {
            title: "Marina Promenade — Furnished",
            location: "Dubai Marina — Marina Promenade",
            price: 14000,
            listingType: "rent",
            status: "ready",
            rentalPeriod: "monthly",
            beds: 1,
            baths: 1,
            sqft: 750,
            description: "A fully furnished one-bedroom on the Marina Promenade — flexible monthly terms, bills included, walking distance to the Marina walk.",
            imageSeed: 2,
            propertyType: "Apartment",
            furnishing: "furnished",
            ownership: "freehold",
            usage: "residential",
            hasParking: true,
            hasBalcony: false,
          },
          {
            title: "JBR Beachfront Studio",
            location: "Jumeirah Beach Residence — Sadaf",
            price: 3200,
            listingType: "rent",
            status: "ready",
            rentalPeriod: "weekly",
            beds: 1,
            baths: 1,
            sqft: 480,
            description: "A beachfront studio in JBR Sadaf, fully serviced — ideal for a short stay, steps from The Walk and the beach.",
            imageSeed: 5,
            propertyType: "Studio",
            furnishing: "furnished",
            ownership: "freehold",
            usage: "residential",
            hasParking: false,
            hasBalcony: true,
          },
          {
            title: "Downtown Holiday Home",
            location: "Downtown Dubai — Boulevard Point",
            price: 950,
            listingType: "rent",
            status: "ready",
            rentalPeriod: "daily",
            beds: 2,
            baths: 2,
            sqft: 1100,
            description: "A two-bedroom holiday home on the Boulevard with a Burj Khalifa view — daily housekeeping, ready for immediate check-in.",
            imageSeed: 3,
            propertyType: "Apartment",
            furnishing: "furnished",
            ownership: "freehold",
            usage: "residential",
            hasParking: true,
            hasBalcony: true,
          },
          {
            title: "Peninsula Two",
            location: "Business Bay — Peninsula Two",
            price: 1650000,
            listingType: "sale",
            status: "offplan",
            beds: 1,
            baths: 1,
            sqft: 1050,
            description: "An off-plan one-bedroom in Select Group's Peninsula Two, on the Business Bay waterfront with a flexible payment plan.",
            handoverNote: "Handover Q4 2027",
            imageSeed: 3,
            propertyType: "Apartment",
            furnishing: "unfurnished",
            ownership: "freehold",
            usage: "residential",
            hasParking: true,
            hasBalcony: true,
            completionPercent: 35,
            expectedRentYearly: 110000,
          },
          {
            title: "Elan Townhouses",
            location: "Jumeirah Village Circle — Elan Townhouses",
            price: 2450000,
            listingType: "sale",
            status: "ready",
            beds: 3,
            baths: 4,
            sqft: 2100,
            description: "A three-bedroom townhouse in the Elan community, JVC — private garden, covered parking for two, and a community pool and park.",
            imageSeed: 5,
            propertyType: "Townhouse",
            furnishing: "unfurnished",
            ownership: "freehold",
            usage: "residential",
            hasParking: true,
            hasBalcony: true,
            plotArea: 2800,
            expectedRentYearly: 175000,
          },
        ],
      },
      testimonials: {
        create: [
          {
            quote:
              "Ahmed found us a Marina apartment in nine days flat, negotiated AED 150K off asking, and was in every viewing on time.",
            author: "Priya S. — Bought in Dubai Marina",
            rating: 5,
          },
          {
            quote:
              "Handled our off-plan purchase in Business Bay end-to-end, including the DLD paperwork. Zero surprises at handover.",
            author: "Michael R. — Bought in Business Bay",
            rating: 5,
          },
          {
            quote: "Sold our villa above asking within three weeks. Professional, responsive, and knows Palm Jumeirah inside out.",
            author: "Fatima & Omar K. — Sold in Palm Jumeirah",
            rating: 5,
          },
        ],
      },
    },
  });

  // Sample leads and analytics so the dashboard and admin screens have data.
  const listings = await prisma.property.findMany({ where: { agentId: ahmed.id }, select: { id: true } });
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  await prisma.lead.createMany({
    data: [
      { agentId: ahmed.id, propertyId: listings[0]?.id, name: "Sara Khan", contact: demo.leadPhone("+971 55 123 4567"), message: "Is the Frond D villa still available for a viewing this weekend?", channel: "whatsapp", createdAt: daysAgo(1) },
      { agentId: ahmed.id, name: "James Porter", contact: "james.porter@example.com", message: "Looking for a 2-bed in Dubai Marina, budget AED 2.5M.", channel: "form", createdAt: daysAgo(3) },
      { agentId: ahmed.id, propertyId: listings[1]?.id, name: "Layla Haddad", contact: demo.leadPhone("+971 50 987 6543"), channel: "call", createdAt: daysAgo(6) },
    ],
  });
  const eventTypes = ["profile_view", "profile_view", "profile_view", "whatsapp_click", "call_click", "email_click", "book_click", "share"];
  await prisma.analyticsEvent.createMany({
    data: Array.from({ length: 120 }, (_, i) => ({
      agentId: ahmed.id,
      type: eventTypes[i % eventTypes.length],
      createdAt: daysAgo((i * 7) % 30),
    })),
  });

  console.log(`Seeded agent: ${ahmed.name} (/${ahmed.slug})`);
  console.log(`Login: ${demo.email} / ${demo.password}`);
  if (productionDemo) console.log("Hidden demo: not approved, so /ahmed is visible only to this login and admins.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
