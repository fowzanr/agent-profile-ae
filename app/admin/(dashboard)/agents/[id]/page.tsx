import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AgentDetailView } from "@/components/admin/AgentDetailView";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      properties: { orderBy: { createdAt: "desc" } },
      leads: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!agent) notFound();

  const [leadCount, analyticsByType] = await Promise.all([
    prisma.lead.count({ where: { agentId: id } }),
    prisma.analyticsEvent.groupBy({ by: ["type"], where: { agentId: id }, _count: { _all: true } }),
  ]);

  return (
    <AgentDetailView
      agent={agent}
      leadCount={leadCount}
      analyticsByType={analyticsByType.map((a) => ({ type: a.type, count: a._count._all }))}
    />
  );
}
