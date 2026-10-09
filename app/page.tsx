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
  CameraIcon,
  ShareIcon,
  ChevronDownIcon,
  BriefcaseIcon,
} from "@/components/icons";
import { AgentAvatar } from "@/components/AgentAvatar";

const FEATURES = [
  {
    icon: LinkIcon,
    tone: "primary" as const,
    title: "One link for everywhere",
    body: "Put it on WhatsApp, Instagram, and your business card — one link instead of a scattered handful.",
    preview: (
      <div className="land-feature-preview">
        <div className="preview-chip-row">
          <span className="preview-chip">WhatsApp</span>
          <span className="preview-chip">Instagram</span>
          <span className="preview-chip">Business card</span>
        </div>
        <div className="preview-link-pill">
          <LinkIcon className="w-3 h-3" />
          agentprofile.ae/you
        </div>
      </div>
    ),
  },
  {
    icon: CheckIcon,
    tone: "gold" as const,
    title: "Built-in credibility",
    body: "Your RERA BRN, DED license, and client testimonials, all in one place clients can verify.",
    preview: (
      <div className="land-feature-preview preview-pill-row">
        <span className="land-trust-pill done">
          <CheckIcon className="w-3 h-3" />
          BRN verified
        </span>
        <span className="land-trust-pill done">
          <CheckIcon className="w-3 h-3" />
          DED licensed
        </span>
      </div>
    ),
  },
  {
    icon: WhatsAppIcon,
    tone: "accent3" as const,
    title: "Contact in one tap",
    body: "WhatsApp, call, email, or book a viewing — clients reach you however they prefer.",
    preview: (
      <div className="land-feature-preview preview-cta-row">
        <div className="cta-tile">
          <PhoneIcon className="w-[14px] h-[14px]" />
          Call
        </div>
        <div className="cta-tile">
          <MailIcon className="w-[14px] h-[14px]" />
          Email
        </div>
        <div className="cta-tile">
          <CalendarIcon className="w-[14px] h-[14px]" />
          Book
        </div>
      </div>
    ),
  },
  {
    icon: TrendingUpIcon,
    tone: "primary" as const,
    title: "Know what's working",
    body: "See profile views, leads, and conversion rate from your dashboard — no spreadsheets.",
    preview: (
      <div className="land-feature-preview preview-stats-row">
        <div className="stat-chip tone-primary">
          <TrendingUpIcon className="w-3.5 h-3.5" />
          <span className="stat-chip-value">248</span>
          <span className="stat-chip-label">Profile views</span>
        </div>
        <div className="stat-chip tone-accent3">
          <StarIcon className="w-3.5 h-3.5" />
          <span className="stat-chip-value">12</span>
          <span className="stat-chip-label">Leads</span>
        </div>
      </div>
    ),
  },
];

const STEPS = [
  {
    icon: LinkIcon,
    title: "Claim your link",
    body: "Pick your address — agentprofile.ae/yourname. Takes ten seconds, and it's yours.",
  },
  {
    icon: CameraIcon,
    title: "Build your profile",
    body: "Add your license details, a photo, your bio, and where clients can find you.",
  },
  {
    icon: ShareIcon,
    title: "Share it everywhere",
    body: "WhatsApp, Instagram, your business card — one link, always current, nothing to update twice.",
  },
];

const VERIFICATION_POINTS = [
  "You submit your RERA BRN and DED license when you sign up",
  "Our team checks it against Dubai Land Department's public broker list",
  "Only checked, approved profiles ever go live publicly",
];

const FAQS = [
  {
    q: "Is agentprofile.ae really free?",
    a: "Yes. Creating your profile and sharing your link costs nothing, and there will always be a free tier.",
  },
  {
    q: "Do I need to be RERA licensed to join?",
    a: "Yes — we collect your BRN and DED license at signup, and our team checks it before your profile goes live. That's what makes the verified badge actually mean something.",
  },
  {
    q: "What happens right after I sign up?",
    a: "You'll build out your profile — photo, bio, contact details — then submit it for review. Our team checks your license, and your page goes live once it's approved.",
  },
  {
    q: "Can I change my link later?",
    a: "Yes, anytime from your dashboard, as long as the new one isn't already taken.",
  },
  {
    q: "How is this different from just posting on Instagram?",
    a: "An Instagram bio link goes stale and gets buried. This is one address you put everywhere once — WhatsApp, business cards, signage — and it stays current because you only ever update it in one place.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`land-faq-item${open ? " open" : ""}`}>
      <button type="button" className="land-faq-q" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {q}
        <ChevronDownIcon className="land-faq-chevron" />
      </button>
      {open && <p className="land-faq-a">{a}</p>}
    </div>
  );
}

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
                      <AgentAvatar seed="ahmed-al-falasi" initials="AF" size={76} />
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

      <section className="land-steps">
        <span className="land-eyebrow land-eyebrow-center">How it works</span>
        <h2>Live in three steps, not three weeks</h2>
        <div className="land-steps-row">
          {STEPS.map((s, i) => (
            <div className="land-step" key={s.title}>
              <div className="land-step-num">{i + 1}</div>
              <div className="land-step-icon">
                <s.icon className="w-4 h-4" />
              </div>
              <div className="land-step-title">{s.title}</div>
              <p className="land-step-body">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="land-features">
        <span className="land-eyebrow land-eyebrow-center">Why agents choose us</span>
        <h2>Everything a client needs to trust you — in one tap</h2>
        <div className="land-feature-grid">
          {FEATURES.map((f) => (
            <div className={`land-feature-card tone-${f.tone}`} key={f.title}>
              <div className={`land-feature-icon tone-${f.tone}`}>
                <f.icon className="w-4 h-4" />
              </div>
              <div className="land-feature-title">{f.title}</div>
              <p className="land-feature-body">{f.body}</p>
              {f.preview}
            </div>
          ))}
        </div>
      </section>

      <section className="land-trust-band">
        <div className="land-trust">
          <div className="land-trust-copy">
            <span className="land-eyebrow">Verified, not just claimed</span>
            <h2>Every agent is checked against the real register</h2>
            <p>
              Anyone can write &quot;licensed&quot; in an Instagram bio. Here, it means something — we actually check
              it before your page goes live.
            </p>
            <ul className="land-trust-list">
              {VERIFICATION_POINTS.map((point) => (
                <li key={point}>
                  <CheckIcon className="w-3.5 h-3.5" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="land-trust-visual">
            <div className="land-trust-card">
              <div className="land-trust-card-row">
                <div className="land-trust-card-icon">
                  <BriefcaseIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="land-trust-card-label">RERA BRN</div>
                  <div className="land-trust-card-value">41527</div>
                </div>
                <span className="land-trust-pill pending">Checking</span>
              </div>
              <div className="land-trust-card-row">
                <div className="land-trust-card-icon">
                  <BuildingIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="land-trust-card-label">DED license</div>
                  <div className="land-trust-card-value">Vantage Real Estate</div>
                </div>
                <span className="land-trust-pill done">
                  <CheckIcon className="w-3 h-3" />
                  Verified
                </span>
              </div>
              <div className="land-trust-card-row land-trust-card-row-live">
                <div className="land-trust-card-icon live">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="land-trust-card-label">Public profile</div>
                  <div className="land-trust-card-value">agentprofile.ae/ahmed</div>
                </div>
                <span className="land-trust-pill live">
                  <span className="land-trust-pulse" />
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="land-faq">
        <span className="land-eyebrow land-eyebrow-center">Questions</span>
        <h2>Good to know before you start</h2>
        <div className="land-faq-list">
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
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
