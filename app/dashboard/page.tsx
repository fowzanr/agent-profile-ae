import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardView } from "@/components/DashboardView";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const agent = await prisma.agent.findUnique({
    where: { id: session.user.id },
    include: {
      properties: { orderBy: { createdAt: "desc" } },
      links: { orderBy: { order: "asc" } },
      testimonials: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!agent) redirect("/login");

  return <DashboardView agent={agent} />;
}
