-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BlockType" ADD VALUE 'HIGHLIGHT';
ALTER TYPE "BlockType" ADD VALUE 'VISITOR_COUNTER';
ALTER TYPE "BlockType" ADD VALUE 'SUPPORT';
ALTER TYPE "BlockType" ADD VALUE 'POLL';
ALTER TYPE "BlockType" ADD VALUE 'GITHUB';

-- CreateTable
CREATE TABLE "PollVote" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "optionKey" VARCHAR(32) NOT NULL,
    "visitorHash" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PollVote_blockId_optionKey_idx" ON "PollVote"("blockId", "optionKey");

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_blockId_visitorHash_key" ON "PollVote"("blockId", "visitorHash");

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
