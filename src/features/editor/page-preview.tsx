"use client";

import { ExternalLink, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "~/lib/cn";
import type { EditorBlock, EditorDocument, PreviewDevice } from "./editor-reducer";
import { safePreviewHref } from "./preview-url";

const widths: Record<PreviewDevice, string> = { mobile: "w-[375px]", tablet: "w-[680px]", desktop: "w-[960px]" };

function PreviewBlock({ block, document, labels }: { block: EditorBlock; document: EditorDocument; labels: { heading: string; text: string; social: string; link: string } }) {
  if (!block.enabled) return null;
  const config = block.config && typeof block.config === "object" ? block.config as Record<string, unknown> : {};
  const theme = document.theme;
  if (block.type === "HEADING") {
    const Tag = config.level === 1 ? "h1" : config.level === 3 ? "h3" : "h2";
    return <Tag className="font-semibold" style={{ fontSize: `${theme.typography.scale * 0.18}px` }}>{String(config.text ?? labels.heading)}</Tag>;
  }
  if (block.type === "TEXT") return <p className="whitespace-pre-wrap opacity-85">{String(config.text ?? labels.text)}</p>;
  if (block.type === "DIVIDER") return <hr className="w-full border-current opacity-20" />;
  if (block.type === "IMAGE") return <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-current/15 bg-current/5"><ImageIcon className="size-6 opacity-35" /></div>;
  if (block.type === "SOCIALS") {
    const items = Array.isArray(config.items) ? config.items : [];
    return <div className="flex flex-wrap justify-center gap-2">{items.map((item, index) => { const social = item as Record<string, unknown>; return <a key={index} href={safePreviewHref(social.url)} onClick={(event) => event.preventDefault()} className="rounded-full border border-current/20 px-3 py-1.5 text-xs">{String(social.label ?? labels.social)}</a>; })}</div>;
  }
  const radius = theme.buttons.shape === "pill" ? 999 : theme.buttons.shape === "square" ? 4 : 14;
  const style = theme.buttons.style;
  return <a href={safePreviewHref(config.url)} onClick={(event) => event.preventDefault()} className={cn("flex w-full items-center justify-between gap-3 px-4 font-medium transition-[transform,opacity] hover:scale-[1.01]", style === "outline" && "border-2 border-current bg-transparent", style === "soft" && "bg-current/10", style === "minimal" && "border-b border-current/25 bg-transparent", style === "fill" && "bg-current/12")} style={{ minHeight: theme.buttons.height, borderRadius: radius }}><span className="min-w-0"><span className="block truncate">{String(config.title ?? labels.link)}</span>{typeof config.description === "string" && config.description ? <span className="mt-0.5 block truncate text-xs opacity-65">{config.description}</span> : null}</span><ExternalLink className="size-4 shrink-0 opacity-55" /></a>;
}

export function PagePreview({ document, profile, device, zoom }: { document: EditorDocument; profile: { displayName: string; bio: string | null }; device: PreviewDevice; zoom: number }) {
  const t = useTranslations("editor");
  const theme = document.theme;
  const background = theme.background.type === "GRADIENT" ? `linear-gradient(${theme.background.angle}deg, ${theme.background.from}, ${theme.background.to})` : theme.colors.background;
  const fontFamily = theme.typography.family === "serif" ? "ui-serif, Georgia, serif" : theme.typography.family === "mono" ? "ui-monospace, monospace" : "var(--font-geist-sans), sans-serif";
  const weight = theme.typography.weight === "regular" ? 400 : theme.typography.weight === "semibold" ? 600 : 500;
  const avatarRadius = theme.layout.avatarShape === "circle" ? "999px" : theme.layout.avatarShape === "square" ? "8px" : "20px";
  return (
    <div className="flex min-h-full min-w-full items-start justify-center overflow-auto bg-muted/45 p-5 sm:p-8">
      <div className={cn("min-h-[720px] max-w-full shrink-0 overflow-hidden rounded-[22px] border border-border-strong/35 shadow-floating transition-[width] duration-200 ease-product", widths[device])} style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
        <div className="min-h-[720px]" style={{ background, color: theme.colors.text, fontFamily, fontWeight: weight, lineHeight: theme.typography.lineHeight, padding: theme.layout.pagePadding }}>
          <div className={cn("mx-auto flex min-h-full flex-col", theme.layout.alignment === "center" ? "items-center text-center" : "items-start text-left")} style={{ maxWidth: theme.layout.maxWidth, gap: theme.layout.blockGap }}>
            <div className="mb-2 flex flex-col items-center gap-3 text-center"><div className="flex size-20 items-center justify-center border border-current/15 bg-current/10 text-xl font-semibold" style={{ borderRadius: avatarRadius }}>{profile.displayName.slice(0, 1).toUpperCase()}</div><div><h1 className="text-xl font-semibold tracking-[-0.025em]">{profile.displayName}</h1>{profile.bio ? <p className="mt-1 max-w-sm text-sm opacity-70">{profile.bio}</p> : null}</div></div>
            {document.blocks.map((block) => <PreviewBlock key={block.id} block={block} document={document} labels={{ heading: t("blockHeading"), text: t("blockText"), social: t("blockSocials"), link: t("blockLink") }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
