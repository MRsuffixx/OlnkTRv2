import { NextResponse } from "next/server";
import { z } from "zod";

import { AppError } from "~/server/errors";
import { getPublicWidget } from "~/server/integrations/service";
import { rateLimit } from "~/server/security/rate-limit";

export async function GET(
  request: Request,
  context: RouteContext<"/api/public/widgets/[blockId]">,
) {
  const parsed = z.string().cuid().safeParse((await context.params).blockId);
  if (!parsed.success) return new NextResponse(null, { status: 404 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await rateLimit("public-widget", `${parsed.data}:${ip}`, 120, 60);
  if (!limited.allowed) return new NextResponse(null, { status: 429 });
  try {
    return NextResponse.json(await getPublicWidget(parsed.data), {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" },
    });
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      return new NextResponse(null, { status: 404 });
    }
    throw error;
  }
}
