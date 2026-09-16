import { z } from "zod";

const allowedSchemes = new Set(["https:", "http:", "mailto:", "tel:"]);

export const safeExternalUrlSchema = z.string().trim().min(1).max(2048).transform((value, ctx) => {
  try {
    const parsed = new URL(value);
    if (!allowedSchemes.has(parsed.protocol) || ((parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.hostname)) {
      ctx.addIssue({ code: "custom", message: "URL scheme is not allowed" });
      return z.NEVER;
    }
    return parsed.toString();
  } catch {
    ctx.addIssue({ code: "custom", message: "Invalid URL" });
    return z.NEVER;
  }
});

export function isSafeRedirect(value: string, origin: string): boolean {
  try {
    const url = new URL(value, origin);
    return url.origin === new URL(origin).origin;
  } catch { return false; }
}
