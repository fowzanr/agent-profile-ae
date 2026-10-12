// A profile link (slug) is locked for SLUG_LOCK_DAYS after it's created or changed,
// so shared links and printed QR codes don't break right after they go out.

export const SLUG_LOCK_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/** When the agent may next change their link; a never-changed link counts from account creation. */
export function slugUnlocksAt(agent: { slugChangedAt: Date | null; createdAt: Date }): Date {
  const since = agent.slugChangedAt ?? agent.createdAt;
  return new Date(since.getTime() + SLUG_LOCK_DAYS * DAY_MS);
}

export function canChangeSlug(agent: { slugChangedAt: Date | null; createdAt: Date }, now: Date = new Date()): boolean {
  return now.getTime() >= slugUnlocksAt(agent).getTime();
}

/** "27 Oct 2026" */
export function formatUnlockDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dubai" });
}
