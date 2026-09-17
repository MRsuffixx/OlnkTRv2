"use client";

import {
  Heading,
  Link2,
  Minus,
  Plus,
  Search,
  Share2,
  Text,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";

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

const blockTypes = [
  {
    type: "LINK",
    key: "blockLink",
    descriptionKey: "blockLinkDescription",
    icon: Link2,
  },
  {
    type: "TEXT",
    key: "blockText",
    descriptionKey: "blockTextDescription",
    icon: Text,
  },
  {
    type: "HEADING",
    key: "blockHeading",
    descriptionKey: "blockHeadingDescription",
    icon: Heading,
  },
  {
    type: "DIVIDER",
    key: "blockDivider",
    descriptionKey: "blockDividerDescription",
    icon: Minus,
  },
  {
    type: "SOCIALS",
    key: "blockSocials",
    descriptionKey: "blockSocialsDescription",
    icon: Share2,
  },
] as const;

type BlockLabelKey = "blockLink" | "blockText" | "blockHeading";

function defaultConfig(
  type: (typeof blockTypes)[number]["type"],
  t: (key: BlockLabelKey) => string,
) {
  switch (type) {
    case "LINK":
      return { title: t("blockLink"), url: "https://example.com" };
    case "TEXT":
      return { text: t("blockText") };
    case "HEADING":
      return { text: t("blockHeading"), level: 2 };
    case "SOCIALS":
      return { items: [] };
    case "DIVIDER":
      return {};
  }
}

export function BlockPicker({
  onCreate,
  loading,
}: {
  onCreate: (type: string, config: unknown) => Promise<boolean>;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const t = useTranslations("editor");
  const common = useTranslations("common");
  const filtered = blockTypes.filter((block) =>
    t(block.key).toLocaleLowerCase().includes(deferredQuery),
  );

  async function create(type: string, config: unknown) {
    if (await onCreate(type, config)) {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          {t("addBlock")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
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
        <div className="mt-3 grid max-h-[55vh] gap-1 overflow-y-auto sm:grid-cols-2">
          {filtered.map((block) => {
            const Icon = block.icon;
            return (
              <button
                key={block.type}
                type="button"
                disabled={loading}
                onClick={() =>
                  void create(block.type, defaultConfig(block.type, t))
                }
                className="flex items-start gap-3 rounded-md border border-transparent p-3 text-left transition-[background-color,border-color] hover:border-border hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:opacity-50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-raised shadow-xs">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">
                    {t(block.key)}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {t(block.descriptionKey)}
                  </span>
                </span>
              </button>
            );
          })}
          {!filtered.length ? (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              {common("search")}: “{query}”
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
