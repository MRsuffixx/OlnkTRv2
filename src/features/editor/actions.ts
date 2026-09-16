"use server";

import { redirect } from "next/navigation";

import { createBlock, deleteBlock, duplicateBlock, reorderBlocks, setBlockEnabled, updateBlock, updateDraft } from "~/server/page/service";
import type { PageDraftUpdateInput } from "~/server/publishing/snapshot";
import { publishPage } from "~/server/publishing/service";
import { auth } from "~/server/auth";
import { AppError } from "~/server/errors";
import { logger } from "~/server/observability/logger";
import type { EditorBlock } from "./editor-reducer";

export type EditorActionResult<T> = { ok: true; value: T } | { ok: false; code: string; message: string };

async function userId() {
  const session = await auth();
  if (!session) redirect("/login");
  return session.user.id;
}

async function safely<T>(operation: string, callback: (ownerId: string) => Promise<T>): Promise<EditorActionResult<T>> {
  try {
    return { ok: true, value: await callback(await userId()) };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
    logger.error({ err: error, operation }, "Editor action failed");
    return { ok: false, code: "INTERNAL_SERVER_ERROR", message: "The change could not be saved." };
  }
}

export async function saveEditorDocumentAction(input: PageDraftUpdateInput & { blocks: EditorBlock[] }) {
  return safely("editor.autosave", async (ownerId) => {
    await updateDraft(ownerId, input);
    await Promise.all(input.blocks.map((block) => updateBlock(ownerId, {
      id: block.id,
      type: block.type,
      config: block.config,
      enabled: block.enabled,
    })));
    return { savedAt: new Date().toISOString() };
  });
}

export async function createEditorBlockAction(input: { pageId: string; type: string; config: unknown }) {
  return safely("editor.block.create", async (ownerId) => {
    const block = await createBlock(ownerId, input);
    return { id: block.id, type: block.type, position: block.position, enabled: block.enabled, config: block.config } satisfies EditorBlock;
  });
}

export async function deleteEditorBlockAction(id: string) {
  return safely("editor.block.delete", async (ownerId) => deleteBlock(ownerId, id));
}

export async function duplicateEditorBlockAction(id: string) {
  return safely("editor.block.duplicate", async (ownerId) => {
    const block = await duplicateBlock(ownerId, id);
    return { id: block.id, type: block.type, position: block.position, enabled: block.enabled, config: block.config } satisfies EditorBlock;
  });
}

export async function toggleEditorBlockAction(id: string, enabled: boolean) {
  return safely("editor.block.toggle", async (ownerId) => setBlockEnabled(ownerId, id, enabled));
}

export async function reorderEditorBlocksAction(pageId: string, ids: string[]) {
  return safely("editor.block.reorder", async (ownerId) => reorderBlocks(ownerId, pageId, ids));
}

export async function publishEditorPageAction(pageId: string) {
  return safely("editor.publish", async (ownerId) => {
    const version = await publishPage(ownerId, pageId);
    return { version: version?.version ?? null, publishedAt: new Date().toISOString() };
  });
}
