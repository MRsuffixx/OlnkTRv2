import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "~/env";
import { AppError } from "~/server/errors";
import {
  getPollResults,
  hashPollVisitor,
  submitPollVote,
} from "~/server/polls/service";
import { rateLimit } from "~/server/security/rate-limit";

const voteSchema = z.object({ optionKey: z.string().max(32) }).strict();

function visitorFrom(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return hashPollVisitor(ip, userAgent, env.ANALYTICS_SALT);
}

function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.code },
      { status: error.code === "NOT_FOUND" ? 404 : 400 },
    );
  }
  throw error;
}

export async function GET(
  request: Request,
  context: RouteContext<"/api/public/polls/[blockId]">,
) {
  const { blockId } = await context.params;
  try {
    return NextResponse.json(
      await getPollResults(blockId, visitorFrom(request)),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/public/polls/[blockId]">,
) {
  const { blockId } = await context.params;
  const visitorHash = visitorFrom(request);
  const limit = await rateLimit("poll-vote", visitorHash, 20, 3600);
  if (!limit.allowed) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  const parsed = voteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await submitPollVote(blockId, parsed.data.optionKey, visitorHash),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
