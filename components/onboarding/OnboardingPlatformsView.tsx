"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { InstagramIcon, LinkedInIcon, TikTokIcon, CheckIcon } from "@/components/icons";

const PLATFORMS = [
  { key: "instagram", name: "Instagram", icon: InstagramIcon },
  { key: "linkedin", name: "LinkedIn", icon: LinkedInIcon },
  { key: "tiktok", name: "TikTok", icon: TikTokIcon },
] as const;

export function OnboardingPlatformsView({ initialSelected }: { initialSelected: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function skipAll() {
    fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarded: true }),
    });
    router.push("/dashboard");
  }

  function goNext() {
    const q = [...selected].join(",");
    router.push(`/onboarding/links${q ? `?p=${q}` : ""}`);
  }

  return (
    <div className="onboard-shell">
      <div className="onboard-card">
        <div className="onboard-top">
          <OnboardingProgress step={2} />
          <button className="onboard-skip-all" onClick={skipAll}>
            Skip to dashboard
          </button>
        </div>

        <div className="onboard-head">
          <h1>Which platforms are you on?</h1>
          <p>Pick the ones you&apos;re active on — you&apos;ll add the links next.</p>
        </div>

        <div className="platform-grid">
          {PLATFORMS.map(({ key, name, icon: Icon }) => {
            const active = selected.has(key);
            return (
              <button key={key} className={`platform-chip${active ? " active" : ""}`} onClick={() => toggle(key)}>
                <div className="platform-chip-icon">
                  <Icon className="w-[17px] h-[17px]" />
                </div>
                <span className="platform-chip-name">{name}</span>
                <span className="platform-chip-check">{active && <CheckIcon className="w-3 h-3" />}</span>
              </button>
            );
          })}
        </div>

        <div className="onboard-actions">
          <button className="onboard-skip onboard-back" onClick={() => router.push("/onboarding/type")}>
            Back
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={goNext}>
            Continue
          </button>
          <button className="onboard-skip" onClick={() => router.push("/onboarding/links")}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
