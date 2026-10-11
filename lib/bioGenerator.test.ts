import { describe, it, expect } from "vitest";
import { generateBio, truncateBio } from "./bioGenerator";
import { BIO_MAX_LENGTH } from "./constants";

const baseInput = {
  name: "Ahmed Al Falasi",
  role: "Luxury Specialist",
  agency: "Vantage Real Estate",
  yearsExperience: 8,
  specialities: "Off-plan, Luxury Villas",
  areas: "Dubai Marina, JVC",
  languages: "English, Arabic",
};

describe("generateBio", () => {
  it("stays within the Instagram-style length limit", () => {
    expect(generateBio(baseInput).length).toBeLessThanOrEqual(BIO_MAX_LENGTH);
  });

  it("includes the role, agency, specialities, and areas when they fit", () => {
    const bio = generateBio(baseInput);
    expect(bio).toContain("Luxury Specialist at Vantage Real Estate");
    expect(bio).toContain("Off-plan & Luxury Villas");
    expect(bio).toContain("Dubai Marina, JVC");
  });

  it("joins three or more specialities as 'A, B & C'", () => {
    const bio = generateBio({ ...baseInput, specialities: "Off-plan, Villas, Leasing", languages: "" });
    expect(bio).toContain("Off-plan, Villas & Leasing");
  });

  it("is split into short lines", () => {
    expect(generateBio(baseInput).split("\n")).toHaveLength(3);
  });

  it("mentions languages when provided", () => {
    expect(generateBio(baseInput)).toContain("English, Arabic");
  });

  it("leaves languages out when none are given", () => {
    const bio = generateBio({ ...baseInput, languages: "" });
    expect(bio.split("\n")[2]).toBe("8 years experience");
  });

  it("falls back to generic specialities and areas when left blank", () => {
    const bio = generateBio({ ...baseInput, specialities: "", areas: "" });
    expect(bio).toContain("Residential sales & rentals");
    expect(bio).toContain("across the UAE");
  });

  it("has no dangling 'at' when agency is blank", () => {
    const bio = generateBio({ ...baseInput, agency: "" });
    expect(bio).not.toMatch(/\bat\s*$/m);
    expect(bio.split("\n")[0]).toBe("Luxury Specialist");
  });

  it("phrases zero years experience as newly licensed, not '0 years'", () => {
    const bio = generateBio({ ...baseInput, yearsExperience: 0 });
    expect(bio).toContain("Newly licensed");
    expect(bio).not.toContain("0 years");
  });

  it("uses singular 'year' for exactly one year", () => {
    const bio = generateBio({ ...baseInput, yearsExperience: 1 });
    expect(bio).toContain("1 year experience");
  });

  it("uses plural 'years' for more than one year", () => {
    expect(generateBio({ ...baseInput, yearsExperience: 5 })).toContain("5 years experience");
  });

  it("drops detail rather than exceeding the limit for long inputs", () => {
    const bio = generateBio({
      ...baseInput,
      agency: "Very Long Brokerage Name International Realty Group LLC",
      specialities: "Off-plan, Luxury Villas, Penthouses, Commercial Leasing, Holiday Homes",
      areas: "Dubai Marina, JVC, Palm Jumeirah, Downtown Dubai, Business Bay, Arabian Ranches",
      languages: "English, Arabic, Hindi, Urdu, Russian",
    });
    expect(bio.length).toBeLessThanOrEqual(BIO_MAX_LENGTH);
    expect(bio).toContain("Off-plan");
    expect(bio).toContain("Dubai Marina");
  });

  it("never returns an empty string", () => {
    const bio = generateBio({
      name: "",
      role: "",
      agency: "",
      yearsExperience: 0,
      specialities: "",
      areas: "",
      languages: "",
    });
    expect(bio.length).toBeGreaterThan(0);
  });
});

describe("truncateBio", () => {
  it("leaves short text alone", () => {
    expect(truncateBio("Hello there")).toBe("Hello there");
  });

  it("cuts long text at a word boundary with an ellipsis", () => {
    const out = truncateBio("word ".repeat(60).trim());
    expect(out.length).toBeLessThanOrEqual(BIO_MAX_LENGTH);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/wor…$/);
  });
});
