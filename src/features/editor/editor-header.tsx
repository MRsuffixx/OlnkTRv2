"use client";

import { ArrowUpRight, Check, CloudAlert, CloudUpload, Eye, LoaderCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/cn";
import type { SaveStatus } from "./editor-reducer";

export function EditorHeader({ username, saveStatus, publishing, onPublish }: { username: string; saveStatus: SaveStatus; publishing: boolean; onPublish: () => void }) {
  const t = useTranslations("editor");
  const common = useTranslations("common");
  const status = saveStatus === "saving" ? { icon: LoaderCircle, label: common("saving"), className: "animate-spin" }
    : saveStatus === "error" ? { icon: CloudAlert, label: t("notSaved"), className: "text-danger" }
      : saveStatus === "dirty" ? { icon: CloudUpload, label: t("unsavedChanges"), className: "" }
        : { icon: Check, label: common("saved"), className: "" };
  const StatusIcon = status.icon;
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/92 px-3 backdrop-blur-md sm:px-4">
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{t("title")}</p><p className="truncate text-[11px] text-muted-foreground">olnk.tr/{username}</p></div>
      <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex" aria-live="polite"><StatusIcon className={cn("size-3.5", status.className)} />{status.label}</div>
      <Link href={`/${username}`} target="_blank" className={buttonVariants({ variant: "secondary", size: "sm" })}><Eye />{t("preview")}<ArrowUpRight className="hidden sm:block" /></Link>
      <Button size="sm" onClick={onPublish} loading={publishing}><Send />{publishing ? t("publishing") : t("publish")}</Button>
    </header>
  );
}
