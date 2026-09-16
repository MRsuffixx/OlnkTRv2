"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { Blocks } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "~/components/ui/empty-state";
import type { EditorBlock } from "./editor-reducer";
import { BlockCard } from "./block-card";
import { BlockPicker } from "./block-picker";

export function BlockList({ blocks, selectedId, busy, onSelect, onCreate, onDuplicate, onToggle, onDelete, onReorder }: { blocks: EditorBlock[]; selectedId: string | null; busy: boolean; onSelect: (id: string) => void; onCreate: (type: string, config: unknown) => Promise<boolean>; onDuplicate: (id: string) => void; onToggle: (id: string, enabled: boolean) => void; onDelete: (id: string) => void; onReorder: (from: number, to: number) => void }) {
  const t = useTranslations("editor");
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle p-4"><div><h3 className="text-sm font-semibold">{t("content")}</h3><p className="mt-0.5 text-xs text-muted-foreground">{t("contentDescription")}</p></div><BlockPicker onCreate={onCreate} loading={busy} /></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {blocks.length ? <DragDropProvider onDragEnd={(event) => { const source = event.operation.source; if (isSortable(source) && source.initialIndex !== source.index) onReorder(source.initialIndex, source.index); }}><div className="grid gap-2">{blocks.map((block, index) => <BlockCard key={block.id} block={block} index={index} selected={block.id === selectedId} onSelect={() => onSelect(block.id)} onDuplicate={() => onDuplicate(block.id)} onToggle={() => onToggle(block.id, !block.enabled)} onDelete={() => onDelete(block.id)} />)}</div></DragDropProvider> : <EmptyState icon={Blocks} title={t("emptyContentTitle")} description={t("emptyContentDescription")} action={<BlockPicker onCreate={onCreate} loading={busy} />} />}
      </div>
    </div>
  );
}
