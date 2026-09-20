"use client";

import { Check, Film, ImageIcon, Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { cn } from "~/lib/cn";
import { api, type RouterOutputs } from "~/trpc/react";

type MediaAsset = RouterOutputs["media"]["list"][number];

export function MediaPicker({
  kind,
  value,
  onSelect,
  label,
  description,
}: {
  kind: "IMAGE" | "VIDEO";
  value?: string | null;
  onSelect: (asset: MediaAsset) => void;
  label: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  const media = useTranslations("media");
  const common = useTranslations("common");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();
  const { data: assets = [] } = api.media.list.useQuery(undefined, {
    enabled: open,
    refetchInterval: (query) =>
      query.state.data?.some((asset) =>
        ["PENDING", "PROCESSING"].includes(asset.status),
      )
        ? 2000
        : false,
  });
  const matching = assets.filter((asset) => asset.kind === kind);

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
      if (!response.ok) throw new Error(payload.error ?? "Upload failed");
      await utils.media.list.invalidate();
      toast.success(
        kind === "VIDEO"
          ? media("videoQueued")
          : media("uploadComplete"),
      );
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" className="w-full">
          {kind === "VIDEO" ? <Film /> : <ImageIcon />}
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(94vw,44rem)]">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          accept={
            kind === "VIDEO"
              ? "video/mp4,video/webm"
              : "image/png,image/jpeg,image/webp,image/gif"
          }
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud />
            {common("upload")} {kind === "VIDEO" ? media("video") : media("images")}
          </Button>
        </div>
        {matching.length ? (
          <div className="grid max-h-[55dvh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
            {matching.map((asset) => {
              const ready = asset.status === "READY";
              const selected = value === asset.id;
              return (
                <button
                  key={asset.id}
                  type="button"
                  disabled={!ready}
                  onClick={() => {
                    onSelect(asset);
                    setOpen(false);
                  }}
                  className={cn(
                    "group relative overflow-hidden rounded-md border bg-muted text-left transition-[border-color,transform,opacity] focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none",
                    selected ? "border-primary" : "border-border",
                    ready
                      ? "hover:-translate-y-0.5 hover:border-border-strong"
                      : "cursor-wait opacity-65",
                  )}
                >
                  <span className="relative block aspect-video">
                    {ready ? (
                      <Image
                        src={`/api/media/${asset.id}${kind === "VIDEO" ? "?variant=poster" : ""}`}
                        alt=""
                        fill
                        unoptimized
                        sizes="220px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </span>
                    )}
                    {selected ? (
                      <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate px-3 py-2 text-xs font-medium">
                    {ready
                      ? (asset.originalName ?? media("untitled"))
                      : asset.status === "REJECTED"
                        ? media("processingFailed")
                        : media("processing")}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-44 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-center text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            <UploadCloud className="size-5" />
            {media("uploadFirst", {
              kind: kind === "VIDEO" ? media("video") : media("images"),
            })}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
