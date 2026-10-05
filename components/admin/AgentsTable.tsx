"use client";

import { useState } from "react";
import Link from "next/link";
import type { Agent } from "@prisma/client";

type TableAgent = Agent & { properties: { id: string }[] };

function buildHref(page: number, q: string, status: string) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (status !== "all") params.set("status", status);
  if (page !== 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/agents${qs ? `?${qs}` : ""}`;
}

export function AgentsTable({
  agents,
  page,
  totalPages,
  q,
  status,
}: {
  agents: TableAgent[];
  page: number;
  totalPages: number;
  q: string;
  status: string;
}) {
  const [list, setList] = useState(agents);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patch(id: string, data: Record<string, boolean>) {
    setBusyId(id);
    const res = await fetch(`/api/admin/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusyId(null);
    if (res.ok) {
      const updated = await res.json();
      setList((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    }
  }

  if (list.length === 0) {
    return <div className="admin-empty">No agents match these filters.</div>;
  }

  return (
    <div className="admin-section" style={{ gap: 14 }}>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Agency</th>
              <th>Contact</th>
              <th>Listings</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/admin/agents/${a.id}`} className="admin-table-link">
                    {a.name}
                  </Link>
                  {a.isPro && <span className="admin-badge tone-gold admin-badge-inline">Pro</span>}
                  {a.isVerified && <span className="admin-badge tone-primary admin-badge-inline">Verified</span>}
                </td>
                <td className="admin-table-muted">{a.agency || "—"}</td>
                <td className="admin-table-muted">
                  <div>{a.email}</div>
                  <div>BRN {a.brn}</div>
                </td>
                <td className="admin-table-muted">{a.properties.length}</td>
                <td>
                  <span className={`admin-badge ${a.isApproved ? "tone-primary" : a.submittedForReview ? "tone-gold" : "tone-muted"}`}>
                    {a.isApproved ? "Approved" : a.submittedForReview ? "Pending" : "Draft"}
                  </span>
                </td>
                <td>
                  <div className="admin-card-actions">
                    {a.submittedForReview && !a.isApproved && (
                      <Link className="btn-primary" style={{ padding: "6px 12px" }} href={`/admin/agents/${a.id}`}>
                        Review &amp; verify
                      </Link>
                    )}
                    {a.isApproved && (
                      <button className="btn-ghost-sm" disabled={busyId === a.id} onClick={() => patch(a.id, { isApproved: false })}>
                        Revoke
                      </button>
                    )}
                    <Link className="btn-ghost-sm" href={`/admin/agents/${a.id}`}>
                      Manage
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <Link
            href={buildHref(page - 1, q, status)}
            className={`btn-ghost-sm${page <= 1 ? " admin-disabled-link" : ""}`}
            aria-disabled={page <= 1}
          >
            Previous
          </Link>
          <span className="admin-page-indicator">
            Page {page} of {totalPages}
          </span>
          <Link
            href={buildHref(page + 1, q, status)}
            className={`btn-ghost-sm${page >= totalPages ? " admin-disabled-link" : ""}`}
            aria-disabled={page >= totalPages}
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
}
