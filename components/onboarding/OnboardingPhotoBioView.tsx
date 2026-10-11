"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { CameraIcon } from "@/components/icons";
import { BIO_MAX_LENGTH } from "@/lib/constants";
import { ImageCropper, downscaleImage, uploadImageBlob } from "@/components/ImageCropper";

export function OnboardingPhotoBioView({ initialPhotoUrl, initialBio, slug }: { initialPhotoUrl: string | null; initialBio: string; slug: string }) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [photoSourceUrl, setPhotoSourceUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<{ file: File; src: string } | null>(null);
  const [bio, setBio] = useState(initialBio);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handlePhotoSelect(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setCropFile({ file, src: URL.createObjectURL(file) });
  }

  function closeCropper() {
    if (cropFile) URL.revokeObjectURL(cropFile.src);
    setCropFile(null);
  }

  async function applyCrop(cropped: Blob) {
    if (!cropFile) return;
    const { file } = cropFile;
    closeCropper();
    setUploading(true);
    try {
      const [croppedUrl, sourceUrl] = await Promise.all([
        uploadImageBlob(cropped),
        downscaleImage(file).then(uploadImageBlob),
      ]);
      setPhotoUrl(croppedUrl);
      setPhotoSourceUrl(sourceUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Couldn't upload photo");
    } finally {
      setUploading(false);
    }
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
    if (bio.length > BIO_MAX_LENGTH) {
      setUploadError(`Your bio is ${bio.length} characters. Shorten it to ${BIO_MAX_LENGTH} or fewer.`);
      return;
    }
    setSaving(true);
    await fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(photoSourceUrl ? { photoUrl, photoSourceUrl, bio } : { photoUrl, bio }),
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
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) => {
                handlePhotoSelect(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <div className="avatar-upload-info">
            JPG, PNG, or WEBP · you can crop it after choosing.
            <br />
            Shown on agentprofile.ae/{slug}.
          </div>
        </div>

        {cropFile && (
          <ImageCropper
            src={cropFile.src}
            aspect={1}
            round
            outputWidth={600}
            title="Crop profile photo"
            onCancel={closeCropper}
            onConfirm={applyCrop}
          />
        )}

        <div className="field">
          <label>Bio</label>
          <textarea
            rows={3}
            value={bio}
            maxLength={BIO_MAX_LENGTH}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short and sweet, like an Instagram bio — what you sell and where."
          />
          <span className="bio-count">
            {bio.length}/{BIO_MAX_LENGTH}
          </span>
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
