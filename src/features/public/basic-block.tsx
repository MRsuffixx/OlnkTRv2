import {
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  Heart,
  LinkIcon,
  MessageCircle,
  Play,
  ShoppingBag,
  Star,
} from "lucide-react";
import Image from "next/image";

import { PublicTrackedLink } from "~/app/[username]/analytics-beacon";
import { basicSpacerHeight } from "~/lib/basic-block-rendering";
import { cn } from "~/lib/cn";
import {
  buttonMotionClass,
  buttonStyle,
  themeFontStack,
} from "~/lib/theme-rendering";
import type { ThemeConfig } from "~/server/publishing/snapshot";
import { AdultLinkBlock, type AdultLinkLabels } from "./adult-link-block";

const basicTypes = new Set([
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

const defaultAdultLabels: AdultLinkLabels = {
  badge: "18+",
  dialogTitle: "Before you continue",
  dialogDescription: "This link leads to an external site with adult content.",
  confirmation: "I confirm that I am at least 18 years old.",
  cancel: "Go back",
  continue: "Continue to external site",
};

export function isPublicBasicBlockType(type: string) {
  return basicTypes.has(type);
}

function BlockIcon({ name }: { name: unknown }) {
  const className = "size-4 shrink-0 opacity-70";
  switch (name) {
    case "star":
      return <Star aria-hidden="true" className={className} />;
    case "heart":
      return <Heart aria-hidden="true" className={className} />;
    case "play":
      return <Play aria-hidden="true" className={className} />;
    case "shopping-bag":
      return <ShoppingBag aria-hidden="true" className={className} />;
    case "calendar":
      return <CalendarDays aria-hidden="true" className={className} />;
    case "message-circle":
      return <MessageCircle aria-hidden="true" className={className} />;
    case "external-link":
      return <ExternalLink aria-hidden="true" className={className} />;
    default:
      return name ? (
        <LinkIcon aria-hidden="true" className={className} />
      ) : null;
  }
}

function customButtonStyle(config: Record<string, unknown>) {
  if (config.useGlobalStyle !== false) return undefined;
  if (config.style === "outline") {
    return {
      background: "transparent",
      color: "var(--olnk-page-text)",
      border: "1px solid var(--olnk-page-border)",
    };
  }
  if (config.style === "soft") {
    return {
      background:
        "color-mix(in srgb, var(--olnk-page-button) 15%, transparent)",
      color: "var(--olnk-page-text)",
      border: "1px solid transparent",
    };
  }
  if (config.style === "minimal") {
    return {
      background: "transparent",
      color: "var(--olnk-page-text)",
      border: "1px solid transparent",
    };
  }
  return {
    background: "var(--olnk-page-button)",
    color: "var(--olnk-page-button-text)",
    border: "1px solid transparent",
  };
}

interface PublicBasicBlockProps {
  block: { id: string; type: string; config: unknown };
  profileId: string;
  theme: ThemeConfig;
  adultLabels?: AdultLinkLabels;
}

export function PublicBasicBlock({
  block,
  profileId,
  theme,
  adultLabels = defaultAdultLabels,
}: PublicBasicBlockProps) {
  const config = block.config as Record<string, unknown>;

  if (block.type === "SPACER") {
    return (
      <div
        aria-hidden="true"
        className="w-full shrink-0"
        style={{ height: basicSpacerHeight(config) }}
      />
    );
  }
  if (block.type === "HEADING") {
    const Tag = config.level === 1 ? "h1" : config.level === 3 ? "h3" : "h2";
    return (
      <Tag
        className="w-full text-lg"
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
  if (block.type === "TEXT") {
    return (
      <section
        className={cn(
          "w-full",
          config.alignment === "left" && "text-left",
          config.alignment === "center" && "text-center",
          config.alignment === "right" && "text-right",
        )}
      >
        {typeof config.title === "string" && config.title ? (
          <h2 className="mb-1 font-semibold">{config.title}</h2>
        ) : null}
        <p className="whitespace-pre-wrap text-sm opacity-80">
          {String(config.text)}
        </p>
      </section>
    );
  }
  if (block.type === "DIVIDER") {
    if (config.style === "space") {
      return <div aria-hidden="true" className="h-5 w-full" />;
    }
    return (
      <hr
        className="my-2 border-current opacity-20"
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
  if (block.type === "IMAGE") {
    const image = (
      <Image
        src={`/api/assets/${String(config.assetId)}`}
        alt={config.decorative ? "" : String(config.alt ?? "")}
        width={1200}
        height={800}
        unoptimized
        className="h-auto w-full object-cover"
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
        {items.map((item, index) => (
          <PublicTrackedLink
            key={`${block.id}-${item.label}-${index}`}
            profileId={profileId}
            blockId={block.id}
            href={item.url}
            label={item.label}
            className="rounded-full border border-current/20 px-3 py-1.5 text-xs font-medium transition-[transform,opacity] hover:-translate-y-0.5 hover:opacity-80"
          >
            {item.label}
          </PublicTrackedLink>
        ))}
      </div>
    );
  }
  if (block.type === "ADULT_LINK") {
    return (
      <AdultLinkBlock
        profileId={profileId}
        blockId={block.id}
        title={String(config.title)}
        url={String(config.url)}
        description={
          typeof config.description === "string" ? config.description : undefined
        }
        platformLabel={
          typeof config.platformLabel === "string"
            ? config.platformLabel
            : undefined
        }
        labels={adultLabels}
        className={buttonMotionClass(theme)}
        style={buttonStyle(theme)}
      />
    );
  }
  if (block.type === "FEATURED_LINK") {
    return (
      <PublicTrackedLink
        profileId={profileId}
        blockId={block.id}
        href={String(config.url)}
        className="group relative block w-full overflow-hidden rounded-2xl border border-current/15 bg-current/8 p-5 text-left shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md"
      >
        {typeof config.assetId === "string" ? (
          <Image
            src={`/api/assets/${config.assetId}`}
            alt=""
            width={960}
            height={540}
            unoptimized
            className="mb-4 aspect-video w-full rounded-xl object-cover"
          />
        ) : null}
        <span className="flex items-start justify-between gap-4">
          <span className="min-w-0">
            <span className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase opacity-60">
              <Star aria-hidden="true" className="size-3" /> Featured
            </span>
            <strong className="flex items-center gap-2 text-base">
              <BlockIcon name={config.icon} />
              {String(config.title)}
            </strong>
            {typeof config.description === "string" && config.description ? (
              <span className="mt-1 block text-xs opacity-70">
                {config.description}
              </span>
            ) : null}
          </span>
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 shrink-0 opacity-55 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </PublicTrackedLink>
    );
  }
  if (block.type !== "LINK" && block.type !== "BUTTON") return null;

  const override = block.type === "BUTTON" ? customButtonStyle(config) : undefined;
  return (
    <PublicTrackedLink
      profileId={profileId}
      blockId={block.id}
      href={String(config.url)}
      className={cn(
        "group flex w-full items-center justify-between gap-3 px-4 text-left font-medium transition-[transform,filter,box-shadow,background-color] duration-200",
        buttonMotionClass(theme),
      )}
      style={{ ...buttonStyle(theme), ...override }}
    >
      <span className="flex min-w-0 items-center gap-3">
        <BlockIcon name={config.icon} />
        <span className="min-w-0">
          <span className="block truncate">{String(config.title)}</span>
          {typeof config.description === "string" && config.description ? (
            <span className="mt-0.5 block truncate text-xs opacity-65">
              {config.description}
            </span>
          ) : null}
        </span>
      </span>
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </PublicTrackedLink>
  );
}
