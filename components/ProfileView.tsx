"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Agent, AgentLink, Property, Testimonial } from "@prisma/client";
import { PropertyArt } from "@/components/PropertyArt";
import { formatAED, formatAEDCompact, csvToList, rentalSuffix, rentalLabel, RENTAL_PERIODS } from "@/lib/format";
import { track } from "@/lib/track";
import { LISTINGS_ENABLED, LEADS_ENABLED } from "@/lib/constants";
import {
  WhatsAppIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  PinIcon,
  BedIcon,
  BathIcon,
  AreaIcon,
  HeartIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ShareIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  LinkIcon,
  StarIcon,
  BriefcaseIcon,
  MessageIcon,
  BuildingIcon,
  TrendingUpIcon,
} from "@/components/icons";

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

function waLink(phone: string, message: string) {
  const digits = digitsOnly(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

const VISIBLE_LIMIT = 4;

type AgentWithRelations = Agent & {
  properties: Property[];
  testimonials: Testimonial[];
  links: AgentLink[];
};

export function ProfileView({
  agent,
  stats,
  previewNotice,
}: {
  agent: AgentWithRelations;
  stats: { forSaleCount: number; forRentCount: number };
  previewNotice?: string | null;
}) {
  const [bioOpen, setBioOpen] = useState(false);
  const hasSale = stats.forSaleCount > 0;
  const hasRent = stats.forRentCount > 0;
  const [dealType, setDealType] = useState<"sale" | "rent">(hasSale ? "sale" : "rent");
  const [subFilter, setSubFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [brnInfoOpen, setBrnInfoOpen] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share this profile");
  const brnWrapRef = useRef<HTMLSpanElement>(null);
  const [leadName, setLeadName] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [sendingLead, setSendingLead] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const specialities = useMemo(() => csvToList(agent.specialities), [agent.specialities]);
  const areas = useMemo(() => csvToList(agent.areas), [agent.areas]);
  const languages = useMemo(() => csvToList(agent.languages), [agent.languages]);

  const saleProperties = useMemo(() => agent.properties.filter((p) => p.listingType === "sale"), [agent.properties]);
  const rentProperties = useMemo(() => agent.properties.filter((p) => p.listingType === "rent"), [agent.properties]);
  const dealProperties = dealType === "sale" ? saleProperties : rentProperties;

  const readyCount = saleProperties.filter((p) => p.status === "ready").length;
  const offplanCount = saleProperties.filter((p) => p.status === "offplan").length;
  const rentalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const period of RENTAL_PERIODS) {
      counts[period] = rentProperties.filter((p) => p.rentalPeriod === period).length;
    }
    return counts;
  }, [rentProperties]);

  const filteredProperties = useMemo(() => {
    const base =
      subFilter === "all"
        ? dealProperties
        : dealType === "sale"
          ? dealProperties.filter((p) => p.status === subFilter)
          : dealProperties.filter((p) => p.rentalPeriod === subFilter);
    return [...base].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  }, [dealProperties, subFilter, dealType]);

  const visibleProperties = expanded ? filteredProperties : filteredProperties.slice(0, VISIBLE_LIMIT);

  function changeDealType(next: "sale" | "rent") {
    setDealType(next);
    setSubFilter("all");
    setExpanded(false);
  }

  function changeSubFilter(next: string) {
    setSubFilter(next);
    setExpanded(false);
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (brnWrapRef.current && !brnWrapRef.current.contains(e.target as Node)) {
        setBrnInfoOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setBrnInfoOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function toggleSaved(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleShare() {
    track(agent.id, "share");
    const url = typeof window !== "undefined" ? window.location.href : "";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${agent.name} — agentprofile.ae`, url });
        return;
      } catch {
        // user cancelled the native share sheet, or it's unsupported here — fall back to copy
      }
    }

    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
    } catch {
      // clipboard unavailable — ignore
    }
    setShareLabel("Link copied");
    setTimeout(() => setShareLabel("Share this profile"), 1800);
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setLeadError(null);
    setSendingLead(true);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: agent.id,
        name: leadName,
        contact: leadContact,
        message: leadMessage || undefined,
      }),
    });
    setSendingLead(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setLeadError(data?.error ?? "Couldn't send your message");
      return;
    }
    setLeadSent(true);
  }

  const hasTestimonials = agent.testimonials.length > 0;
  const hasSocials = agent.instagramUrl || agent.linkedinUrl || agent.tiktokUrl;
  const hasLinks = agent.links.length > 0;

  const generalMessage = `Hi ${agent.name.split(" ")[0]}, I found your profile on agentprofile.ae and I'd like to get in touch.`;
  const bookMessage = `Hi ${agent.name.split(" ")[0]}, I'd like to book a viewing. Here's a good time for me: `;

  return (
    <>
      {previewNotice && <div className="preview-notice-banner">{previewNotice}</div>}
      <div className="page-shell">
      <div className="page">
        <div className="card profile">
          <button type="button" className="profile-share-btn" onClick={handleShare} aria-label="Share profile">
            <ShareIcon className="w-4 h-4" />
          </button>
          <div className="id-row">
            <div className="avatar-wrap">
              {agent.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agent.photoUrl} alt={agent.name} className="avatar avatar-photo" />
              ) : (
                <div className="avatar">{agent.avatarInitials}</div>
              )}
              {agent.isVerified && agent.isPro && (
                <div className="verified-badge">
                  <CheckIcon className="w-[13px] h-[13px]" />
                </div>
              )}
            </div>
            <div className="id-main">
              <div className="id-name-row">
                <h1>{agent.name}</h1>
              </div>
              {agent.role && <p className="role-line">{agent.role}</p>}
              {agent.agency && <p className="agency">{agent.agency}</p>}
              <p className="brn">
                RERA{" "}
                <span className="info-wrap" ref={brnWrapRef}>
                  BRN
                  <button
                    className="info-btn"
                    aria-expanded={brnInfoOpen}
                    aria-label="What is a BRN?"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBrnInfoOpen((v) => !v);
                    }}
                  >
                    i
                  </button>
                  <span className={`info-popover${brnInfoOpen ? " open" : ""}`}>
                    <span className="info-popover-title">What&apos;s a BRN?</span>
                    <span className="info-popover-text">
                      Broker Registration Number — a unique ID issued by Dubai&apos;s RERA (Real Estate Regulatory
                      Authority) to every licensed broker. It&apos;s how you confirm an agent is legally registered
                      to practice in Dubai.
                    </span>
                  </span>
                </span>{" "}
                <b>{agent.brn}</b>
                {agent.dedLicensed ? " · DED Licensed" : ""} ·{" "}
                <a
                  href="https://dubailand.gov.ae/en/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  verify on RERA
                </a>
              </p>
            </div>
          </div>

          <a
            className="cta-primary"
            href={waLink(agent.whatsapp, generalMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track(agent.id, "whatsapp_click")}
          >
            <WhatsAppIcon className="w-4 h-4" />
            WhatsApp Now
          </a>
          <div className="cta-row three-col">
            <a className="cta-tile" href={`tel:${digitsOnly(agent.phone)}`} onClick={() => track(agent.id, "call_click")}>
              <PhoneIcon className="w-[15px] h-[15px]" />
              Call
            </a>
            <a className="cta-tile" href={`mailto:${agent.contactEmail}`} onClick={() => track(agent.id, "email_click")}>
              <MailIcon className="w-[15px] h-[15px]" />
              Email
            </a>
            <a
              className="cta-tile"
              href={waLink(agent.whatsapp, bookMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(agent.id, "book_click")}
            >
              <CalendarIcon className="w-[15px] h-[15px]" />
              Book
            </a>
          </div>

          <div className="stat-chips">
            <div className="stat-chip tone-primary">
              <BuildingIcon className="w-3.5 h-3.5" />
              <span className="stat-chip-value">{stats.forSaleCount + stats.forRentCount}</span>
              <span className="stat-chip-label">Total Sales</span>
            </div>
            <div className="stat-chip tone-accent3">
              <StarIcon className="w-3.5 h-3.5" />
              <span className="stat-chip-value">{agent.yearsExperience}</span>
              <span className="stat-chip-label">Experience</span>
            </div>
            {agent.transactedVolume != null && (
              <div className="stat-chip tone-primary">
                <TrendingUpIcon className="w-3.5 h-3.5" />
                <span className="stat-chip-value">{formatAEDCompact(agent.transactedVolume).replace("AED ", "")}</span>
                <span className="stat-chip-label">Transacted (AED)</span>
              </div>
            )}
          </div>

          {(specialities.length > 0 || areas.length > 0 || languages.length > 0) && (
            <div className="detail-rows">
              {specialities.length > 0 && (
                <div className="detail-row">
                  <div className="drow-head">
                    <BriefcaseIcon className="w-3 h-3" />
                    <span className="drow-label">Specialities</span>
                  </div>
                  <div className="drow-chips">
                    {specialities.map((s) => (
                      <span className="drow-chip" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {areas.length > 0 && (
                <div className="detail-row">
                  <div className="drow-head">
                    <PinIcon className="w-3 h-3" />
                    <span className="drow-label">Areas</span>
                  </div>
                  <div className="drow-chips">
                    {areas.map((a) => (
                      <span className="drow-chip" key={a}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {languages.length > 0 && (
                <div className="detail-row">
                  <div className="drow-head">
                    <MessageIcon className="w-3 h-3" />
                    <span className="drow-label">Languages</span>
                  </div>
                  <div className="drow-chips">
                    {languages.map((l) => (
                      <span className="drow-chip" key={l}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {agent.bio && (
            <div className="bio-block">
              <span className="tags-label">Agent Bio</span>
              <p className={`bio-text${bioOpen ? "" : " clamp"}`}>{agent.bio}</p>
              <button
                className={`read-more${bioOpen ? " open" : ""}`}
                aria-expanded={bioOpen}
                onClick={() => setBioOpen((v) => !v)}
              >
                {bioOpen ? "Read less" : "Read more"}
                <ChevronDownIcon className="w-[11px] h-[11px]" />
              </button>
            </div>
          )}

          {LEADS_ENABLED && (
            <div className="lead-form-block">
              <span className="tags-label">Send a Message</span>
              {leadSent ? (
                <div className="lead-form-success">
                  <CheckIcon className="w-4 h-4" />
                  Thanks — {agent.name.split(" ")[0]} will get back to you soon.
                </div>
              ) : (
                <form className="lead-form" onSubmit={submitLead}>
                  {leadError && <div className="form-error">{leadError}</div>}
                  <div className="lead-form-row">
                    <input
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                    <input
                      value={leadContact}
                      onChange={(e) => setLeadContact(e.target.value)}
                      placeholder="Phone or email"
                      required
                    />
                  </div>
                  <textarea
                    value={leadMessage}
                    onChange={(e) => setLeadMessage(e.target.value)}
                    placeholder="Tell them what you're looking for…"
                    rows={3}
                  />
                  <button className="btn-primary" type="submit" disabled={sendingLead}>
                    {sendingLead ? "Sending…" : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {LISTINGS_ENABLED && agent.properties.length > 0 && (
          <>
            <div className="section-head">
              <h2>Featured Listings</h2>
              <span className="count">{agent.properties.length} active</span>
            </div>

            {hasSale && hasRent && (
              <div className="deal-tabs">
                <button className={`deal-tab${dealType === "sale" ? " active" : ""}`} onClick={() => changeDealType("sale")}>
                  Buy · {stats.forSaleCount}
                </button>
                <button className={`deal-tab${dealType === "rent" ? " active" : ""}`} onClick={() => changeDealType("rent")}>
                  Rent · {stats.forRentCount}
                </button>
              </div>
            )}

            {dealType === "sale" ? (
              <div className="filters">
                <button className={`filter-btn${subFilter === "all" ? " active" : ""}`} onClick={() => changeSubFilter("all")}>
                  All · {saleProperties.length}
                </button>
                <button className={`filter-btn${subFilter === "ready" ? " active" : ""}`} onClick={() => changeSubFilter("ready")}>
                  Ready · {readyCount}
                </button>
                <button className={`filter-btn${subFilter === "offplan" ? " active" : ""}`} onClick={() => changeSubFilter("offplan")}>
                  Off-Plan · {offplanCount}
                </button>
              </div>
            ) : (
              <div className="filters">
                <button className={`filter-btn${subFilter === "all" ? " active" : ""}`} onClick={() => changeSubFilter("all")}>
                  All · {rentProperties.length}
                </button>
                {RENTAL_PERIODS.map((period) => (
                  <button
                    key={period}
                    className={`filter-btn${subFilter === period ? " active" : ""}`}
                    onClick={() => changeSubFilter(period)}
                  >
                    {rentalLabel(period)} · {rentalCounts[period]}
                  </button>
                ))}
              </div>
            )}

            <div className="listings">
              {visibleProperties.map((property, i) => {
                const priceLabel =
                  property.listingType === "rent" ? (
                    <>
                      {formatAED(property.price)}
                      <span> {rentalSuffix(property.rentalPeriod)}</span>
                    </>
                  ) : (
                    formatAED(property.price)
                  );
                const propMessage = `Hi ${agent.name.split(" ")[0]}, I'm interested in ${property.title} (${property.location}).`;
                return (
                  <div className="card listing" key={property.id}>
                    <div className="listing-photo">
                      <PropertyArt seed={property.imageSeed || i + 1} height={100} />
                      <div className="badge-row">
                        <div className="status-pills">
                          {property.isFeatured && (
                            <span className="pill pill-featured">
                              <StarIcon className="w-[10px] h-[10px]" />
                              Featured
                            </span>
                          )}
                          <span className="pill pill-type">{property.listingType === "sale" ? "For Sale" : "For Rent"}</span>
                          <span className="pill pill-status">
                            {property.listingType === "sale"
                              ? property.status === "ready"
                                ? "Ready"
                                : "Off-Plan"
                              : rentalLabel(property.rentalPeriod ?? "yearly")}
                          </span>
                        </div>
                        <button
                          className={`save-btn${saved.has(property.id) ? " saved" : ""}`}
                          aria-label="Save listing"
                          onClick={() => toggleSaved(property.id)}
                        >
                          <HeartIcon className="w-3 h-3" filled={saved.has(property.id)} />
                        </button>
                      </div>
                    </div>
                    <div className="listing-body">
                      <div className="listing-price">{priceLabel}</div>
                      <div className="listing-loc">
                        <PinIcon className="w-[13px] h-[13px]" />
                        {property.location}
                      </div>
                      <div className="listing-specs">
                        <span className="spec">
                          <BedIcon className="w-3 h-3" />
                          {property.beds} Bed
                        </span>
                        <span className="spec">
                          <BathIcon className="w-3 h-3" />
                          {property.baths} Bath
                        </span>
                        <span className="spec">
                          <AreaIcon className="w-3 h-3" />
                          {property.sqft.toLocaleString()} sqft
                        </span>
                      </div>
                      <div className="listing-foot" style={{ justifyContent: "space-between" }}>
                        <Link
                          href={`/${agent.slug}/properties/${property.id}`}
                          className="listing-name"
                          style={{ fontSize: "10.5px", textDecoration: "underline", textUnderlineOffset: "2px" }}
                        >
                          Details →
                        </Link>
                        <div className="mini-actions">
                          <a
                            className="mini-btn wa"
                            href={waLink(agent.whatsapp, propMessage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="WhatsApp about this listing"
                            onClick={() => track(agent.id, "whatsapp_click", property.id)}
                          >
                            <WhatsAppIcon className="w-3 h-3" />
                          </a>
                          <a
                            className="mini-btn"
                            href={`tel:${digitsOnly(agent.phone)}`}
                            aria-label="Call about this listing"
                            onClick={() => track(agent.id, "call_click", property.id)}
                          >
                            <PhoneIcon className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredProperties.length > VISIBLE_LIMIT && (
                <button className="view-all-btn" onClick={() => setExpanded((v) => !v)}>
                  {expanded ? "Show Less" : "View All Properties"}
                  <ChevronRightIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          </>
        )}

        {hasTestimonials && (
          <>
            <div className="section-head">
              <h2>What Clients Say</h2>
            </div>
            <div className="testimonials-viewport">
              <div className="testimonials-track">
                {[...agent.testimonials, ...agent.testimonials].map((t, i) => (
                  <div className="card testimonial" key={`${t.id}-${i}`} aria-hidden={i >= agent.testimonials.length}>
                    <div className="stars">{"★".repeat(t.rating)}</div>
                    <p className="quote">&quot;{t.quote}&quot;</p>
                    <p className="attrib">{t.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {hasSocials && (
          <div className="social-row-top" style={{ justifyContent: "center" }}>
            {agent.instagramUrl && (
              <a className="social-sm" href={agent.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramIcon className="w-[15px] h-[15px]" />
              </a>
            )}
            {agent.linkedinUrl && (
              <a className="social-sm" href={agent.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <LinkedInIcon className="w-[15px] h-[15px]" />
              </a>
            )}
            {agent.tiktokUrl && (
              <a className="social-sm" href={agent.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <TikTokIcon className="w-[15px] h-[15px]" />
              </a>
            )}
          </div>
        )}

        {hasLinks && (
          <div className="extra-links">
            <a className="extra-link" href={agent.links[0].url} target="_blank" rel="noopener noreferrer">
              <LinkIcon className="w-[13px] h-[13px]" />
              {agent.links[0].label}
            </a>
          </div>
        )}

        <footer className="site-footer">
          <button className="share-btn" onClick={handleShare}>
            <ShareIcon className="w-[14px] h-[14px]" />
            {shareLabel}
          </button>
          <p className="fineprint">
            agentprofile.ae/{agent.slug} — your trusted address in UAE real estate
          </p>
        </footer>
      </div>
      </div>
    </>
  );
}
