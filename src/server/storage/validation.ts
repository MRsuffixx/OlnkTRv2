import { fileTypeFromBuffer } from "file-type";

import { AppError } from "~/server/errors";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const allowedVideoTypes = new Set(["video/mp4", "video/webm"]);

export const maximumUploadBytes = 5 * 1024 * 1024;
export const maximumVideoUploadBytes = 25 * 1024 * 1024;

export async function validateMediaUpload(
  bytes: Uint8Array,
  declaredSize = bytes.byteLength,
) {
  if (bytes.byteLength === 0 || declaredSize <= 0) {
    throw new AppError("VALIDATION_ERROR", "Invalid file size");
  }
  const detected = await fileTypeFromBuffer(bytes);
  if (!detected) {
    throw new AppError("VALIDATION_ERROR", "Unsupported file signature");
  }
  if (allowedImageTypes.has(detected.mime)) {
    if (
      bytes.byteLength > maximumUploadBytes ||
      declaredSize > maximumUploadBytes
    ) {
      throw new AppError("VALIDATION_ERROR", "Invalid file size");
    }
    return { ...detected, kind: "IMAGE" as const };
  }
  if (allowedVideoTypes.has(detected.mime)) {
    if (
      bytes.byteLength > maximumVideoUploadBytes ||
      declaredSize > maximumVideoUploadBytes
    ) {
      throw new AppError("VALIDATION_ERROR", "Invalid file size");
    }
    return { ...detected, kind: "VIDEO" as const };
  }
  throw new AppError("VALIDATION_ERROR", "Unsupported file signature");
}

export async function validateImageUpload(bytes: Uint8Array) {
  if (bytes.byteLength === 0 || bytes.byteLength > maximumUploadBytes) {
    throw new AppError("VALIDATION_ERROR", "Invalid file size");
  }
  const detected = await validateMediaUpload(bytes);
  if (detected.kind !== "IMAGE") {
    throw new AppError("VALIDATION_ERROR", "Unsupported file signature");
  }
  return detected;
}
