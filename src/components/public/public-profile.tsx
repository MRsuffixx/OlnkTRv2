import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "~/lib/cn";
import type { ThemeConfig } from "~/server/publishing/snapshot";
import {
  AnalyticsBeacon,
  PublicTrackedLink,
} from "~/app/[username]/analytics-beacon";

interface PublicSnapshot {
  profile: {
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
  };
  page: {
    title: string | null;
    description: string | null;
    visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  };
  theme: ThemeConfig;
  blocks: Array<{ id: string; type: string; config: unknown }>;
}

function buttonAppearance(theme: ThemeConfig) {
  const radius =
    theme.buttons.shape === "pill"
      ? 999
      : theme.buttons.shape === "square"
        ? 5
        : 14;
  const shadow =
    theme.buttons.shadow === "strong"
      ? "0 12px 28px rgb(0 0 0 / .18)"
      : theme.buttons.shadow === "soft"
        ? "0 5px 16px rgb(0 0 0 / .1)"
        : "none";
  return {
    minHeight: theme.buttons.height,
    borderRadius: radius,
    boxShadow: shadow,
  };
}

function PublicBlock({
  block,
  profileId,
  theme,
}: {
  block: PublicSnapshot["blocks"][number];
  profileId: string;
  theme: ThemeConfig;
}) {
  const config = block.config as Record<string, unknown>;
  if (block.type === "HEADING") {
    const Tag = config.level === 1 ? "h1" : config.level === 3 ? "h3" : "h2";
    return (
      <Tag className="mt-2 w-full text-lg font-semibold tracking-[-0.02em]">
        {String(config.text)}
      </Tag>
    );
  }
  if (block.type === "TEXT")
    return (
      <p className="w-full whitespace-pre-wrap text-sm opacity-80">
        {String(config.text)}
      </p>
    );
  if (block.type === "DIVIDER")
    return <hr className="my-2 w-full border-current opacity-20" />;
  if (block.type === "IMAGE") {
    const image = (
      <Image
        src={`/api/assets/${String(config.assetId)}`}
        alt={String(config.alt ?? "")}
        width={1200}
        height={800}
        unoptimized
        className="h-auto w-full rounded-[inherit] object-cover"
      />
    );
    return typeof config.href === "string" ? (
      <PublicTrackedLink
        profileId={profileId}
        blockId={block.id}
        href={config.href}
        className="block w-full overflow-hidden rounded-xl"
      >
        {image}
      </PublicTrackedLink>
    ) : (
      <div className="w-full overflow-hidden rounded-xl">{image}</div>
    );
  }
  if (block.type === "SOCIALS") {
    const items = Array.isArray(config.items)
      ? (config.items as Array<{ label: string; url: string }>)
      : [];
    return (
      <div className="flex w-full flex-wrap justify-center gap-2">
        {items.map((item) => (
          <PublicTrackedLink
            key={`${block.id}-${item.label}`}
            profileId={profileId}
            blockId={block.id}
            href={item.url}
            className="rounded-full border border-current/20 px-3 py-1.5 text-xs font-medium transition-[transform,opacity] hover:-translate-y-0.5 hover:opacity-80"
          >
            {item.label}
          </PublicTrackedLink>
        ))}
      </div>
    );
  }
  if (block.type !== "LINK") return null;
  return (
    <PublicTrackedLink
      profileId={profileId}
      blockId={block.id}
      href={String(config.url)}
      className={cn(
        "group flex w-full items-center justify-between gap-3 px-4 text-left font-medium transition-[transform,opacity,box-shadow] hover:-translate-y-0.5",
        theme.buttons.style === "outline" &&
          "border-2 border-current bg-transparent",
        theme.buttons.style === "soft" && "bg-current/10",
        theme.buttons.style === "minimal" &&
          "border-b border-current/25 bg-transparent",
        theme.buttons.style === "fill" && "bg-current/12",
      )}
      style={buttonAppearance(theme)}
    >
      <span className="min-w-0">
        <span className="block truncate">{String(config.title)}</span>
        {typeof config.description === "string" && config.description ? (
          <span className="mt-0.5 block truncate text-xs opacity-65">
            {config.description}
          </span>
        ) : null}
      </span>
      <ArrowUpRight className="size-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </PublicTrackedLink>
  );
}

export function PublicProfile({
  snapshot,
  profileId,
}: {
  snapshot: PublicSnapshot;
  profileId: string;
}) {
  const { theme, profile } = snapshot;
  const background =
    theme.background.type === "GRADIENT"
      ? `linear-gradient(${theme.background.angle}deg, ${theme.background.from}, ${theme.background.to})`
      : theme.colors.background;
  const fontFamily =
    theme.typography.family === "serif"
      ? "ui-serif, Georgia, serif"
      : theme.typography.family === "mono"
        ? "ui-monospace, monospace"
        : "var(--font-geist-sans), sans-serif";
  const fontWeight =
    theme.typography.weight === "regular"
      ? 400
      : theme.typography.weight === "semibold"
        ? 600
        : 500;
  const avatarRadius =
    theme.layout.avatarShape === "circle"
      ? "999px"
      : theme.layout.avatarShape === "square"
        ? "8px"
        : "20px";
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-dvh"
      style={{
        background,
        color: theme.colors.text,
        fontFamily,
        fontWeight,
        lineHeight: theme.typography.lineHeight,
        fontSize: `${theme.typography.scale}%`,
      }}
    >
      <AnalyticsBeacon profileId={profileId} />
      <div
        className={cn(
          "mx-auto flex min-h-dvh flex-col",
          theme.layout.alignment === "center"
            ? "items-center text-center"
            : "items-start text-left",
        )}
        style={{
          maxWidth: theme.layout.maxWidth,
          gap: theme.layout.blockGap,
          padding: theme.layout.pagePadding,
        }}
      >
        <header
          className={cn(
            "mb-2 flex w-full flex-col gap-3",
            theme.layout.alignment === "center"
              ? "items-center text-center"
              : "items-start text-left",
          )}
        >
          {profile.avatarUrl ? (
            <Image
              src={`/api/assets/${profile.avatarUrl}`}
              width={88}
              height={88}
              unoptimized
              alt=""
              className="size-20 object-cover"
              style={{ borderRadius: avatarRadius }}
            />
          ) : (
            <div
              className="flex size-20 items-center justify-center border border-current/15 bg-current/10 text-xl font-semibold"
              style={{ borderRadius: avatarRadius }}
            >
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.025em]">
              {profile.displayName}
            </h1>
            {profile.bio ? (
              <p className="mt-1 max-w-md text-sm opacity-70">{profile.bio}</p>
            ) : null}
          </div>
        </header>
        {snapshot.blocks.map((block) => (
          <PublicBlock
            key={block.id}
            block={block}
            profileId={profileId}
            theme={theme}
          />
        ))}
        <footer className="mt-auto pt-10 text-[11px] opacity-45">
          <Link href="/" className="transition-opacity hover:opacity-80">
            OlnkTR
          </Link>
        </footer>
      </div>
    </main>
  );
}
