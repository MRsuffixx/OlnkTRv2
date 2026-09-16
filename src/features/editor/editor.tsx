"use client";

import { Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { SegmentedControl, SegmentedControlItem } from "~/components/ui/segmented-control";
import { AppearanceInspector } from "./appearance-inspector";
import { createEditorBlockAction, deleteEditorBlockAction, duplicateEditorBlockAction, publishEditorPageAction, reorderEditorBlocksAction, saveEditorDocumentAction, toggleEditorBlockAction } from "./actions";
import { BlockInspector } from "./block-inspector";
import { BlockList } from "./block-list";
import { EditorHeader } from "./editor-header";
import { EditorNavigation } from "./editor-navigation";
import { createEditorState, editorReducer, type EditorDocument } from "./editor-reducer";
import { PagePreview } from "./page-preview";

export function Editor({ initialDocument, profile }: { initialDocument: EditorDocument; profile: { username: string; displayName: string; bio: string | null } }) {
  const [state, dispatch] = useReducer(editorReducer, initialDocument, createEditorState);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();
  const t = useTranslations("editor");
  const common = useTranslations("common");
  const selectedBlock = state.document.blocks.find((block) => block.id === state.selectedBlockId) ?? null;

  const persist = useCallback(async (document: EditorDocument) => {
    dispatch({ type: "save.started" });
    const result = await saveEditorDocumentAction({ ...document, blocks: document.blocks });
    if (result.ok) {
      dispatch({ type: "save.succeeded", document });
      return true;
    }
    dispatch({ type: "save.failed", message: result.message });
    return false;
  }, []);

  useEffect(() => {
    if (state.document === state.confirmed) return;
    const timeout = window.setTimeout(() => void persist(state.document), 750);
    return () => window.clearTimeout(timeout);
  }, [persist, state.confirmed, state.document]);

  async function createBlock(type: string, config: unknown) {
    setBusy(true);
    const result = await createEditorBlockAction({ pageId: state.document.pageId, type, config });
    setBusy(false);
    if (!result.ok) { toast.error(result.message); return false; }
    dispatch({ type: "block.added", block: result.value });
    return true;
  }

  async function deleteBlock(id: string) {
    setBusy(true);
    const result = await deleteEditorBlockAction(id);
    setBusy(false);
    if (!result.ok) return toast.error(result.message);
    dispatch({ type: "block.deleted", blockId: id });
  }

  async function duplicateBlock(id: string) {
    setBusy(true);
    const result = await duplicateEditorBlockAction(id);
    setBusy(false);
    if (!result.ok) return toast.error(result.message);
    dispatch({ type: "block.added", block: result.value });
  }

  async function toggleBlock(id: string, enabled: boolean) {
    dispatch({ type: "block.toggled", blockId: id, enabled });
    const result = await toggleEditorBlockAction(id, enabled);
    if (!result.ok) {
      dispatch({ type: "block.toggled", blockId: id, enabled: !enabled });
      toast.error(result.message);
    }
  }

  async function reorder(from: number, to: number) {
    const blocks = [...state.document.blocks];
    const [moved] = blocks.splice(from, 1);
    if (!moved) return;
    blocks.splice(to, 0, moved);
    dispatch({ type: "blocks.reordered", from, to });
    const result = await reorderEditorBlocksAction(state.document.pageId, blocks.map((block) => block.id));
    if (!result.ok) {
      dispatch({ type: "blocks.reordered", from: to, to: from });
      toast.error(result.message);
    }
  }

  async function publish() {
    setPublishing(true);
    const saved = await persist(state.document);
    if (!saved) { setPublishing(false); return; }
    const result = await publishEditorPageAction(state.document.pageId);
    setPublishing(false);
    if (!result.ok) return toast.error(result.message);
    toast.success(t("publishSuccess"));
    router.refresh();
  }

  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-background sm:-mx-6 md:-mx-8 md:-my-8 md:h-[calc(100dvh-4rem)] md:min-h-0">
      <EditorHeader username={profile.username} saveStatus={state.saveStatus} publishing={publishing} onPublish={() => void publish()} />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <EditorNavigation value={state.section} onChange={(section) => dispatch({ type: "section.changed", section })} />
        <div className="order-1 flex min-h-[52vh] min-w-0 flex-1 flex-col overflow-hidden lg:order-2 lg:min-h-0">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-3">
            <SegmentedControl type="single" value={state.previewDevice} onValueChange={(device) => device && dispatch({ type: "preview.changed", device: device as "mobile" | "tablet" | "desktop" })}>
              <SegmentedControlItem value="mobile" aria-label={t("mobile")}><Smartphone className="size-3.5" /><span className="hidden sm:inline">{t("mobile")}</span></SegmentedControlItem>
              <SegmentedControlItem value="tablet" aria-label={t("tablet")}><Tablet className="size-3.5" /><span className="hidden sm:inline">{t("tablet")}</span></SegmentedControlItem>
              <SegmentedControlItem value="desktop" aria-label={t("desktop")}><Monitor className="size-3.5" /><span className="hidden sm:inline">{t("desktop")}</span></SegmentedControlItem>
            </SegmentedControl>
            <label className="flex items-center gap-2 text-xs text-muted-foreground"><span className="sr-only">{t("zoom")}</span><select value={state.zoom} onChange={(event) => dispatch({ type: "zoom.changed", zoom: Number(event.target.value) })} className="h-8 rounded-sm border border-border bg-surface-raised px-2 text-xs"><option value={75}>75%</option><option value={100}>100%</option><option value={125}>125%</option></select></label>
          </div>
          <PagePreview document={state.document} profile={profile} device={state.previewDevice} zoom={state.zoom} />
        </div>
        <aside className="order-2 min-h-[26rem] border-t border-border bg-surface lg:order-3 lg:w-[340px] lg:shrink-0 lg:border-t-0 lg:border-l">
          {state.section === "content" ? selectedBlock ? <BlockInspector block={selectedBlock} onChange={(config) => dispatch({ type: "block.updated", blockId: selectedBlock.id, config })} onBack={() => dispatch({ type: "block.selected", blockId: null })} /> : <BlockList blocks={state.document.blocks} selectedId={state.selectedBlockId} busy={busy} onSelect={(blockId) => dispatch({ type: "block.selected", blockId })} onCreate={createBlock} onDuplicate={(id) => void duplicateBlock(id)} onToggle={(id, enabled) => void toggleBlock(id, enabled)} onDelete={(id) => void deleteBlock(id)} onReorder={(from, to) => void reorder(from, to)} /> : <AppearanceInspector section={state.section} document={state.document} onThemeChange={(theme) => dispatch({ type: "theme.replaced", theme })} onPageChange={(patch) => dispatch({ type: "page.updated", patch })} onSeoChange={(seo) => dispatch({ type: "seo.updated", seo })} />}
          {state.saveStatus === "error" ? <div className="m-3 flex items-center justify-between gap-3 rounded-md border border-danger/20 bg-danger-soft p-3 text-xs text-danger"><span>{state.error}</span><Button size="sm" variant="outlineDanger" onClick={() => void persist(state.document)}><RotateCcw />{common("retry")}</Button></div> : null}
        </aside>
      </div>
    </div>
  );
}
