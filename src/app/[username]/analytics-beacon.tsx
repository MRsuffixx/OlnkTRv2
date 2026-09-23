"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect } from "react";

function send(body: unknown) { void fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true }); }

export function trackPublicBlockClick(profileId: string, blockId: string) {
  send({ eventType: "BLOCK_CLICK", profileId, blockId });
}

export function AnalyticsBeacon({ profileId }: { profileId: string }) { useEffect(() => send({ eventType: "PROFILE_VIEW", profileId }), [profileId]); return null; }

export function PublicTrackedLink({ profileId, blockId, href, className, style, children, label }: { profileId: string; blockId: string; href: string; className?: string; style?: CSSProperties; children: ReactNode; label?: string }) {
  const external = href.startsWith("http://") || href.startsWith("https://");
  return <a href={href} aria-label={label} className={className} style={style} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} onClick={() => trackPublicBlockClick(profileId, blockId)}>{children}</a>;
}
