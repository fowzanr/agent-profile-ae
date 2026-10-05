import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const agents = await prisma.agent.findMany({
    where: { agency: { not: "" } },
    select: { agency: true },
    distinct: ["agency"],
  });

  const agencies = [...new Set(agents.map((a) => a.agency.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );

  return NextResponse.json(agencies);
}
