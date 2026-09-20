import { z } from "zod";

import { env } from "~/env";
import { fetchIntegrationJson } from "../http";

const eventSchema = z.array(
  z.object({
    id: z.string(),
    type: z.string(),
    repo: z.object({ name: z.string() }),
    created_at: z.string(),
  }).passthrough(),
);

export function normalizeGithubEvents(value: unknown) {
  return eventSchema.parse(value).slice(0, 5).map((event) => ({
    id: event.id,
    type: event.type,
    repository: event.repo.name,
    createdAt: event.created_at,
  }));
}

export async function getGithubWidget(username: string) {
  const url = new URL(
    `https://api.github.com/users/${encodeURIComponent(username)}/events/public`,
  );
  url.searchParams.set("per_page", "5");
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
  };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  return {
    kind: "github" as const,
    username,
    href: `https://github.com/${username}`,
    events: normalizeGithubEvents(
      await fetchIntegrationJson(url, { headers }),
    ),
  };
}
