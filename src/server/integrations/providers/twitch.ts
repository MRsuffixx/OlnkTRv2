import { z } from "zod";

import { env } from "~/env";
import { fetchIntegrationJson } from "../http";

const streamSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      user_name: z.string(),
      game_name: z.string(),
      title: z.string(),
      viewer_count: z.number(),
      thumbnail_url: z.string(),
      started_at: z.string(),
    }),
  ),
});

export function normalizeTwitchStream(value: unknown) {
  const stream = streamSchema.parse(value).data[0];
  if (!stream) return { live: false as const };
  return {
    live: true as const,
    title: stream.title,
    game: stream.game_name,
    viewers: stream.viewer_count,
    startedAt: stream.started_at,
    thumbnailUrl: stream.thumbnail_url
      .replace("{width}", "640")
      .replace("{height}", "360"),
  };
}

async function appToken() {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) return null;
  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", env.TWITCH_CLIENT_ID);
  url.searchParams.set("client_secret", env.TWITCH_CLIENT_SECRET);
  url.searchParams.set("grant_type", "client_credentials");
  return z.object({ access_token: z.string() }).parse(
    await fetchIntegrationJson(url, { method: "POST" }),
  ).access_token;
}

export async function getTwitchWidget(channel: string) {
  const href = `https://www.twitch.tv/${channel}`;
  const token = await appToken();
  if (!token || !env.TWITCH_CLIENT_ID) {
    return { kind: "twitch" as const, available: false, href, channel };
  }
  const url = new URL("https://api.twitch.tv/helix/streams");
  url.searchParams.set("user_login", channel);
  return {
    kind: "twitch" as const,
    available: true,
    href,
    channel,
    stream: normalizeTwitchStream(
      await fetchIntegrationJson(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Client-Id": env.TWITCH_CLIENT_ID,
        },
      }),
    ),
  };
}
