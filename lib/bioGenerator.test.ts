import { describe, it, expect, vi, afterEach } from "vitest";
import { generateBio } from "./bioGenerator";

const baseInput = {
  name: "Ahmed Al Falasi",
  role: "Luxury Specialist",
  agency: "Vantage Real Estate",
  yearsExperience: 8,
  specialities: "Off-plan, Luxury Villas",
  areas: "Dubai Marina, JVC",
  languages: "English, Arabic",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateBio", () => {
  it("includes the agent's first name, not the full name", () => {
    const bio = generateBio(baseInput);
    expect(bio).toContain("Ahmed");
    expect(bio).not.toContain("Ahmed Al Falasi");
  });

  it("includes the specialities and areas", () => {
    const bio = generateBio(baseInput);
    expect(bio).toContain("Off-plan");
    expect(bio).toContain("Luxury Villas");
    expect(bio).toContain("Dubai Marina");
    expect(bio).toContain("JVC");
  });

  it("mentions languages when provided", () => {
    const bio = generateBio(baseInput);
    expect(bio).toContain("Fluent in English and Arabic");
  });

  it("omits the language sentence entirely when no languages are given", () => {
    const bio = generateBio({ ...baseInput, languages: "" });
    expect(bio).not.toContain("Fluent in");
  });

  it("falls back to generic specialities and areas when left blank", () => {
    const bio = generateBio({ ...baseInput, specialities: "", areas: "" });
    expect(bio).toContain("residential sales and rentals");
    expect(bio).toContain("the UAE");
  });

  it("uses just the first name (no dangling 'at') when agency is blank", () => {
    const bio = generateBio({ ...baseInput, agency: "" });
    expect(bio).not.toMatch(/\bat\s*,/);
    expect(bio).not.toContain(" at .");
  });

  it("handles a single-word name without throwing", () => {
    const bio = generateBio({ ...baseInput, name: "Cher" });
    expect(bio).toContain("Cher");
  });

  it("falls back to 'This agent' when the name is empty", () => {
    const bio = generateBio({ ...baseInput, name: "" });
    expect(bio).toContain("This agent");
  });

  it("phrases zero years experience as newly licensed, not '0 years'", () => {
    // template[0] and template[2] both embed experiencePhrase; force selection deterministically
    vi.spyOn(Math, "random").mockReturnValue(0);
    const bio = generateBio({ ...baseInput, yearsExperience: 0 });
    expect(bio).toContain("newly licensed");
    expect(bio).not.toContain("0 years");
  });

  it("uses singular 'a year' for exactly one year of experience", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const bio = generateBio({ ...baseInput, yearsExperience: 1 });
    expect(bio).toContain("a year of hands-on experience");
    expect(bio).not.toContain("1 years");
  });

  it("uses plural 'N years' for more than one year of experience", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const bio = generateBio({ ...baseInput, yearsExperience: 5 });
    expect(bio).toContain("5 years of hands-on experience");
  });

  it("never produces doubled whitespace", () => {
    for (let i = 0; i < 10; i++) {
      const bio = generateBio(baseInput);
      expect(bio).not.toMatch(/\s{2,}/);
    }
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

  it("joins three or more languages with an Oxford comma", () => {
    const bio = generateBio({ ...baseInput, languages: "English, Arabic, Hindi" });
    expect(bio).toContain("Fluent in English, Arabic, and Hindi");
  });
});
