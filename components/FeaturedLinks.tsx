"use client";

import { useState } from "react";
import type { AgentLink } from "@prisma/client";
import { ChevronRightIcon, LinkIcon } from "@/components/icons";
import { LINK_KIND_LABELS, displayHost, embedFor, kindOf, type Embed, type LinkKind } from "@/lib/featuredLinks";

const KIND_ICON_PATHS: Record<LinkKind, string> = {
  video: "M8 5.5v13l11-6.5-11-6.5Z",
  audio: "M4 14v-2a8 8 0 0 1 16 0v2M4 14v3a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 1Zm16 0v3a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 1Z",
  course: "M2 9l10-5 10 5-10 5L2 9Zm4 2.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6",
  community: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10 8v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3.5 3.5 0 0 1 0 6.7",
  website: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z",
};

function KindIcon({ kind }: { kind: LinkKind }) {
  const filled = kind === "video";
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={KIND_ICON_PATHS[kind]} />
    </svg>
  );
}

/** YouTube thumbnail that swaps in the real (privacy-enhanced) player only when tapped. */
function LiteYouTube({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="feat-video">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" className="feat-video-poster" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" />
          <span className="feat-video-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M8 5.5v13l11-6.5-11-6.5Z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

function EmbedPlayer({ embed, title }: { embed: Embed; title: string }) {
  if (embed.type === "youtube") return <LiteYouTube videoId={embed.videoId} title={title} />;
  if (embed.type === "audio") {
    return (
      <audio className="feat-audio" controls preload="none" src={embed.src}>
        <a href={embed.src}>Listen</a>
      </audio>
    );
  }
  return (
    <iframe
      className="feat-iframe"
      src={embed.src}
      title={title}
      height={embed.height}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    />
  );
}

function LinkCard({ link, kind }: { link: AgentLink; kind: LinkKind }) {
  return (
    <a className="feat-card" href={link.url} target="_blank" rel="noopener noreferrer">
      <span className={`feat-card-icon kind-${kind}`} aria-hidden="true">
        <KindIcon kind={kind} />
      </span>
      <span className="feat-card-text">
        <span className="feat-card-label">{link.label}</span>
        <span className="feat-card-meta">
          {LINK_KIND_LABELS[kind]} · {displayHost(link.url)}
        </span>
      </span>
      <ChevronRightIcon className="w-3.5 h-3.5 feat-card-arrow" />
    </a>
  );
}

/** Agent's featured content: the pinned item first and large, then players and link cards. */
export function FeaturedLinks({ links }: { links: AgentLink[] }) {
  const ordered = [...links].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order);

  return (
    <section className="featured" aria-labelledby="featured-title">
      <div className="section-head">
        <h2 id="featured-title">Featured</h2>
      </div>
      <div className="featured-list">
        {ordered.map((link) => {
          const kind = kindOf(link);
          const embed = embedFor(link.url);
          if (!embed) return <LinkCard key={link.id} link={link} kind={kind} />;
          return (
            <div className={`card feat-media${link.pinned ? " pinned" : ""}`} key={link.id}>
              <EmbedPlayer embed={embed} title={link.label} />
              <a className="feat-media-caption" href={link.url} target="_blank" rel="noopener noreferrer">
                <span className="feat-media-label">
                  {link.pinned && <span className="feat-pin">Pinned</span>}
                  {link.label}
                </span>
                <LinkIcon className="w-3 h-3" />
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
