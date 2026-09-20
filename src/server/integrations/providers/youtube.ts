import { z } from "zod";

import { env } from "~/env";
import { fetchIntegrationJson } from "../http";

const searchSchema = z.object({
  items: z.array(
    z.object({
      id: z.object({ videoId: z.string() }),
      snippet: z.object({
        title: z.string(),
        publishedAt: z.string(),
        thumbnails: z.object({
          high: z.object({ url: z.string().url() }).optional(),
          medium: z.object({ url: z.string().url() }).optional(),
          default: z.object({ url: z.string().url() }).optional(),
        }),
      }),
    }),
  ),
});

export function normalizeYoutubeSearch(value: unknown) {
  const item = searchSchema.parse(value).items[0];
  if (!item) return null;
  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
    publishedAt: item.snippet.publishedAt,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url ??
      null,
  };
}

function channelIdentifier(channelUrl: string) {
  const url = new URL(channelUrl);
  if (url.hostname !== "www.youtube.com" && url.hostname !== "youtube.com") {
    throw new Error("INVALID_YOUTUBE_URL");
  }
  const [kind, identifier] = url.pathname.split("/").filter(Boolean);
  if (kind === "channel" && identifier) return { channelId: identifier };
  if (kind?.startsWith("@")) return { handle: kind };
  throw new Error("YOUTUBE_CHANNEL_URL_REQUIRED");
}

export async function getYoutubeWidget(channelUrl: string) {
  if (!env.YOUTUBE_API_KEY) {
    return { kind: "youtube" as const, available: false, href: channelUrl };
  }
  const identifier = channelIdentifier(channelUrl);
  let channelId = identifier.channelId;
  if (!channelId && identifier.handle) {
    const channelRequest = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelRequest.searchParams.set("part", "id");
    channelRequest.searchParams.set("forHandle", identifier.handle);
    channelRequest.searchParams.set("key", env.YOUTUBE_API_KEY);
    const response = z.object({ items: z.array(z.object({ id: z.string() })) }).parse(
      await fetchIntegrationJson(channelRequest),
    );
    channelId = response.items[0]?.id;
  }
  if (!channelId) return { kind: "youtube" as const, available: false, href: channelUrl };
  const request = new URL("https://www.googleapis.com/youtube/v3/search");
  request.searchParams.set("part", "snippet");
  request.searchParams.set("channelId", channelId);
  request.searchParams.set("type", "video");
  request.searchParams.set("order", "date");
  request.searchParams.set("maxResults", "1");
  request.searchParams.set("key", env.YOUTUBE_API_KEY);
  return {
    kind: "youtube" as const,
    available: true,
    href: channelUrl,
    video: normalizeYoutubeSearch(await fetchIntegrationJson(request)),
  };
}
