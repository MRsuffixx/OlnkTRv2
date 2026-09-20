import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const envBoolean = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return value;
}, z.boolean());

const server = {
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: envBoolean.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().email().default("no-reply@olnk.test"),
  MAIL_FROM_NAME: z.string().default("OlnkTR"),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  LOCAL_STORAGE_PATH: z.string().default("./data/uploads"),
  STORAGE_PUBLIC_URL: z.string().url().default("http://localhost:3000/uploads"),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  FFMPEG_PATH: z.string().default("ffmpeg"),
  FFPROBE_PATH: z.string().default("ffprobe"),
  MEDIA_VIDEO_MAX_DURATION_SECONDS: z.coerce.number().int().min(1).max(120).default(30),
  MEDIA_VIDEO_MAX_DIMENSION: z.coerce.number().int().min(320).max(4096).default(2560),
  GITHUB_TOKEN: z.string().optional(),
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  INTEGRATION_ENCRYPTION_KEY: z.string().refine((value) => Buffer.from(value, "base64").byteLength === 32, "Must be a base64-encoded 32-byte key").optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  TWITCH_CLIENT_ID: z.string().optional(),
  TWITCH_CLIENT_SECRET: z.string().optional(),
  BILLING_WEBHOOK_SECRET: z.string().min(16).default("development-only-secret"),
  ANALYTICS_SALT: z.string().min(16).default("development-analytics-salt"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_EMAIL: z.string().email().optional(),
  ACCOUNT_DELETION_GRACE_DAYS: z.coerce.number().int().min(0).max(90).default(7),
};

export const env = createEnv({
  server,
  client: {},
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    MAIL_FROM: process.env.MAIL_FROM,
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    LOCAL_STORAGE_PATH: process.env.LOCAL_STORAGE_PATH,
    STORAGE_PUBLIC_URL: process.env.STORAGE_PUBLIC_URL,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    FFMPEG_PATH: process.env.FFMPEG_PATH,
    FFPROBE_PATH: process.env.FFPROBE_PATH,
    MEDIA_VIDEO_MAX_DURATION_SECONDS: process.env.MEDIA_VIDEO_MAX_DURATION_SECONDS,
    MEDIA_VIDEO_MAX_DIMENSION: process.env.MEDIA_VIDEO_MAX_DIMENSION,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    INTEGRATION_ENCRYPTION_KEY: process.env.INTEGRATION_ENCRYPTION_KEY,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET,
    BILLING_WEBHOOK_SECRET: process.env.BILLING_WEBHOOK_SECRET,
    ANALYTICS_SALT: process.env.ANALYTICS_SALT,
    APP_URL: process.env.APP_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ACCOUNT_DELETION_GRACE_DAYS: process.env.ACCOUNT_DELETION_GRACE_DAYS,
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
  emptyStringAsUndefined: true,
});

if (!process.env.SKIP_ENV_VALIDATION) {
  if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
    throw new Error("Google OAuth requires both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
  }
  if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD)) {
    throw new Error("SMTP authentication requires both SMTP_USER and SMTP_PASSWORD");
  }
  if (Boolean(env.TWITCH_CLIENT_ID) !== Boolean(env.TWITCH_CLIENT_SECRET)) {
    throw new Error("Twitch integration requires both client ID and client secret");
  }
  if (Boolean(env.SPOTIFY_CLIENT_ID) !== Boolean(env.SPOTIFY_CLIENT_SECRET)) {
    throw new Error("Spotify integration requires both client ID and client secret");
  }
  if (env.SPOTIFY_CLIENT_ID && !env.INTEGRATION_ENCRYPTION_KEY) {
    throw new Error("Spotify integration requires INTEGRATION_ENCRYPTION_KEY");
  }
  if (
    env.STORAGE_PROVIDER === "s3" &&
    (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY)
  ) {
    throw new Error("S3 storage requires bucket and credentials");
  }
  if (env.NODE_ENV === "production") {
    if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required in production");
    if (env.BILLING_WEBHOOK_SECRET === "development-only-secret") {
      throw new Error("A production BILLING_WEBHOOK_SECRET is required");
    }
    if (env.ANALYTICS_SALT === "development-analytics-salt") {
      throw new Error("A production ANALYTICS_SALT is required");
    }
  }
}
