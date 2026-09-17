"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { IconButton } from "~/components/ui/icon-button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { EditorBlock } from "./editor-reducer";

export function BlockInspector({
  block,
  onChange,
  onBack,
}: {
  block: EditorBlock;
  onChange: (config: unknown) => void;
  onBack: () => void;
}) {
  const t = useTranslations("editor");
  const common = useTranslations("common");
  const config =
    block.config && typeof block.config === "object"
      ? (block.config as Record<string, unknown>)
      : {};
  const patch = (value: Record<string, unknown>) =>
    onChange({ ...config, ...value });

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-border-subtle p-3">
        <IconButton label={common("back")} onClick={onBack}>
          <ArrowLeft />
        </IconButton>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("editBlock")}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold">
            {t(
              `block${block.type.charAt(0)}${block.type.slice(1).toLowerCase()}` as "blockLink",
            )}
          </h3>
        </div>
      </div>
      <div className="grid gap-5 p-4">
        {block.type === "LINK" ? (
          <>
            <Field label={t("linkTitle")} htmlFor="block-title">
              <Input
                id="block-title"
                value={String(config.title ?? "")}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </Field>
            <Field
              label={t("linkUrl")}
              htmlFor="block-url"
              description={t("safeUrlHelp")}
            >
              <Input
                id="block-url"
                inputMode="url"
                value={String(config.url ?? "")}
                onChange={(event) => patch({ url: event.target.value })}
              />
            </Field>
            <Field
              label={t("linkDescription")}
              htmlFor="block-description"
              optional={common("optional")}
            >
              <Textarea
                id="block-description"
                rows={3}
                value={String(config.description ?? "")}
                onChange={(event) =>
                  patch({ description: event.target.value || undefined })
                }
              />
            </Field>
          </>
        ) : null}
        {block.type === "TEXT" ? (
          <Field label={t("textContent")} htmlFor="block-text">
            <Textarea
              id="block-text"
              rows={8}
              value={String(config.text ?? "")}
              onChange={(event) => patch({ text: event.target.value })}
            />
          </Field>
        ) : null}
        {block.type === "HEADING" ? (
          <>
            <Field label={t("headingText")} htmlFor="heading-text">
              <Input
                id="heading-text"
                value={String(config.text ?? "")}
                onChange={(event) => patch({ text: event.target.value })}
              />
            </Field>
            <Field label={t("headingLevel")} htmlFor="heading-level">
              <select
                id="heading-level"
                className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                value={Number(config.level ?? 2)}
                onChange={(event) =>
                  patch({ level: Number(event.target.value) })
                }
              >
                <option value={1}>H1</option>
                <option value={2}>H2</option>
                <option value={3}>H3</option>
              </select>
            </Field>
          </>
        ) : null}
        {block.type === "DIVIDER" ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {t("dividerDescription")}
          </p>
        ) : null}
        {block.type === "IMAGE" ? (
          <>
            <Field label={t("imageAlt")} htmlFor="image-alt">
              <Input
                id="image-alt"
                value={String(config.alt ?? "")}
                onChange={(event) => patch({ alt: event.target.value })}
              />
            </Field>
            <Field
              label={t("linkUrl")}
              htmlFor="image-href"
              optional={common("optional")}
            >
              <Input
                id="image-href"
                inputMode="url"
                value={String(config.href ?? "")}
                onChange={(event) =>
                  patch({ href: event.target.value || undefined })
                }
              />
            </Field>
          </>
        ) : null}
        {block.type === "SOCIALS" ? (
          <SocialItems
            items={
              Array.isArray(config.items)
                ? (config.items as Array<Record<string, unknown>>)
                : []
            }
            onChange={(items) => patch({ items })}
          />
        ) : null}
      </div>
    </div>
  );
}

function SocialItems({
  items,
  onChange,
}: {
  items: Array<Record<string, unknown>>;
  onChange: (items: Array<Record<string, unknown>>) => void;
}) {
  const t = useTranslations("editor");
  const common = useTranslations("common");
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("socialLinks")}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange([
              ...items,
              { label: t("blockSocials"), url: "https://example.com" },
            ])
          }
        >
          <Plus />
          {t("addSocial")}
        </Button>
      </div>
      <div className="mt-3 grid gap-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-border p-3"
          >
            <div className="grid gap-2">
              <Input
                aria-label={t("socialLabel")}
                value={String(item.label ?? "")}
                onChange={(event) =>
                  onChange(
                    items.map((current, itemIndex) =>
                      itemIndex === index
                        ? { ...current, label: event.target.value }
                        : current,
                    ),
                  )
                }
              />
              <Input
                aria-label={t("linkUrl")}
                inputMode="url"
                value={String(item.url ?? "")}
                onChange={(event) =>
                  onChange(
                    items.map((current, itemIndex) =>
                      itemIndex === index
                        ? { ...current, url: event.target.value }
                        : current,
                    ),
                  )
                }
              />
            </div>
            <IconButton
              label={common("delete")}
              className="text-danger"
              onClick={() =>
                onChange(items.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              <Trash2 />
            </IconButton>
          </div>
        ))}
      </div>
    </div>
  );
}
