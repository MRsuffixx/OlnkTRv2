import { createHash, randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { can } from "~/server/entitlements/service";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { mediaQueue } from "~/server/queues";
import { rateLimit } from "~/server/security/rate-limit";
import { storage } from "~/server/storage";
import {
  maximumVideoUploadBytes,
  validateMediaUpload,
} from "~/server/storage/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    return new NextResponse(null, { status: 401 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const [accountLimit, ipLimit] = await Promise.all([
    rateLimit("media-upload-account", session.user.id, 60, 3600),
    rateLimit("media-upload-ip", ip, 120, 3600),
  ]);
  if (!accountLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > maximumVideoUploadBytes) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const usage = await db.mediaAsset.aggregate({
    where: {
      ownerId: session.user.id,
      status: { not: "DELETED" },
      variant: "ORIGINAL",
    },
    _sum: { size: true },
  });
  const usedMegabytes = Number(usage._sum.size ?? 0) / (1024 * 1024);
  const entitlement = await can(
    session.user.id,
    "FILE_STORAGE",
    usedMegabytes,
  );
  if (
    !entitlement.allowed ||
    (entitlement.limit !== null &&
      usedMegabytes + file.size / (1024 * 1024) > entitlement.limit)
  ) {
    return NextResponse.json(
      { error: "Storage limit reached" },
      { status: 403 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  let detected;
  try {
    detected = await validateMediaUpload(bytes, file.size);
  } catch {
    return NextResponse.json({ error: "Unsupported file" }, { status: 400 });
  }
  const key = `users/${session.user.id}/${randomUUID()}.${detected.ext}`;
  await storage.putObject(key, Readable.from(bytes), detected.mime);

  let createdAssetId: string | undefined;
  try {
    const asset = await db.mediaAsset.create({
      data: {
        ownerId: session.user.id,
        provider: process.env.STORAGE_PROVIDER === "s3" ? "S3" : "LOCAL",
        objectKey: key,
        originalName: file.name.slice(0, 200),
        mimeType: detected.mime,
        kind: detected.kind,
        variant: "ORIGINAL",
        size: file.size,
        checksum: createHash("sha256").update(bytes).digest("hex"),
        status: detected.kind === "VIDEO" ? "PENDING" : "READY",
        private: true,
      },
    });
    createdAssetId = asset.id;
    if (detected.kind === "VIDEO") {
      await mediaQueue.add(
        "process-video",
        { assetId: asset.id },
        { jobId: `process-video-${asset.id}` },
      );
    }
    return NextResponse.json({ id: asset.id, status: asset.status });
  } catch (error) {
    await storage.deleteObject(key);
    if (createdAssetId) {
      await db.mediaAsset.delete({ where: { id: createdAssetId } });
    }
    throw error;
  }
}
