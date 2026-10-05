"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);

  async function confirm() {
    setStatus("loading");
    setError(null);
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error ?? "Something went wrong");
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resendEmail }),
    }).catch(() => {});
    setResendSent(true);
  }

  if (status === "done") {
    return (
      <div>
        <h1 className="auth-title">Email confirmed</h1>
        <p className="auth-sub">Your email is verified. You&apos;re all set.</p>
        <p className="auth-alt" style={{ marginTop: 22 }}>
          <Link href="/dashboard">Go to your dashboard</Link>
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div>
          <h1 className="auth-title">Link expired</h1>
          <p className="auth-sub">{error} Enter your email and we&apos;ll send a new one.</p>
        </div>
        {resendSent ? (
          <div className="form-error" style={{ background: "var(--primary-soft)", color: "var(--primary)", borderColor: "transparent" }}>
            If that email has an account, a new link is on its way.
          </div>
        ) : (
          <form onSubmit={resend} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@agency.ae"
              />
            </div>
            <button className="btn-primary" type="submit">
              Send a new link
            </button>
          </form>
        )}
      </div>
    );
  }

  if (!token) {
    return (
      <div>
        <h1 className="auth-title">Missing link</h1>
        <p className="auth-sub">This page needs a verification link — open the one from your email.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 className="auth-title">Confirm your email</h1>
        <p className="auth-sub">Click below to confirm this is your email address.</p>
      </div>
      <button className="btn-primary" type="button" onClick={confirm} disabled={status === "loading"}>
        {status === "loading" ? "Confirming…" : "Confirm email"}
      </button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-top">
          <span className="auth-brand-mark">A</span>
          agentprofile.ae
        </div>
        <div className="auth-brand-copy">
          <h2>One more step.</h2>
          <p>Confirming your email keeps your account recoverable and your listing trustworthy.</p>
        </div>
        <div className="auth-brand-foot">Your trusted address in UAE real estate</div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <Suspense fallback={null}>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
