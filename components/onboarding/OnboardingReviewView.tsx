"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { EMIRATES } from "@/lib/constants";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";

export function OnboardingReviewView({
  hasBio,
  hasPhoto,
  hasSocial,
  initialSpecialities,
  initialAreas,
  initialWhatsapp,
}: {
  hasBio: boolean;
  hasPhoto: boolean;
  hasSocial: boolean;
  initialSpecialities: string;
  initialAreas: string;
  initialWhatsapp: string;
}) {
  const router = useRouter();
  const [specialities, setSpecialities] = useState(initialSpecialities);
  const [areas, setAreas] = useState(initialAreas);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
  const [saving, setSaving] = useState(false);

  const checks = useMemo(
    () => [
      { label: "Bio added", done: hasBio, editHref: "/onboarding/photo-bio" },
      { label: "Profile photo added", done: hasPhoto, editHref: "/onboarding/photo-bio" },
      { label: "Social link added", done: hasSocial, editHref: "/onboarding/links" },
      { label: "Specialities listed", done: specialities.trim().length > 0 },
      { label: "Areas you cover", done: areas.trim().length > 0 },
      { label: "WhatsApp number added", done: whatsapp.trim().length > 0 },
    ],
    [hasBio, hasPhoto, hasSocial, specialities, areas, whatsapp],
  );

  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);

  async function finish() {
    setSaving(true);
    await fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialities, areas, whatsapp, onboarded: true }),
    });
    router.push("/dashboard");
  }

  return (
    <div className="onboard-shell">
      <div className="onboard-card" style={{ maxWidth: 560 }}>
        <div className="onboard-head">
          <h1>Complete your profile</h1>
          <p>A fuller profile gets more replies. Fill in what&apos;s missing, or head straight to your dashboard.</p>
        </div>

        <div className="dash-card completion-card">
          <div className="completion-head">
            <span className="section-title">Profile strength</span>
            <span className="completion-pct">{pct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="completion-list">
            {checks.map((c) => (
              <div className={`completion-item${c.done ? " done" : ""}`} key={c.label}>
                <span className="dot">{c.done && <CheckIcon className="w-3 h-3" />}</span>
                {c.label}
                {!c.done && c.editHref && (
                  <Link className="completion-item-action" href={c.editHref}>
                    Add
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Specialities</label>
          <input
            value={specialities}
            onChange={(e) => setSpecialities(e.target.value)}
            placeholder="Off-plan, Luxury Villas, Waterfront"
          />
        </div>
        <div className="field">
          <label>Areas you cover</label>
          <ChipMultiSelect options={EMIRATES} value={areas} onChange={setAreas} />
        </div>
        <div className="field">
          <label>WhatsApp number</label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="971501234567"
          />
        </div>

        <button className="btn-primary" onClick={finish} disabled={saving}>
          {saving ? "Saving…" : "Enter Dashboard"}
        </button>
      </div>
    </div>
  );
}
