import { describe, expect, it } from "vitest";

import { parseBlockConfig } from "~/server/page/block-schemas";
import {hashPollVisitor} from "~/server/polls/service";

describe("advanced block schemas", () => {
  it.each([
    ["HIGHLIGHT", { title: "New release", text: "Out now", tone: "accent" }],
    ["COUNTDOWN", { title: "Launch", targetAt: "2027-01-01T00:00:00.000Z", expiredLabel: "Live" }],
    ["VISITOR_COUNTER", { label: "Visitors", period: "total" }],
    ["SUPPORT", { title: "Support me", provider: "iban", iban: "TR330006100519786457841326" }],
    ["POLL", { question: "What next?", options: [{ key: "docs", label: "Docs" }, { key: "app", label: "App" }] }],
    ["DISCORD", { discordUserId: "80351110224678912", showSpotify: true, showActivity: true }],
    ["GITHUB", { username: "octocat", showContributions: true }],
    ["YOUTUBE", { channelUrl: "https://www.youtube.com/@example" }],
    ["TWITCH", { channel: "example_creator" }],
    ["SPOTIFY", { resourceUrl: "https://open.spotify.com/artist/abc" }],
  ] as const)("accepts %s configuration", (type, config) => {
    expect(parseBlockConfig(type, config)).toMatchObject(config);
  });

  it("rejects unsafe support links and invalid Discord identifiers", () => {
    expect(() =>
      parseBlockConfig("SUPPORT", {
        title: "Click",
        provider: "custom",
        href: "javascript:alert(1)",
      }),
    ).toThrow();
    expect(() =>
      parseBlockConfig("DISCORD", {
        discordUserId: "not-a-snowflake",
        showSpotify: true,
        showActivity: true,
      }),
    ).toThrow();
  });

  it("requires stable unique poll option keys", () => {
    expect(() =>
      parseBlockConfig("POLL", {
        question: "Pick one",
        options: [
          { key: "same", label: "One" },
          { key: "same", label: "Two" },
        ],
      }),
    ).toThrow();
  });
  it("restricts provider widgets to their official hosts", () => {
    expect(() =>
      parseBlockConfig("YOUTUBE", {
        channelUrl: "https://example.com/@creator",
      }),
    ).toThrow();
    expect(() =>
      parseBlockConfig("SPOTIFY", {
        resourceUrl: "https://example.com/artist/creator",
      }),
    ).toThrow();
  });
  it("creates a stable non-reversible visitor identifier",()=>{
    const first=hashPollVisitor("203.0.113.9","Browser","test-secret-with-enough-length");
    expect(first).toHaveLength(64);
    expect(first).toBe(hashPollVisitor("203.0.113.9","Browser","test-secret-with-enough-length"));
    expect(first).not.toContain("203.0.113.9");
  });
});
