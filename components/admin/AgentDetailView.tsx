"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lead, Property } from "@prisma/client";
import type { SafeAgent } from "@/lib/prisma";
import { formatAED } from "@/lib/format";
import { SOCIAL_PLATFORMS, hasAnySocial, socialUrlsOf, type SocialUrls } from "@/lib/socials";
import { RERA_BROKERS_URL } from "@/lib/constants";

type AgentWithRelations = SafeAgent & { properties: Property[]; leads: Lead[] };

type FormState = {
  name: string;
  agency: string;
  accountType: string;
  role: string;
  brn: string;
  dedLicensed: boolean;
  yearsExperience: number;
  email: string;
  contactEmail: string;
  phone: string;
  whatsapp: string;
  coverUrl: string;
  bio: string;
  specialities: string;
  areas: string;
  languages: string;
  availabilityStatus: string;
  isPro: boolean;
  isVerified: boolean;
  isApproved: boolean;
  submittedForReview: boolean;
  brnVerified: boolean;
  socialVerified: boolean;
  manualForSaleCount: number;
  manualForRentCount: number;
  transactedVolume: number | "";
} & SocialUrls;

function toFormState(agent: AgentWithRelations): FormState {
  return {
    name: agent.name,
    agency: agent.agency,
    accountType: agent.accountType,
    role: agent.role,
    brn: agent.brn,
    dedLicensed: agent.dedLicensed,
    yearsExperience: agent.yearsExperience,
    email: agent.email,
    contactEmail: agent.contactEmail,
    phone: agent.phone,
    whatsapp: agent.whatsapp,
    ...socialUrlsOf(agent),
    coverUrl: agent.coverUrl ?? "",
    bio: agent.bio,
    specialities: agent.specialities,
    areas: agent.areas,
    languages: agent.languages,
    availabilityStatus: agent.availabilityStatus,
    isPro: agent.isPro,
    isVerified: agent.isVerified,
    isApproved: agent.isApproved,
    submittedForReview: agent.submittedForReview,
    brnVerified: Boolean(agent.brnVerifiedAt),
    socialVerified: Boolean(agent.socialVerifiedAt),
    manualForSaleCount: agent.manualForSaleCount,
    manualForRentCount: agent.manualForRentCount,
    transactedVolume: agent.transactedVolume ?? "",
  };
}

function formatVerifiedAt(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  call: "Call",
  email: "Email",
  book: "Booking",
  form: "Form",
};

export function AgentDetailView({
  agent,
  leadCount,
  analyticsByType,
}: {
  agent: AgentWithRelations;
  leadCount: number;
  analyticsByType: { type: string; count: number }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(agent));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  const canApprove = form.brnVerified && form.socialVerified;

  function setVerification(key: "brnVerified" | "socialVerified", value: boolean) {
    setForm((prev) => ({ ...prev, [key]: value, isApproved: value ? prev.isApproved : false }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        transactedVolume: form.transactedVolume === "" ? null : Number(form.transactedVolume),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const detail = data?.issues?.[0]?.message;
      setError(detail ? `${data.error}: ${detail}` : (data?.error ?? "Failed to save changes"));
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function deleteAgent() {
    if (!confirm(`Permanently delete ${agent.name}? This removes their listings, leads, and analytics too. This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/admin/agents/${agent.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/agents");
      router.refresh();
    } else {
      setDeleting(false);
      setError("Failed to delete agent");
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/agents" className="admin-back-link">
            ← Back to agents
          </Link>
          <div className="admin-page-title" style={{ marginTop: 6 }}>
            {agent.name}
            {agent.agency && <span className="admin-card-agency"> · {agent.agency}</span>}
          </div>
          <div className="admin-page-sub">
            <span className={`admin-badge ${agent.isApproved ? "tone-primary" : agent.submittedForReview ? "tone-gold" : "tone-muted"}`}>
              {agent.isApproved ? "Approved" : agent.submittedForReview ? "Pending review" : "Draft"}
            </span>
            {agent.isPro && <span className="admin-badge tone-gold admin-badge-inline">Pro</span>}
            {agent.isVerified && <span className="admin-badge tone-primary admin-badge-inline">Verified</span>}
          </div>
        </div>
        <Link className="btn-ghost-sm" href={`/${agent.slug}`} target="_blank">
          View public profile
        </Link>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="admin-detail-grid">
        <div className="admin-panel">
          <div className="admin-panel-title">Identity</div>
          <div className="admin-field-grid">
            <div className="field">
              <label>Full name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="field">
              <label>Agency</label>
              <input value={form.agency} onChange={(e) => set("agency", e.target.value)} />
            </div>
            <div className="field">
              <label>Account type</label>
              <select value={form.accountType} onChange={(e) => set("accountType", e.target.value)}>
                <option value="agent">Agent</option>
                <option value="agency">Agency</option>
              </select>
            </div>
            <div className="field">
              <label>Role / title</label>
              <input value={form.role} onChange={(e) => set("role", e.target.value)} />
            </div>
            <div className="field">
              <label>BRN</label>
              <input value={form.brn} onChange={(e) => set("brn", e.target.value)} />
            </div>
            <div className="field">
              <label>Years of experience</label>
              <input type="number" min={0} value={form.yearsExperience} onChange={(e) => set("yearsExperience", Number(e.target.value))} />
            </div>
          </div>
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={form.dedLicensed} onChange={(e) => set("dedLicensed", e.target.checked)} />
            DED licensed
          </label>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Contact</div>
          <div className="admin-field-grid">
            <div className="field">
              <label>Login email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="field">
              <label>Public contact email</label>
              <input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="field">
              <label>WhatsApp</label>
              <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Cover image</div>
          {form.coverUrl ? (
            <div className="admin-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.coverUrl} alt="Cover" />
              <div className="admin-cover-actions">
                <a className="admin-open-link" href={form.coverUrl} target="_blank" rel="noreferrer">
                  Open
                </a>
                <button type="button" className="admin-open-link" onClick={() => set("coverUrl", "")}>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <span className="admin-table-muted">No cover image</span>
          )}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Social links</div>
          <div className="admin-field-grid">
            {SOCIAL_PLATFORMS.map(({ field, name }) => (
              <div className="field" key={field}>
                <label>{name} URL</label>
                <div className="admin-input-with-link">
                  <input value={form[field]} onChange={(e) => set(field, e.target.value)} />
                  {form[field] && (
                    <a className="admin-open-link" href={form[field]} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel admin-verify-panel">
          <div className="admin-panel-title">Verification — required before approval</div>
          <p className="admin-page-sub" style={{ margin: 0 }}>
            Confirm you&apos;ve checked these against real sources before approving this agent. Approval is blocked until both are verified.
          </p>

          <div className="admin-verify-row">
            <div>
              <div className="admin-verify-label">BRN / DED license — {form.brn || "not set"}</div>
              <a
                className="admin-open-link"
                href={RERA_BROKERS_URL}
                target="_blank"
                rel="noreferrer"
              >
                Check on RERA brokers list
              </a>
              {form.brnVerified && agent.brnVerifiedAt && (
                <span className="admin-verify-timestamp">Verified {formatVerifiedAt(agent.brnVerifiedAt)}</span>
              )}
            </div>
            <label className="admin-checkbox-row">
              <input type="checkbox" checked={form.brnVerified} onChange={(e) => setVerification("brnVerified", e.target.checked)} />
              BRN/license checked
            </label>
          </div>

          <div className="admin-verify-row">
            <div>
              <div className="admin-verify-label">Social media profiles</div>
              <div className="admin-verify-social-links">
                {SOCIAL_PLATFORMS.map(({ field, name }) =>
                  form[field] ? (
                    <a key={field} href={form[field]} target="_blank" rel="noreferrer" className="admin-open-link">
                      {name}
                    </a>
                  ) : null,
                )}
                {!hasAnySocial(form) && <span className="admin-table-muted">No social links provided</span>}
              </div>
              {form.socialVerified && agent.socialVerifiedAt && (
                <span className="admin-verify-timestamp">Verified {formatVerifiedAt(agent.socialVerifiedAt)}</span>
              )}
            </div>
            <label className="admin-checkbox-row">
              <input type="checkbox" checked={form.socialVerified} onChange={(e) => setVerification("socialVerified", e.target.checked)} />
              Social profiles checked
            </label>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">About</div>
          <div className="field">
            <label>Bio</label>
            <textarea rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </div>
          <div className="admin-field-grid">
            <div className="field">
              <label>Specialities (comma separated)</label>
              <input value={form.specialities} onChange={(e) => set("specialities", e.target.value)} />
            </div>
            <div className="field">
              <label>Areas (comma separated)</label>
              <input value={form.areas} onChange={(e) => set("areas", e.target.value)} />
            </div>
            <div className="field">
              <label>Languages (comma separated)</label>
              <input value={form.languages} onChange={(e) => set("languages", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Public stats</div>
          <div className="admin-field-grid">
            <div className="field">
              <label>Availability</label>
              <select value={form.availabilityStatus} onChange={(e) => set("availabilityStatus", e.target.value)}>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </select>
            </div>
            <div className="field">
              <label>Manual &quot;for sale&quot; count</label>
              <input type="number" min={0} value={form.manualForSaleCount} onChange={(e) => set("manualForSaleCount", Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Manual &quot;for rent&quot; count</label>
              <input type="number" min={0} value={form.manualForRentCount} onChange={(e) => set("manualForRentCount", Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Transacted volume (AED)</label>
              <input
                type="number"
                min={0}
                value={form.transactedVolume}
                onChange={(e) => set("transactedVolume", e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Status & flags</div>
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={form.submittedForReview} onChange={(e) => set("submittedForReview", e.target.checked)} />
            Submitted for review
          </label>
          <label className={`admin-checkbox-row${canApprove ? "" : " admin-checkbox-row-disabled"}`}>
            <input
              type="checkbox"
              checked={form.isApproved}
              disabled={!canApprove && !form.isApproved}
              onChange={(e) => set("isApproved", e.target.checked)}
            />
            Approved (live)
          </label>
          {!canApprove && !form.isApproved && (
            <div className="admin-verify-hint">Verify BRN/license and social profiles above to unlock approval.</div>
          )}
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={form.isPro} onChange={(e) => set("isPro", e.target.checked)} />
            Pro subscriber
          </label>
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={form.isVerified} onChange={(e) => set("isVerified", e.target.checked)} />
            Verified badge (needs Pro to show)
          </label>
        </div>
      </div>

      <div className="admin-save-bar">
        {saved && <span className="admin-save-confirm">Saved</span>}
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <section className="admin-section">
        <div className="admin-section-title">
          Listings <span className="admin-count">{agent.properties.length}</span>
        </div>
        {agent.properties.length === 0 ? (
          <div className="admin-empty">No listings yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Featured</th>
                </tr>
              </thead>
              <tbody>
                {agent.properties.map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td className="admin-table-muted">{p.location}</td>
                    <td className="admin-table-muted">{formatAED(p.price)}</td>
                    <td className="admin-table-muted">
                      {p.listingType === "sale" ? "For sale" : "For rent"} · {p.propertyType}
                    </td>
                    <td className="admin-table-muted">{p.isFeatured ? "Yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-title">
          Recent leads <span className="admin-count">{leadCount}</span>
          {leadCount > agent.leads.length && (
            <Link href={`/admin/leads?agentId=${agent.id}`} className="admin-section-link">
              View all
            </Link>
          )}
        </div>
        {agent.leads.length === 0 ? (
          <div className="admin-empty">No leads recorded yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Channel</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {agent.leads.map((l) => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td className="admin-table-muted">{l.contact}</td>
                    <td className="admin-table-muted">{CHANNEL_LABEL[l.channel] ?? l.channel}</td>
                    <td className="admin-table-muted">{l.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {analyticsByType.length > 0 && (
        <section className="admin-section">
          <div className="admin-section-title">Analytics</div>
          <div className="admin-analytics-row">
            {analyticsByType.map((a) => (
              <div className="admin-stat-chip" key={a.type}>
                <span className="admin-stat-chip-value">{a.count}</span>
                <span className="admin-stat-chip-label">{a.type.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="admin-section">
        <div className="admin-panel admin-danger-panel">
          <div className="admin-panel-title">Danger zone</div>
          <p className="admin-page-sub">Permanently delete this agent and everything they own: listings, leads, testimonials, and analytics.</p>
          <button className="admin-danger-btn" onClick={deleteAgent} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete agent"}
          </button>
        </div>
      </section>
    </div>
  );
}
