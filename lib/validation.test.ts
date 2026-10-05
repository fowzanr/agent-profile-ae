import { describe, it, expect } from "vitest";
import { isValidBrn, isValidSlug, BRN_PATTERN, SLUG_PATTERN, RESERVED_SLUGS } from "./validation";

describe("isValidBrn", () => {
  it("accepts 3 to 7 digit numeric strings", () => {
    expect(isValidBrn("123")).toBe(true);
    expect(isValidBrn("41527")).toBe(true);
    expect(isValidBrn("1234567")).toBe(true);
  });

  it("rejects too short or too long values", () => {
    expect(isValidBrn("12")).toBe(false);
    expect(isValidBrn("12345678")).toBe(false);
  });

  it("rejects non-numeric characters", () => {
    expect(isValidBrn("ABC123")).toBe(false);
    expect(isValidBrn("41527a")).toBe(false);
    expect(isValidBrn("415 27")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidBrn("")).toBe(false);
  });

  it("trims whitespace before validating", () => {
    expect(isValidBrn("  41527  ")).toBe(true);
  });
});

describe("BRN_PATTERN", () => {
  it("matches the same rule as isValidBrn for trimmed input", () => {
    expect(BRN_PATTERN.test("41527")).toBe(true);
    expect(BRN_PATTERN.test("ABC")).toBe(false);
  });
});

describe("isValidSlug", () => {
  it("accepts lowercase alphanumeric hyphenated slugs", () => {
    expect(isValidSlug("ahmed-al-falasi")).toBe(true);
    expect(isValidSlug("agent123")).toBe(true);
    expect(isValidSlug("abc")).toBe(true);
  });

  it("rejects uppercase letters", () => {
    expect(isValidSlug("Ahmed-Al-Falasi")).toBe(false);
  });

  it("rejects spaces and invalid characters", () => {
    expect(isValidSlug("ahmed al falasi")).toBe(false);
    expect(isValidSlug("ahmed_al_falasi")).toBe(false);
    expect(isValidSlug("ahmed@falasi")).toBe(false);
  });

  it("rejects leading, trailing, or double hyphens", () => {
    expect(isValidSlug("-ahmed")).toBe(false);
    expect(isValidSlug("ahmed-")).toBe(false);
    expect(isValidSlug("ahmed--falasi")).toBe(false);
  });

  it("rejects slugs shorter than 3 or longer than 40 characters", () => {
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("a".repeat(41))).toBe(false);
    expect(isValidSlug("a".repeat(40))).toBe(true);
  });

  it("rejects reserved route names", () => {
    for (const reserved of RESERVED_SLUGS) {
      expect(isValidSlug(reserved)).toBe(false);
    }
  });

  it("trims whitespace before validating", () => {
    expect(isValidSlug("  ahmed-falasi  ")).toBe(true);
  });
});

describe("SLUG_PATTERN", () => {
  it("matches valid slug shapes", () => {
    expect(SLUG_PATTERN.test("ahmed-al-falasi")).toBe(true);
    expect(SLUG_PATTERN.test("Ahmed")).toBe(false);
  });
});
