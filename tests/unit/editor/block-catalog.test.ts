import { describe, expect, it } from "vitest";

import {
  blockCatalog,
  defaultBlockConfig,
  searchBlockCatalog,
} from "~/features/editor/block-catalog";
import { parseBlockConfig } from "~/server/page/block-schemas";

const copy: Record<string, string> = {
  blockLink: "Link",
  blockLinkDescription: "A safe destination",
  blockFeaturedLink: "Featured Link",
  blockFeaturedLinkDescription: "A prominent destination",
  blockSocials: "Social Icons",
  blockSocialsDescription: "Instagram X TikTok GitHub Discord",
  blockText: "Text",
  blockTextDescription: "Free-form text",
  blockHeading: "Heading",
  blockHeadingDescription: "Section heading",
  blockDivider: "Divider",
  blockDividerDescription: "Line or space",
  blockImage: "Image",
  blockImageDescription: "Single image",
  blockImageLink: "Image + Link",
  blockImageLinkDescription: "Clickable image banner",
  blockButton: "Button",
  blockButtonDescription: "Classic CTA",
  blockSpacer: "Spacer",
  blockSpacerDescription: "Controlled spacing",
  blockAdultLink: "Adult Link",
  blockAdultLinkDescription: "18+ external destination",
  blockHighlight: "Highlight",
  blockHighlightDescription: "Announcement",
  blockCountdown: "Countdown",
  blockCountdownDescription: "Event timer",
  blockVisitorCounter: "Visitor Counter",
  blockVisitorCounterDescription: "Profile views",
  blockSupport: "Support",
  blockSupportDescription: "Creator support",
  blockPoll: "Poll",
  blockPollDescription: "Visitor voting",
  blockDiscord: "Discord Presence",
  blockDiscordDescription: "Discord status",
  blockSpotify: "Spotify",
  blockSpotifyDescription: "Spotify media",
  blockGithub: "GitHub",
  blockGithubDescription: "GitHub activity",
  blockYoutube: "YouTube",
  blockYoutubeDescription: "Latest video",
  blockTwitch: "Twitch",
  blockTwitchDescription: "Live stream",
  blockLiveNow: "Live now",
  blockOptionOne: "Option 1",
  blockOptionTwo: "Option 2",
};

const translate = (key: string) => copy[key] ?? key;

describe("editor block catalog", () => {
  it("offers every requested basic preset to Free users with unique IDs", () => {
    const basicEntries = blockCatalog.filter(
      (entry) => entry.category === "basic",
    );
    const basicIds = basicEntries.map((entry) => entry.id);

    expect(basicIds).toEqual(expect.arrayContaining([
      "link",
      "featured-link",
      "social-icons",
      "text",
      "heading",
      "divider",
      "image",
      "image-link",
      "button",
      "spacer",
    ]));
    expect(
      basicEntries.every((entry) => entry.availability === "FREE"),
    ).toBe(true);
    expect(new Set(blockCatalog.map((entry) => entry.id)).size).toBe(
      blockCatalog.length,
    );
  });

  it("keeps Adult Link in a distinct free 18+ category", () => {
    expect(
      blockCatalog.find((entry) => entry.id === "adult-link"),
    ).toMatchObject({
      type: "ADULT_LINK",
      category: "adult",
      availability: "FREE",
      setup: "adult-attestation",
    });
    expect(searchBlockCatalog("18+", translate).map((entry) => entry.id)).toEqual([
      "adult-link",
    ]);
    expect(searchBlockCatalog("adult", translate).map((entry) => entry.id)).toEqual([
      "adult-link",
    ]);
  });

  it("creates schema-valid defaults only after required setup", () => {
    const plainLink = defaultBlockConfig("link", translate);
    expect(parseBlockConfig("LINK", plainLink)).toMatchObject({
      title: "Link",
      variant: "standard",
    });

    expect(defaultBlockConfig("image", translate)).toBeNull();
    expect(
      parseBlockConfig(
        "IMAGE",
        defaultBlockConfig("image-link", translate, {
          assetId: "cm12345678901234567890123",
        }),
      ),
    ).toMatchObject({ decorative: true, href: "https://example.com/" });

    expect(defaultBlockConfig("adult-link", translate)).toBeNull();
    expect(
      parseBlockConfig(
        "ADULT_LINK",
        defaultBlockConfig("adult-link", translate, {
          adultAttested: true,
        }),
      ),
    ).toMatchObject({ title: "Adult Link", attestedAdult: true });
  });
});
