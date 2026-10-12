// Featured links on an agent's profile: videos and audio play inline, everything else is a link card.

export const LINK_KINDS = ["video", "audio", "course", "community", "website"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export const LINK_KIND_LABELS: Record<LinkKind, string> = {
  video: "Video",
  audio: "Podcast / audio",
  course: "Course",
  community: "Community",
  website: "Website",
};

export type Embed =
  | { type: "youtube"; videoId: string }
  | { type: "iframe"; provider: "spotify" | "apple" | "soundcloud"; src: string; height: number }
  | { type: "audio"; src: string };

function parse(url: string): URL | null {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

function host(u: URL): string {
  return u.hostname.replace(/^www\.|^m\./, "").toLowerCase();
}

const AUDIO_FILE = /\.(mp3|m4a|aac|wav|ogg|oga|opus)$/i;

export function youtubeId(url: string): string | null {
  const u = parse(url);
  if (!u) return null;
  const h = host(u);
  const valid = (id: string | null | undefined) => (id && /^[\w-]{11}$/.test(id) ? id : null);
  if (h === "youtu.be") return valid(u.pathname.slice(1).split("/")[0]);
  if (h === "youtube.com" || h === "music.youtube.com" || h === "youtube-nocookie.com") {
    if (u.pathname === "/watch") return valid(u.searchParams.get("v"));
    const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/);
    return valid(m?.[1]);
  }
  return null;
}

/** How a link can be played inline on the profile, or null if it's a plain link. */
export function embedFor(url: string): Embed | null {
  const u = parse(url);
  if (!u) return null;
  const h = host(u);

  const videoId = youtubeId(url);
  if (videoId) return { type: "youtube", videoId };

  if (h === "open.spotify.com") {
    const m = u.pathname.match(/^\/(?:intl-[a-z-]+\/)?(episode|show|track|album|playlist)\/([A-Za-z0-9]+)/);
    if (m) {
      const compact = m[1] === "episode" || m[1] === "track";
      return { type: "iframe", provider: "spotify", src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: compact ? 152 : 352 };
    }
  }

  if (h === "podcasts.apple.com" && /\/podcast\//.test(u.pathname)) {
    const episode = u.searchParams.has("i");
    return { type: "iframe", provider: "apple", src: `https://embed.podcasts.apple.com${u.pathname}${u.search}`, height: episode ? 175 : 450 };
  }

  if (h === "soundcloud.com" && u.pathname.split("/").filter(Boolean).length >= 2) {
    const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(`https://soundcloud.com${u.pathname}`)}&color=%231f6f52&visual=false&show_comments=false`;
    return { type: "iframe", provider: "soundcloud", src, height: 166 };
  }

  if (AUDIO_FILE.test(u.pathname)) return { type: "audio", src: u.toString() };

  return null;
}

const COURSE_HOSTS = ["udemy.com", "teachable.com", "thinkific.com", "kajabi.com", "coursera.org", "podia.com", "gumroad.com", "learnworlds.com", "maven.com"];
const COMMUNITY_HOSTS = ["discord.gg", "discord.com", "t.me", "telegram.me", "chat.whatsapp.com", "skool.com", "circle.so", "slack.com", "mn.co", "geneva.com"];

const matches = (h: string, list: string[]) => list.some((d) => h === d || h.endsWith(`.${d}`));

/** Best guess at a link's kind from its URL; agents can override it. */
export function detectKind(url: string): LinkKind {
  const u = parse(url);
  if (!u) return "website";
  const h = host(u);
  if (youtubeId(url) || h === "vimeo.com" || h === "tiktok.com") return "video";
  const embed = embedFor(url);
  if (embed && embed.type !== "youtube") return "audio";
  if (h === "anchor.fm" || h === "podcasters.spotify.com" || h === "buzzsprout.com") return "audio";
  if (matches(h, COURSE_HOSTS)) return "course";
  if (matches(h, COMMUNITY_HOSTS) || (h === "facebook.com" && u.pathname.startsWith("/groups/"))) return "community";
  return "website";
}

export function kindOf(link: { kind: string | null; url: string }): LinkKind {
  return (LINK_KINDS as readonly string[]).includes(link.kind ?? "") ? (link.kind as LinkKind) : detectKind(link.url);
}

/** "udemy.com" for a card subtitle. */
export function displayHost(url: string): string {
  const u = parse(url);
  return u ? host(u) : url;
}
