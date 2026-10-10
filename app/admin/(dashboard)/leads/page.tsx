import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/lib/date";
import { LeadsFilterBar } from "@/components/admin/LeadsFilterBar";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 25;

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  call: "Call",
  email: "Email",
  book: "Booking",
  form: "Form",
};

const RANGE_DAYS: Record<string, number | null> = { "7d": 7, "30d": 30, all: null };

function buildLeadsHref(page: number, agent: string, channel: string, range: string, agentId?: string) {
  const params = new URLSearchParams();
  if (agentId) params.set("agentId", agentId);
  if (agent.trim()) params.set("agent", agent.trim());
  if (channel !== "all") params.set("channel", channel);
  if (range !== "all") params.set("range", range);
  if (page !== 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/leads${qs ? `?${qs}` : ""}`;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; agentId?: string; channel?: string; range?: string; page?: string }>;
}) {
  const { agent = "", agentId, channel = "all", range = "all", page: rawPage = "1" } = await searchParams;
  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const rangeDays = RANGE_DAYS[range] ?? null;
  const since = rangeDays ? daysAgo(rangeDays) : null;

  const filteredAgent = agentId ? await prisma.agent.findUnique({ where: { id: agentId }, select: { id: true, name: true } }) : null;

  const where: Prisma.LeadWhereInput = {
    ...(channel !== "all" ? { channel } : {}),
    ...(since ? { createdAt: { gte: since } } : {}),
    ...(filteredAgent ? { agentId: filteredAgent.id } : {}),
    ...(agent.trim()
      ? {
          agent: {
            OR: [{ name: { contains: agent.trim() } }, { email: { contains: agent.trim() } }],
          },
        }
      : {}),
  };

  const [total, leads, totalAllTime, last7d, last30d, analyticsByType] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      include: { agent: { select: { id: true, name: true } }, property: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.lead.count({ where: { createdAt: { gte: daysAgo(30) } } }),
    prisma.analyticsEvent.groupBy({ by: ["type"], _count: { _all: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-page-title">Leads & analytics</div>
          <div className="admin-page-sub">Every enquiry and engagement event across all agents.</div>
        </div>
      </div>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value tone-primary">{totalAllTime.toLocaleString("en-US")}</div>
          <div className="admin-stat-label">Leads all-time</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value tone-gold">{last7d.toLocaleString("en-US")}</div>
          <div className="admin-stat-label">Leads (7d)</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value tone-accent3">{last30d.toLocaleString("en-US")}</div>
          <div className="admin-stat-label">Leads (30d)</div>
        </div>
      </div>

      {analyticsByType.length > 0 && (
        <div className="admin-analytics-row">
          {analyticsByType.map((a) => (
            <div className="admin-stat-chip" key={a.type}>
              <span className="admin-stat-chip-value">{a._count._all}</span>
              <span className="admin-stat-chip-label">{a.type.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      )}

      {filteredAgent && (
        <div className="admin-filter-chip">
          Filtering by <strong>{filteredAgent.name}</strong>
          <Link href="/admin/leads" className="admin-filter-chip-clear">
            Clear
          </Link>
        </div>
      )}

      <LeadsFilterBar agent={agent} channel={channel} range={range} />

      {leads.length === 0 ? (
        <div className="admin-empty">No leads match these filters.</div>
      ) : (
        <div className="admin-section" style={{ gap: 14 }}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Contact</th>
                  <th>Agent</th>
                  <th>Property</th>
                  <th>Channel</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.name}
                      {l.message && <div className="admin-table-muted admin-lead-message">{l.message}</div>}
                    </td>
                    <td className="admin-table-muted">{l.contact}</td>
                    <td>
                      <Link href={`/admin/agents/${l.agent.id}`} className="admin-table-link">
                        {l.agent.name}
                      </Link>
                    </td>
                    <td className="admin-table-muted">{l.property?.title ?? "—"}</td>
                    <td>
                      <span className="admin-badge tone-muted">{CHANNEL_LABEL[l.channel] ?? l.channel}</span>
                    </td>
                    <td className="admin-table-muted">{l.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <Link
                href={buildLeadsHref(page - 1, agent, channel, range, filteredAgent?.id)}
                className={`btn-ghost-sm${page <= 1 ? " admin-disabled-link" : ""}`}
                aria-disabled={page <= 1}
              >
                Previous
              </Link>
              <span className="admin-page-indicator">
                Page {page} of {totalPages} · {total.toLocaleString("en-US")} result{total === 1 ? "" : "s"}
              </span>
              <Link
                href={buildLeadsHref(page + 1, agent, channel, range, filteredAgent?.id)}
                className={`btn-ghost-sm${page >= totalPages ? " admin-disabled-link" : ""}`}
                aria-disabled={page >= totalPages}
              >
                Next
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
