// Booking availability shared by the dashboard, the profile booking form, and the leads API.
// Times are agent-local Dubai time (GST, UTC+4, no daylight saving).

export const BOOKING_TIMEZONE = "Asia/Dubai";
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const SLOT_LENGTHS = [15, 30, 45, 60] as const;
export const BOOKING_WINDOW_DAYS = 14;

export const DEFAULT_BOOKING_DAYS = "1,2,3,4,5,6";
export const DEFAULT_BOOKING_START = "09:00";
export const DEFAULT_BOOKING_END = "19:00";
export const DEFAULT_BOOKING_SLOT_MINUTES = 30;

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type BookingAvailability = {
  days: number[]; // 0 = Sunday … 6 = Saturday
  start: string; // "HH:MM"
  end: string; // "HH:MM", exclusive: the last slot ends at this time
  slotMinutes: number;
};

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** "1,2,3" → [1, 2, 3]; ignores anything that isn't a weekday number. */
export function parseBookingDays(csv: string): number[] {
  const days = csv
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return [...new Set(days)].sort((a, b) => a - b);
}

export function availabilityOf(agent: {
  bookingDays: string;
  bookingStartTime: string;
  bookingEndTime: string;
  bookingSlotMinutes: number;
}): BookingAvailability {
  return {
    days: parseBookingDays(agent.bookingDays),
    start: agent.bookingStartTime,
    end: agent.bookingEndTime,
    slotMinutes: agent.bookingSlotMinutes,
  };
}

/** Start times of every slot that fits fully between start and end. */
export function slotTimes({ start, end, slotMinutes }: Pick<BookingAvailability, "start" | "end" | "slotMinutes">): string[] {
  const out: string[] = [];
  for (let t = toMinutes(start); t + slotMinutes <= toMinutes(end); t += slotMinutes) out.push(fromMinutes(t));
  return out;
}

/** Today's date ("YYYY-MM-DD") and the minutes past midnight, in Dubai. */
export function dubaiNow(now: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** Weekday (0 = Sunday) of a calendar date, independent of the viewer's timezone. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Bookable dates in the next BOOKING_WINDOW_DAYS days that are working days and still have open slots. */
export function bookableDates(availability: BookingAvailability, now: Date = new Date()): string[] {
  const today = dubaiNow(now);
  const dates: string[] = [];
  for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
    const date = addDays(today.date, i);
    if (availability.days.includes(weekdayOf(date)) && openSlots(availability, date, now).length > 0) dates.push(date);
  }
  return dates;
}

/** Slots still open on a date: all slots, minus ones starting within the next hour when the date is today. */
export function openSlots(availability: BookingAvailability, date: string, now: Date = new Date()): string[] {
  const slots = slotTimes(availability);
  const today = dubaiNow(now);
  if (date !== today.date) return slots;
  return slots.filter((t) => toMinutes(t) >= today.minutes + 60);
}

/** Whether a requested date and time fits the agent's availability (used server-side). */
export function isBookable(availability: BookingAvailability, date: string, time: string, now: Date = new Date()): boolean {
  if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) return false;
  const today = dubaiNow(now).date;
  if (date < today || date > addDays(today, BOOKING_WINDOW_DAYS - 1)) return false;
  if (!availability.days.includes(weekdayOf(date))) return false;
  return openSlots(availability, date, now).includes(time);
}

/** "Tue, 14 Oct 2026 at 10:30 (Dubai time)" */
export function formatBookingTime(date: string, time: string): string {
  const day = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${day} at ${time} (Dubai time)`;
}
