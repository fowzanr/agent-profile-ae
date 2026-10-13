"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Sheet } from "@/components/Sheet";
import { CookieChoicesDialog } from "@/components/CookieChoicesDialog";
import { CheckIcon } from "@/components/icons";
import { REPORT_REASONS, type ReportReason } from "@/lib/reports";

type FooterAgent = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  slugChangedAt: Date | null;
  brnVerifiedAt: Date | null;
  socialVerifiedAt: Date | null;
  isApproved: boolean;
};

function monthYear(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "Asia/Dubai" });
}

function AboutAccount({ agent, onClose }: { agent: FooterAgent; onClose: () => void }) {
  const rows: { label: string; value: string; ok?: boolean }[] = [
    { label: "Joined", value: monthYear(agent.createdAt) },
    {
      label: "RERA / DED licence",
      value: agent.brnVerifiedAt ? `Checked by our team, ${monthYear(agent.brnVerifiedAt)}` : "Not checked yet",
      ok: Boolean(agent.brnVerifiedAt),
    },
    {
      label: "Social profiles",
      value: agent.socialVerifiedAt ? `Checked by our team, ${monthYear(agent.socialVerifiedAt)}` : "Not checked yet",
      ok: Boolean(agent.socialVerifiedAt),
    },
    {
      label: "Profile link",
      value: agent.slugChangedAt
        ? `agentprofile.ae/${agent.slug} · changed ${monthYear(agent.slugChangedAt)}`
        : `agentprofile.ae/${agent.slug} · unchanged since joining`,
    },
    { label: "Based in", value: "United Arab Emirates" },
  ];

  return (
    <Sheet title="About this account" onClose={onClose}>
      <p className="sheet-text">
        To help you decide who to trust, here&apos;s what agentprofile.ae knows about {agent.name}&apos;s account.
      </p>
      <dl className="about-list">
        {rows.map((r) => (
          <div className="about-row" key={r.label}>
            <dt>{r.label}</dt>
            <dd>
              {r.ok && <CheckIcon className="w-3.5 h-3.5 about-ok" />}
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="sheet-fineprint">
        Licence details are checked against Dubai Land Department&apos;s public broker list before a profile goes live.
        The agent writes everything else on their page.
      </p>
    </Sheet>
  );
}

function ReportProfile({ agent, onClose }: { agent: FooterAgent; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reason) return setError("Choose what's wrong.");
    if (reason === "other" && !details.trim()) return setError("Tell us a little about what's wrong.");
    setSending(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: agent.id,
        reason,
        details: details.trim() || undefined,
        contact: contact.trim() || undefined,
      }),
    }).catch(() => null);
    setSending(false);
    if (!res || !res.ok) {
      const data = await res?.json().catch(() => null);
      setError(data?.error ?? "Couldn't send your report. Try again in a moment.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Sheet title="Report sent" onClose={onClose}>
        <p className="sheet-text">
          Thanks for letting us know. Our team reviews every report and takes action if this profile breaks our rules.
        </p>
        <button type="button" className="btn-primary sheet-full" onClick={onClose}>
          Done
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet title={`Report ${agent.name}`} onClose={onClose}>
      <form className="report-form" onSubmit={submit} noValidate>
        <p className="sheet-text">Reports go to the agentprofile.ae team, not the agent.</p>
        {error && <div className="form-error">{error}</div>}
        <div className="report-reasons" role="radiogroup" aria-label="What's wrong?">
          {REPORT_REASONS.map((r) => (
            <label key={r.value} className={`report-reason${reason === r.value ? " active" : ""}`}>
              <input
                type="radio"
                name="report-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
              />
              {r.label}
            </label>
          ))}
        </div>
        <div className="field">
          <label htmlFor="report-details">
            Details{" "}
            <span className="booking-optional">{reason === "other" ? "(required)" : "(optional)"}</span>
          </label>
          <textarea
            id="report-details"
            rows={3}
            maxLength={1000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="What did you notice?"
          />
        </div>
        <div className="field">
          <label htmlFor="report-contact">
            Your email or phone <span className="booking-optional">(optional, if we can follow up)</span>
          </label>
          <input id="report-contact" maxLength={200} value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary sheet-full" disabled={sending}>
          {sending ? "Sending…" : "Send report"}
        </button>
      </form>
    </Sheet>
  );
}

/** Footer links under an agent's profile: About this account · Privacy · Report · Cookie choices. */
export function ProfileFooterLinks({ agent }: { agent: FooterAgent }) {
  const [open, setOpen] = useState<"about" | "report" | "cookies" | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <nav className="profile-footer-links" aria-label="Profile information">
        <button type="button" onClick={() => setOpen("about")}>
          About this account
        </button>
        <span aria-hidden="true">·</span>
        <Link href="/privacy">Privacy</Link>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => setOpen("report")}>
          Report
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => setOpen("cookies")}>
          Cookie choices
        </button>
      </nav>
      {open === "about" && <AboutAccount agent={agent} onClose={close} />}
      {open === "report" && <ReportProfile agent={agent} onClose={close} />}
      {open === "cookies" && <CookieChoicesDialog onClose={close} />}
    </>
  );
}
