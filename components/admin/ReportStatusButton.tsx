"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReportStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const resolved = status === "resolved";

  async function toggle() {
    setSaving(true);
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: resolved ? "open" : "resolved" }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="admin-report-status">
      <span className={`admin-badge ${resolved ? "tone-primary" : "tone-gold"}`}>{resolved ? "Resolved" : "Open"}</span>
      <button type="button" className="btn-ghost-sm" onClick={toggle} disabled={saving}>
        {saving ? "Saving…" : resolved ? "Reopen" : "Mark resolved"}
      </button>
    </div>
  );
}
