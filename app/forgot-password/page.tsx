"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-top">
          <span className="auth-brand-mark">A</span>
          agentprofile.ae
        </div>
        <div className="auth-brand-copy">
          <h2>Forgot your password?</h2>
          <p>We&apos;ll email you a link to set a new one.</p>
        </div>
        <div className="auth-brand-foot">Your trusted address in UAE real estate</div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          {sent ? (
            <>
              <div>
                <h1 className="auth-title">Check your email</h1>
                <p className="auth-sub">
                  If an account exists for <b>{email}</b>, we&apos;ve sent a link to reset your password. It expires in
                  an hour.
                </p>
              </div>
              <p className="auth-alt">
                <Link href="/login">Back to log in</Link>
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div>
                <h1 className="auth-title">Reset your password</h1>
                <p className="auth-sub">Enter the email on your account and we&apos;ll send you a reset link.</p>
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.ae"
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
              <p className="auth-alt">
                <Link href="/login">Back to log in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
