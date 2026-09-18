import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  parseLocale,
} from "~/i18n/config";

describe("locale configuration", () => {
  it("accepts supported locales and falls back safely", () => {
    expect(parseLocale("tr")).toBe("tr");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("de")).toBe(DEFAULT_LOCALE);
    expect(parseLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(LOCALE_COOKIE_NAME).toBe("olnk-locale");
  });
});
