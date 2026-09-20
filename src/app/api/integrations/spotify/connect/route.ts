import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import {
  spotifyAuthorizationUrl,
  spotifyConfigured,
} from "~/server/integrations/providers/spotify";
import { ensureRedis, redis } from "~/server/cache/redis";
import { rateLimit } from "~/server/security/rate-limit";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!spotifyConfigured()) {
    return NextResponse.redirect(
      new URL("/dashboard/settings/integrations?spotify=disabled", request.url),
    );
  }
  const limited = await rateLimit(
    "spotify-connect",
    session.user.id,
    10,
    3600,
  );
  if (!limited.allowed) {
    return NextResponse.redirect(
      new URL("/dashboard/settings/integrations?spotify=rate-limited", request.url),
    );
  }
  const state = randomBytes(32).toString("base64url");
  await ensureRedis();
  await redis.set(
    `olnk:v1:oauth:spotify:${state}`,
    session.user.id,
    "EX",
    600,
  );
  return NextResponse.redirect(spotifyAuthorizationUrl(state));
}
