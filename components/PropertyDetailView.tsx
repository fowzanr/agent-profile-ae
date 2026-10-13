"use client";

import { useState } from "react";
import Link from "next/link";
import type { Property } from "@prisma/client";
import type { PublicAgent } from "@/lib/prisma";
import { PropertyArt } from "@/components/PropertyArt";
import { formatAED, rentalSuffix, rentalLabel } from "@/lib/format";
import { furnishingLabel, ownershipLabel, usageLabel, mapsLink } from "@/lib/propertyMeta";
import { track } from "@/lib/track";
import { RERA_BROKERS_URL } from "@/lib/constants";
import {
  ArrowLeftIcon,
  HeartIcon,
  BedIcon,
  BathIcon,
  AreaIcon,
  PinIcon,
  WhatsAppIcon,
  PhoneIcon,
  CalendarIcon,
  ShareIcon,
  ChevronRightIcon,
} from "@/components/icons";

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

function waLink(phone: string, message: string) {
  return `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(message)}`;
}

export function PropertyDetailView({ property, agent }: { property: Property; agent: PublicAgent }) {
  const [saved, setSaved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [shareLabel, setShareLabel] = useState("Share");
  const [agentShareLabel, setAgentShareLabel] = useState("Share");
  const message = `Hi ${agent.name.split(" ")[0]}, I'm interested in ${property.title} (${property.location}).`;
  const images = [property.image1, property.image2, property.image3].filter((v): v is string => Boolean(v));

  async function share(url: string, title: string, text: string, onDone: (label: string) => void) {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
    } catch {
      // clipboard unavailable — ignore
    }
    onDone("Link copied");
    setTimeout(() => onDone("Share"), 1800);
  }

  function shareProperty() {
    track(agent.id, "share", property.id);
    const url = typeof window !== "undefined" ? window.location.href : "";
    share(url, property.title, `${property.title} — ${formatAED(property.price)}`, setShareLabel);
  }

  function shareAgent() {
    track(agent.id, "share");
    const url = typeof window !== "undefined" ? `${window.location.origin}/${agent.slug}` : "";
    share(url, agent.name, agent.agency ? `${agent.name} — ${agent.agency}` : agent.name, setAgentShareLabel);
  }

  const factRows: { label: string; value: string }[] = [
    { label: "Property Type", value: property.propertyType },
    { label: "Furnishing", value: furnishingLabel(property.furnishing) },
    { label: "Ownership", value: ownershipLabel(property.ownership) },
    { label: "Usage", value: usageLabel(property.usage) },
    { label: "Parking", value: property.hasParking ? "Available" : "Not available" },
    { label: "Balcony", value: property.hasBalcony ? "Yes" : "No" },
  ];
  if (property.plotArea) factRows.push({ label: "Plot Area", value: `${property.plotArea.toLocaleString()} sqft` });
  if (property.status === "offplan" && property.completionPercent != null) {
    factRows.push({ label: "Completion", value: `${property.completionPercent}% complete` });
  }
  if (property.listingType === "sale" && property.expectedRentYearly) {
    factRows.push({ label: "Expected Rent (Yearly)", value: `${formatAED(property.expectedRentYearly)} /yr` });
  }

  return (
    <div className="detail-shell">
      <div className="page">
        <div className="detail-topbar">
          <Link className="back-link" href={`/${agent.slug}`}>
            <ArrowLeftIcon className="w-[15px] h-[15px]" />
            {agent.name.split(" ")[0]}&apos;s Profile
          </Link>
          <div className="wordmark">
            agentprofile.ae<b>/{agent.slug}</b>
          </div>
        </div>

        <div className="detail-content">
          <div className="hero">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[activeImage]} alt={property.title} className="hero-photo" />
            ) : (
              <PropertyArt seed={property.imageSeed || 1} height={260} />
            )}
            <div className="hero-scrim" />
            <div className="badge-row">
              <div className="status-pills">
                <span className="pill pill-type">{property.listingType === "sale" ? "For Sale" : "For Rent"}</span>
                <span className="pill pill-status">
                  {property.listingType === "sale"
                    ? property.status === "ready"
                      ? "Ready"
                      : "Off-Plan"
                    : rentalLabel(property.rentalPeriod ?? "yearly")}
                </span>
              </div>
              <div className="hero-actions">
                <button className="hero-icon-btn" aria-label="Share this property" title={shareLabel} onClick={shareProperty}>
                  <ShareIcon className="w-4 h-4" />
                </button>
                <button className={`hero-save-btn${saved ? " saved" : ""}`} aria-label="Save listing" onClick={() => setSaved((v) => !v)}>
                  <HeartIcon className="w-[18px] h-[18px]" filled={saved} />
                </button>
              </div>
            </div>
            {images.length > 1 && (
              <div className="hero-dots">
                {images.map((_, i) => (
                  <button
                    key={i}
                    className={`hero-dot${i === activeImage ? " active" : ""}`}
                    aria-label={`Photo ${i + 1} of ${images.length}`}
                    onClick={() => setActiveImage(i)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="headline">
            <h1 className="property-title">{property.title}</h1>
            <div className="price-lg">
              {formatAED(property.price)}
              {property.listingType === "rent" ? ` ${rentalSuffix(property.rentalPeriod)}` : ""}
            </div>
            <div className="addr">
              <PinIcon className="w-3.5 h-3.5" />
              {property.location}
              <a className="map-link" href={mapsLink(property.location)} target="_blank" rel="noopener noreferrer">
                View on Map
                <ChevronRightIcon className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="specs-row">
            <div className="spec-chip">
              <BedIcon className="w-[18px] h-[18px]" />
              <span className="v">{property.beds}</span>
              <span className="l">Bedrooms</span>
            </div>
            <div className="spec-chip">
              <BathIcon className="w-[18px] h-[18px]" />
              <span className="v">{property.baths}</span>
              <span className="l">Bathrooms</span>
            </div>
            <div className="spec-chip">
              <AreaIcon className="w-[18px] h-[18px]" />
              <span className="v">{property.sqft.toLocaleString()}</span>
              <span className="l">Built-up Area</span>
            </div>
            {property.handoverNote && (
              <div className="spec-chip">
                <CalendarIcon className="w-[18px] h-[18px]" />
                <span className="v" style={{ fontSize: 11 }}>
                  {property.handoverNote}
                </span>
                <span className="l">Handover</span>
              </div>
            )}
          </div>

          <div className="block">
            <div className="block-title">About this property</div>
            <p className="desc">{property.description}</p>
          </div>

          <div className="block">
            <div className="block-title">Property Details</div>
            <div className="facts-grid">
              {factRows.map((f) => (
                <div className="fact" key={f.label}>
                  <span className="fact-label">{f.label}</span>
                  <span className="fact-value">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="block">
            <div className="block-title">Listed by</div>
            <div className="agent-card">
              {agent.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agent.photoUrl} alt={agent.name} className="avatar-sm avatar-photo" />
              ) : (
                <div className="avatar-sm">{agent.avatarInitials}</div>
              )}
              <div className="agent-info">
                <span className="agent-name">{agent.name}</span>
                <span className="agent-meta">
                  {agent.yearsExperience} yrs{agent.agency ? ` · ${agent.agency}` : ""}
                </span>
              </div>
              <button className="mini-btn" aria-label="Share this agent's profile" onClick={shareAgent} title={agentShareLabel}>
                <ShareIcon className="w-3 h-3" />
              </button>
              <Link className="view-profile" href={`/${agent.slug}`}>
                View Profile
              </Link>
            </div>
            <p className="brn" style={{ marginTop: 4 }}>
              RERA BRN <b>{agent.brn}</b> —{" "}
              <a
                href={RERA_BROKERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                verify on RERA
              </a>
            </p>
          </div>

          <div className="cta-row two-col">
            <a
              className="cta-tile wa full-span"
              href={waLink(agent.whatsapp, message)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(agent.id, "whatsapp_click", property.id)}
            >
              <WhatsAppIcon className="w-4 h-4" />
              WhatsApp About This Property
            </a>
            <a
              className="cta-tile"
              href={`tel:${digitsOnly(agent.phone)}`}
              onClick={() => track(agent.id, "call_click", property.id)}
            >
              <PhoneIcon className="w-[15px] h-[15px]" />
              Call
            </a>
            <a
              className="cta-tile"
              href={waLink(agent.whatsapp, `Hi ${agent.name.split(" ")[0]}, I'd like to book a viewing for ${property.title}.`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(agent.id, "book_click", property.id)}
            >
              <CalendarIcon className="w-[15px] h-[15px]" />
              Book a Viewing
            </a>
          </div>

          <footer className="site-footer">
            <p className="fineprint">
              agentprofile.ae/{agent.slug} — your trusted address in UAE real estate
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
