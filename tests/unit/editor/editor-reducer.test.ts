import { describe, expect, it } from "vitest";

import { createEditorState, editorReducer, type EditorDocument } from "~/features/editor/editor-reducer";
import { defaultThemeConfig } from "~/server/publishing/theme-v2";

const document: EditorDocument = {
  pageId: "page-1",
  title: null,
  description: null,
  visibility: "PUBLIC",
  theme: defaultThemeConfig,
  seo: { schemaVersion: 1, robots: "index,follow" },
  blocks: [{ id: "block-1", type: "LINK", position: 0, enabled: true, config: { title: "GitHub", url: "https://github.com" } }],
};

describe("editorReducer", () => {
  it("opens on the block list instead of selecting an item implicitly", () => {
    expect(createEditorState(document).selectedBlockId).toBeNull();
  });

  it("marks a local edit dirty without changing the confirmed snapshot", () => {
    const next = editorReducer(createEditorState(document), {
      type: "block.updated",
      blockId: "block-1",
      config: { title: "Portfolio", url: "https://example.com" },
    });
    expect(next.saveStatus).toBe("dirty");
    expect(next.document.blocks[0]?.config).toEqual({ title: "Portfolio", url: "https://example.com" });
    expect(next.confirmed.blocks[0]?.config).toEqual({ title: "GitHub", url: "https://github.com" });
  });

  it("promotes the local document after a successful save", () => {
    const dirty = editorReducer(createEditorState(document), { type: "page.updated", patch: { title: "Creator" } });
    const saved = editorReducer(dirty, { type: "save.succeeded", document: dirty.document });
    expect(saved.saveStatus).toBe("saved");
    expect(saved.confirmed.title).toBe("Creator");
  });

  it("keeps newer edits dirty when an older autosave completes", () => {
    const first = editorReducer(createEditorState(document), { type: "page.updated", patch: { title: "First" } });
    const newer = editorReducer(first, { type: "page.updated", patch: { title: "Second" } });
    const completed = editorReducer(newer, { type: "save.succeeded", document: first.document });

    expect(completed.confirmed.title).toBe("First");
    expect(completed.document.title).toBe("Second");
    expect(completed.saveStatus).toBe("dirty");
  });

  it("reorders blocks and normalizes their positions", () => {
    const withSecond = { ...document, blocks: [...document.blocks, { id: "block-2", type: "TEXT", position: 1, enabled: true, config: { text: "Hello" } }] };
    const next = editorReducer(createEditorState(withSecond), { type: "blocks.reordered", from: 1, to: 0 });
    expect(next.document.blocks.map((block) => [block.id, block.position])).toEqual([["block-2", 0], ["block-1", 1]]);
  });

  it("updates SEO state without changing page metadata", () => {
    const next = editorReducer(createEditorState(document), {
      type: "seo.updated",
      seo: { ...document.seo, robots: "noindex,nofollow" },
    });
    expect(next.document.seo.robots).toBe("noindex,nofollow");
    expect(next.document.title).toBeNull();
  });

  it("opens theme presets without mutating the draft", () => {
    const next = editorReducer(createEditorState(document), { type: "section.changed", section: "themes" });
    expect(next.section).toBe("themes");
    expect(next.document).toBe(document);
    expect(next.saveStatus).toBe("saved");
  });
});
