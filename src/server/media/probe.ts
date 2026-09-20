import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { z } from "zod";

import { env } from "~/env";
import { AppError } from "~/server/errors";

const execFileAsync = promisify(execFile);

export interface VideoProbe {
  durationSeconds: number;
  width: number;
  height: number;
}

const ffprobeOutputSchema = z.object({
  format: z.object({ duration: z.coerce.number().positive() }),
  streams: z.array(
    z.object({
      codec_type: z.string(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    }),
  ),
});

export function validateVideoProbe(
  probe: VideoProbe,
  limits = {
    maxDurationSeconds: env.MEDIA_VIDEO_MAX_DURATION_SECONDS,
    maxDimension: env.MEDIA_VIDEO_MAX_DIMENSION,
  },
) {
  if (
    !Number.isFinite(probe.durationSeconds) ||
    probe.durationSeconds <= 0
  ) {
    throw new AppError("VALIDATION_ERROR", "VIDEO_DURATION_INVALID");
  }
  if (probe.durationSeconds > limits.maxDurationSeconds) {
    throw new AppError("VALIDATION_ERROR", "VIDEO_DURATION_EXCEEDED");
  }
  if (
    probe.width <= 0 ||
    probe.height <= 0 ||
    probe.width > limits.maxDimension ||
    probe.height > limits.maxDimension
  ) {
    throw new AppError("VALIDATION_ERROR", "VIDEO_DIMENSIONS_EXCEEDED");
  }
  return probe;
}

export async function probeVideo(filePath: string): Promise<VideoProbe> {
  const { stdout } = await execFileAsync(
    env.FFPROBE_PATH,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration:stream=codec_type,width,height",
      "-of",
      "json",
      filePath,
    ],
    { maxBuffer: 1024 * 1024 },
  );
  const parsed = ffprobeOutputSchema.parse(JSON.parse(stdout));
  const video = parsed.streams.find(
    (stream) =>
      stream.codec_type === "video" && stream.width && stream.height,
  );
  if (!video?.width || !video.height) {
    throw new AppError("VALIDATION_ERROR", "VIDEO_STREAM_MISSING");
  }
  return validateVideoProbe({
    durationSeconds: parsed.format.duration,
    width: video.width,
    height: video.height,
  });
}
