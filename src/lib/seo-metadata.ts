import type { Metadata } from "next";

import { canonicalUrl } from "~/server/seo/policy";

export function marketingMetadata(input: {
  title: string;
  description: string;
  path: string;
  appUrl: string;
}): Metadata {
  const canonical = canonicalUrl(input.path, input.appUrl);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: "OlnkTR",
      url: canonical,
      title: input.title,
      description: input.description,
    },
    twitter: {
      card: "summary",
      title: input.title,
      description: input.description,
    },
  };
}

export function privateRouteMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false, noarchive: true },
  };
}
