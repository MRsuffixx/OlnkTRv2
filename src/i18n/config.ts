export const SUPPORTED_LOCALES = ["en", "tr"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_COOKIE_NAME = "olnk-locale";

export function parseLocale(value: unknown): SupportedLocale {
  return typeof value === "string" &&
    SUPPORTED_LOCALES.some((locale) => locale === value)
    ? (value as SupportedLocale)
    : DEFAULT_LOCALE;
}
