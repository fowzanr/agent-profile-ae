"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Incorrect email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-top">
          <span className="auth-brand-mark">A</span>
          agentprofile.ae
        </div>
        <div className="auth-brand-copy">
          <h2>Welcome back.</h2>
          <p>
            Log in to update your profile, manage your listings, and see
            what&apos;s live.
          </p>
        </div>
        <div className="auth-brand-foot">
          Your trusted address in UAE real estate
        </div>
      </div>

      <div className="auth-form-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <h1 className="auth-title">Log in</h1>
            <p className="auth-sub">Manage your agentprofile.ae page.</p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agency.ae"
              autoFocus
            />
          </div>
          <div className="field">
            <div className="field-label-row">
              <label htmlFor="password">Password</label>
              <Link href="/forgot-password" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--primary)" }}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>

          <p className="auth-alt">
            New here? <Link href="/signup">Create a profile</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
