import { describe, it, expect } from "vitest";
import { formatAED, formatAEDCompact, rentalSuffix, rentalLabel, csvToList, RENTAL_PERIODS } from "./format";

describe("formatAED", () => {
  it("formats with thousands separators and the AED prefix", () => {
    expect(formatAED(1500000)).toBe("AED 1,500,000");
  });

  it("formats zero", () => {
    expect(formatAED(0)).toBe("AED 0");
  });

  it("formats small numbers without separators", () => {
    expect(formatAED(500)).toBe("AED 500");
  });
});

describe("formatAEDCompact", () => {
  it("formats billions with a B suffix", () => {
    expect(formatAEDCompact(1_500_000_000)).toBe("AED 1.5B");
  });

  it("formats millions with an M suffix", () => {
    expect(formatAEDCompact(45_000_000)).toBe("AED 45M");
    expect(formatAEDCompact(45_500_000)).toBe("AED 45.5M");
  });

  it("formats thousands with a K suffix", () => {
    expect(formatAEDCompact(850_000)).toBe("AED 850K");
  });

  it("falls back to the full formatted amount below 1,000", () => {
    expect(formatAEDCompact(500)).toBe("AED 500");
    expect(formatAEDCompact(0)).toBe("AED 0");
  });
});

describe("rentalSuffix", () => {
  it("returns the correct suffix for each rental period", () => {
    expect(rentalSuffix("yearly")).toBe("/yr");
    expect(rentalSuffix("monthly")).toBe("/mo");
    expect(rentalSuffix("weekly")).toBe("/wk");
    expect(rentalSuffix("daily")).toBe("/day");
  });

  it("falls back to /yr for null, undefined, or unknown values", () => {
    expect(rentalSuffix(null)).toBe("/yr");
    expect(rentalSuffix(undefined)).toBe("/yr");
    expect(rentalSuffix("fortnightly")).toBe("/yr");
  });
});

describe("rentalLabel", () => {
  it("returns the human label for each known period", () => {
    expect(rentalLabel("yearly")).toBe("Yearly");
    expect(rentalLabel("monthly")).toBe("Monthly");
    expect(rentalLabel("weekly")).toBe("Weekly");
    expect(rentalLabel("daily")).toBe("Daily");
  });

  it("passes through unknown values unchanged", () => {
    expect(rentalLabel("fortnightly")).toBe("fortnightly");
  });

  it("returns a capitalized label distinct from the raw value for every known period", () => {
    for (const period of RENTAL_PERIODS) {
      const label = rentalLabel(period);
      expect(label).not.toBe(period);
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });
});

describe("csvToList", () => {
  it("splits a comma-separated string and trims whitespace", () => {
    expect(csvToList("Dubai, Abu Dhabi,  Sharjah")).toEqual(["Dubai", "Abu Dhabi", "Sharjah"]);
  });

  it("drops empty segments from stray commas", () => {
    expect(csvToList("Dubai,, Abu Dhabi,")).toEqual(["Dubai", "Abu Dhabi"]);
  });

  it("returns an empty array for an empty string", () => {
    expect(csvToList("")).toEqual([]);
  });

  it("returns a single-item array when there are no commas", () => {
    expect(csvToList("Dubai")).toEqual(["Dubai"]);
  });
});
