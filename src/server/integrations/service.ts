import { cacheGet, cacheKeys, cacheSet } from "~/server/cache";
import { db } from "~/server/db";
import { AppError } from "~/server/errors";
import { parsePublicationSnapshot } from "~/server/publishing/snapshot";
import { enqueueWidgetRefresh } from "~/server/queues";

import { getGithubWidget } from "./providers/github";
import { getSpotifyWidget } from "./providers/spotify";
import { getTwitchWidget } from "./providers/twitch";
import { getYoutubeWidget } from "./providers/youtube";
import {
  normalizeWidgetPayload,
  resolveWidgetCache,
  type WidgetPayload,
} from "./types";

const supported = ["GITHUB", "SPOTIFY", "YOUTUBE", "TWITCH"] as const;
type SupportedWidget = (typeof supported)[number];

async function publishedWidget(blockId: string) {
  const block = await db.block.findFirst({
    where: {
      id: blockId,
      page: {
        visibility: { not: "PRIVATE" },
        publication: { isNot: null },
        profile: { status: "ACTIVE", user: { status: "ACTIVE" } },
      },
    },
    select: {
      page: {
        select: {
          profile: { select: { userId: true } },
          publication: { select: { version: { select: { snapshot: true } } } },
        },
      },
    },
  });
  const value = block?.page.publication?.version.snapshot;
  if (!block || !value) throw new AppError("NOT_FOUND", "Widget not found");
  const published = parsePublicationSnapshot(value).blocks.find(
    (candidate) => candidate.id === blockId,
  );
  if (
    !published ||
    !supported.includes(published.type as SupportedWidget)
  ) {
    throw new AppError("NOT_FOUND", "Widget not found");
  }
  return {
    type: published.type as SupportedWidget,
    userId: block.page.profile.userId,
    config: published.config as Record<string, unknown>,
  };
}

function fallbackFor(widget: Awaited<ReturnType<typeof publishedWidget>>) {
  return {
    kind: widget.type.toLowerCase(),
    href:
      widget.type === "GITHUB"
        ? `https://github.com/${String(widget.config.username)}`
        : widget.type === "TWITCH"
          ? `https://www.twitch.tv/${String(widget.config.channel)}`
          : widget.type === "YOUTUBE"
            ? String(widget.config.channelUrl)
            : String(widget.config.resourceUrl),
  };
}

async function fetchWidget(
  widget: Awaited<ReturnType<typeof publishedWidget>>,
) {
  if (widget.type === "GITHUB") {
    return getGithubWidget(String(widget.config.username));
  }
  if (widget.type === "SPOTIFY") {
    return getSpotifyWidget(widget.userId, String(widget.config.resourceUrl));
  }
  if (widget.type === "YOUTUBE") {
    return getYoutubeWidget(String(widget.config.channelUrl));
  }
  return getTwitchWidget(String(widget.config.channel));
}

export async function getPublicWidget(blockId: string) {
  const widget = await publishedWidget(blockId);
  const [fresh, stale] = await Promise.all([
    cacheGet<WidgetPayload>(cacheKeys.publicWidget(blockId)),
    cacheGet<WidgetPayload>(cacheKeys.publicWidgetStale(blockId)),
  ]);
  const resolved = resolveWidgetCache(fresh, stale, fallbackFor(widget));
  if (resolved.refresh) await enqueueWidgetRefresh(blockId);
  return resolved.delivery;
}

export async function refreshPublicWidget(blockId: string) {
  const widget = await publishedWidget(blockId);
  const result = normalizeWidgetPayload(await fetchWidget(widget));
  await Promise.all([
    cacheSet(cacheKeys.publicWidget(blockId), result, 60),
    cacheSet(cacheKeys.publicWidgetStale(blockId), result, 86_400),
  ]);
  return result;
}
