"use client";

import {
  FileImage,
  MoreHorizontal,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { EmptyState } from "~/components/ui/empty-state";
import { IconButton } from "~/components/ui/icon-button";
import { Input } from "~/components/ui/input";
import { api, type RouterOutputs } from "~/trpc/react";

type MediaAsset = RouterOutputs["media"]["list"][number];

export function MediaLibrary({
  initialAssets,
}: {
  initialAssets: MediaAsset[];
}) {
  const media = useTranslations("media");
  const common = useTranslations("common");
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(
    query.trim().toLocaleLowerCase(locale),
  );
  const [uploading, setUploading] = useState(false);
  const utils = api.useUtils();
  const { data: assets = initialAssets } = api.media.list.useQuery(undefined, {
    initialData: initialAssets,
  });
  const remove = api.media.delete.useMutation({
    onSuccess: async () => {
      toast.success(media("deleteComplete"));
      await utils.media.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const visibleAssets = assets.filter(
    (asset) =>
      !deferredQuery ||
      (asset.originalName ?? "")
        .toLocaleLowerCase(locale)
        .includes(deferredQuery),
  );

  async function upload(file: File) {
    setUploading(true);
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? media("uploadFailed"));
      toast.success(media("uploadComplete"));
      await utils.media.list.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : media("uploadFailed"),
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="media-search"
            aria-label={media("filterPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={media("filterPlaceholder")}
            className="pl-9"
          />
        </div>
        <div>
          <input
            ref={inputRef}
            className="sr-only"
            name="media-file"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button loading={uploading} onClick={() => inputRef.current?.click()}>
            <UploadCloud />
            {uploading ? media("uploading") : common("upload")}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{media("assetCount", { count: visibleAssets.length })}</span>
        <span>{media("uploadDescription")}</span>
      </div>
      {visibleAssets.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {visibleAssets.map((asset) => (
            <article
              key={asset.id}
              className="group overflow-hidden rounded-md border border-border bg-surface-raised shadow-xs"
            >
              <div className="relative aspect-square bg-muted">
                <Image
                  src={`/api/media/${asset.id}`}
                  alt={asset.originalName ?? ""}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw"
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <IconButton
                          label={media("details")}
                          className="bg-background/90 shadow-sm backdrop-blur"
                        >
                          <MoreHorizontal />
                        </IconButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-danger"
                            onSelect={(event) => event.preventDefault()}
                          >
                            <Trash2 />
                            {common("delete")}
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogTitle>
                        {media("deleteTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {media("deleteDescription")}
                      </AlertDialogDescription>
                      <div className="mt-5 flex justify-end gap-2">
                        <AlertDialogCancel asChild>
                          <Button variant="secondary">
                            {common("cancel")}
                          </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button
                            variant="danger"
                            loading={remove.isPending}
                            onClick={() => remove.mutate({ id: asset.id })}
                          >
                            {common("delete")}
                          </Button>
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="space-y-1 p-3">
                <p
                  className="truncate text-sm font-medium"
                  title={asset.originalName ?? undefined}
                >
                  {asset.originalName ?? media("images")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat(locale, {
                    style: "unit",
                    unit: "kilobyte",
                    maximumFractionDigits: 0,
                  }).format(Number(asset.size) / 1024)}{" "}
                  ·{" "}
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                  }).format(asset.createdAt)}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileImage}
          title={media("emptyTitle")}
          description={media("emptyDescription")}
          action={
            <Button onClick={() => inputRef.current?.click()}>
              <UploadCloud />
              {common("upload")}
            </Button>
          }
        />
      )}
    </div>
  );
}
