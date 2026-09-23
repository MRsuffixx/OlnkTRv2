interface AdultConsentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function adultConsentKey(profileId: string) {
  return `olnk:adult-consent:v1:${profileId}`;
}

export function hasAdultConsent(
  storage: AdultConsentStorage,
  profileId: string,
) {
  try {
    return storage.getItem(adultConsentKey(profileId)) === "confirmed";
  } catch {
    return false;
  }
}

export function rememberAdultConsent(
  storage: AdultConsentStorage,
  profileId: string,
) {
  try {
    storage.setItem(adultConsentKey(profileId), "confirmed");
    return true;
  } catch {
    return false;
  }
}

export function adultDestinationAttributes(href: string) {
  return {
    href,
    target: "_blank" as const,
    rel: "nofollow noreferrer noopener",
    referrerPolicy: "no-referrer" as const,
  };
}
