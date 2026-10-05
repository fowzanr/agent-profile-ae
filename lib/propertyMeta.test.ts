import { describe, it, expect } from "vitest";
import {
  furnishingLabel,
  ownershipLabel,
  usageLabel,
  mapsLink,
  FURNISHING_OPTIONS,
  OWNERSHIP_OPTIONS,
  USAGE_OPTIONS,
} from "./propertyMeta";

describe("furnishingLabel", () => {
  it("maps every known furnishing option to a human label", () => {
    expect(furnishingLabel("unfurnished")).toBe("Unfurnished");
    expect(furnishingLabel("furnished")).toBe("Furnished");
    expect(furnishingLabel("partly")).toBe("Partly Furnished");
  });

  it("passes through unknown values unchanged", () => {
    expect(furnishingLabel("semi-furnished")).toBe("semi-furnished");
  });

  it("covers every value in FURNISHING_OPTIONS", () => {
    for (const opt of FURNISHING_OPTIONS) {
      expect(furnishingLabel(opt)).not.toBe(opt);
    }
  });
});

describe("ownershipLabel", () => {
  it("maps freehold and leasehold to human labels", () => {
    expect(ownershipLabel("freehold")).toBe("Freehold");
    expect(ownershipLabel("leasehold")).toBe("Leasehold");
  });

  it("passes through unknown values unchanged", () => {
    expect(ownershipLabel("shared")).toBe("shared");
  });

  it("covers every value in OWNERSHIP_OPTIONS", () => {
    for (const opt of OWNERSHIP_OPTIONS) {
      expect(ownershipLabel(opt)).not.toBe(opt);
    }
  });
});

describe("usageLabel", () => {
  it("maps residential and commercial to human labels", () => {
    expect(usageLabel("residential")).toBe("Residential");
    expect(usageLabel("commercial")).toBe("Commercial");
  });

  it("passes through unknown values unchanged", () => {
    expect(usageLabel("mixed")).toBe("mixed");
  });

  it("covers every value in USAGE_OPTIONS", () => {
    for (const opt of USAGE_OPTIONS) {
      expect(usageLabel(opt)).not.toBe(opt);
    }
  });
});

describe("mapsLink", () => {
  it("builds a Google Maps search URL for the given location", () => {
    expect(mapsLink("Dubai Marina")).toBe("https://www.google.com/maps/search/?api=1&query=Dubai%20Marina");
  });

  it("URL-encodes special characters", () => {
    expect(mapsLink("Marina Gate II, Dubai")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Marina%20Gate%20II%2C%20Dubai",
    );
  });
});
