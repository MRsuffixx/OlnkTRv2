-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaVariant" AS ENUM ('ORIGINAL', 'OPTIMIZED', 'POSTER');

-- AlterEnum
ALTER TYPE "MediaStatus" ADD VALUE 'PROCESSING';

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "processingErrorCode" TEXT,
ADD COLUMN     "sourceAssetId" TEXT,
ADD COLUMN     "variant" "MediaVariant" NOT NULL DEFAULT 'ORIGINAL';

-- CreateIndex
CREATE INDEX "MediaAsset_sourceAssetId_variant_idx" ON "MediaAsset"("sourceAssetId", "variant");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
