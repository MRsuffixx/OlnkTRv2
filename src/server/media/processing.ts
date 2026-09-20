import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { promisify } from "node:util";

import { env } from "~/env";
import { db } from "~/server/db";
import { AppError } from "~/server/errors";
import { storage } from "~/server/storage";
import { probeVideo } from "./probe";

const execFileAsync = promisify(execFile);

export function buildVideoDerivativeKeys(ownerId: string, assetId: string) {
  return {
    optimized: `users/${ownerId}/processed/${assetId}.mp4`,
    poster: `users/${ownerId}/processed/${assetId}.webp`,
  };
}

function failureCode(error: unknown) {
  if (error instanceof AppError) return error.message.slice(0, 120);
  return "VIDEO_PROCESSING_FAILED";
}

export async function processVideoAsset(assetId: string) {
  const asset = await db.mediaAsset.findUnique({
    where: { id: assetId },
    include: { derivatives: true },
  });
  if (!asset || asset.kind !== "VIDEO" || asset.variant !== "ORIGINAL") {
    throw new AppError("NOT_FOUND", "VIDEO_ASSET_NOT_FOUND");
  }
  if (
    asset.status === "READY" &&
    asset.derivatives.some((item) => item.variant === "OPTIMIZED") &&
    asset.derivatives.some((item) => item.variant === "POSTER")
  ) {
    return asset;
  }

  await db.mediaAsset.update({
    where: { id: asset.id },
    data: { status: "PROCESSING", processingErrorCode: null },
  });

  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "olnktr-video-"),
  );
  const inputPath = path.join(temporaryDirectory, `source.${asset.mimeType === "video/webm" ? "webm" : "mp4"}`);
  const optimizedPath = path.join(temporaryDirectory, "optimized.mp4");
  const posterPath = path.join(temporaryDirectory, "poster.webp");
  const keys = buildVideoDerivativeKeys(asset.ownerId, asset.id);

  try {
    await writeFile(inputPath, await storage.getObject(asset.objectKey));
    const probe = await probeVideo(inputPath);
    const scale = `scale=min(${env.MEDIA_VIDEO_MAX_DIMENSION}\\,iw):-2`;
    await execFileAsync(env.FFMPEG_PATH, [
      "-y",
      "-i",
      inputPath,
      "-map_metadata",
      "-1",
      "-an",
      "-vf",
      scale,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "24",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      optimizedPath,
    ]);
    await execFileAsync(env.FFMPEG_PATH, [
      "-y",
      "-i",
      inputPath,
      "-frames:v",
      "1",
      "-vf",
      scale,
      "-c:v",
      "libwebp",
      "-quality",
      "82",
      posterPath,
    ]);

    const [optimizedBytes, posterBytes] = await Promise.all([
      readFile(optimizedPath),
      readFile(posterPath),
    ]);
    await Promise.all([
      storage.deleteObject(keys.optimized),
      storage.deleteObject(keys.poster),
    ]);
    await storage.putObject(
      keys.optimized,
      Readable.from(optimizedBytes),
      "video/mp4",
    );
    await storage.putObject(
      keys.poster,
      Readable.from(posterBytes),
      "image/webp",
    );

    const durationMs = Math.round(probe.durationSeconds * 1000);
    await db.$transaction(async (tx) => {
      await tx.mediaAsset.deleteMany({
        where: {
          sourceAssetId: asset.id,
          variant: { in: ["OPTIMIZED", "POSTER"] },
        },
      });
      await tx.mediaAsset.createMany({
        data: [
          {
            ownerId: asset.ownerId,
            provider: asset.provider,
            bucket: asset.bucket,
            objectKey: keys.optimized,
            originalName: null,
            mimeType: "video/mp4",
            kind: "VIDEO",
            variant: "OPTIMIZED",
            size: optimizedBytes.byteLength,
            width: probe.width,
            height: probe.height,
            durationMs,
            checksum: createHash("sha256")
              .update(optimizedBytes)
              .digest("hex"),
            status: "READY",
            private: asset.private,
            sourceAssetId: asset.id,
          },
          {
            ownerId: asset.ownerId,
            provider: asset.provider,
            bucket: asset.bucket,
            objectKey: keys.poster,
            originalName: null,
            mimeType: "image/webp",
            kind: "IMAGE",
            variant: "POSTER",
            size: posterBytes.byteLength,
            width: probe.width,
            height: probe.height,
            checksum: createHash("sha256").update(posterBytes).digest("hex"),
            status: "READY",
            private: asset.private,
            sourceAssetId: asset.id,
          },
        ],
      });
      await tx.mediaAsset.update({
        where: { id: asset.id },
        data: {
          status: "READY",
          width: probe.width,
          height: probe.height,
          durationMs,
          processingErrorCode: null,
        },
      });
    });
    return db.mediaAsset.findUniqueOrThrow({ where: { id: asset.id } });
  } catch (error) {
    await db.mediaAsset.update({
      where: { id: asset.id },
      data: { status: "REJECTED", processingErrorCode: failureCode(error) },
    });
    throw error;
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
