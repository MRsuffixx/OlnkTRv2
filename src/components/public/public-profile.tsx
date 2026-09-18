import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  AnalyticsBeacon,
  PublicTrackedLink,
} from "~/app/[username]/analytics-beacon";
import { cn } from "~/lib/cn";
import {
  avatarFrameStyle,
  avatarRadius,
  buttonMotionClass,
  buttonStyle,
  themeBackgroundStyle,
  themeFontStack,
  themeOverlayStyle,
} from "~/lib/theme-rendering";
import type { ThemeConfig } from "~/server/publishing/snapshot";

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
      <Tag
        className="mt-2 w-full text-lg"
        style={{
          fontFamily: themeFontStack(theme.typography.heading.family),
          fontWeight: theme.typography.heading.weight,
          letterSpacing: `${theme.typography.heading.letterSpacing}em`,
        }}
      >
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
        "group flex w-full items-center justify-between gap-3 px-4 text-left font-medium transition-[transform,filter,box-shadow,background-color] duration-200",
        buttonMotionClass(theme),
      )}
      style={buttonStyle(theme)}
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
  const avatarStyle = avatarFrameStyle(theme);
  const profileHorizontal = theme.layout.profileLayout === "left-card";

  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-theme-mode={theme.mode.strategy}
      data-vibe-layer={theme.effects.layer}
      className={cn(
        "relative min-h-dvh overflow-hidden",
        theme.background.type === "ANIMATED_GRADIENT" &&
          "animate-theme-gradient",
      )}
      style={{
        ...themeBackgroundStyle(theme),
        color: theme.colors.text,
        fontFamily: themeFontStack(theme.typography.body.family),
        fontWeight: theme.typography.body.weight,
        lineHeight: theme.typography.body.lineHeight,
        fontSize: `${theme.typography.body.scale}%`,
      }}
    >
      <AnalyticsBeacon profileId={profileId} />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={themeOverlayStyle(theme)}
      />
      {theme.effects.layer === "stars" || theme.effects.layer === "snow" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,currentColor_0_1px,transparent_1.5px)] bg-[size:28px_28px] opacity-25"
        />
      ) : null}
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh flex-col",
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
            "mb-2 flex w-full gap-4",
            profileHorizontal
              ? "items-center text-left"
              : "flex-col items-center text-center",
            theme.layout.profileLayout === "banner" &&
              "rounded-2xl border border-current/15 bg-current/5 p-5 backdrop-blur-sm",
          )}
        >
          <div style={avatarStyle} className="shrink-0">
            {profile.avatarUrl ? (
              <Image
                src={`/api/assets/${profile.avatarUrl}`}
                width={theme.avatar.size}
                height={theme.avatar.size}
                unoptimized
                alt=""
                className="size-full object-cover"
                style={{
                  borderRadius: avatarRadius(theme),
                  objectPosition: `${theme.avatar.cropX}% ${theme.avatar.cropY}%`,
                  transform: `scale(${theme.avatar.zoom})`,
                }}
              />
            ) : (
              <div
                className="flex size-full items-center justify-center bg-current/10 text-xl font-semibold"
                style={{ borderRadius: avatarRadius(theme) }}
              >
                {profile.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1
              className="text-xl"
              style={{
                fontFamily: themeFontStack(theme.typography.heading.family),
                fontWeight: theme.typography.heading.weight,
                letterSpacing: `${theme.typography.heading.letterSpacing}em`,
              }}
            >
              {profile.displayName}
            </h1>
            {profile.bio ? (
              <p
                className="mt-1 max-w-md text-sm"
                style={{ color: theme.colors.mutedText }}
              >
                {profile.bio}
              </p>
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
        {theme.branding.visible ? (
          <footer className="mt-auto pt-10 text-[11px] opacity-45">
            <Link href="/" className="transition-opacity hover:opacity-80">
              OlnkTR
            </Link>
          </footer>
        ) : null}
      </div>
    </main>
  );
}
