import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "~/server/db";
import { rateLimit } from "~/server/security/rate-limit";

const paramsSchema = z.object({ profileId: z.string().cuid() });

export async function GET(
  request: Request,
  context: RouteContext<"/api/public/stats/[profileId]">,
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return new NextResponse(null, { status: 404 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await rateLimit(
    "public-stats",
    `${parsed.data.profileId}:${ip}`,
    120,
    60,
  );
  if (!limited.allowed) return new NextResponse(null, { status: 429 });
  const profile = await db.profile.findFirst({
    where: {
      id: parsed.data.profileId,
      status: "ACTIVE",
      user: { status: "ACTIVE" },
      page: {
        visibility: { not: "PRIVATE" },
        publication: { isNot: null },
      },
    },
    select: { id: true },
  });
  if (!profile) return new NextResponse(null, { status: 404 });
  const period = new URL(request.url).searchParams.get("period");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const result = await db.profileAnalyticsDaily.aggregate({
    where: {
      profileId: profile.id,
      ...(period === "daily" ? { date: today } : {}),
    },
    _sum: { views: true },
  });
  return NextResponse.json(
    { views: result._sum.views ?? 0 },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } },
  );
}
