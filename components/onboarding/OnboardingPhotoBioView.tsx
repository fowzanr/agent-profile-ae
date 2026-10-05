"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { CameraIcon } from "@/components/icons";

export function OnboardingPhotoBioView({ initialPhotoUrl, initialBio, slug }: { initialPhotoUrl: string | null; initialBio: string; slug: string }) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [bio, setBio] = useState(initialBio);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handlePhotoSelect(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json();

    setUploading(false);
    if (!res.ok) {
      setUploadError(data.error ?? "Couldn't upload photo");
      return;
    }
    setPhotoUrl(data.url);
  }

  async function skip() {
    fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarded: true }),
    });
    router.push("/dashboard");
  }

  async function finish() {
    setSaving(true);
    await fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl, bio }),
    });
    router.push("/onboarding/review");
  }

  return (
    <div className="onboard-shell">
      <div className="onboard-card">
        <div className="onboard-top">
          <OnboardingProgress step={4} />
          <button className="onboard-skip-all" onClick={skip}>
            Skip to dashboard
          </button>
        </div>

        <div className="onboard-head">
          <h1>Add a photo and your bio</h1>
          <p>Last step — profiles with a real photo get more replies.</p>
        </div>

        {uploadError && <div className="form-error">{uploadError}</div>}

        <div className="avatar-upload">
          <label className="avatar-upload-circle">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Your photo" />
            ) : (
              <span className="placeholder">
                <CameraIcon className="w-5 h-5" />
                {uploading ? "Uploading…" : "Add photo"}
              </span>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => handlePhotoSelect(e.target.files?.[0])} />
          </label>
          <div className="avatar-upload-info">
            JPG, PNG, or WEBP · up to 5MB.
            <br />
            Shown on agentprofile.ae/{slug}.
          </div>
        </div>

        <div className="field">
          <label>Bio</label>
          <textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A few sentences about how you work and what you specialise in." />
        </div>

        <div className="onboard-actions">
          <button className="onboard-skip onboard-back" onClick={() => router.push("/onboarding/links")}>
            Back
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={finish} disabled={saving}>
            {saving ? "Saving…" : "Continue"}
          </button>
          <button className="onboard-skip" onClick={skip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
