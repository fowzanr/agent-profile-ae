"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CHANNEL_OPTIONS = [
  { value: "all", label: "All channels" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "book", label: "Booking" },
  { value: "form", label: "Form" },
];

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

export function LeadsFilterBar({ agent, channel, range }: { agent: string; channel: string; range: string }) {
  const router = useRouter();
  const [value, setValue] = useState(agent);

  function navigate(next: { agent?: string; channel?: string; range?: string }) {
    const params = new URLSearchParams();
    const nextAgent = next.agent ?? agent;
    const nextChannel = next.channel ?? channel;
    const nextRange = next.range ?? range;
    if (nextAgent.trim()) params.set("agent", nextAgent.trim());
    if (nextChannel !== "all") params.set("channel", nextChannel);
    if (nextRange !== "all") params.set("range", nextRange);
    router.push(`/admin/leads${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="admin-filters-bar">
      <form
        className="admin-search-form"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ agent: value });
        }}
      >
        <input
          type="search"
          placeholder="Filter by agent name or email…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="admin-search-input"
        />
        <button type="submit" className="btn-ghost-sm">
          Filter
        </button>
      </form>

      <select className="admin-select" value={channel} onChange={(e) => navigate({ channel: e.target.value })}>
        {CHANNEL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select className="admin-select" value={range} onChange={(e) => navigate({ range: e.target.value })}>
        {RANGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
