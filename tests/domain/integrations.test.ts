import { describe, expect, it } from "vitest";

import {
  decryptCredentials,
  encryptCredentials,
} from "~/server/integrations/crypto";
import { normalizeGithubEvents } from "~/server/integrations/providers/github";
import { spotifyEmbedUrl } from "~/server/integrations/providers/spotify";
import { normalizeTwitchStream } from "~/server/integrations/providers/twitch";
import { normalizeYoutubeSearch } from "~/server/integrations/providers/youtube";
import {
  normalizeWidgetPayload,
  resolveWidgetCache,
} from "~/server/integrations/types";

describe("live integration normalization", () => {
  it("encrypts credentials with authenticated encryption", () => {
    const key = Buffer.alloc(32, 7).toString("base64");
    const encrypted = encryptCredentials(
      { accessToken: "secret", refreshToken: "refresh" },
      key,
    );

    expect(encrypted.ciphertext).not.toContain("secret");
    expect(decryptCredentials(encrypted, key)).toEqual({
      accessToken: "secret",
      refreshToken: "refresh",
    });
  });

  it("rejects tampered encrypted credentials", () => {
    const key = Buffer.alloc(32, 9).toString("base64");
    const encrypted = encryptCredentials({ accessToken: "secret" }, key);
    expect(() =>
      decryptCredentials(
        { ...encrypted, ciphertext: `${encrypted.ciphertext.slice(0, -2)}AA` },
        key,
      ),
    ).toThrow();
  });

  it("keeps only safe public GitHub activity fields", () => {
    expect(
      normalizeGithubEvents([
        { id: "1", type: "PushEvent", repo: { name: "olnk/app" }, created_at: "2026-09-19T10:00:00Z", secret: "drop" },
      ]),
    ).toEqual([{ id: "1", type: "PushEvent", repository: "olnk/app", createdAt: "2026-09-19T10:00:00Z" }]);
  });

  it("builds Spotify embeds only from supported Spotify URLs", () => {
    expect(spotifyEmbedUrl("https://open.spotify.com/track/abc123?si=x")).toBe("https://open.spotify.com/embed/track/abc123");
    expect(() => spotifyEmbedUrl("https://evil.test/track/abc123")).toThrow();
  });

  it("normalizes YouTube and Twitch responses", () => {
    expect(normalizeYoutubeSearch({items:[{id:{videoId:"video1"},snippet:{title:"Latest",publishedAt:"2026-09-19T10:00:00Z",thumbnails:{high:{url:"https://i.ytimg.com/x.jpg"}}}}]})).toMatchObject({videoId:"video1",title:"Latest"});
    expect(normalizeTwitchStream({data:[]})).toEqual({live:false});
  });

  it("returns a stale successful payload while requesting a refresh", () => {
    const successful = normalizeWidgetPayload(
      { kind: "github", events: [{ id: "1" }] },
      new Date("2026-09-19T10:00:00Z"),
    );

    expect(
      resolveWidgetCache(null, successful, {
        kind: "github",
        href: "https://github.com/olnk",
      }),
    ).toEqual({
      refresh: true,
      delivery: {
        ...successful,
        status: "STALE",
      },
    });
  });

  it("marks provider-disabled payloads as misconfigured", () => {
    expect(
      normalizeWidgetPayload(
        { kind: "youtube", available: false },
        new Date("2026-09-19T10:00:00Z"),
      ),
    ).toMatchObject({
      status: "MISCONFIGURED",
      available: false,
      updatedAt: "2026-09-19T10:00:00.000Z",
    });
  });
});
