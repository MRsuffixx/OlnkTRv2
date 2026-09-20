import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { ensureRedis, redis } from "~/server/cache/redis";
import { connectSpotify } from "~/server/integrations/providers/spotify";

function settingsRedirect(request: Request, status: string) {
  return NextResponse.redirect(
    new URL(`/dashboard/settings/integrations?spotify=${status}`, request.url),
  );
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code || url.searchParams.has("error")) {
    return settingsRedirect(request, "failed");
  }
  await ensureRedis();
  const ownerId = await redis.getdel(`olnk:v1:oauth:spotify:${state}`);
  if (ownerId !== session.user.id) {
    return settingsRedirect(request, "invalid-state");
  }
  try {
    await connectSpotify(session.user.id, code);
    return settingsRedirect(request, "connected");
  } catch {
    return settingsRedirect(request, "failed");
  }
}
