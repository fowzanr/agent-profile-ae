"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { slugify } from "@/lib/slug";
import { CookieChoicesDialog } from "@/components/CookieChoicesDialog";
import {
  WhatsAppIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  CheckIcon,
  LinkIcon,
  TrendingUpIcon,
  BuildingIcon,
  YouTubeIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  GlobeIcon,
  MenuIcon,
  CloseIcon,
  ChevronDownIcon,
  BriefcaseIcon,
} from "@/components/icons";

const FEATURES = [
  {
    icon: LinkIcon,
    tone: "primary" as const,
    title: "One link for everywhere",
    body: "Your Instagram, TikTok, LinkedIn, YouTube, and website in one place — plus a QR code for business cards and signage.",
  },
  {
    icon: CheckIcon,
    tone: "gold" as const,
    title: "Built-in credibility",
    body: "Your RERA BRN, DED license, track record, and client testimonials — with a one-tap link to verify you on RERA.",
  },
  {
    icon: WhatsAppIcon,
    tone: "accent3" as const,
    title: "Contact in one tap",
    body: "WhatsApp, call, or email — clients reach you however they prefer, straight from your page.",
  },
  {
    icon: CalendarIcon,
    tone: "primary" as const,
    title: "Viewings booked your way",
    body: "Clients pick a time within the days and hours you set, and requests land in your inbox. Prefer Calendly? Link that instead.",
  },
  {
    icon: YouTubeIcon,
    tone: "gold" as const,
    title: "Show your best content",
    body: "Pin a property tour or market update. Videos and podcasts play right on your page; courses and communities get their own cards.",
  },
  {
    icon: TrendingUpIcon,
    tone: "accent3" as const,
    title: "Know what's working",
    body: "See profile views, taps on WhatsApp, call, and book, and your conversion rate — right from your dashboard.",
  },
];

const STEPS = [
  {
    label: "Step 1",
    title: "Claim your link",
    body: "Pick your address — agentprofile.ae/yourname. Takes ten seconds, and it's yours.",
    mockup: (
      <div className="mini-addressbar">
        <span className="mini-dot dot-r" />
        <span className="mini-dot dot-y" />
        <span className="mini-dot dot-g" />
        <span className="mini-url">
          agentprofile.ae/<b>you</b>
          <span className="mini-caret" />
        </span>
      </div>
    ),
  },
  {
    label: "Step 2",
    title: "Build your profile",
    body: "Add your license details, a photo and cover, a short bio, your socials, and how clients can book you.",
    mockup: (
      <div className="mini-profile">
        <div className="avatar-sm">YN</div>
        <div className="mini-profile-info">
          <div className="mini-profile-name">Your Name</div>
          <div className="mini-profile-role">Real Estate Agent</div>
        </div>
      </div>
    ),
  },
  {
    label: "Step 3",
    title: "Share it everywhere",
    body: "WhatsApp, Instagram, your business card — one link, always current, nothing to update twice.",
    mockup: (
      <div className="mini-share">
        <div className="mini-share-icon">
          <WhatsAppIcon className="w-4 h-4" />
        </div>
        <div>
          <div className="mini-share-label">Sent to a client</div>
          <div className="mini-share-link">agentprofile.ae/you</div>
        </div>
      </div>
    ),
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
    q: "How do clients book a viewing with me?",
    a: "They tap Book on your page and pick a time from the days and hours you've set — the request is emailed to you to confirm. If you already use Calendly or a similar tool, you can point the Book button there instead.",
  },
  {
    q: "What can I put on my profile?",
    a: "Your photo and a cover image, a short bio, your RERA and DED details, sales and rental numbers, specialities, areas, and languages, client testimonials, your social links and website, and featured content like a pinned YouTube video, your podcast, a course, or your community.",
  },
  {
    q: "Can I change my link later?",
    a: "Yes, from your dashboard, as long as the new one isn't already taken. To keep shared links and QR codes working, a link can be changed once every 14 days.",
  },
  {
    q: "How is this different from just posting on Instagram?",
    a: "An Instagram bio link goes stale and gets buried. This is one address you put everywhere once — WhatsApp, business cards, signage — and it stays current because you only ever update it in one place.",
  },
];

function useReveal<T extends HTMLElement>(direction?: "left" | "right") {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const base = direction === "left" ? "reveal-left" : direction === "right" ? "reveal-right" : "reveal";
  return { ref, className: `${base}${visible ? " reveal-visible" : ""}` };
}

function StepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const { ref, className } = useReveal<HTMLDivElement>();
  return (
    <div className={`land-step ${className}`} ref={ref} style={{ transitionDelay: `${index * 90}ms` }}>
      <div className="land-step-mockup">{step.mockup}</div>
      <span className="land-step-label">{step.label}</span>
      <div className="land-step-title">{step.title}</div>
      <p className="land-step-body">{step.body}</p>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: (typeof FEATURES)[number]; index: number }) {
  const { ref, className } = useReveal<HTMLDivElement>();
  return (
    <div className={`land-feature-card ${className}`} ref={ref} style={{ transitionDelay: `${index * 70}ms` }}>
      <div className={`land-feature-icon tone-${feature.tone}`}>
        <feature.icon className="w-4 h-4" />
      </div>
      <div className="land-feature-title">{feature.title}</div>
      <p className="land-feature-body">{feature.body}</p>
    </div>
  );
}

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
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const closeCookies = useCallback(() => setCookiesOpen(false), []);
  const navRef = useRef<HTMLDivElement>(null);
  const { ref: stepsHeadingRef, className: stepsHeadingClass } = useReveal<HTMLDivElement>();
  const { ref: featuresHeadingRef, className: featuresHeadingClass } = useReveal<HTMLDivElement>();
  const { ref: trustCopyRef, className: trustCopyClass } = useReveal<HTMLDivElement>("left");
  const { ref: trustVisualRef, className: trustVisualClass } = useReveal<HTMLDivElement>("right");
  const { ref: faqRef, className: faqClass } = useReveal<HTMLDivElement>();
  const { ref: ctaRef, className: ctaClass } = useReveal<HTMLDivElement>();

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

  // The hero preview is an example built from whatever the visitor types, not a real agent.
  const typedName = name.trim().replace(/\s+/g, " ");
  const previewName = typedName.length > 28 ? `${typedName.slice(0, 27).trimEnd()}…` : typedName || "Your Name";
  const previewInitials =
    previewName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "YN";
  const previewSlug = slugify(name.trim()) || "yourname";

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
              One shareable page for your credentials, your track record, and every way to reach you — the link you
              put on WhatsApp, Instagram, and your business card instead of a scattered handful of them.
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
                  agentprofile.ae/{previewSlug}
                </span>
              </div>
              <div className="browser-body">
                <div className="card profile land-mockup-card">
                  <div className="profile-hero">
                    <span className="land-mockup-example">Example</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/seed/ahmed-cover.svg" alt="" className="profile-hero-img" />
                    <div className="profile-hero-id">
                      <div className="avatar-wrap">
                        <div className="avatar">{previewInitials}</div>
                        <div className="verified-badge">
                          <CheckIcon className="w-[13px] h-[13px]" />
                        </div>
                      </div>
                      <div className="id-main">
                        <div className="mockup-name">{previewName}</div>
                        <p className="role-line">Real Estate Agent</p>
                        <p className="agency">Your Agency</p>
                      </div>
                    </div>
                  </div>
                  <div className="stat-strip">
                    <div className="stat-item">
                      <span className="stat-value">12</span>
                      <span className="stat-label">Sales</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">7</span>
                      <span className="stat-label">Rentals</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">8</span>
                      <span className="stat-label">Years</span>
                    </div>
                  </div>
                  <div className="profile-divider" aria-hidden="true">
                    <span className="profile-divider-dot" />
                  </div>
                  <div className="profile-socials land-mockup-socials" aria-hidden="true">
                    <span className="social-plain">
                      <InstagramIcon className="w-[16px] h-[16px]" />
                    </span>
                    <span className="social-plain">
                      <LinkedInIcon className="w-[16px] h-[16px]" />
                    </span>
                    <span className="social-plain">
                      <TikTokIcon className="w-[16px] h-[16px]" />
                    </span>
                    <span className="social-plain">
                      <YouTubeIcon className="w-[16px] h-[16px]" />
                    </span>
                    <span className="social-plain">
                      <GlobeIcon className="w-[16px] h-[16px]" />
                    </span>
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
        <div ref={stepsHeadingRef} className={stepsHeadingClass}>
          <span className="land-eyebrow land-eyebrow-center">How it works</span>
          <h2>Live in three steps, not three weeks</h2>
        </div>
        <div className="land-steps-row">
          {STEPS.map((s, i) => (
            <StepCard step={s} index={i} key={s.title} />
          ))}
        </div>
      </section>

      <section className="land-features">
        <div ref={featuresHeadingRef} className={featuresHeadingClass}>
          <span className="land-eyebrow land-eyebrow-center">Why agents choose us</span>
          <h2>Everything a client needs to trust you — in one tap</h2>
        </div>
        <div className="land-feature-grid">
          {FEATURES.map((f, i) => (
            <FeatureCard feature={f} index={i} key={f.title} />
          ))}
        </div>
      </section>

      <section className="land-trust-band">
        <div className="land-trust">
          <div className="land-trust-copy" ref={trustCopyRef}>
            <div className={trustCopyClass}>
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
          </div>
          <div className="land-trust-visual" ref={trustVisualRef}>
            <div className={`land-trust-card ${trustVisualClass}`}>
              <div className="land-trust-card-row">
                <div className="land-trust-card-icon">
                  <BriefcaseIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="land-trust-card-label">RERA BRN</div>
                  <div className="land-trust-card-value">Your BRN</div>
                </div>
                <span className="land-trust-pill pending">Checking</span>
              </div>
              <div className="land-trust-card-row">
                <div className="land-trust-card-icon">
                  <BuildingIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="land-trust-card-label">DED license</div>
                  <div className="land-trust-card-value">Your agency</div>
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
                  <div className="land-trust-card-value">agentprofile.ae/{previewSlug}</div>
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
        <div ref={faqRef} className={faqClass}>
          <span className="land-eyebrow land-eyebrow-center">Questions</span>
          <h2>Good to know before you start</h2>
          <div className="land-faq-list">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      <section className="land-cta">
        <div className="land-cta-glow" />
        <div ref={ctaRef} className={`land-cta-inner ${ctaClass}`}>
          <h2>Ready to build yours?</h2>
          <p>Set up your profile in under two minutes — no credit card, no catch.</p>
          <Link className="land-cta-btn" href="/signup">
            Create your profile — it&apos;s free
          </Link>
        </div>
      </section>

      <footer className="land-footer">
        <span>agentprofile.ae — your trusted address in UAE real estate</span>
        <div className="land-footer-links">
          <Link href="/privacy">Privacy</Link>
          <button type="button" className="land-footer-btn" onClick={() => setCookiesOpen(true)}>
            Cookie choices
          </button>
          <Link href="/login">Log in</Link>
          <Link href="/signup">Sign up</Link>
        </div>
      </footer>
      {cookiesOpen && <CookieChoicesDialog onClose={closeCookies} />}
    </div>
  );
}
