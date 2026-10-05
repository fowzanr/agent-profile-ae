import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Ahmed Al Falasi")).toBe("ahmed-al-falasi");
  });

  it("collapses repeated whitespace into a single hyphen", () => {
    expect(slugify("Ahmed   Al   Falasi")).toBe("ahmed-al-falasi");
  });

  it("strips characters outside a-z, 0-9, spaces, and hyphens", () => {
    expect(slugify("Ahmed's Agency! #1")).toBe("ahmeds-agency-1");
  });

  it("collapses multiple hyphens into one", () => {
    expect(slugify("Ahmed--Al--Falasi")).toBe("ahmed-al-falasi");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  -Ahmed Falasi- ")).toBe("ahmed-falasi");
  });

  it("returns an empty string for input with no valid characters", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("leaves an already-valid slug untouched", () => {
    expect(slugify("yousef-nasser")).toBe("yousef-nasser");
  });
});
