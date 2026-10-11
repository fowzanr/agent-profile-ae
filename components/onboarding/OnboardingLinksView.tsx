"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { LinkIcon } from "@/components/icons";
import { SOCIAL_ICONS } from "@/components/socialIcons";
import { SOCIAL_PLATFORMS, type SocialUrls } from "@/lib/socials";

type LinkItem = { id: string; label: string; url: string };

export function OnboardingLinksView({
  platforms,
  initialUrls,
  initialLinks,
}: {
  platforms: string[];
  initialUrls: SocialUrls;
  initialLinks: LinkItem[];
}) {
  const router = useRouter();
  const shownPlatforms = SOCIAL_PLATFORMS.filter((p) => platforms.length === 0 || platforms.includes(p.key));
  const [urls, setUrls] = useState(initialUrls);
  const [links, setLinks] = useState(initialLinks);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [addingLink, setAddingLink] = useState(false);
  const [saving, setSaving] = useState(false);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    setLinkError(null);
    if (newLabel.trim().length < 1) return setLinkError("Give the link a short label");

    setAddingLink(true);
    const res = await fetch("/api/agent-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim(), url: newUrl.trim() }),
    });
    const data = await res.json();
    setAddingLink(false);

    if (!res.ok) {
      setLinkError(data.error ?? "Couldn't add that link");
      return;
    }
    setLinks((prev) => [...prev, data]);
    setNewLabel("");
    setNewUrl("");
  }

  async function removeLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    await fetch(`/api/agent-links/${id}`, { method: "DELETE" });
  }

  async function skipAll() {
    fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarded: true }),
    });
    router.push("/dashboard");
  }

  async function goNext() {
    setSaving(true);
    await fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(urls),
    });
    router.push("/onboarding/photo-bio");
  }

  return (
    <div className="onboard-shell">
      <div className="onboard-card">
        <div className="onboard-top">
          <OnboardingProgress step={3} />
          <button className="onboard-skip-all" onClick={skipAll}>
            Skip to dashboard
          </button>
        </div>

        <div className="onboard-head">
          <h1>Add your links</h1>
          <p>These show up as icons and buttons on your public profile.</p>
        </div>

        <div className="link-input-list">
          {shownPlatforms.map((meta) => {
            const Icon = SOCIAL_ICONS[meta.key];
            return (
              <div className="field" key={meta.key}>
                <label style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Icon className="w-3.5 h-3.5" />
                  {meta.name}
                </label>
                <input
                  value={urls[meta.field]}
                  onChange={(e) => setUrls((f) => ({ ...f, [meta.field]: e.target.value }))}
                  placeholder={meta.placeholder}
                />
              </div>
            );
          })}
        </div>

        <div className="form-section">
          <div className="section-header" style={{ marginBottom: 10 }}>
            <div className="section-icon tone-gold">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="section-title">Additional Links</div>
              <div className="section-sub">Your website, a listings page — anything else.</div>
            </div>
          </div>

          {links.length > 0 && (
            <div className="link-list" style={{ marginBottom: 12 }}>
              {links.map((l) => (
                <div className="link-row" key={l.id}>
                  <span className="link-row-label">{l.label}</span>
                  <span className="link-row-url">{l.url}</span>
                  <button type="button" className="btn-ghost-sm" onClick={() => removeLink(l.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {linkError && <div className="form-error" style={{ marginBottom: 10 }}>{linkError}</div>}

          <form className="add-link-row" onSubmit={addLink}>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label, e.g. Website" />
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://" type="url" required />
            <button className="btn-secondary" type="submit" disabled={addingLink} style={{ flex: "0 0 auto", padding: "0 16px" }}>
              {addingLink ? "Adding…" : "Add"}
            </button>
          </form>
        </div>

        <div className="onboard-actions">
          <button className="onboard-skip onboard-back" onClick={() => router.push("/onboarding/platforms")}>
            Back
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={goNext} disabled={saving}>
            {saving ? "Saving…" : "Continue"}
          </button>
          <button className="onboard-skip" onClick={() => router.push("/onboarding/photo-bio")}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
