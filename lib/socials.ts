// The social networks an agent can link from their profile, in display order.
// Each maps to a nullable `<key>Url` column on Agent.
export const SOCIAL_PLATFORMS = [
  { key: "instagram", field: "instagramUrl", name: "Instagram", placeholder: "https://instagram.com/you" },
  { key: "facebook", field: "facebookUrl", name: "Facebook", placeholder: "https://facebook.com/you" },
  { key: "linkedin", field: "linkedinUrl", name: "LinkedIn", placeholder: "https://linkedin.com/in/you" },
  { key: "tiktok", field: "tiktokUrl", name: "TikTok", placeholder: "https://tiktok.com/@you" },
  { key: "youtube", field: "youtubeUrl", name: "YouTube", placeholder: "https://youtube.com/@you" },
  { key: "pinterest", field: "pinterestUrl", name: "Pinterest", placeholder: "https://pinterest.com/you" },
  { key: "spotify", field: "spotifyUrl", name: "Spotify", placeholder: "https://open.spotify.com/show/…" },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SocialKey = SocialPlatform["key"];
export type SocialField = SocialPlatform["field"];
export type SocialUrls = Record<SocialField, string>;

export const SOCIAL_FIELDS = SOCIAL_PLATFORMS.map((p) => p.field) as SocialField[];

/** Pulls every social URL off an agent record, with empty strings for unset ones. */
export function socialUrlsOf(agent: { [K in SocialField]: string | null }): SocialUrls {
  return Object.fromEntries(SOCIAL_FIELDS.map((f) => [f, agent[f] ?? ""])) as SocialUrls;
}

export function hasAnySocial(agent: { [K in SocialField]?: string | null }): boolean {
  return SOCIAL_FIELDS.some((f) => Boolean(agent[f]?.trim()));
}
