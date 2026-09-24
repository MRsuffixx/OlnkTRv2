"use client";

import { Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { IconButton } from "~/components/ui/icon-button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { MediaPicker } from "~/features/media/media-picker";
import type { EditorBlock } from "../editor-reducer";

export function patchBasicBlockConfig(
  config: Record<string, unknown>,
  patch: Record<string, unknown>,
) {
  return { ...config, ...patch };
}

const iconOptions = [
  "link",
  "star",
  "heart",
  "play",
  "shopping-bag",
  "calendar",
  "message-circle",
  "external-link",
] as const;

export function BasicBlockInspector({
  block,
  hasMultipleH1 = false,
  onChange,
}: {
  block: EditorBlock;
  hasMultipleH1?: boolean;
  onChange: (config: unknown) => void;
}) {
  const t = useTranslations("editor");
  const common = useTranslations("common");
  const config =
    block.config && typeof block.config === "object"
      ? (block.config as Record<string, unknown>)
      : {};
  const patch = (value: Record<string, unknown>) =>
    onChange(patchBasicBlockConfig(config, value));
  const linkLike = ["LINK", "FEATURED_LINK", "BUTTON", "ADULT_LINK"].includes(
    block.type,
  );

  return (
    <div className="grid gap-5">
      {linkLike ? (
        <>
          <Field label={t("linkTitle")} htmlFor="basic-link-title">
            <Input
              id="basic-link-title"
              value={String(config.title ?? "")}
              onChange={(event) => patch({ title: event.target.value })}
            />
          </Field>
          <Field
            label={t("linkUrl")}
            htmlFor="basic-link-url"
            description={
              block.type === "ADULT_LINK"
                ? t("adultUrlHelp")
                : t("safeUrlHelp")
            }
          >
            <Input
              id="basic-link-url"
              inputMode="url"
              value={String(config.url ?? "")}
              onChange={(event) => patch({ url: event.target.value })}
            />
          </Field>
          <Field
            label={t("linkDescription")}
            htmlFor="basic-link-description"
            optional={common("optional")}
          >
            <Textarea
              id="basic-link-description"
              rows={3}
              value={String(config.description ?? "")}
              onChange={(event) =>
                patch({ description: event.target.value || undefined })
              }
            />
          </Field>
          <Field label={t("linkIcon")} htmlFor="basic-link-icon" optional={common("optional")}>
            <select
              id="basic-link-icon"
              value={String(config.icon ?? "")}
              onChange={(event) => patch({ icon: event.target.value || undefined })}
              className="h-9 w-full rounded-sm border border-border bg-surface-raised px-3 text-sm"
            >
              <option value="">{t("noIcon")}</option>
              {iconOptions.map((icon) => (
                <option key={icon} value={icon}>{t(`icon_${icon}` as never)}</option>
              ))}
            </select>
          </Field>
        </>
      ) : null}

      {block.type === "FEATURED_LINK" ? (
        <>
          <Field label={t("featuredPresentation")} htmlFor="featured-presentation">
            <select
              id="featured-presentation"
              value={String(config.presentation ?? "spotlight")}
              onChange={(event) => patch({ presentation: event.target.value })}
              className="h-9 w-full rounded-sm border border-border bg-surface-raised px-3 text-sm"
            >
              <option value="compact">{t("compact")}</option>
              <option value="spotlight">{t("spotlight")}</option>
              <option value="image">{t("imageCard")}</option>
            </select>
          </Field>
          <MediaPicker
            kind="IMAGE"
            value={typeof config.assetId === "string" ? config.assetId : undefined}
            label={t("selectImage")}
            description={t("featuredImageHelp")}
            onSelect={(asset) => patch({ assetId: asset.id })}
          />
        </>
      ) : null}

      {block.type === "BUTTON" ? (
        <>
          <ToggleField
            label={t("useGlobalButtonStyle")}
            checked={config.useGlobalStyle !== false}
            onChange={(useGlobalStyle) => patch({ useGlobalStyle })}
          />
          {config.useGlobalStyle === false ? (
            <Field label={t("buttonStyle")} htmlFor="block-button-style">
              <select
                id="block-button-style"
                value={String(config.style ?? "solid")}
                onChange={(event) => patch({ style: event.target.value })}
                className="h-9 w-full rounded-sm border border-border bg-surface-raised px-3 text-sm"
              >
                <option value="solid">{t("fill")}</option>
                <option value="outline">{t("outline")}</option>
                <option value="soft">{t("soft")}</option>
                <option value="minimal">{t("minimal")}</option>
              </select>
            </Field>
          ) : null}
        </>
      ) : null}

      {block.type === "ADULT_LINK" ? (
        <div className="rounded-md border border-warning/30 bg-warning/8 p-3 text-xs leading-5">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>{t("adultBlockNotice")}</span>
          </div>
        </div>
      ) : null}

      {block.type === "TEXT" ? (
        <>
          <Field label={t("textTitle")} htmlFor="text-title" optional={common("optional")}>
            <Input
              id="text-title"
              value={String(config.title ?? "")}
              onChange={(event) => patch({ title: event.target.value || undefined })}
            />
          </Field>
          <Field label={t("textContent")} htmlFor="block-text">
            <Textarea
              id="block-text"
              rows={8}
              value={String(config.text ?? "")}
              onChange={(event) => patch({ text: event.target.value })}
            />
          </Field>
          <Field label={t("alignment")} htmlFor="text-alignment">
            <select
              id="text-alignment"
              value={String(config.alignment ?? "inherit")}
              onChange={(event) => patch({ alignment: event.target.value })}
              className="h-9 w-full rounded-sm border border-border bg-surface-raised px-3 text-sm"
            >
              <option value="inherit">{t("inheritPageAlignment")}</option>
              <option value="left">{t("left")}</option>
              <option value="center">{t("center")}</option>
              <option value="right">{t("right")}</option>
            </select>
          </Field>
        </>
      ) : null}

      {block.type === "HEADING" ? (
        <>
          <Field label={t("headingText")} htmlFor="heading-text">
            <Input id="heading-text" value={String(config.text ?? "")} onChange={(event) => patch({ text: event.target.value })} />
          </Field>
          <Field label={t("headingLevel")} htmlFor="heading-level">
            <select id="heading-level" className="h-9 w-full rounded-sm border border-border bg-surface-raised px-3 text-sm" value={Number(config.level ?? 2)} onChange={(event) => patch({ level: Number(event.target.value) })}>
              <option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option>
            </select>
          </Field>
          {hasMultipleH1 && config.level === 1 ? (
            <p role="status" className="rounded-md border border-warning/30 bg-warning/8 p-3 text-xs leading-5 text-foreground">
              {t("multipleH1Warning")}
            </p>
          ) : null}
        </>
      ) : null}

      {block.type === "DIVIDER" ? (
        <>
          <Field label={t("dividerStyle")} htmlFor="divider-style">
            <select id="divider-style" value={String(config.style ?? "line")} onChange={(event) => patch({ style: event.target.value })} className="h-9 w-full rounded-sm border border-border bg-surface-raised px-3 text-sm">
              <option value="line">{t("line")}</option><option value="dashed">{t("dashed")}</option><option value="dotted">{t("dotted")}</option><option value="space">{t("spaceOnly")}</option>
            </select>
          </Field>
          <Field label={t("dividerThickness")} htmlFor="divider-thickness"><Input id="divider-thickness" type="number" min={1} max={8} value={Number(config.thickness ?? 1)} onChange={(event) => patch({ thickness: Number(event.target.value) })} /></Field>
          <Field label={t("dividerWidth")} htmlFor="divider-width"><Input id="divider-width" type="number" min={10} max={100} value={Number(config.width ?? 100)} onChange={(event) => patch({ width: Number(event.target.value) })} /></Field>
        </>
      ) : null}

      {block.type === "IMAGE" ? (
        <>
          <MediaPicker kind="IMAGE" value={typeof config.assetId === "string" ? config.assetId : undefined} label={t("selectImage")} description={t("imageSetupDescription")} onSelect={(asset) => patch({ assetId: asset.id })} />
          <ToggleField label={t("decorativeImage")} checked={config.decorative === true} onChange={(decorative) => patch({ decorative, ...(decorative ? { alt: "" } : {}) })} />
          {config.decorative !== true ? <Field label={t("imageAlt")} htmlFor="image-alt"><Input id="image-alt" value={String(config.alt ?? "")} onChange={(event) => patch({ alt: event.target.value })} /></Field> : null}
          <Field label={t("linkUrl")} htmlFor="image-href" optional={common("optional")}><Input id="image-href" inputMode="url" value={String(config.href ?? "")} onChange={(event) => patch({ href: event.target.value || undefined })} /></Field>
        </>
      ) : null}

      {block.type === "SOCIALS" ? (
        <SocialItems
          items={Array.isArray(config.items) ? config.items as Array<Record<string, unknown>> : []}
          onChange={(items) => patch({ items })}
        />
      ) : null}

      {block.type === "SPACER" ? (
        <>
          <Field label={t("spacerSize")} htmlFor="spacer-size">
            <select id="spacer-size" value={String(config.size ?? "medium")} onChange={(event) => patch({ size: event.target.value, customPixels: event.target.value === "custom" ? Number(config.customPixels ?? 28) : undefined })} className="h-9 w-full rounded-sm border border-border bg-surface-raised px-3 text-sm">
              <option value="small">{t("small")}</option><option value="medium">{t("medium")}</option><option value="large">{t("large")}</option><option value="custom">{t("custom")}</option>
            </select>
          </Field>
          {config.size === "custom" ? <Field label={t("customPixels")} htmlFor="spacer-pixels"><Input id="spacer-pixels" type="number" min={4} max={160} value={Number(config.customPixels ?? 28)} onChange={(event) => patch({ customPixels: Number(event.target.value) })} /></Field> : null}
        </>
      ) : null}
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 text-sm font-medium"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-primary" /></label>;
}

function SocialItems({ items, onChange }: { items: Array<Record<string, unknown>>; onChange: (items: Array<Record<string, unknown>>) => void }) {
  const t = useTranslations("editor");
  const common = useTranslations("common");
  return <div><div className="flex items-center justify-between"><p className="text-sm font-medium">{t("socialLinks")}</p><Button type="button" variant="secondary" size="sm" onClick={() => onChange([...items, { provider: "custom", label: t("blockSocials"), url: "https://example.com" }])}><Plus />{t("addSocial")}</Button></div><div className="mt-3 grid gap-3">{items.map((item, index) => <div key={index} className="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-border p-3"><div className="grid gap-2"><select aria-label={t("socialProvider")} value={String(item.provider ?? "custom")} onChange={(event) => onChange(items.map((current, itemIndex) => itemIndex === index ? { ...current, provider: event.target.value } : current))} className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"><option value="custom">{t("custom")}</option><option value="instagram">Instagram</option><option value="x">X</option><option value="tiktok">TikTok</option><option value="github">GitHub</option><option value="discord">Discord</option><option value="youtube">YouTube</option><option value="twitch">Twitch</option><option value="linkedin">LinkedIn</option><option value="telegram">Telegram</option><option value="facebook">Facebook</option><option value="website">{t("website")}</option></select><Input aria-label={t("socialLabel")} value={String(item.label ?? "")} onChange={(event) => onChange(items.map((current, itemIndex) => itemIndex === index ? { ...current, label: event.target.value } : current))} /><Input aria-label={t("linkUrl")} inputMode="url" value={String(item.url ?? "")} onChange={(event) => onChange(items.map((current, itemIndex) => itemIndex === index ? { ...current, url: event.target.value } : current))} /></div><IconButton label={common("delete")} className="text-danger" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></IconButton></div>)}</div></div>;
}
