ALTER TABLE "Block" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Block_pageId_deletedAt_idx" ON "Block"("pageId", "deletedAt");
