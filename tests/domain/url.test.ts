import { describe, expect, it } from "vitest";
import { safeExternalUrlSchema } from "~/server/security/url";

describe("external URL policy", () => {
  it.each(["https://example.com/a", "mailto:hello@example.com", "tel:+905551112233"])("accepts %s", (url) => {
    expect(safeExternalUrlSchema.safeParse(url).success).toBe(true);
  });

  it.each(["javascript:alert(1)", "data:text/html,x", "vbscript:msgbox(1)", "ftp://example.com"])("rejects %s", (url) => {
    expect(safeExternalUrlSchema.safeParse(url).success).toBe(false);
  });
});
