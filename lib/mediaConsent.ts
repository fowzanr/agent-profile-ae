"use client";

import { useCallback, useSyncExternalStore } from "react";

// Visitor's choice about embedded third-party media (Spotify, Apple Podcasts, SoundCloud,
// YouTube players), which can set their own cookies. Stored only in this browser.
const STORAGE_KEY = "ap-cookie-choices";
const CHANGE_EVENT = "ap-cookie-choices-change";

export type MediaConsent = "allowed" | "blocked" | "unset";

function read(): MediaConsent {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return "unset";
    const parsed = JSON.parse(raw) as { media?: boolean };
    return parsed.media === true ? "allowed" : parsed.media === false ? "blocked" : "unset";
  } catch {
    return "unset";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setMediaConsent(allowed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ media: allowed, savedAt: new Date().toISOString() }));
  } catch {
    // Storage blocked (private mode etc.) — the choice just won't persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Current choice; "unset" on the server and until the visitor decides. */
export function useMediaConsent(): [MediaConsent, (allowed: boolean) => void] {
  const consent = useSyncExternalStore(subscribe, read, () => "unset" as const);
  const set = useCallback((allowed: boolean) => setMediaConsent(allowed), []);
  return [consent, set];
}
