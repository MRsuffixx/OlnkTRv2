import { z } from "zod";

export const SYSTEM_RESERVED_USERNAMES = new Set([
  "admin", "api", "login", "auth", "dashboard", "account", "settings", "billing",
  "pricing", "support", "about", "blog", "assets", "static", "tr", "en", "de", "fr",
  "verify-request", "onboarding", "health", "features", "terms", "privacy", "explore", "robots.txt", "sitemap.xml",
]);

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export const usernameFormatSchema = z.string().transform(normalizeUsername).pipe(
  z.string().min(3).max(30).regex(/^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/, "Use lowercase letters, numbers, and underscores"),
);

export const usernameSchema = usernameFormatSchema.refine((value) => !SYSTEM_RESERVED_USERNAMES.has(value), "Username is reserved");
