"use client";

import type { ComponentProps } from "react";
import { useEffect } from "react";

function send(body: unknown) { void fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true }); }

export function trackPublicBlockClick(profileId: string, blockId: string) {
  send({ eventType: "BLOCK_CLICK", profileId, blockId });
}

export function AnalyticsBeacon({ profileId }: { profileId: string }) { useEffect(() => send({ eventType: "PROFILE_VIEW", profileId }), [profileId]); return null; }

export function PublicTrackedLink({ profileId, blockId, href, ...anchorProps }: { profileId: string; blockId: string; href: string } & Omit<ComponentProps<"a">, "href" | "onClick">) {
  const external = href.startsWith("http://") || href.startsWith("https://");
  return <a {...anchorProps} href={href} target={external ? "_blank" : anchorProps.target} rel={external ? "noopener noreferrer" : anchorProps.rel} onClick={() => trackPublicBlockClick(profileId, blockId)} />;
}
