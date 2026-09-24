"use client";

import {
  ArrowLeft,
  Code2,
  Eye,
  Heading,
  Heart,
  ImageIcon,
  Images,
  Link2,
  Megaphone,
  MessageCircle,
  Minus,
  MousePointerClick,
  MoveVertical,
  Music2,
  Play,
  Plus,
  Radio,
  Search,
  Share2,
  ShieldAlert,
  Star,
  Text,
  Timer,
  Vote,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";

import { MediaPicker } from "~/features/media/media-picker";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  blockCategories,
  blockCategoryLabelKeys,
  defaultBlockConfig,
  searchBlockCatalog,
  type BlockCatalogIcon,
  type EditorBlockPreset,
} from "./block-catalog";

const icons: Record<BlockCatalogIcon, LucideIcon> = {
  link: Link2,
  star: Star,
  share: Share2,
  text: Text,
  heading: Heading,
  divider: Minus,
  image: ImageIcon,
  "image-link": Images,
  button: MousePointerClick,
  spacer: MoveVertical,
  highlight: Megaphone,
  countdown: Timer,
  visitors: Eye,
  support: Heart,
  poll: Vote,
  discord: MessageCircle,
  spotify: Music2,
  github: Code2,
  youtube: Play,
  twitch: Radio,
  adult: ShieldAlert,
};

export function BlockPicker({
  onCreate,
  loading,
}: {
  onCreate: (type: string, config: unknown) => Promise<boolean>;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [setupPreset, setSetupPreset] = useState<EditorBlockPreset | null>(null);
  const [adultAttested, setAdultAttested] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const t = useTranslations("editor");
  const common = useTranslations("common");
  const translate = (key: string) => t(key as never);
  const filtered = searchBlockCatalog(deferredQuery, translate);

  function reset() {
    setQuery("");
    setSetupPreset(null);
    setAdultAttested(false);
  }

  async function create(preset: EditorBlockPreset, config: unknown) {
    if (await onCreate(preset.type, config)) {
      setOpen(false);
      reset();
    }
  }

  function choose(preset: EditorBlockPreset) {
    if (preset.setup) {
      setSetupPreset(preset);
      return;
    }
    const config = defaultBlockConfig(preset.id, translate);
    if (config) void create(preset, config);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          {t("addBlock")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        {setupPreset ? (
          <>
            <DialogHeader>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-2 w-fit"
                onClick={() => {
                  setSetupPreset(null);
                  setAdultAttested(false);
                }}
              >
                <ArrowLeft />
                {common("back")}
              </Button>
              <DialogTitle>{t(setupPreset.labelKey as never)}</DialogTitle>
              <DialogDescription>
                {setupPreset.setup === "adult-attestation"
                  ? t("adultSetupDescription")
                  : t("imageSetupDescription")}
              </DialogDescription>
            </DialogHeader>
            {setupPreset.setup === "image" ? (
              <MediaPicker
                kind="IMAGE"
                label={t("selectImage")}
                description={t("imageSetupDescription")}
                onSelect={(asset) => {
                  const config = defaultBlockConfig(
                    setupPreset.id,
                    translate,
                    { assetId: asset.id },
                  );
                  if (config) void create(setupPreset, config);
                }}
              />
            ) : (
              <div className="grid gap-4">
                <div className="rounded-md border border-warning/30 bg-warning/8 p-4 text-sm leading-6">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                    <p>{t("adultPolicyWarning")}</p>
                  </div>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm leading-5">
                  <input
                    type="checkbox"
                    checked={adultAttested}
                    onChange={(event) => setAdultAttested(event.target.checked)}
                    className="mt-0.5 size-4 accent-[var(--primary)]"
                  />
                  <span>{t("adultCreatorAttestation")}</span>
                </label>
                <Button
                  type="button"
                  disabled={!adultAttested || loading}
                  loading={loading}
                  onClick={() => {
                    const config = defaultBlockConfig(
                      setupPreset.id,
                      translate,
                      { adultAttested },
                    );
                    if (config) void create(setupPreset, config);
                  }}
                >
                  {common("continue")}
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("addBlock")}</DialogTitle>
              <DialogDescription>{t("addBlockDescription")}</DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="block-search"
                aria-label={t("searchBlocks")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchBlocks")}
                className="pl-9"
              />
            </div>
            <div className="mt-3 max-h-[58vh] overflow-y-auto pr-1">
              {blockCategories.map((category) => {
                const entries = filtered.filter(
                  (entry) => entry.category === category,
                );
                if (!entries.length) return null;
                return (
                  <section key={category} className="mb-4 last:mb-0">
                    <div className="mb-1 flex items-center gap-2 px-2 pt-2">
                      <p className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                      {t(blockCategoryLabelKeys[category] as never)}
                      </p>
                      {category === "adult" ? (
                        <Badge variant="warning" className="px-1.5 py-0 text-[9px]">
                          18+
                        </Badge>
                      ) : null}
                    </div>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {entries.map((entry) => {
                        const Icon = icons[entry.icon];
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            disabled={loading}
                            onClick={() => choose(entry)}
                            className="flex items-start gap-3 rounded-md border border-transparent p-3 text-left transition-[background-color,border-color] hover:border-border hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:opacity-50"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-raised shadow-xs">
                              <Icon className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2 text-sm font-medium">
                                {t(entry.labelKey as never)}
                                {entry.availability === "PREMIUM" ? (
                                  <Badge variant="primary" className="px-1.5 py-0 text-[9px]">
                                    {common("pro")}
                                  </Badge>
                                ) : null}
                                {entry.category === "adult" ? (
                                  <Badge variant="warning" className="px-1.5 py-0 text-[9px]">
                                    18+
                                  </Badge>
                                ) : null}
                              </span>
                              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                                {t(entry.descriptionKey as never)}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
              {!filtered.length ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {common("search")}: “{query}”
                </p>
              ) : null}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
