export const BRN_PATTERN = /^\d{3,7}$/;

export function isValidBrn(value: string): boolean {
  return BRN_PATTERN.test(value.trim());
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const RESERVED_SLUGS = new Set(["login", "signup", "dashboard", "admin", "api", "onboarding"]);

export function isValidSlug(value: string): boolean {
  const v = value.trim();
  return v.length >= 3 && v.length <= 40 && SLUG_PATTERN.test(v) && !RESERVED_SLUGS.has(v);
}
