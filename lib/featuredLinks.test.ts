import { describe, it, expect } from "vitest";
import { detectKind, displayHost, embedFor, kindOf, youtubeId } from "./featuredLinks";

describe("youtubeId", () => {
  it("handles watch, short, shorts, embed, and live links", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ?si=abc")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://m.youtube.com/live/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("ignores channels and non-YouTube links", () => {
    expect(youtubeId("https://youtube.com/@ahmedvantage")).toBeNull();
    expect(youtubeId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });
});

describe("embedFor", () => {
  it("embeds Spotify episodes compactly and shows larger", () => {
    expect(embedFor("https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk?si=x")).toEqual({
      type: "iframe",
      provider: "spotify",
      src: "https://open.spotify.com/embed/episode/4rOoJ6Egrf8K2IrywzwOMk",
      height: 152,
    });
    expect(embedFor("https://open.spotify.com/intl-ar/show/2MAi0BvDc6GTFvKFPXnkCL")).toMatchObject({ height: 352 });
  });

  it("embeds Apple Podcasts and SoundCloud", () => {
    expect(embedFor("https://podcasts.apple.com/ae/podcast/dubai-property/id123?i=1000")).toMatchObject({
      provider: "apple",
      src: "https://embed.podcasts.apple.com/ae/podcast/dubai-property/id123?i=1000",
      height: 175,
    });
    expect(embedFor("https://soundcloud.com/ahmed/market-update")).toMatchObject({ provider: "soundcloud", height: 166 });
  });

  it("plays audio files directly", () => {
    expect(embedFor("https://cdn.example.com/ep1.mp3")).toEqual({ type: "audio", src: "https://cdn.example.com/ep1.mp3" });
  });

  it("returns null for plain links and unsafe URLs", () => {
    expect(embedFor("https://www.udemy.com/course/dubai-real-estate")).toBeNull();
    expect(embedFor("javascript:alert(1)")).toBeNull();
  });
});

describe("detectKind", () => {
  it("recognises videos, audio, courses, and communities", () => {
    expect(detectKind("https://youtu.be/dQw4w9WgXcQ")).toBe("video");
    expect(detectKind("https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL")).toBe("audio");
    expect(detectKind("https://ahmed.teachable.com/p/off-plan-101")).toBe("course");
    expect(detectKind("https://www.udemy.com/course/dubai-real-estate")).toBe("course");
    expect(detectKind("https://chat.whatsapp.com/AbCdEf")).toBe("community");
    expect(detectKind("https://www.facebook.com/groups/dubaibuyers")).toBe("community");
    expect(detectKind("https://www.skool.com/dubai-investors")).toBe("community");
  });

  it("falls back to website", () => {
    expect(detectKind("https://vantage.ae")).toBe("website");
    expect(detectKind("not a url")).toBe("website");
  });
});

describe("kindOf", () => {
  it("prefers the agent's chosen kind, else detects", () => {
    expect(kindOf({ kind: "course", url: "https://vantage.ae/academy" })).toBe("course");
    expect(kindOf({ kind: null, url: "https://youtu.be/dQw4w9WgXcQ" })).toBe("video");
    expect(kindOf({ kind: "bogus", url: "https://vantage.ae" })).toBe("website");
  });
});

describe("displayHost", () => {
  it("strips www", () => {
    expect(displayHost("https://www.udemy.com/course/x")).toBe("udemy.com");
  });
});
