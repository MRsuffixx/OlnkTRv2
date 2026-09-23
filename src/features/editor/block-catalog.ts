export const blockCategories = [
  "basic",
  "media",
  "contact",
  "social",
  "monetization",
  "professional",
  "gaming",
  "adult",
] as const;

export type BlockCategory = (typeof blockCategories)[number];
export type BlockAvailability = "FREE" | "PREMIUM";
export type BlockSetup = "image" | "adult-attestation";
export type BlockCatalogIcon =
  | "link"
  | "star"
  | "share"
  | "text"
  | "heading"
  | "divider"
  | "image"
  | "image-link"
  | "button"
  | "spacer"
  | "highlight"
  | "countdown"
  | "visitors"
  | "support"
  | "poll"
  | "discord"
  | "spotify"
  | "github"
  | "youtube"
  | "twitch"
  | "adult";

export interface EditorBlockPreset {
  id: string;
  type: string;
  category: BlockCategory;
  availability: BlockAvailability;
  labelKey: string;
  descriptionKey: string;
  icon: BlockCatalogIcon;
  keywords: readonly string[];
  setup?: BlockSetup;
}

export const blockCatalog = [
  { id: "link", type: "LINK", category: "basic", availability: "FREE", labelKey: "blockLink", descriptionKey: "blockLinkDescription", icon: "link", keywords: ["url"] },
  { id: "featured-link", type: "FEATURED_LINK", category: "basic", availability: "FREE", labelKey: "blockFeaturedLink", descriptionKey: "blockFeaturedLinkDescription", icon: "star", keywords: ["large", "card", "url"] },
  { id: "social-icons", type: "SOCIALS", category: "basic", availability: "FREE", labelKey: "blockSocials", descriptionKey: "blockSocialsDescription", icon: "share", keywords: ["instagram", "x", "tiktok", "github", "discord"] },
  { id: "text", type: "TEXT", category: "basic", availability: "FREE", labelKey: "blockText", descriptionKey: "blockTextDescription", icon: "text", keywords: ["paragraph", "description"] },
  { id: "heading", type: "HEADING", category: "basic", availability: "FREE", labelKey: "blockHeading", descriptionKey: "blockHeadingDescription", icon: "heading", keywords: ["h1", "h2", "h3", "section"] },
  { id: "divider", type: "DIVIDER", category: "basic", availability: "FREE", labelKey: "blockDivider", descriptionKey: "blockDividerDescription", icon: "divider", keywords: ["line", "space", "separator"] },
  { id: "image", type: "IMAGE", category: "basic", availability: "FREE", labelKey: "blockImage", descriptionKey: "blockImageDescription", icon: "image", keywords: ["photo", "media"], setup: "image" },
  { id: "image-link", type: "IMAGE", category: "basic", availability: "FREE", labelKey: "blockImageLink", descriptionKey: "blockImageLinkDescription", icon: "image-link", keywords: ["photo", "banner", "url"], setup: "image" },
  { id: "button", type: "BUTTON", category: "basic", availability: "FREE", labelKey: "blockButton", descriptionKey: "blockButtonDescription", icon: "button", keywords: ["cta", "url"] },
  { id: "spacer", type: "SPACER", category: "basic", availability: "FREE", labelKey: "blockSpacer", descriptionKey: "blockSpacerDescription", icon: "spacer", keywords: ["space", "gap"] },
  { id: "highlight", type: "HIGHLIGHT", category: "professional", availability: "FREE", labelKey: "blockHighlight", descriptionKey: "blockHighlightDescription", icon: "highlight", keywords: ["announcement", "campaign"] },
  { id: "countdown", type: "COUNTDOWN", category: "professional", availability: "FREE", labelKey: "blockCountdown", descriptionKey: "blockCountdownDescription", icon: "countdown", keywords: ["timer", "event", "sale"] },
  { id: "visitor-counter", type: "VISITOR_COUNTER", category: "basic", availability: "FREE", labelKey: "blockVisitorCounter", descriptionKey: "blockVisitorCounterDescription", icon: "visitors", keywords: ["views", "counter"] },
  { id: "support", type: "SUPPORT", category: "monetization", availability: "FREE", labelKey: "blockSupport", descriptionKey: "blockSupportDescription", icon: "support", keywords: ["tip", "donation", "coffee", "iban"] },
  { id: "poll", type: "POLL", category: "basic", availability: "FREE", labelKey: "blockPoll", descriptionKey: "blockPollDescription", icon: "poll", keywords: ["vote", "survey"] },
  { id: "discord", type: "DISCORD", category: "gaming", availability: "PREMIUM", labelKey: "blockDiscord", descriptionKey: "blockDiscordDescription", icon: "discord", keywords: ["presence", "lanyard", "game"] },
  { id: "spotify", type: "SPOTIFY", category: "media", availability: "PREMIUM", labelKey: "blockSpotify", descriptionKey: "blockSpotifyDescription", icon: "spotify", keywords: ["music", "track", "playlist"] },
  { id: "github", type: "GITHUB", category: "social", availability: "PREMIUM", labelKey: "blockGithub", descriptionKey: "blockGithubDescription", icon: "github", keywords: ["code", "repository", "profile"] },
  { id: "youtube", type: "YOUTUBE", category: "media", availability: "PREMIUM", labelKey: "blockYoutube", descriptionKey: "blockYoutubeDescription", icon: "youtube", keywords: ["video", "channel"] },
  { id: "twitch", type: "TWITCH", category: "gaming", availability: "PREMIUM", labelKey: "blockTwitch", descriptionKey: "blockTwitchDescription", icon: "twitch", keywords: ["stream", "live", "game"] },
  { id: "adult-link", type: "ADULT_LINK", category: "adult", availability: "FREE", labelKey: "blockAdultLink", descriptionKey: "blockAdultLinkDescription", icon: "adult", keywords: ["18+", "adult", "mature"], setup: "adult-attestation" },
] as const satisfies readonly EditorBlockPreset[];

export type EditorBlockPresetId = (typeof blockCatalog)[number]["id"];

type Translate = (key: string) => string;

export function searchBlockCatalog(query: string, translate: Translate) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [...blockCatalog];
  return blockCatalog.filter((entry) =>
    [translate(entry.labelKey), translate(entry.descriptionKey), ...entry.keywords]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalized),
  );
}

export function defaultBlockConfig(
  presetId: string,
  translate: Translate,
  setup: { assetId?: string; adultAttested?: boolean } = {},
): unknown | null {
  switch (presetId) {
    case "link": return { schemaVersion: 1, title: translate("blockLink"), url: "https://example.com", variant: "standard" };
    case "featured-link": return { schemaVersion: 1, title: translate("blockFeaturedLink"), url: "https://example.com", presentation: "spotlight" };
    case "social-icons": return { schemaVersion: 1, items: [] };
    case "text": return { schemaVersion: 1, text: translate("blockText"), alignment: "inherit" };
    case "heading": return { schemaVersion: 1, text: translate("blockHeading"), level: 2 };
    case "divider": return { schemaVersion: 1, style: "line", thickness: 1, width: 100 };
    case "image":
    case "image-link":
      return setup.assetId ? { schemaVersion: 1, assetId: setup.assetId, alt: "", decorative: true, ...(presetId === "image-link" ? { href: "https://example.com" } : {}) } : null;
    case "button": return { schemaVersion: 1, title: translate("blockButton"), url: "https://example.com", useGlobalStyle: true, style: "solid" };
    case "spacer": return { schemaVersion: 1, size: "medium" };
    case "highlight": return { title: translate("blockHighlight"), text: "", tone: "accent" };
    case "countdown": return { title: translate("blockCountdown"), targetAt: new Date(Date.now() + 7 * 86_400_000).toISOString(), expiredLabel: translate("blockLiveNow") };
    case "visitor-counter": return { label: translate("blockVisitorCounter"), period: "total" };
    case "support": return { title: translate("blockSupport"), provider: "buymeacoffee", href: "https://www.buymeacoffee.com/" };
    case "poll": return { question: translate("blockPoll"), options: [{ key: "option-1", label: translate("blockOptionOne") }, { key: "option-2", label: translate("blockOptionTwo") }] };
    case "discord": return { discordUserId: "80351110224678912", showSpotify: true, showActivity: true };
    case "spotify": return { resourceUrl: "https://open.spotify.com/" };
    case "github": return { username: "octocat", showContributions: true };
    case "youtube": return { channelUrl: "https://www.youtube.com/" };
    case "twitch": return { channel: "twitch" };
    case "adult-link": return setup.adultAttested ? { schemaVersion: 1, title: translate("blockAdultLink"), url: "https://example.com/adult", attestedAdult: true } : null;
    default: return null;
  }
}
