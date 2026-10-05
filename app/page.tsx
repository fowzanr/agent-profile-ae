"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { slugify } from "@/lib/slug";
import {
  WhatsAppIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  CheckIcon,
  LinkIcon,
  StarIcon,
  TrendingUpIcon,
  BuildingIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/icons";

const FEATURES = [
  {
    icon: LinkIcon,
    tone: "primary" as const,
    title: "One link for everywhere",
    body: "Put it on WhatsApp, Instagram, and your business card — one link instead of a scattered handful.",
  },
  {
    icon: CheckIcon,
    tone: "gold" as const,
    title: "Built-in credibility",
    body: "Your RERA BRN, DED license, and client testimonials, all in one place clients can verify.",
  },
  {
    icon: WhatsAppIcon,
    tone: "accent3" as const,
    title: "Contact in one tap",
    body: "WhatsApp, call, email, or book a viewing — clients reach you however they prefer.",
  },
  {
    icon: TrendingUpIcon,
    tone: "primary" as const,
    title: "Know what's working",
    body: "See profile views, leads, and conversion rate from your dashboard — no spreadsheets.",
  },
];

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function claimProfile(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      router.push("/signup");
      return;
    }
    const params = new URLSearchParams({ name: trimmed });
    const slug = slugify(trimmed);
    if (slug) params.set("slug", slug);
    router.push(`/signup?${params.toString()}`);
  }

  return (
    <div className="land-page">
      <header className="land-nav" ref={navRef}>
        <div className="land-nav-brand">
          agentprofile<b>.ae</b>
        </div>
        <div className="land-nav-ctas">
          <Link href="/login" className="land-nav-login">
            Log in
          </Link>
          <Link href="/signup" className="land-nav-signup">
            Sign up free
          </Link>
        </div>
        <button
          type="button"
          className="land-nav-hamburger"
          onClick={() => setNavOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={navOpen}
        >
          {navOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
        {navOpen && (
          <div className="land-nav-mobile-menu">
            <Link href="/login" className="land-nav-login" onClick={() => setNavOpen(false)}>
              Log in
            </Link>
            <Link href="/signup" className="land-nav-signup" onClick={() => setNavOpen(false)}>
              Sign up free
            </Link>
          </div>
        )}
      </header>

      <section className="land-hero">
        <div className="land-glow" />
        <div className="land-hero-grid">
          <div className="land-hero-copy">
            <span className="land-eyebrow">Built for UAE real estate agents</span>
            <h1>
              Your real estate career.
              <br />
              <span className="land-accent">One link.</span>
            </h1>
            <p>
              One shareable page for your profile, your listings, and your track record — the link you put on
              WhatsApp, Instagram, and your business card instead of a scattered handful of them.
            </p>

            <form className="land-claim" onSubmit={claimProfile}>
              <span className="land-claim-prefix">agentprofile.ae/</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="yourname"
                aria-label="Your name"
              />
              <button className="land-claim-btn" type="submit">
                Claim it
              </button>
            </form>
            {name.trim() && <p className="land-claim-preview">agentprofile.ae/{slugify(name) || "yourname"}</p>}
            <p className="land-hero-sub">Free to start · Takes about two minutes</p>
          </div>

          <div className="land-hero-mockup">
            <div className="land-mockup-blob blob-a" />
            <div className="land-mockup-blob blob-b" />

            <div className="browser-mockup">
              <div className="browser-window">
              <div className="browser-bar">
                <span className="browser-dot dot-r" />
                <span className="browser-dot dot-y" />
                <span className="browser-dot dot-g" />
                <span className="browser-url">
                  <LinkIcon className="w-3 h-3" />
                  agentprofile.ae/ahmed
                </span>
              </div>
              <div className="browser-body">
                <div className="card profile land-mockup-card">
                  <div className="id-row">
                    <div className="avatar-wrap">
                      <div className="avatar">AF</div>
                      <div className="verified-badge">
                        <CheckIcon className="w-[13px] h-[13px]" />
                      </div>
                    </div>
                    <div className="id-main">
                      <div className="id-name-row">
                        <h1>Ahmed Al Falasi</h1>
                      </div>
                      <p className="role-line">Luxury &amp; Off-Plan Specialist</p>
                      <p className="agency">Vantage Real Estate</p>
                    </div>
                  </div>

                  <div className="cta-primary land-mockup-static">
                    <WhatsAppIcon className="w-4 h-4" />
                    WhatsApp Now
                  </div>
                  <div className="cta-row three-col">
                    <div className="cta-tile">
                      <PhoneIcon className="w-[15px] h-[15px]" />
                      Call
                    </div>
                    <div className="cta-tile">
                      <MailIcon className="w-[15px] h-[15px]" />
                      Email
                    </div>
                    <div className="cta-tile">
                      <CalendarIcon className="w-[15px] h-[15px]" />
                      Book
                    </div>
                  </div>

                  <div className="stat-chips">
                    <div className="stat-chip tone-primary">
                      <BuildingIcon className="w-3.5 h-3.5" />
                      <span className="stat-chip-value">0</span>
                      <span className="stat-chip-label">Total Sales</span>
                    </div>
                    <div className="stat-chip tone-accent3">
                      <StarIcon className="w-3.5 h-3.5" />
                      <span className="stat-chip-value">8</span>
                      <span className="stat-chip-label">Experience</span>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div className="land-float-card">
                <div className="land-float-icon">
                  <WhatsAppIcon className="w-4 h-4" />
                </div>
                <div className="land-float-text">
                  <span className="land-float-title">New lead</span>
                  <span className="land-float-sub">&quot;Is the villa still available?&quot;</span>
                </div>
              </div>

              <div className="land-float-badge">
                <CheckIcon className="w-3 h-3" />
                RERA Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="land-features">
        <span className="land-eyebrow land-eyebrow-center">Why agents choose us</span>
        <h2>Everything a client needs to trust you — in one tap</h2>
        <div className="land-feature-grid">
          {FEATURES.map((f, i) => (
            <div className={`land-feature-card tone-${f.tone}`} key={f.title}>
              <span className="land-feature-num">{String(i + 1).padStart(2, "0")}</span>
              <div className={`land-feature-icon tone-${f.tone}`}>
                <f.icon className="w-4 h-4" />
              </div>
              <div className="land-feature-title">{f.title}</div>
              <p className="land-feature-body">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="land-cta">
        <div className="land-cta-glow" />
        <h2>Ready to build yours?</h2>
        <p>Set up your profile in under two minutes — no credit card, no catch.</p>
        <Link className="land-cta-btn" href="/signup">
          Create your profile — it&apos;s free
        </Link>
      </section>

      <footer className="land-footer">
        <span>agentprofile.ae — your trusted address in UAE real estate</span>
        <div className="land-footer-links">
          <Link href="/login">Log in</Link>
          <Link href="/signup">Sign up</Link>
        </div>
      </footer>
    </div>
  );
}
