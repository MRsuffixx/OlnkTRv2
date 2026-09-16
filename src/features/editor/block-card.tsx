"use client";

import { BarChart3, Copy, Eye, EyeOff, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSortable } from "@dnd-kit/react/sortable";
import Link from "next/link";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { IconButton } from "~/components/ui/icon-button";
import { cn } from "~/lib/cn";
import type { EditorBlock } from "./editor-reducer";

function summary(block: EditorBlock) {
  if (!block.config || typeof block.config !== "object") return block.type;
  const config = block.config as Record<string, unknown>;
  const value = config.url ?? config.text ?? (Array.isArray(config.items) ? `${config.items.length} items` : block.type);
  return String(value);
}

export function BlockCard({ block, index, selected, onSelect, onDuplicate, onToggle, onDelete }: { block: EditorBlock; index: number; selected: boolean; onSelect: () => void; onDuplicate: () => void; onToggle: () => void; onDelete: () => void }) {
  const { ref, handleRef, isDragging } = useSortable({ id: block.id, index });
  const t = useTranslations("editor");
  const common = useTranslations("common");
  const config = block.config && typeof block.config === "object" ? block.config as Record<string, unknown> : {};
  const title = String(config.title ?? config.text ?? t(`block${block.type.charAt(0)}${block.type.slice(1).toLowerCase()}` as "blockLink"));
  return (
    <div ref={ref} data-selected={selected} className={cn("group flex items-center gap-2 rounded-md border bg-surface-raised p-2 shadow-xs transition-[border-color,box-shadow,opacity] duration-150", selected ? "border-primary/45 ring-2 ring-primary/8" : "border-border hover:border-border-strong", !block.enabled && "opacity-60", isDragging && "z-20 opacity-70 shadow-md")}>
      <button ref={handleRef} type="button" aria-label={t("dragBlock")} className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground hover:bg-surface-hover active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"><GripVertical className="size-4" /></button>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 rounded-xs px-1 py-1.5 text-left focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"><span className="block truncate text-sm font-medium">{title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{summary(block)}</span></button>
      {!block.enabled ? <EyeOff className="size-3.5 text-muted-foreground" aria-label={t("hidden")} /> : null}
      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><IconButton label={t("blockActions")}><MoreHorizontal /></IconButton></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onSelect}><Pencil />{common("edit")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}><Copy />{t("duplicate")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggle}>{block.enabled ? <EyeOff /> : <Eye />}{block.enabled ? t("hide") : t("show")}</DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={`/dashboard/analytics?block=${block.id}`}><BarChart3 />{t("analyticsShortcut")}</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialogTrigger asChild><DropdownMenuItem className="text-danger" onSelect={(event) => event.preventDefault()}><Trash2 />{common("delete")}</DropdownMenuItem></AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent><AlertDialogTitle>{t("deleteBlockTitle")}</AlertDialogTitle><AlertDialogDescription>{t("deleteBlockDescription")}</AlertDialogDescription><div className="mt-5 flex justify-end gap-2"><AlertDialogCancel asChild><Button variant="secondary">{common("cancel")}</Button></AlertDialogCancel><AlertDialogAction asChild><Button variant="danger" onClick={onDelete}>{common("delete")}</Button></AlertDialogAction></div></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
