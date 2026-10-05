export const PROPERTY_TYPES = ["Apartment", "Villa", "Townhouse", "Penthouse", "Studio", "Duplex", "Office", "Retail"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const FURNISHING_OPTIONS = ["unfurnished", "furnished", "partly"] as const;
export type Furnishing = (typeof FURNISHING_OPTIONS)[number];
const FURNISHING_LABEL: Record<Furnishing, string> = {
  unfurnished: "Unfurnished",
  furnished: "Furnished",
  partly: "Partly Furnished",
};
export function furnishingLabel(value: string): string {
  return value in FURNISHING_LABEL ? FURNISHING_LABEL[value as Furnishing] : value;
}

export const OWNERSHIP_OPTIONS = ["freehold", "leasehold"] as const;
export type Ownership = (typeof OWNERSHIP_OPTIONS)[number];
const OWNERSHIP_LABEL: Record<Ownership, string> = { freehold: "Freehold", leasehold: "Leasehold" };
export function ownershipLabel(value: string): string {
  return value in OWNERSHIP_LABEL ? OWNERSHIP_LABEL[value as Ownership] : value;
}

export const USAGE_OPTIONS = ["residential", "commercial"] as const;
export type Usage = (typeof USAGE_OPTIONS)[number];
const USAGE_LABEL: Record<Usage, string> = { residential: "Residential", commercial: "Commercial" };
export function usageLabel(value: string): string {
  return value in USAGE_LABEL ? USAGE_LABEL[value as Usage] : value;
}

export function mapsLink(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
