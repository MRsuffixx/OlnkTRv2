import { describe, expect, it } from "vitest";

import {
  adultConsentKey,
  adultDestinationAttributes,
  getAdultConsentStorage,
  hasAdultConsent,
  rememberAdultConsent,
} from "~/features/public/adult-consent";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("adult link consent", () => {
  it("is versioned and isolated between profiles for the current session", () => {
    const storage = memoryStorage();
    expect(adultConsentKey("profile-a")).toBe(
      "olnk:adult-consent:v1:profile-a",
    );
    expect(hasAdultConsent(storage, "profile-a")).toBe(false);

    expect(rememberAdultConsent(storage, "profile-a")).toBe(true);
    expect(hasAdultConsent(storage, "profile-a")).toBe(true);
    expect(hasAdultConsent(storage, "profile-b")).toBe(false);
  });

  it("fails closed when session storage is unavailable", () => {
    const unavailable = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    expect(hasAdultConsent(unavailable, "profile-a")).toBe(false);
    expect(rememberAdultConsent(unavailable, "profile-a")).toBe(false);
    expect(
      getAdultConsentStorage(() => {
        throw new Error("SecurityError");
      }),
    ).toBeNull();
    expect(hasAdultConsent(null, "profile-a")).toBe(false);
    expect(rememberAdultConsent(null, "profile-a")).toBe(false);
  });

  it("uses privacy-preserving external navigation attributes", () => {
    expect(adultDestinationAttributes("https://example.com/adult")).toEqual({
      href: "https://example.com/adult",
      target: "_blank",
      rel: "nofollow noreferrer noopener",
      referrerPolicy: "no-referrer",
    });
  });
});
