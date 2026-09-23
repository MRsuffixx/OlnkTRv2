import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PublicProfile } from "~/components/public/public-profile";
import { env } from "~/env";
import { cacheGet, cacheKeys, cacheSet } from "~/server/cache";
import { getPublicSnapshot } from "~/server/publishing/service";
import { parsePublicationSnapshot } from "~/server/publishing/snapshot";
import {
  adultRatingMetadata,
  canonicalUrl,
  isPublishedSnapshotIndexable,
} from "~/server/seo/policy";
import { normalizeUsername, usernameSchema } from "~/server/profile/username";

// Redis is the explicit cross-instance cache for published snapshots. Keep the
// route dynamic so a pre-publish 404 cannot outlive the publication transaction.
export const dynamic = "force-dynamic";

const load = cache(async (raw: string) => {
  const parsedUsername = usernameSchema.safeParse(normalizeUsername(raw));
  if (!parsedUsername.success) return null;
  const username = parsedUsername.data;
  const cached = await cacheGet<{
    snapshot: unknown;
    profileId: string;
    visibility?: "PUBLIC" | "UNLISTED" | "PRIVATE";
  }>(cacheKeys.publicProfile(username));
  if (cached?.visibility) return { ...cached, visibility: cached.visibility };
  const row = await getPublicSnapshot(username);
  if (!row) return null;
  const value = {
    snapshot: row.version.snapshot,
    profileId: row.page.profile.id,
    visibility: row.page.visibility,
  };
  await cacheSet(cacheKeys.publicProfile(username), value, 300);
  return value;
});

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const row = await load(username);
  if (!row) return { robots: { index: false, follow: false } };
  const snapshot = parsePublicationSnapshot(row.snapshot);
  const title =
    snapshot.seo.title ?? snapshot.page.title ?? snapshot.profile.displayName;
  const description =
    snapshot.seo.description ??
    snapshot.page.description ??
    snapshot.profile.bio ??
    undefined;
  const canonical = canonicalUrl(`/${normalizeUsername(username)}`, env.APP_URL);
  const image = snapshot.seo.ogImageAssetId
    ? canonicalUrl(`/api/assets/${snapshot.seo.ogImageAssetId}`, env.APP_URL)
    : undefined;
  const indexable = isPublishedSnapshotIndexable(snapshot, row.visibility);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "profile",
      siteName: "OlnkTR",
      title,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: {
      index: indexable,
      follow: indexable,
      noarchive: !indexable,
    },
    other: adultRatingMetadata(snapshot),
  };
}

export default async function PublicProfilePage({ params }: PageProps<"/[username]">) {
  const row = await load((await params).username);
  if (!row) notFound();
  const snapshot = parsePublicationSnapshot(row.snapshot);
  return <PublicProfile snapshot={snapshot} profileId={row.profileId} />;
}
