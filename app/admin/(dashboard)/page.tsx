import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/lib/date";
import { PendingReviewList } from "@/components/admin/PendingReviewList";

export default async function AdminOverviewPage() {
  const since7d = daysAgo(7);
  const since30d = daysAgo(30);

  const [
    totalAgents,
    pendingCount,
    approvedCount,
    totalProperties,
    totalLeads,
    leadsLast7d,
    signupsLast30d,
    pendingAgents,
    recentAgents,
  ] = await Promise.all([
    prisma.agent.count(),
    prisma.agent.count({ where: { submittedForReview: true, isApproved: false } }),
    prisma.agent.count({ where: { isApproved: true } }),
    prisma.property.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: since7d } } }),
    prisma.agent.count({ where: { createdAt: { gte: since30d } } }),
    prisma.agent.findMany({
      where: { submittedForReview: true, isApproved: false },
      include: { properties: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.agent.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, agency: true, slug: true, createdAt: true, isApproved: true, submittedForReview: true },
    }),
  ]);

  const stats = [
    { label: "Total agents", value: totalAgents, tone: "primary" as const },
    { label: "Pending review", value: pendingCount, tone: "gold" as const },
    { label: "Approved & live-ready", value: approvedCount, tone: "primary" as const },
    { label: "Signups (30d)", value: signupsLast30d, tone: "accent3" as const },
    { label: "Total listings", value: totalProperties, tone: "accent3" as const },
    { label: "Leads (7d)", value: leadsLast7d, tone: "gold" as const, footnote: `${totalLeads} all-time` },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-page-title">Overview</div>
          <div className="admin-page-sub">What&apos;s happening across the platform right now.</div>
        </div>
      </div>

      <div className="admin-stat-grid">
        {stats.map((s) => (
          <div className="admin-stat-card" key={s.label}>
            <div className={`admin-stat-value tone-${s.tone}`}>{s.value.toLocaleString("en-US")}</div>
            <div className="admin-stat-label">{s.label}</div>
            {s.footnote && <div className="admin-stat-footnote">{s.footnote}</div>}
          </div>
        ))}
      </div>

      <section className="admin-section">
        <div className="admin-section-title">
          Needs attention <span className="admin-count">{pendingCount}</span>
          <Link href="/admin/agents?status=pending" className="admin-section-link">
            View all
          </Link>
        </div>
        <PendingReviewList agents={pendingAgents} />
      </section>

      <section className="admin-section">
        <div className="admin-section-title">
          Recent signups
          <Link href="/admin/agents" className="admin-section-link">
            View all
          </Link>
        </div>
        {recentAgents.length === 0 ? (
          <div className="admin-empty">No agents yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Agency</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentAgents.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/admin/agents/${a.id}`} className="admin-table-link">
                        {a.name}
                      </Link>
                    </td>
                    <td>{a.agency || "—"}</td>
                    <td className="admin-table-muted">{a.email}</td>
                    <td>
                      <span className={`admin-badge ${a.isApproved ? "tone-primary" : a.submittedForReview ? "tone-gold" : "tone-muted"}`}>
                        {a.isApproved ? "Approved" : a.submittedForReview ? "Pending" : "Draft"}
                      </span>
                    </td>
                    <td className="admin-table-muted">{a.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
