import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { reportReasonLabel } from "@/lib/reports";
import { ReportStatusButton } from "@/components/admin/ReportStatusButton";

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
] as const;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: rawStatus = "open" } = await searchParams;
  const status = FILTERS.some((f) => f.value === rawStatus) ? rawStatus : "open";

  const [reports, openCount] = await Promise.all([
    prisma.report.findMany({
      where: status === "all" ? {} : { status },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { agent: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.report.count({ where: { status: "open" } }),
  ]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-page-title">Reports</div>
          <div className="admin-page-sub">
            Profiles flagged by visitors. {openCount === 0 ? "Nothing waiting." : `${openCount} open.`}
          </div>
        </div>
      </div>

      <div className="admin-report-filters">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "open" ? "/admin/reports" : `/admin/reports?status=${f.value}`}
            className={`sub-nav-pill${status === f.value ? " active" : ""}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="admin-empty">{status === "open" ? "No open reports." : "No reports here."}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Reason</th>
                <th>Reporter</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/agents/${r.agent.id}`} className="admin-table-link">
                      {r.agent.name}
                    </Link>
                    <div className="admin-table-muted">
                      <a href={`/${r.agent.slug}`} target="_blank" rel="noreferrer" className="admin-open-link">
                        /{r.agent.slug}
                      </a>
                    </div>
                  </td>
                  <td>
                    {reportReasonLabel(r.reason)}
                    {r.details && <div className="admin-table-muted admin-lead-message">{r.details}</div>}
                  </td>
                  <td className="admin-table-muted">{r.contact ?? "Anonymous"}</td>
                  <td className="admin-table-muted">
                    {r.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td>
                    <ReportStatusButton id={r.id} status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
