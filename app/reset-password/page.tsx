"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This link is missing its token — request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Something went wrong");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <>
        <div>
          <h1 className="auth-title">Password updated</h1>
          <p className="auth-sub">You can log in with your new password now.</p>
        </div>
        <button className="btn-primary" type="button" onClick={() => router.push("/login")}>
          Go to log in
        </button>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 className="auth-title">Set a new password</h1>
        <p className="auth-sub">Choose a new password for your account.</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="field">
        <label htmlFor="password">New password</label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>
      <div className="field">
        <label htmlFor="confirm">Confirm password</label>
        <input
          id="confirm"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type it again"
        />
      </div>

      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "Saving…" : "Set new password"}
      </button>
      <p className="auth-alt">
        <Link href="/login">Back to log in</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-top">
          <span className="auth-brand-mark">A</span>
          agentprofile.ae
        </div>
        <div className="auth-brand-copy">
          <h2>Almost there.</h2>
          <p>Set a new password and you&apos;re back in.</p>
        </div>
        <div className="auth-brand-foot">Your trusted address in UAE real estate</div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
