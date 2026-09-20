import { createHmac } from "node:crypto";

import { db } from "~/server/db";
import { AppError } from "~/server/errors";
import { parsePublicationSnapshot } from "~/server/publishing/snapshot";

interface PollConfig {
  question: string;
  options: Array<{ key: string; label: string }>;
}

export function hashPollVisitor(
  ip: string,
  userAgent: string,
  secret: string,
) {
  return createHmac("sha256", secret)
    .update(`${ip}\u0000${userAgent}`)
    .digest("hex");
}

async function getPublishedPoll(blockId: string) {
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
          publication: { select: { version: { select: { snapshot: true } } } },
        },
      },
    },
  });
  const snapshotValue = block?.page.publication?.version.snapshot;
  if (!snapshotValue) throw new AppError("NOT_FOUND", "Poll not found");
  const snapshot = parsePublicationSnapshot(snapshotValue);
  const publishedBlock = snapshot.blocks.find(
    (candidate) => candidate.id === blockId && candidate.type === "POLL",
  );
  if (!publishedBlock) throw new AppError("NOT_FOUND", "Poll not found");
  return publishedBlock.config as PollConfig;
}

export async function getPollResults(
  blockId: string,
  visitorHash?: string,
) {
  const config = await getPublishedPoll(blockId);
  const [groups, existing] = await Promise.all([
    db.pollVote.groupBy({
      by: ["optionKey"],
      where: { blockId },
      _count: { _all: true },
    }),
    visitorHash
      ? db.pollVote.findUnique({
          where: { blockId_visitorHash: { blockId, visitorHash } },
          select: { optionKey: true },
        })
      : null,
  ]);
  const countByKey = new Map(
    groups.map((group) => [group.optionKey, group._count._all]),
  );
  const options = config.options.map((option) => ({
    ...option,
    votes: countByKey.get(option.key) ?? 0,
  }));
  return {
    options,
    total: options.reduce((sum, option) => sum + option.votes, 0),
    selectedOptionKey: existing?.optionKey ?? null,
  };
}

export async function submitPollVote(
  blockId: string,
  optionKey: string,
  visitorHash: string,
) {
  const config = await getPublishedPoll(blockId);
  if (!config.options.some((option) => option.key === optionKey)) {
    throw new AppError("VALIDATION_ERROR", "Poll option is unavailable");
  }
  await db.pollVote.createMany({
    data: { blockId, optionKey, visitorHash },
    skipDuplicates: true,
  });
  return getPollResults(blockId, visitorHash);
}
