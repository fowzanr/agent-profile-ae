"use client";

import type { Property } from "@prisma/client";
import { RENTAL_PERIODS, rentalLabel } from "@/lib/format";
import {
  PROPERTY_TYPES,
  FURNISHING_OPTIONS,
  OWNERSHIP_OPTIONS,
  USAGE_OPTIONS,
  furnishingLabel,
  ownershipLabel,
  usageLabel,
} from "@/lib/propertyMeta";
import { BriefcaseIcon, AreaIcon, CameraIcon } from "@/components/icons";

export type PropertyFormState = {
  title: string;
  location: string;
  price: string;
  listingType: "sale" | "rent";
  status: "ready" | "offplan";
  rentalPeriod: "yearly" | "monthly" | "weekly" | "daily";
  beds: string;
  baths: string;
  sqft: string;
  description: string;
  handoverNote: string;
  propertyType: (typeof PROPERTY_TYPES)[number];
  furnishing: (typeof FURNISHING_OPTIONS)[number];
  ownership: (typeof OWNERSHIP_OPTIONS)[number];
  usage: (typeof USAGE_OPTIONS)[number];
  hasParking: boolean;
  hasBalcony: boolean;
  plotArea: string;
  completionPercent: string;
  expectedRentYearly: string;
  image1: string | null;
  image2: string | null;
  image3: string | null;
  isFeatured: boolean;
};

export const emptyPropertyForm: PropertyFormState = {
  title: "",
  location: "",
  price: "",
  listingType: "sale",
  status: "ready",
  rentalPeriod: "yearly",
  beds: "",
  baths: "",
  sqft: "",
  description: "",
  handoverNote: "",
  propertyType: "Apartment",
  furnishing: "unfurnished",
  ownership: "freehold",
  usage: "residential",
  hasParking: false,
  hasBalcony: false,
  plotArea: "",
  completionPercent: "",
  expectedRentYearly: "",
  image1: null,
  image2: null,
  image3: null,
  isFeatured: false,
};

export function propertyToFormState(p: Property): PropertyFormState {
  return {
    title: p.title,
    location: p.location,
    price: String(p.price),
    listingType: p.listingType as PropertyFormState["listingType"],
    status: p.status as PropertyFormState["status"],
    rentalPeriod: (p.rentalPeriod ?? "yearly") as PropertyFormState["rentalPeriod"],
    beds: String(p.beds),
    baths: String(p.baths),
    sqft: String(p.sqft),
    description: p.description,
    handoverNote: p.handoverNote ?? "",
    propertyType: p.propertyType as PropertyFormState["propertyType"],
    furnishing: p.furnishing as PropertyFormState["furnishing"],
    ownership: p.ownership as PropertyFormState["ownership"],
    usage: p.usage as PropertyFormState["usage"],
    hasParking: p.hasParking,
    hasBalcony: p.hasBalcony,
    plotArea: p.plotArea != null ? String(p.plotArea) : "",
    completionPercent: p.completionPercent != null ? String(p.completionPercent) : "",
    expectedRentYearly: p.expectedRentYearly != null ? String(p.expectedRentYearly) : "",
    image1: p.image1,
    image2: p.image2,
    image3: p.image3,
    isFeatured: p.isFeatured,
  };
}

const selectStyle: React.CSSProperties = {
  padding: 11,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface)",
};

function SectionHeader({
  tone,
  icon,
  title,
  sub,
}: {
  tone: "primary" | "gold" | "accent3";
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="section-header">
      <div className={`section-icon tone-${tone}`}>{icon}</div>
      <div>
        <div className="section-title">{title}</div>
        <div className="section-sub">{sub}</div>
      </div>
    </div>
  );
}

export function PropertyForm({
  form,
  onFieldChange,
  uploadingSlot,
  onImageSelect,
  onRemoveImage,
  noTopBorder,
}: {
  form: PropertyFormState;
  onFieldChange: <K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) => void;
  uploadingSlot: 1 | 2 | 3 | null;
  onImageSelect: (slot: 1 | 2 | 3, file: File | undefined) => void;
  onRemoveImage: (slot: 1 | 2 | 3) => void;
  noTopBorder?: boolean;
}) {
  return (
    <>
      <div className="form-section" style={noTopBorder ? { marginTop: 0, paddingTop: 0, borderTop: "none" } : undefined}>
        <SectionHeader
          tone="primary"
          icon={<BriefcaseIcon className="w-4 h-4" />}
          title="Basics"
          sub="What it is, where it is, and what it costs."
        />
        <div className="field-grid">
          <div className="field">
            <label>Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => onFieldChange("title", e.target.value)}
              placeholder="Marina Gate II"
            />
          </div>
          <div className="field">
            <label>Location</label>
            <input
              required
              value={form.location}
              onChange={(e) => onFieldChange("location", e.target.value)}
              placeholder="Dubai Marina — Marina Gate II"
            />
          </div>
          <div className="field">
            <label>Price (AED)</label>
            <input
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => onFieldChange("price", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Listing type</label>
            <select
              value={form.listingType}
              onChange={(e) => onFieldChange("listingType", e.target.value as PropertyFormState["listingType"])}
              style={selectStyle}
            >
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
          </div>
          {form.listingType === "sale" ? (
            <div className="field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => onFieldChange("status", e.target.value as PropertyFormState["status"])}
                style={selectStyle}
              >
                <option value="ready">Ready</option>
                <option value="offplan">Off-Plan</option>
              </select>
            </div>
          ) : (
            <div className="field">
              <label>Rental period</label>
              <select
                value={form.rentalPeriod}
                onChange={(e) => onFieldChange("rentalPeriod", e.target.value as PropertyFormState["rentalPeriod"])}
                style={selectStyle}
              >
                {RENTAL_PERIODS.map((period) => (
                  <option key={period} value={period}>
                    {rentalLabel(period)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="field">
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => onFieldChange("description", e.target.value)} />
        </div>
      </div>

      <div className="form-section">
        <SectionHeader
          tone="accent3"
          icon={<AreaIcon className="w-4 h-4" />}
          title="Specifications"
          sub="Size, type, and the details buyers ask about."
        />
        <div className="field-grid">
          <div className="field">
            <label>Beds</label>
            <input required type="number" min={0} value={form.beds} onChange={(e) => onFieldChange("beds", e.target.value)} />
          </div>
          <div className="field">
            <label>Baths</label>
            <input required type="number" min={0} value={form.baths} onChange={(e) => onFieldChange("baths", e.target.value)} />
          </div>
          <div className="field">
            <label>Built-up Area (sqft)</label>
            <input required type="number" min={0} value={form.sqft} onChange={(e) => onFieldChange("sqft", e.target.value)} />
          </div>
          <div className="field">
            <label>Property type</label>
            <select
              value={form.propertyType}
              onChange={(e) => onFieldChange("propertyType", e.target.value as PropertyFormState["propertyType"])}
              style={selectStyle}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Furnishing</label>
            <select
              value={form.furnishing}
              onChange={(e) => onFieldChange("furnishing", e.target.value as PropertyFormState["furnishing"])}
              style={selectStyle}
            >
              {FURNISHING_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {furnishingLabel(v)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Ownership</label>
            <select
              value={form.ownership}
              onChange={(e) => onFieldChange("ownership", e.target.value as PropertyFormState["ownership"])}
              style={selectStyle}
            >
              {OWNERSHIP_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {ownershipLabel(v)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Usage</label>
            <select
              value={form.usage}
              onChange={(e) => onFieldChange("usage", e.target.value as PropertyFormState["usage"])}
              style={selectStyle}
            >
              {USAGE_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {usageLabel(v)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Plot area (sqft, optional)</label>
            <input
              type="number"
              min={0}
              value={form.plotArea}
              onChange={(e) => onFieldChange("plotArea", e.target.value)}
              placeholder="Villas & townhouses"
            />
          </div>
          {form.listingType === "sale" && (
            <div className="field">
              <label>Expected rent, yearly (optional)</label>
              <input
                type="number"
                min={0}
                value={form.expectedRentYearly}
                onChange={(e) => onFieldChange("expectedRentYearly", e.target.value)}
                placeholder="Investor estimate, AED/yr"
              />
            </div>
          )}
          {form.status === "offplan" && (
            <>
              <div className="field">
                <label>Handover note</label>
                <input
                  value={form.handoverNote}
                  onChange={(e) => onFieldChange("handoverNote", e.target.value)}
                  placeholder="Handover Q4 2027"
                />
              </div>
              <div className="field">
                <label>Completion (%, optional)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.completionPercent}
                  onChange={(e) => onFieldChange("completionPercent", e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 4, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" checked={form.hasParking} onChange={(e) => onFieldChange("hasParking", e.target.checked)} />
            Parking available
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" checked={form.hasBalcony} onChange={(e) => onFieldChange("hasBalcony", e.target.checked)} />
            Has balcony
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--gold)",
            }}
          >
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => onFieldChange("isFeatured", e.target.checked)} />
            Feature this listing
          </label>
        </div>
      </div>

      <div className="form-section">
        <SectionHeader tone="gold" icon={<CameraIcon className="w-4 h-4" />} title="Photos" sub="Up to 3 — the first is used as the cover." />
        <div style={{ display: "flex", gap: 10 }}>
          {([1, 2, 3] as const).map((slot) => {
            const key = `image${slot}` as "image1" | "image2" | "image3";
            const url = form[key];
            return (
              <div
                key={slot}
                style={{
                  position: "relative",
                  width: 84,
                  height: 84,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                }}
              >
                {url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${slot}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveImage(slot)}
                      aria-label={`Remove photo ${slot}`}
                      style={{
                        position: "absolute",
                        top: 3,
                        right: 3,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(10,16,28,0.65)",
                        color: "#fff",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <label
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {uploadingSlot === slot ? "Uploading…" : "+ Add"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => onImageSelect(slot, e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
