import { describe, it, expect } from "vitest";
import { canChangeSlug, formatUnlockDate, slugUnlocksAt } from "./slugLock";

const created = new Date("2026-10-01T10:00:00Z");

describe("slug lock", () => {
  it("counts 14 days from account creation when the link was never changed", () => {
    expect(slugUnlocksAt({ slugChangedAt: null, createdAt: created }).toISOString()).toBe("2026-10-15T10:00:00.000Z");
  });

  it("counts 14 days from the last change", () => {
    const changed = new Date("2026-10-20T08:00:00Z");
    expect(slugUnlocksAt({ slugChangedAt: changed, createdAt: created }).toISOString()).toBe("2026-11-03T08:00:00.000Z");
  });

  it("blocks changes until the lock ends, then allows them", () => {
    const agent = { slugChangedAt: null, createdAt: created };
    expect(canChangeSlug(agent, new Date("2026-10-15T09:59:59Z"))).toBe(false);
    expect(canChangeSlug(agent, new Date("2026-10-15T10:00:00Z"))).toBe(true);
  });

  it("formats the unlock date in Dubai time", () => {
    expect(formatUnlockDate(new Date("2026-10-15T21:00:00Z"))).toBe("16 Oct 2026");
  });
});
