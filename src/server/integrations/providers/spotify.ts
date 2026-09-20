import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import { decryptCredentials, encryptCredentials } from "../crypto";
import { fetchIntegrationJson } from "../http";

const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string().default("Bearer"),
  scope: z.string().default(""),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().optional(),
});
const credentialsSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.string(),
});
const recentSchema = z.object({
  items: z.array(
    z.object({
      played_at: z.string(),
      track: z.object({
        id: z.string(),
        name: z.string(),
        duration_ms: z.number(),
        artists: z.array(z.object({ name: z.string() })),
        album: z.object({
          name: z.string(),
          images: z.array(
            z.object({ url: z.string().url(), width: z.number().nullable() }),
          ),
        }),
        external_urls: z.object({ spotify: z.string().url() }),
      }),
    }),
  ),
});

function integrationKey() {
  if (!env.INTEGRATION_ENCRYPTION_KEY) {
    throw new Error("SPOTIFY_INTEGRATION_DISABLED");
  }
  return env.INTEGRATION_ENCRYPTION_KEY;
}

function clientCredentials() {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
    throw new Error("SPOTIFY_INTEGRATION_DISABLED");
  }
  return { id: env.SPOTIFY_CLIENT_ID, secret: env.SPOTIFY_CLIENT_SECRET };
}

export function spotifyConfigured() {
  return Boolean(
    env.SPOTIFY_CLIENT_ID &&
      env.SPOTIFY_CLIENT_SECRET &&
      env.INTEGRATION_ENCRYPTION_KEY,
  );
}

export function spotifyEmbedUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "open.spotify.com") {
    throw new Error("INVALID_SPOTIFY_URL");
  }
  const [type, id] = url.pathname.split("/").filter(Boolean);
  if (
    !type ||
    !id ||
    !["track", "album", "artist", "playlist", "episode", "show"].includes(
      type,
    )
  ) {
    throw new Error("INVALID_SPOTIFY_URL");
  }
  return `https://open.spotify.com/embed/${type}/${encodeURIComponent(id)}`;
}

export function spotifyAuthorizationUrl(state: string) {
  const { id } = clientCredentials();
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", id);
  url.searchParams.set(
    "scope",
    "user-read-recently-played user-read-currently-playing",
  );
  url.searchParams.set(
    "redirect_uri",
    `${env.APP_URL}/api/integrations/spotify/callback`,
  );
  url.searchParams.set("state", state);
  return url;
}

async function requestToken(body: URLSearchParams) {
  const { id, secret } = clientCredentials();
  return tokenSchema.parse(
    await fetchIntegrationJson(
      new URL("https://accounts.spotify.com/api/token"),
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    ),
  );
}

export async function connectSpotify(userId: string, code: string) {
  const token = await requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${env.APP_URL}/api/integrations/spotify/callback`,
    }),
  );
  if (!token.refresh_token) throw new Error("SPOTIFY_REFRESH_TOKEN_MISSING");
  const encrypted = encryptCredentials(
    {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenType: token.token_type,
    },
    integrationKey(),
  );
  const expiresAt = new Date(Date.now() + token.expires_in * 1000);
  await db.$transaction(async (tx) => {
    const connection = await tx.integrationConnection.upsert({
      where: { userId_provider: { userId, provider: "SPOTIFY" } },
      create: {
        userId,
        provider: "SPOTIFY",
        status: "ACTIVE",
        encryptedCredentials: encrypted,
        scopes: token.scope.split(" ").filter(Boolean),
        expiresAt,
      },
      update: {
        status: "ACTIVE",
        encryptedCredentials: encrypted,
        scopes: token.scope.split(" ").filter(Boolean),
        expiresAt,
        lastRefreshedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: userId,
        actorType: "USER",
        action: "INTEGRATION_CONNECTED",
        targetType: "IntegrationConnection",
        targetId: connection.id,
        metadata: { provider: "SPOTIFY" },
      },
    });
  });
}

export async function disconnectSpotify(userId: string) {
  await db.$transaction(async (tx) => {
    const connection = await tx.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider: "SPOTIFY" } },
      select: { id: true },
    });
    if (!connection) return;
    await tx.integrationConnection.delete({ where: { id: connection.id } });
    await tx.auditLog.create({
      data: {
        actorId: userId,
        actorType: "USER",
        action: "INTEGRATION_DISCONNECTED",
        targetType: "IntegrationConnection",
        targetId: connection.id,
        metadata: { provider: "SPOTIFY" },
      },
    });
  });
}

async function accessToken(userId: string) {
  const connection = await db.integrationConnection.findUnique({
    where: { userId_provider: { userId, provider: "SPOTIFY" } },
  });
  if (!connection || connection.status !== "ACTIVE") return null;
  const credentials = credentialsSchema.parse(
    decryptCredentials(
      connection.encryptedCredentials,
      integrationKey(),
    ),
  );
  if (
    connection.expiresAt &&
    connection.expiresAt.getTime() > Date.now() + 60_000
  ) {
    return credentials.accessToken;
  }
  const token = await requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
    }),
  );
  const nextCredentials = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? credentials.refreshToken,
    tokenType: token.token_type,
  };
  await db.integrationConnection.update({
    where: { id: connection.id },
    data: {
      encryptedCredentials: encryptCredentials(
        nextCredentials,
        integrationKey(),
      ),
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
      lastRefreshedAt: new Date(),
      status: "ACTIVE",
    },
  });
  return nextCredentials.accessToken;
}

export async function getSpotifyWidget(userId: string, resourceUrl: string) {
  const token = spotifyConfigured() ? await accessToken(userId) : null;
  if (!token) {
    return {
      kind: "spotify" as const,
      available: true,
      href: resourceUrl,
      embedUrl: spotifyEmbedUrl(resourceUrl),
    };
  }
  const response = recentSchema.parse(
    await fetchIntegrationJson(
      new URL("https://api.spotify.com/v1/me/player/recently-played?limit=1"),
      { headers: { Authorization: `Bearer ${token}` } },
    ),
  );
  const item = response.items[0];
  if (!item) {
    return {
      kind: "spotify" as const,
      available: true,
      href: resourceUrl,
      embedUrl: spotifyEmbedUrl(resourceUrl),
    };
  }
  return {
    kind: "spotify" as const,
    available: true,
    href: item.track.external_urls.spotify,
    recent: {
      title: item.track.name,
      artists: item.track.artists.map((artist) => artist.name).join(", "),
      album: item.track.album.name,
      artworkUrl: item.track.album.images[0]?.url ?? null,
      playedAt: item.played_at,
    },
  };
}
