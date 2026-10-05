"use client";

import { useState } from "react";
import Link from "next/link";
import type { Agent } from "@prisma/client";

type QueueAgent = Agent & { properties: { id: string }[] };

export function PendingReviewList({ agents }: { agents: QueueAgent[] }) {
  const [list, setList] = useState(agents);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reject(agent: QueueAgent) {
    setBusyId(agent.id);
    await fetch(`/api/admin/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submittedForReview: false }),
    });
    setBusyId(null);
    setList((prev) => prev.filter((a) => a.id !== agent.id));
  }

  if (list.length === 0) {
    return <div className="admin-empty">Nothing waiting on review.</div>;
  }

  return (
    <div className="admin-list">
      {list.map((a) => (
        <div className="admin-card" key={a.id}>
          <div className="admin-card-main">
            <div className="admin-card-name">
              <Link href={`/admin/agents/${a.id}`}>{a.name}</Link>
              {a.agency && <span className="admin-card-agency">· {a.agency}</span>}
            </div>
            <div className="admin-card-meta">
              BRN {a.brn} · {a.email} · {a.properties.length} listing{a.properties.length === 1 ? "" : "s"}
              {a.properties.length === 0 && (
                <span className="admin-flag"> — no listings, won&apos;t go live even if approved</span>
              )}
            </div>
          </div>
          <div className="admin-card-actions">
            <Link className="btn-ghost-sm" href={`/${a.slug}`} target="_blank">
              Preview
            </Link>
            <button className="btn-ghost-sm" disabled={busyId === a.id} onClick={() => reject(a)}>
              Reject
            </button>
            <Link className="btn-primary" style={{ padding: "8px 16px" }} href={`/admin/agents/${a.id}`}>
              Review &amp; verify
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
