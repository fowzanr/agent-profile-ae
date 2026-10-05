"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "draft", label: "Draft" },
] as const;

export function AgentsFilterBar({ q, status }: { q: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(q);

  function navigate(next: { q?: string; status?: string }) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextStatus = next.status ?? status;
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);
    router.push(`/admin/agents${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="admin-filters-bar">
      <form
        className="admin-search-form"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ q: value });
        }}
      >
        <input
          type="search"
          placeholder="Search by name, email, agency, BRN, slug…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="admin-search-input"
        />
        <button type="submit" className="btn-ghost-sm">
          Search
        </button>
      </form>

      <div className="admin-status-tabs">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`admin-status-tab${status === opt.value ? " active" : ""}`}
            onClick={() => navigate({ status: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
