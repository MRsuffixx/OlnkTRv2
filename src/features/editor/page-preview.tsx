"use client";

import { BadgeCheck, ExternalLink, ImageIcon, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { cn } from "~/lib/cn";
import { ThemeMediaBackground } from "~/components/public/theme-media-background";
import {
  avatarFrameStyle,
  avatarRadius,
  buttonMotionClass,
  buttonStyle,
  themeFontStack,
  themeOverlayStyle,
} from "~/lib/theme-rendering";
import { ThemeModeSurface } from "~/features/public/theme-mode-surface";
import { VibeLayer } from "~/features/public/vibe-layer";
import type {
  EditorBlock,
  EditorDocument,
  PreviewDevice,
} from "./editor-reducer";
import { safePreviewHref } from "./preview-url";

const widths: Record<PreviewDevice, string> = {
  mobile: "w-[375px]",
  tablet: "w-[680px]",
  desktop: "w-[960px]",
};

function PreviewBlock({
  block,
  document,
  labels,
}: {
  block: EditorBlock;
  document: EditorDocument;
  labels: {
    heading: string;
    text: string;
    social: string;
    link: string;
    visitors: string;
    option: string;
    livePresence: string;
    liveContent: string;
  };
}) {
  if (!block.enabled) return null;
  const config =
    block.config && typeof block.config === "object"
      ? (block.config as Record<string, unknown>)
      : {};
  const theme = document.theme;
  if (block.type === "HEADING") {
    const Tag = config.level === 1 ? "h1" : config.level === 3 ? "h3" : "h2";
    return (
      <Tag
        className="w-full font-semibold"
        style={{
          fontFamily: themeFontStack(theme.typography.heading.family),
          fontSize: `${theme.typography.heading.scale * 0.18}px`,
          fontWeight: theme.typography.heading.weight,
          letterSpacing: `${theme.typography.heading.letterSpacing}em`,
        }}
      >
        {String(config.text ?? labels.heading)}
      </Tag>
    );
  }
  if (block.type === "TEXT")
    return (
      <p className="w-full whitespace-pre-wrap opacity-85">
        {String(config.text ?? labels.text)}
      </p>
    );
  if (block.type === "DIVIDER")
    return <hr className="w-full border-current opacity-20" />;
  if (block.type === "IMAGE")
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-current/15 bg-current/5">
        <ImageIcon className="size-6 opacity-35" />
      </div>
    );
  if (block.type === "SOCIALS") {
    const items = Array.isArray(config.items) ? config.items : [];
    return (
      <div className="flex w-full flex-wrap justify-center gap-2">
        {items.map((item, index) => {
          const social = item as Record<string, unknown>;
          return (
            <a
              key={index}
              href={safePreviewHref(social.url)}
              onClick={(event) => event.preventDefault()}
              className="rounded-full border border-current/20 px-3 py-1.5 text-xs"
            >
              {String(social.label ?? labels.social)}
            </a>
          );
        })}
      </div>
    );
  }
  if (block.type === "HIGHLIGHT") {
    return <aside className="w-full rounded-2xl border border-current/15 bg-current/8 p-4 text-left"><strong className="block text-sm">{String(config.title ?? labels.heading)}</strong>{config.text ? <span className="mt-1 block text-xs opacity-75">{String(config.text)}</span>:null}</aside>;
  }
  if (block.type === "COUNTDOWN") {
    return <section className="w-full rounded-2xl border border-current/15 bg-current/5 p-4"><p className="text-sm font-semibold">{String(config.title ?? labels.heading)}</p><div className="mt-3 grid grid-cols-4 gap-2">{["07d","12h","34m","56s"].map(value=><span key={value} className="rounded-xl bg-current/8 px-2 py-2 text-center text-sm font-semibold tabular-nums">{value}</span>)}</div></section>;
  }
  if (block.type === "VISITOR_COUNTER") {
    return <div className="inline-flex items-center gap-2 rounded-full border border-current/15 bg-current/5 px-3 py-1.5 text-xs"><span className="size-2 rounded-full bg-current opacity-60"/>{String(config.label ?? labels.visitors)} <strong>—</strong></div>;
  }
  if (block.type === "SUPPORT") {
    return <aside className="w-full px-4 py-3 text-left" style={buttonStyle(theme)}><strong className="block">{String(config.title ?? labels.link)}</strong>{config.description?<span className="mt-1 block text-xs opacity-70">{String(config.description)}</span>:null}</aside>;
  }
  if (block.type === "POLL") {
    const options=Array.isArray(config.options)?config.options:[];
    return <section className="w-full rounded-2xl border border-current/15 bg-current/5 p-4 text-left"><p className="font-semibold">{String(config.question ?? labels.heading)}</p><div className="mt-3 grid gap-2">{options.map((item,index)=>{const option=item as Record<string,unknown>;return <span key={index} className="rounded-xl border border-current/15 px-3 py-2 text-sm">{String(option.label ?? labels.option)}</span>;})}</div></section>;
  }
  if (["DISCORD","GITHUB","SPOTIFY","YOUTUBE","TWITCH"].includes(block.type)) {
    return <section className="w-full rounded-2xl border border-current/15 bg-current/5 p-4 text-left"><span className="text-[10px] font-semibold tracking-wider uppercase opacity-55">{block.type}</span><p className="mt-1 text-sm font-semibold">{block.type === "DISCORD"?labels.livePresence:block.type === "GITHUB"?`@${String(config.username ?? "—")}`:block.type === "TWITCH"?String(config.channel ?? "—"):labels.liveContent}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-current/10"><div className="h-full w-2/3 rounded-full bg-current/40"/></div></section>;
  }
  if (block.type !== "LINK") return null;
  return (
    <a
      href={safePreviewHref(config.url)}
      onClick={(event) => event.preventDefault()}
      className={cn(
        "flex w-full items-center justify-between gap-3 px-4 font-medium transition-[transform,filter,box-shadow,background-color] duration-200",
        buttonMotionClass(theme),
      )}
      style={buttonStyle(theme)}
    >
      <span className="min-w-0">
        <span className="block truncate">
          {String(config.title ?? labels.link)}
        </span>
        {typeof config.description === "string" && config.description ? (
          <span className="mt-0.5 block truncate text-xs opacity-65">
            {config.description}
          </span>
        ) : null}
      </span>
      <ExternalLink className="size-4 shrink-0 opacity-55" />
    </a>
  );
}

export function PagePreview({
  document,
  profile,
  device,
  zoom,
}: {
  document: EditorDocument;
  profile: {
    displayName: string;
    bio: string | null;
    avatarAssetId: string | null;
    verified: boolean;
  };
  device: PreviewDevice;
  zoom: number;
}) {
  const t = useTranslations("editor");
  const theme = document.theme;
  const profileHorizontal = theme.layout.profileLayout === "left-card";
  const animated = theme.background.type === "ANIMATED_GRADIENT";
  const avatarStyle = avatarFrameStyle(theme);

  return (
    <div className="flex min-h-full min-w-full items-start justify-center overflow-auto bg-muted/45 p-5 sm:p-8">
      <div
        className={cn(
          "min-h-[720px] max-w-full shrink-0 overflow-hidden rounded-[22px] border border-border-strong/35 shadow-floating transition-[width] duration-200 ease-product",
          widths[device],
        )}
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top center",
        }}
      >
        <ThemeModeSurface
          theme={theme}
          className={cn(
            "relative min-h-[720px] overflow-hidden",
            animated && "animate-theme-gradient",
          )}
          style={{
            fontFamily: themeFontStack(theme.typography.body.family),
            fontWeight: theme.typography.body.weight,
            fontSize: `${theme.typography.body.scale}%`,
            lineHeight: theme.typography.body.lineHeight,
          }}
        >
          <ThemeMediaBackground theme={theme} assetBase="/api/media" />
          <VibeLayer theme={theme} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={themeOverlayStyle(theme)}
          />
          <div
            className={cn(
              "relative mx-auto flex min-h-[720px] flex-col",
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
            <div
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
                {profile.avatarAssetId ? (
                  <Image
                    src={`/api/media/${profile.avatarAssetId}`}
                    alt=""
                    width={theme.avatar.size}
                    height={theme.avatar.size}
                    unoptimized
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
                      fontFamily: themeFontStack(
                        theme.typography.heading.family,
                      ),
                      fontWeight: theme.typography.heading.weight,
                      letterSpacing: `${theme.typography.heading.letterSpacing}em`,
                    }}
                  >
                    {profile.displayName}
                  </h1>
                  {profile.verified ? (
                    <BadgeCheck className="size-5 fill-current" />
                  ) : null}
                </span>
                {profile.bio ? (
                  <p
                    className="mt-1 max-w-sm text-sm"
                    style={{ color: "var(--olnk-page-muted)" }}
                  >
                    {profile.bio}
                  </p>
                ) : null}
              </div>
            </div>
            {document.blocks.map((block) => (
              <PreviewBlock
                key={block.id}
                block={block}
                document={document}
                labels={{
                  heading: t("blockHeading"),
                  text: t("blockText"),
                  social: t("blockSocials"),
                  link: t("blockLink"),
                  visitors: t("blockVisitorCounter"),
                  option: t("pollOption"),
                  livePresence: t("livePresencePreview"),
                  liveContent: t("liveContentPreview"),
                }}
              />
            ))}
            {theme.branding.visible ? (
              <div className="mt-auto flex items-center gap-1 pt-8 text-[10px] opacity-45">
                <Sparkles className="size-3" /> OlnkTR
              </div>
            ) : null}
          </div>
        </ThemeModeSurface>
      </div>
    </div>
  );
}
