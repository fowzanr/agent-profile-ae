"use client";

import Link from "next/link";
import { Sheet } from "@/components/Sheet";
import { useMediaConsent } from "@/lib/mediaConsent";

export function CookieChoicesDialog({ onClose }: { onClose: () => void }) {
  const [consent, setConsent] = useMediaConsent();
  const mediaOn = consent === "allowed";

  return (
    <Sheet title="Cookie choices" onClose={onClose}>
      <p className="sheet-text">
        agentprofile.ae doesn&apos;t use advertising or tracking cookies. Your choice is saved in this browser only.
      </p>

      <div className="cookie-option">
        <div className="cookie-option-text">
          <span className="cookie-option-title">Essential</span>
          <span className="cookie-option-desc">
            Keeps agents signed in and protects forms from abuse. These are needed for the site to work.
          </span>
        </div>
        <span className="cookie-always">Always on</span>
      </div>

      <div className="cookie-option">
        <div className="cookie-option-text">
          <span className="cookie-option-title">Embedded media</span>
          <span className="cookie-option-desc">
            Lets videos and podcasts from YouTube, Spotify, Apple Podcasts, and SoundCloud play on profiles. Those
            services may set their own cookies. When off, a player only loads if you tap play.
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={mediaOn}
          aria-label="Allow embedded media"
          className={`cookie-switch${mediaOn ? " on" : ""}`}
          onClick={() => setConsent(!mediaOn)}
        >
          <span className="cookie-switch-knob" />
        </button>
      </div>

      <p className="sheet-fineprint">
        More in our <Link href="/privacy">privacy notice</Link>.
      </p>
    </Sheet>
  );
}
