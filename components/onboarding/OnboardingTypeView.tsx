"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { BriefcaseIcon, BuildingIcon } from "@/components/icons";

export function OnboardingTypeView({ initialType }: { initialType: "agent" | "agency" }) {
  const router = useRouter();
  const [type, setType] = useState<"agent" | "agency">(initialType);
  const [saving, setSaving] = useState(false);

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
      body: JSON.stringify({ accountType: type }),
    });
    router.push("/onboarding/platforms");
  }

  return (
    <div className="onboard-shell">
      <div className="onboard-card">
        <div className="onboard-top">
          <OnboardingProgress step={1} />
          <button className="onboard-skip-all" onClick={skipAll}>
            Skip to dashboard
          </button>
        </div>

        <div className="onboard-head">
          <h1>Which best describes you?</h1>
          <p>This shapes how your profile introduces you.</p>
        </div>

        <div className="type-options">
          <button className={`type-option${type === "agent" ? " active" : ""}`} onClick={() => setType("agent")}>
            <div className="type-option-icon">
              <BriefcaseIcon className="w-[18px] h-[18px]" />
            </div>
            <div>
              <div className="type-option-title">Individual Agent</div>
              <div className="type-option-sub">I work independently, or as part of a team under an agency.</div>
            </div>
          </button>
          <button className={`type-option${type === "agency" ? " active" : ""}`} onClick={() => setType("agency")}>
            <div className="type-option-icon">
              <BuildingIcon className="w-[18px] h-[18px]" />
            </div>
            <div>
              <div className="type-option-title">Agency</div>
              <div className="type-option-sub">This profile represents a brokerage or team, not one person.</div>
            </div>
          </button>
        </div>

        <div className="onboard-actions">
          <button className="btn-primary" style={{ flex: 1 }} onClick={goNext} disabled={saving}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
