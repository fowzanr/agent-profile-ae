// Used to build links in emails (password reset, email verification). Deliberately
// NOT derived from the incoming request's Host header — trusting that header lets an
// attacker point reset links at a domain they control ("host header poisoning").
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
