"use client";

import {
  Heading,
  Eye,
  Code2,
  Heart,
  Link2,
  Megaphone,
  MessageCircle,
  Minus,
  Music2,
  Plus,
  Search,
  Share2,
  Timer,
  Text,
  Radio,
  Vote,
  Play,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

const blockTypes = [
  {
    type: "LINK",
    key: "blockLink",
    descriptionKey: "blockLinkDescription",
    icon: Link2,
  },
  {
    type: "TEXT",
    key: "blockText",
    descriptionKey: "blockTextDescription",
    icon: Text,
  },
  {
    type: "HEADING",
    key: "blockHeading",
    descriptionKey: "blockHeadingDescription",
    icon: Heading,
  },
  {
    type: "DIVIDER",
    key: "blockDivider",
    descriptionKey: "blockDividerDescription",
    icon: Minus,
  },
  {
    type: "SOCIALS",
    key: "blockSocials",
    descriptionKey: "blockSocialsDescription",
    icon: Share2,
  },
  {
    type: "HIGHLIGHT",
    key: "blockHighlight",
    descriptionKey: "blockHighlightDescription",
    icon: Megaphone,
  },
  {
    type: "COUNTDOWN",
    key: "blockCountdown",
    descriptionKey: "blockCountdownDescription",
    icon: Timer,
  },
  {
    type: "VISITOR_COUNTER",
    key: "blockVisitorCounter",
    descriptionKey: "blockVisitorCounterDescription",
    icon: Eye,
  },
  {
    type: "SUPPORT",
    key: "blockSupport",
    descriptionKey: "blockSupportDescription",
    icon: Heart,
  },
  {
    type: "POLL",
    key: "blockPoll",
    descriptionKey: "blockPollDescription",
    icon: Vote,
  },
  {
    type: "DISCORD",
    key: "blockDiscord",
    descriptionKey: "blockDiscordDescription",
    icon: MessageCircle,
  },
  {
    type: "SPOTIFY",
    key: "blockSpotify",
    descriptionKey: "blockSpotifyDescription",
    icon: Music2,
  },
  {
    type: "GITHUB",
    key: "blockGithub",
    descriptionKey: "blockGithubDescription",
    icon: Code2,
  },
  {
    type: "YOUTUBE",
    key: "blockYoutube",
    descriptionKey: "blockYoutubeDescription",
    icon: Play,
  },
  {
    type: "TWITCH",
    key: "blockTwitch",
    descriptionKey: "blockTwitchDescription",
    icon: Radio,
  },
] as const;

const liveTypes = new Set(["DISCORD", "SPOTIFY", "GITHUB", "YOUTUBE", "TWITCH"]);

function blockCategory(type: (typeof blockTypes)[number]["type"]) {
  if (liveTypes.has(type)) return "blockCategoryLive" as const;
  if (["COUNTDOWN", "VISITOR_COUNTER", "SUPPORT", "POLL"].includes(type)) {
    return "blockCategoryEngagement" as const;
  }
  return "blockCategoryContent" as const;
}

type BlockLabelKey =
  | "blockLink"
  | "blockText"
  | "blockHeading"
  | "blockHighlight"
  | "blockCountdown"
  | "blockVisitorCounter"
  | "blockSupport"
  | "blockPoll"
  | "blockLiveNow"
  | "blockOptionOne"
  | "blockOptionTwo";

function defaultConfig(
  type: (typeof blockTypes)[number]["type"],
  t: (key: BlockLabelKey) => string,
) {
  switch (type) {
    case "LINK":
      return { title: t("blockLink"), url: "https://example.com" };
    case "TEXT":
      return { text: t("blockText") };
    case "HEADING":
      return { text: t("blockHeading"), level: 2 };
    case "SOCIALS":
      return { items: [] };
    case "DIVIDER":
      return {};
    case "HIGHLIGHT":
      return { title: t("blockHighlight"), text: "", tone: "accent" };
    case "COUNTDOWN":
      return {
        title: t("blockCountdown"),
        targetAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        expiredLabel: t("blockLiveNow"),
      };
    case "VISITOR_COUNTER":
      return { label: t("blockVisitorCounter"), period: "total" };
    case "SUPPORT":
      return {
        title: t("blockSupport"),
        provider: "buymeacoffee",
        href: "https://www.buymeacoffee.com/",
      };
    case "POLL":
      return {
        question: t("blockPoll"),
        options: [
          { key: "option-1", label: t("blockOptionOne") },
          { key: "option-2", label: t("blockOptionTwo") },
        ],
      };
    case "DISCORD":
      return { discordUserId: "80351110224678912", showSpotify: true, showActivity: true };
    case "SPOTIFY":
      return { resourceUrl: "https://open.spotify.com/" };
    case "GITHUB":
      return { username: "octocat", showContributions: true };
    case "YOUTUBE":
      return { channelUrl: "https://www.youtube.com/" };
    case "TWITCH":
      return { channel: "twitch" };
  }
}

export function BlockPicker({
  onCreate,
  loading,
}: {
  onCreate: (type: string, config: unknown) => Promise<boolean>;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const t = useTranslations("editor");
  const common = useTranslations("common");
  const filtered = blockTypes.filter((block) =>
    t(block.key).toLocaleLowerCase().includes(deferredQuery),
  );

  async function create(type: string, config: unknown) {
    if (await onCreate(type, config)) {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          {t("addBlock")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("addBlock")}</DialogTitle>
          <DialogDescription>{t("addBlockDescription")}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="block-search"
            aria-label={t("searchBlocks")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchBlocks")}
            className="pl-9"
          />
        </div>
        <div className="mt-3 grid max-h-[55vh] gap-1 overflow-y-auto sm:grid-cols-2">
          {filtered.map((block, index) => {
            const Icon = block.icon;
            const category = blockCategory(block.type);
            const previous = filtered[index - 1];
            const showCategory =
              !previous || blockCategory(previous.type) !== category;
            return (
              <div key={block.type} className={showCategory ? "contents" : undefined}>
                {showCategory ? (
                  <p className="col-span-full mt-2 px-2 pt-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase first:mt-0">
                    {t(category)}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    void create(block.type, defaultConfig(block.type, t))
                  }
                  className="flex items-start gap-3 rounded-md border border-transparent p-3 text-left transition-[background-color,border-color] hover:border-border hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:opacity-50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-raised shadow-xs">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {t(block.key)}
                      {liveTypes.has(block.type) ? (
                        <Badge variant="primary" className="px-1.5 py-0 text-[9px]">
                          {common("pro")}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {t(block.descriptionKey)}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
          {!filtered.length ? (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              {common("search")}: “{query}”
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
