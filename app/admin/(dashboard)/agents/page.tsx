import { prisma } from "@/lib/prisma";
import { AgentsFilterBar } from "@/components/admin/AgentsFilterBar";
import { AgentsTable } from "@/components/admin/AgentsTable";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

type Status = "all" | "pending" | "approved" | "draft";

function statusWhere(status: Status): Prisma.AgentWhereInput {
  if (status === "pending") return { submittedForReview: true, isApproved: false };
  if (status === "approved") return { isApproved: true };
  if (status === "draft") return { submittedForReview: false, isApproved: false };
  return {};
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q = "", status: rawStatus = "all", page: rawPage = "1" } = await searchParams;
  const status: Status = ["pending", "approved", "draft"].includes(rawStatus) ? (rawStatus as Status) : "all";
  const page = Math.max(1, parseInt(rawPage, 10) || 1);

  const where: Prisma.AgentWhereInput = {
    ...statusWhere(status),
    ...(q.trim()
      ? {
          OR: [
            { name: { contains: q.trim() } },
            { email: { contains: q.trim() } },
            { agency: { contains: q.trim() } },
            { brn: { contains: q.trim() } },
            { slug: { contains: q.trim() } },
          ],
        }
      : {}),
  };

  const [total, agents] = await Promise.all([
    prisma.agent.count({ where }),
    prisma.agent.findMany({
      where,
      include: { properties: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-page-title">Agents</div>
          <div className="admin-page-sub">{total.toLocaleString("en-US")} agent{total === 1 ? "" : "s"} total</div>
        </div>
      </div>

      <AgentsFilterBar q={q} status={status} />
      <AgentsTable agents={agents} page={page} totalPages={totalPages} q={q} status={status} />
    </div>
  );
}
