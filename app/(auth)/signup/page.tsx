"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { CheckIcon, ArrowLeftIcon } from "@/components/icons";
import { isValidBrn } from "@/lib/validation";
import { ComboInput } from "@/components/ComboInput";
import { slugify } from "@/lib/slug";

type Step = 1 | 2 | 3;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    name: searchParams.get("name") ?? "",
    slug: searchParams.get("slug") ?? "",
    email: "",
    password: "",
    agency: "",
    role: "",
    bio: "",
    brn: "",
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(searchParams.get("slug")));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [agencyOptions, setAgencyOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/agencies")
      .then((res) => res.json())
      .then((data) => setAgencyOptions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function updateName(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setForm((f) => ({ ...f, name: value, slug: slugTouched ? f.slug : slugify(value) }));
  }

  function updateSlug(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true);
    const value = slugify(e.target.value);
    setForm((f) => ({ ...f, slug: value }));
  }

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) return setError("Enter your full name");
    if (form.slug.trim().length < 2) return setError("Choose your profile link");
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      return setError("Enter a valid email");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters");
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.role.trim().length < 2)
      return setError("Enter your job role");
    if (!isValidBrn(form.brn))
      return setError("Enter a valid RERA BRN — numbers only (3–7 digits)");

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
        return;
      }

      setSlug(data.slug);
      setStep(3);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function copyLink() {
    const url = `agentprofile.ae/${slug}`;
    try {
      if (navigator.clipboard)
        await navigator.clipboard.writeText(`https://${url}`);
    } catch {
      // clipboard unavailable — ignore
    }
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy"), 1800);
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-top">
          <span className="auth-brand-mark">A</span>
          agentprofile.ae
        </div>
        <div className="auth-brand-copy">
          <h2>
            A professional digital identity, built for UAE real estate agents.
          </h2>
          <p>
            One shareable page for your profile, your listings, and your track
            record — the link you put on WhatsApp, Instagram, and your business
            card instead of a scattered handful of them.
          </p>
        </div>
        <div className="auth-brand-foot">
          Free to start · Takes about two minutes
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          {step < 3 && (
            <>
              <div className="stepper">
                <div className={`step-dot${step === 1 ? " active" : " done"}`}>
                  {step > 1 ? <CheckIcon className="w-3 h-3" /> : "1"}
                </div>
                <div className={`step-line${step > 1 ? " done" : ""}`} />
                <div className={`step-dot${step === 2 ? " active" : ""}`}>
                  2
                </div>
              </div>
              <div className="step-labels">
                <span>Account</span>
                <span>Professional details</span>
              </div>
            </>
          )}

          {step === 1 && (
            <form
              onSubmit={goToStep2}
              style={{ display: "flex", flexDirection: "column", gap: 22 }}
            >
              <div>
                <h1 className="auth-title">Create your agent profile</h1>
                <p className="auth-sub">Let&apos;s start with your account.</p>
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={updateName}
                  placeholder="Ahmed Al Falasi"
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="slug">Your profile link</label>
                <div className="slug-edit-row">
                  <span className="slug-prefix">agentprofile.ae/</span>
                  <input
                    id="slug"
                    required
                    value={form.slug}
                    onChange={updateSlug}
                    placeholder="ahmed-al-falasi"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@agency.ae"
                />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={update("password")}
                  placeholder="At least 8 characters"
                />
              </div>

              <button className="btn-primary" type="submit">
                Continue
              </button>

              <p className="auth-alt">
                Already have an account? <Link href="/login">Log in</Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 22 }}
            >
              <div>
                <h1 className="auth-title">Your professional details</h1>
                <p className="auth-sub">
                  This appears on your public profile — you can refine it
                  anytime from your dashboard.
                </p>
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="field">
                <label htmlFor="agency">Brokerage / Agency (optional)</label>
                <ComboInput
                  id="agency"
                  value={form.agency}
                  onChange={(v) => setForm((f) => ({ ...f, agency: v }))}
                  options={agencyOptions}
                  placeholder="Vantage Real Estate"
                />
                <p className="field-hint">
                  Enter the name yourself — it isn&apos;t verified by the brokerage and doesn&apos;t require their
                  approval. Leave blank if you&apos;d rather not show one.
                </p>
              </div>
              <div className="field">
                <label htmlFor="role">Job role at the agency</label>
                <input
                  id="role"
                  required
                  value={form.role}
                  onChange={update("role")}
                  placeholder="Senior Sales Agent"
                />
              </div>
              <div className="field">
                <label htmlFor="bio">Bio (optional)</label>
                <textarea
                  id="bio"
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="A couple of sentences about your experience and what clients can expect working with you…"
                />
                <p className="field-hint">You can write this now or generate one with AI later from your dashboard.</p>
              </div>
              <div className="field">
                <label htmlFor="brn">RERA BRN</label>
                <input
                  id="brn"
                  required
                  value={form.brn}
                  onChange={update("brn")}
                  placeholder="41527"
                  inputMode="numeric"
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: "0 0 auto", padding: "0 16px" }}
                  onClick={() => setStep(1)}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </button>
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? "Creating your profile…" : "Create profile"}
                </button>
              </div>
            </form>
          )}

          {step === 3 && slug && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div className="success-icon">
                <CheckIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="auth-title">
                  You&apos;re live, {form.name.split(" ")[0]}.
                </h1>
                <p className="auth-sub">
                  Your profile is already up — here&apos;s your link.
                </p>
              </div>

              <div className="profile-link-box">
                <span>agentprofile.ae/{slug}</span>
                <button
                  type="button"
                  className="btn-ghost-sm"
                  onClick={copyLink}
                >
                  {copyLabel}
                </button>
              </div>

              <div className="checklist">
                <div className="checklist-item">
                  <span className="num">1</span>
                  Tell us a bit more about you — takes under a minute
                </div>
                <div className="checklist-item">
                  <span className="num">2</span>
                  Add your first listing — properties are what visitors come to
                  see
                </div>
                <div className="checklist-item">
                  <span className="num">3</span>
                  Share your link on WhatsApp, Instagram, or your business card
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => router.push("/onboarding/type")}
              >
                Continue Setup
              </button>
              <button
                type="button"
                className="onboard-skip"
                style={{ alignSelf: "center" }}
                onClick={() => router.push("/dashboard")}
              >
                Skip to dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
