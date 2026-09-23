import { ArrowUpRight, BadgeCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

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
  themeFontStack,
  themeOverlayStyle,
} from "~/lib/theme-rendering";
import type { ThemeConfig } from "~/server/publishing/snapshot";
import { ThemeMediaBackground } from "./theme-media-background";
import { CountdownBlock } from "~/features/public/countdown-block";
import { DiscordPresenceBlock } from "~/features/public/discord-presence-block";
import { ExternalWidgetBlock } from "~/features/public/external-widget-block";
import { PollBlock } from "~/features/public/poll-block";
import { VisitorCounterBlock } from "~/features/public/visitor-counter-block";
import { ThemeModeSurface } from "~/features/public/theme-mode-surface";
import { VibeLayer } from "~/features/public/vibe-layer";
import {
  isPublicBasicBlockType,
  PublicBasicBlock,
} from "~/features/public/basic-block";
import type { AdultLinkLabels } from "~/features/public/adult-link-block";

interface PublicSnapshot {
  profile: {
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    verified?: boolean;
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
  adultLabels,
}: {
  block: PublicSnapshot["blocks"][number];
  profileId: string;
  theme: ThemeConfig;
  adultLabels: AdultLinkLabels;
}) {
  const config = block.config as Record<string, unknown>;
  if (isPublicBasicBlockType(block.type)) {
    return (
      <PublicBasicBlock
        block={block}
        profileId={profileId}
        theme={theme}
        adultLabels={adultLabels}
      />
    );
  }
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
  if (block.type === "HIGHLIGHT") {
    const content = (
      <span className="block">
        <strong className="block text-sm">{String(config.title)}</strong>
        {typeof config.text === "string" && config.text ? (
          <span className="mt-1 block text-xs opacity-75">{config.text}</span>
        ) : null}
      </span>
    );
    const className =
      "w-full rounded-2xl border border-current/15 bg-current/8 p-4 text-left backdrop-blur-sm transition-transform hover:scale-[1.01]";
    return typeof config.href === "string" ? (
      <PublicTrackedLink
        profileId={profileId}
        blockId={block.id}
        href={config.href}
        className={className}
      >
        {content}
      </PublicTrackedLink>
    ) : (
      <aside className={className}>{content}</aside>
    );
  }
  if (block.type === "COUNTDOWN") {
    return (
      <CountdownBlock
        title={String(config.title)}
        targetAt={String(config.targetAt)}
        expiredLabel={String(config.expiredLabel)}
      />
    );
  }
  if (block.type === "VISITOR_COUNTER") {
    return (
      <VisitorCounterBlock
        profileId={profileId}
        label={String(config.label)}
        period={config.period === "daily" ? "daily" : "total"}
      />
    );
  }
  if (block.type === "SUPPORT") {
    const provider = String(config.provider);
    const body = (
      <span className="block">
        <strong className="block">{String(config.title)}</strong>
        {typeof config.description === "string" && config.description ? (
          <span className="mt-1 block text-xs opacity-70">
            {config.description}
          </span>
        ) : null}
        {provider === "iban" && typeof config.iban === "string" ? (
          <span className="mt-2 block font-mono text-xs tracking-wide">
            {config.iban}
          </span>
        ) : null}
      </span>
    );
    return typeof config.href === "string" ? (
      <PublicTrackedLink
        profileId={profileId}
        blockId={block.id}
        href={config.href}
        className="w-full px-4 py-3 text-left"
        style={buttonStyle(theme)}
      >
        {body}
      </PublicTrackedLink>
    ) : (
      <aside
        className="w-full px-4 py-3 text-left"
        style={buttonStyle(theme)}
      >
        {body}
      </aside>
    );
  }
  if (block.type === "POLL") {
    return (
      <PollBlock
        blockId={block.id}
        question={String(config.question)}
        options={
          Array.isArray(config.options)
            ? (config.options as Array<{ key: string; label: string }>)
            : []
        }
      />
    );
  }
  if (block.type === "DISCORD") {
    return (
      <DiscordPresenceBlock
        discordUserId={String(config.discordUserId)}
        showSpotify={config.showSpotify === true}
        showActivity={config.showActivity === true}
      />
    );
  }
  if (
    block.type === "GITHUB" ||
    block.type === "SPOTIFY" ||
    block.type === "YOUTUBE" ||
    block.type === "TWITCH"
  ) {
    return <ExternalWidgetBlock blockId={block.id} provider={block.type} />;
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
  const t = useTranslations("publicProfile");
  const { theme, profile } = snapshot;
  const adultLabels: AdultLinkLabels = {
    badge: t("adultBadge"),
    dialogTitle: t("adultDialogTitle"),
    dialogDescription: t("adultDialogDescription"),
    confirmation: t("adultConfirmation"),
    cancel: t("adultCancel"),
    continue: t("adultContinue"),
  };
  const avatarStyle = avatarFrameStyle(theme);
  const profileHorizontal = theme.layout.profileLayout === "left-card";
  const socialBlocks = snapshot.blocks.filter(
    (block) => block.type === "SOCIALS",
  );
  const contentBlocks = snapshot.blocks.filter(
    (block) => block.type !== "SOCIALS",
  );
  const renderSocials = (placement: ThemeConfig["layout"]["socialPlacement"]) =>
    theme.layout.socialPlacement === placement
      ? socialBlocks.map((block) => (
          <PublicBlock
            key={block.id}
            block={block}
            profileId={profileId}
            theme={theme}
            adultLabels={adultLabels}
          />
        ))
      : null;

  return (
    <ThemeModeSurface
      element="main"
      theme={theme}
      id="main-content"
      tabIndex={-1}
      className={cn(
        "relative min-h-dvh overflow-hidden",
        theme.background.type === "ANIMATED_GRADIENT" &&
          "animate-theme-gradient",
      )}
      style={{
        fontFamily: themeFontStack(theme.typography.body.family),
        fontWeight: theme.typography.body.weight,
        lineHeight: theme.typography.body.lineHeight,
        fontSize: `${theme.typography.body.scale}%`,
      }}
    >
      <AnalyticsBeacon profileId={profileId} />
      <ThemeMediaBackground theme={theme} assetBase="/api/assets" />
      <VibeLayer theme={theme} />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={themeOverlayStyle(theme)}
      />
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
          <div style={avatarStyle} className="shrink-0 overflow-hidden">
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
            <span className="inline-flex items-center gap-1.5">
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
              {profile.verified ? (
                <BadgeCheck
                  aria-label="Verified account"
                  className="size-5 fill-current text-current"
                />
              ) : null}
            </span>
            {profile.bio ? (
              <p
                className="mt-1 max-w-md text-sm"
                    style={{ color: "var(--olnk-page-muted)" }}
              >
                {profile.bio}
              </p>
            ) : null}
          </div>
        </header>
        {renderSocials("top")}
        {contentBlocks.map((block) => (
          <PublicBlock
            key={block.id}
            block={block}
            profileId={profileId}
            theme={theme}
            adultLabels={adultLabels}
          />
        ))}
        {renderSocials("bottom")}
        {theme.branding.visible ? (
          <footer className="mt-auto pt-10 text-[11px] opacity-45">
            <Link href="/" className="transition-opacity hover:opacity-80">
              OlnkTR
            </Link>
          </footer>
        ) : null}
      </div>
      {theme.layout.socialPlacement === "fixed-footer" && socialBlocks.length ? (
        <div className="fixed inset-x-0 bottom-4 z-10 mx-auto flex w-fit max-w-[calc(100%-2rem)] rounded-full border border-current/15 bg-black/10 px-3 py-2 shadow-lg backdrop-blur-xl">
          {renderSocials("fixed-footer")}
        </div>
      ) : null}
    </ThemeModeSurface>
  );
}
