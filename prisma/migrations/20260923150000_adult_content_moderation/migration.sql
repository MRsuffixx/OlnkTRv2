ALTER TYPE "ReportReason" ADD VALUE 'ADULT_CONTENT';
ALTER TYPE "ReportReason" ADD VALUE 'EXPLOITATION';
ALTER TYPE "ReportReason" ADD VALUE 'MINOR_SAFETY';

ALTER TABLE "Report" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

DROP INDEX "Report_status_createdAt_idx";
CREATE INDEX "Report_status_priority_createdAt_idx"
ON "Report"("status", "priority", "createdAt");
