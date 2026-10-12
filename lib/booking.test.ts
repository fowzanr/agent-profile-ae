import { describe, it, expect } from "vitest";
import {
  bookableDates,
  dubaiNow,
  formatBookingTime,
  isBookable,
  openSlots,
  parseBookingDays,
  slotTimes,
  weekdayOf,
} from "./booking";

// Tuesday 13 Oct 2026, 10:00 in Dubai (06:00 UTC).
const NOW = new Date("2026-10-13T06:00:00Z");
const weekdays = { days: [1, 2, 3, 4, 5, 6], start: "09:00", end: "19:00", slotMinutes: 30 };

describe("parseBookingDays", () => {
  it("parses, dedupes, sorts, and drops junk", () => {
    expect(parseBookingDays("3, 1,1,9,x,0")).toEqual([0, 1, 3]);
  });
});

describe("slotTimes", () => {
  it("lists every slot that fully fits before the end time", () => {
    const slots = slotTimes(weekdays);
    expect(slots[0]).toBe("09:00");
    expect(slots.at(-1)).toBe("18:30");
    expect(slots).toHaveLength(20);
  });

  it("supports 45-minute viewings", () => {
    expect(slotTimes({ start: "09:00", end: "12:00", slotMinutes: 45 })).toEqual(["09:00", "09:45", "10:30", "11:15"]);
  });

  it("respects longer slot lengths", () => {
    expect(slotTimes({ start: "09:00", end: "11:30", slotMinutes: 60 })).toEqual(["09:00", "10:00"]);
  });
});

describe("dubaiNow", () => {
  it("reports Dubai local date and time", () => {
    expect(dubaiNow(NOW)).toEqual({ date: "2026-10-13", minutes: 600 });
  });

  it("rolls over to the next day before UTC does", () => {
    expect(dubaiNow(new Date("2026-10-13T21:00:00Z")).date).toBe("2026-10-14");
  });
});

describe("weekdayOf", () => {
  it("returns 0 for Sunday", () => {
    expect(weekdayOf("2026-10-18")).toBe(0);
    expect(weekdayOf("2026-10-13")).toBe(2);
  });
});

describe("openSlots", () => {
  it("hides today's slots that start within the next hour", () => {
    const slots = openSlots(weekdays, "2026-10-13", NOW);
    expect(slots[0]).toBe("11:00");
  });

  it("keeps every slot on future days", () => {
    expect(openSlots(weekdays, "2026-10-14", NOW)[0]).toBe("09:00");
  });
});

describe("bookableDates", () => {
  it("skips days the agent doesn't work", () => {
    const dates = bookableDates(weekdays, NOW);
    expect(dates).not.toContain("2026-10-18"); // Sunday
    expect(dates[0]).toBe("2026-10-13");
  });

  it("drops today once all of today's slots have passed", () => {
    const evening = new Date("2026-10-13T15:00:00Z"); // 19:00 Dubai
    expect(bookableDates(weekdays, evening)[0]).toBe("2026-10-14");
  });
});

describe("isBookable", () => {
  it("accepts an open slot on a working day", () => {
    expect(isBookable(weekdays, "2026-10-14", "10:30", NOW)).toBe(true);
  });

  it("rejects days off, off-grid times, past days, and far-future days", () => {
    expect(isBookable(weekdays, "2026-10-18", "10:30", NOW)).toBe(false);
    expect(isBookable(weekdays, "2026-10-14", "10:15", NOW)).toBe(false);
    expect(isBookable(weekdays, "2026-10-14", "19:00", NOW)).toBe(false);
    expect(isBookable(weekdays, "2026-10-12", "10:30", NOW)).toBe(false);
    expect(isBookable(weekdays, "2026-11-30", "10:30", NOW)).toBe(false);
  });
});

describe("formatBookingTime", () => {
  it("reads naturally in emails", () => {
    expect(formatBookingTime("2026-10-14", "10:30")).toBe("Wed, 14 Oct 2026 at 10:30 (Dubai time)");
  });
});
