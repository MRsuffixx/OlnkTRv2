import { ExternalLink, ImageIcon, ShieldAlert, Star } from "lucide-react";
import Image from "next/image";

import { cn } from "~/lib/cn";
import { basicSpacerHeight } from "~/lib/basic-block-rendering";
import {
  buttonMotionClass,
  buttonStyle,
  themeFontStack,
} from "~/lib/theme-rendering";
import type { ThemeConfig } from "~/server/publishing/snapshot";
import { safePreviewHref } from "../preview-url";

const supportedTypes = new Set([
  "LINK",
  "FEATURED_LINK",
  "BUTTON",
  "SPACER",
  "ADULT_LINK",
  "TEXT",
  "HEADING",
  "DIVIDER",
  "IMAGE",
  "SOCIALS",
]);

export function isBasicBlockType(type: string) {
  return supportedTypes.has(type);
}

export function spacerHeight(config: Record<string, unknown>) {
  return basicSpacerHeight(config);
}

export function BasicBlockPreview({
  type,
  config,
  theme,
  labels,
}: {
  type: string;
  config: Record<string, unknown>;
  theme: ThemeConfig;
  labels: {
    adult: string;
    featured: string;
    link: string;
    image: string;
    heading?: string;
    text?: string;
    social?: string;
  };
}) {
  if (type === "SPACER") {
    return (
      <div
        aria-hidden="true"
        data-block-preview="spacer"
        className="w-full shrink-0"
        style={{ height: spacerHeight(config) }}
      />
    );
  }
  if (type === "HEADING") {
    const Tag = config.level === 1 ? "h1" : config.level === 3 ? "h3" : "h2";
    return (
      <Tag
        data-block-preview="heading"
        className="w-full font-semibold"
        style={{
          fontFamily: themeFontStack(theme.typography.heading.family),
          fontSize: `${theme.typography.heading.scale * 0.18}px`,
          fontWeight: theme.typography.heading.weight,
          letterSpacing: `${theme.typography.heading.letterSpacing}em`,
        }}
      >
        {String(config.text ?? labels.heading ?? labels.link)}
      </Tag>
    );
  }
  if (type === "TEXT") {
    return (
      <div
        data-block-preview="text"
        className={cn(
          "w-full",
          config.alignment === "left" && "text-left",
          config.alignment === "center" && "text-center",
          config.alignment === "right" && "text-right",
        )}
      >
        {typeof config.title === "string" && config.title ? (
          <strong className="mb-1 block text-sm">{config.title}</strong>
        ) : null}
        <p className="whitespace-pre-wrap opacity-85">
          {String(config.text ?? labels.text ?? labels.link)}
        </p>
      </div>
    );
  }
  if (type === "DIVIDER") {
    if (config.style === "space") {
      return <div aria-hidden="true" className="h-5 w-full" />;
    }
    return (
      <hr
        data-block-preview="divider"
        className="border-current opacity-20"
        style={{
          width: `${Number(config.width ?? 100)}%`,
          borderTopStyle:
            config.style === "dashed"
              ? "dashed"
              : config.style === "dotted"
                ? "dotted"
                : "solid",
          borderTopWidth: Number(config.thickness ?? 1),
        }}
      />
    );
  }
  if (type === "IMAGE") {
    const assetId = typeof config.assetId === "string" ? config.assetId : null;
    const content = assetId ? (
      <Image
        src={`/api/media/${assetId}`}
        alt={config.decorative ? "" : String(config.alt ?? "")}
        width={960}
        height={540}
        unoptimized
        className="h-auto w-full object-cover"
      />
    ) : (
      <span className="flex aspect-video w-full items-center justify-center">
        <ImageIcon className="size-6 opacity-35" aria-label={labels.image} />
      </span>
    );
    return (
      <div
        data-block-preview="image"
        className="w-full overflow-hidden rounded-xl border border-current/15 bg-current/5"
      >
        {typeof config.href === "string" ? (
          <a
            href={safePreviewHref(config.href)}
            onClick={(event) => event.preventDefault()}
          >
            {content}
          </a>
        ) : (
          content
        )}
      </div>
    );
  }
  if (type === "SOCIALS") {
    const items = Array.isArray(config.items)
      ? (config.items as Array<Record<string, unknown>>)
      : [];
    return (
      <div data-block-preview="socials" className="flex w-full flex-wrap justify-center gap-2">
        {items.map((item, index) => (
          <a
            key={`${String(item.label)}-${index}`}
            href={safePreviewHref(item.url)}
            onClick={(event) => event.preventDefault()}
            className="rounded-full border border-current/20 px-3 py-1.5 text-xs"
          >
            {String(item.label ?? labels.social ?? labels.link)}
          </a>
        ))}
      </div>
    );
  }
  if (type === "FEATURED_LINK") {
    return (
      <div
        data-block-preview="featured-link"
        className="relative w-full overflow-hidden rounded-2xl border border-current/15 bg-current/8 p-5 text-left shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <span>
            <span className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase opacity-60">
              <Star className="size-3" /> {labels.featured}
            </span>
            <strong className="block text-base">{String(config.title ?? labels.link)}</strong>
            {typeof config.description === "string" && config.description ? (
              <span className="mt-1 block text-xs opacity-70">{config.description}</span>
            ) : null}
          </span>
          <ExternalLink className="size-4 shrink-0 opacity-55" />
        </div>
      </div>
    );
  }
  if (type === "ADULT_LINK") {
    return (
      <div
        data-block-preview="adult-link"
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-warning uppercase">
            <ShieldAlert className="size-3" /> {labels.adult}
          </span>
          <strong className="block truncate text-sm">{String(config.title ?? labels.link)}</strong>
          {typeof config.description === "string" && config.description ? (
            <span className="mt-0.5 block truncate text-xs opacity-65">{config.description}</span>
          ) : null}
        </span>
        <ExternalLink className="size-4 shrink-0 opacity-55" />
      </div>
    );
  }
  if (type === "LINK" || type === "BUTTON") {
    return (
      <a
        data-block-preview={type === "BUTTON" ? "button" : "link"}
        href={safePreviewHref(config.url)}
        onClick={(event) => event.preventDefault()}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 font-medium transition-[transform,filter,box-shadow,background-color] duration-200",
          buttonMotionClass(theme),
        )}
        style={buttonStyle(theme)}
      >
        <span className="min-w-0">
          <span className="block truncate">{String(config.title ?? labels.link)}</span>
          {typeof config.description === "string" && config.description ? (
            <span className="mt-0.5 block truncate text-xs opacity-65">{config.description}</span>
          ) : null}
        </span>
        <ExternalLink className="size-4 shrink-0 opacity-55" />
      </a>
    );
  }
  return null;
}
