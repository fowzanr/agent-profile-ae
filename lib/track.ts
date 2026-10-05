export type TrackType =
  | "whatsapp_click"
  | "call_click"
  | "email_click"
  | "book_click"
  | "share";

export function track(agentId: string, type: TrackType, propertyId?: string) {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({ agentId, type, propertyId });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // best-effort — never block the user's action
  }
}
