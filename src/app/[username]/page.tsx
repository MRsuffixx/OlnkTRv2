import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PublicProfile } from "~/components/public/public-profile";
import { env } from "~/env";
import { cacheGet, cacheKeys, cacheSet } from "~/server/cache";
import { getPublicSnapshot } from "~/server/publishing/service";
import { parsePublicationSnapshot } from "~/server/publishing/snapshot";
import { normalizeUsername, usernameSchema } from "~/server/profile/username";

// Redis is the explicit cross-instance cache for published snapshots. Keep the
// route dynamic so a pre-publish 404 cannot outlive the publication transaction.
export const dynamic = "force-dynamic";

const load = cache(async (raw: string) => {
  const parsedUsername = usernameSchema.safeParse(normalizeUsername(raw));
  if (!parsedUsername.success) return null;
  const username = parsedUsername.data;
  const cached = await cacheGet<{ snapshot: unknown; profileId: string }>(cacheKeys.publicProfile(username));
  if (cached) return cached;
  const row = await getPublicSnapshot(username);
  if (!row) return null;
  const value = { snapshot: row.version.snapshot, profileId: row.page.profile.id };
  await cacheSet(cacheKeys.publicProfile(username), value, 300);
  return value;
});

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const row = await load(username);
  if (!row) return {};
  const snapshot = parsePublicationSnapshot(row.snapshot);
  const title = snapshot.page.title ?? snapshot.profile.displayName;
  const description = snapshot.page.description ?? snapshot.profile.bio ?? undefined;
  return { title, description, alternates: { canonical: `${env.APP_URL}/${snapshot.profile.username}` }, openGraph: { type: "profile", title, description, url: `${env.APP_URL}/${snapshot.profile.username}` }, robots: snapshot.page.visibility === "UNLISTED" ? { index: false, follow: false } : undefined };
}

export default async function PublicProfilePage({ params }: PageProps<"/[username]">) {
  const row = await load((await params).username);
  if (!row) notFound();
  const snapshot = parsePublicationSnapshot(row.snapshot);
  return <PublicProfile snapshot={snapshot} profileId={row.profileId} />;
}
