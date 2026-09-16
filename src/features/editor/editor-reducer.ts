import type { ThemeConfig } from "~/server/publishing/snapshot";

export type EditorSection = "content" | "appearance" | "background" | "typography" | "buttons" | "seo";
export type PreviewDevice = "mobile" | "tablet" | "desktop";
export type SaveStatus = "saved" | "dirty" | "saving" | "error";

export interface EditorBlock {
  id: string;
  type: string;
  position: number;
  enabled: boolean;
  config: unknown;
}

export interface EditorSeoConfig {
  schemaVersion: 1;
  title?: string;
  description?: string;
  ogImageAssetId?: string;
  robots: "index,follow" | "noindex,nofollow";
}

export interface EditorDocument {
  pageId: string;
  title: string | null;
  description: string | null;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  theme: ThemeConfig;
  seo: EditorSeoConfig;
  blocks: EditorBlock[];
}

export interface EditorState {
  document: EditorDocument;
  confirmed: EditorDocument;
  selectedBlockId: string | null;
  section: EditorSection;
  previewDevice: PreviewDevice;
  zoom: number;
  saveStatus: SaveStatus;
  error: string | null;
}

type EditorAction =
  | { type: "page.updated"; patch: Partial<Pick<EditorDocument, "title" | "description" | "visibility">> }
  | { type: "theme.replaced"; theme: ThemeConfig }
  | { type: "seo.updated"; seo: EditorSeoConfig }
  | { type: "block.updated"; blockId: string; config: unknown }
  | { type: "block.added"; block: EditorBlock }
  | { type: "block.deleted"; blockId: string }
  | { type: "block.toggled"; blockId: string; enabled: boolean }
  | { type: "blocks.reordered"; from: number; to: number }
  | { type: "block.selected"; blockId: string | null }
  | { type: "section.changed"; section: EditorSection }
  | { type: "preview.changed"; device: PreviewDevice }
  | { type: "zoom.changed"; zoom: number }
  | { type: "save.started" }
  | { type: "save.succeeded"; document: EditorDocument }
  | { type: "save.failed"; message: string };

export function createEditorState(document: EditorDocument): EditorState {
  return {
    document,
    confirmed: document,
    selectedBlockId: document.blocks[0]?.id ?? null,
    section: "content",
    previewDevice: "mobile",
    zoom: 100,
    saveStatus: "saved",
    error: null,
  };
}

function dirty(state: EditorState, document: EditorDocument): EditorState {
  return { ...state, document, saveStatus: "dirty", error: null };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "page.updated":
      return dirty(state, { ...state.document, ...action.patch });
    case "theme.replaced":
      return dirty(state, { ...state.document, theme: action.theme });
    case "seo.updated":
      return dirty(state, { ...state.document, seo: action.seo });
    case "block.updated":
      return dirty(state, { ...state.document, blocks: state.document.blocks.map((block) => block.id === action.blockId ? { ...block, config: action.config } : block) });
    case "block.added":
      return { ...dirty(state, { ...state.document, blocks: [...state.document.blocks, action.block] }), selectedBlockId: action.block.id };
    case "block.deleted":
      return { ...dirty(state, { ...state.document, blocks: state.document.blocks.filter((block) => block.id !== action.blockId).map((block, position) => ({ ...block, position })) }), selectedBlockId: state.selectedBlockId === action.blockId ? null : state.selectedBlockId };
    case "block.toggled":
      return dirty(state, { ...state.document, blocks: state.document.blocks.map((block) => block.id === action.blockId ? { ...block, enabled: action.enabled } : block) });
    case "blocks.reordered": {
      if (action.from === action.to) return state;
      const blocks = [...state.document.blocks];
      const [moved] = blocks.splice(action.from, 1);
      if (!moved) return state;
      blocks.splice(action.to, 0, moved);
      return dirty(state, { ...state.document, blocks: blocks.map((block, position) => ({ ...block, position })) });
    }
    case "block.selected":
      return { ...state, selectedBlockId: action.blockId, section: "content" };
    case "section.changed":
      return { ...state, section: action.section, selectedBlockId: action.section === "content" ? state.selectedBlockId : null };
    case "preview.changed":
      return { ...state, previewDevice: action.device };
    case "zoom.changed":
      return { ...state, zoom: action.zoom };
    case "save.started":
      return { ...state, saveStatus: "saving", error: null };
    case "save.succeeded":
      return {
        ...state,
        confirmed: action.document,
        saveStatus: state.document === action.document ? "saved" : "dirty",
        error: null,
      };
    case "save.failed":
      return { ...state, saveStatus: "error", error: action.message };
  }
}
