import { z } from "zod";
import { parseBlockConfig } from "~/server/page/block-schemas";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const themeConfigSchema = z.object({
  schemaVersion: z.literal(1),
  colors: z.object({
    background: hexColor,
    text: hexColor,
    accent: hexColor.default("#6d5dfc"),
  }).strict(),
  layout: z.object({
    alignment: z.enum(["left", "center"]).default("center"),
    maxWidth: z.number().int().min(360).max(840).default(560),
    blockGap: z.number().int().min(4).max(40).default(12),
    pagePadding: z.number().int().min(12).max(64).default(24),
    avatarShape: z.enum(["circle", "rounded", "square"]).default("circle"),
  }).strict().default({ alignment: "center", maxWidth: 560, blockGap: 12, pagePadding: 24, avatarShape: "circle" }),
  background: z.discriminatedUnion("type", [
    z.object({ type: z.literal("COLOR") }).strict(),
    z.object({ type: z.literal("GRADIENT"), from: hexColor, to: hexColor, angle: z.number().int().min(0).max(360) }).strict(),
  ]).default({ type: "COLOR" }),
  typography: z.object({
    family: z.enum(["geist", "serif", "mono"]).default("geist"),
    scale: z.number().int().min(80).max(130).default(100),
    weight: z.enum(["regular", "medium", "semibold"]).default("medium"),
    lineHeight: z.number().min(1.2).max(2).default(1.5),
  }).strict().default({ family: "geist", scale: 100, weight: "medium", lineHeight: 1.5 }),
  buttons: z.object({
    style: z.enum(["fill", "outline", "soft", "minimal"]).default("fill"),
    shape: z.enum(["square", "rounded", "pill"]).default("rounded"),
    height: z.number().int().min(40).max(72).default(52),
    shadow: z.enum(["none", "soft", "strong"]).default("soft"),
  }).strict().default({ style: "fill", shape: "rounded", height: 52, shadow: "soft" }),
}).strict();

export type ThemeConfig = z.infer<typeof themeConfigSchema>;
export const normalizeThemeConfig = (value: unknown): ThemeConfig => themeConfigSchema.parse(value);
export const seoConfigSchema = z.object({ schemaVersion: z.literal(1), title: z.string().max(120).optional(), description: z.string().max(300).optional(), ogImageAssetId: z.string().cuid().optional(), robots: z.enum(["index,follow", "noindex,nofollow"]).default("index,follow") }).strict();
export const pageDraftUpdateSchema = z.object({
  pageId: z.string().cuid(),
  title: z.string().trim().max(120).nullable(),
  description: z.string().trim().max(300).nullable(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]),
  theme: themeConfigSchema,
  seo: seoConfigSchema,
});
export type PageDraftUpdateInput = z.infer<typeof pageDraftUpdateSchema>;
const storedSnapshotSchema=z.object({schemaVersion:z.literal(1),profile:z.object({username:z.string(),displayName:z.string(),bio:z.string().nullable(),avatarUrl:z.string().nullable()}),page:z.object({title:z.string().nullable(),description:z.string().nullable(),visibility:z.enum(["PUBLIC","UNLISTED","PRIVATE"])}),theme:themeConfigSchema,blocks:z.array(z.object({id:z.string(),type:z.string(),config:z.unknown()})),generatedAt:z.string().datetime()});
export function parsePublicationSnapshot(value:unknown){const parsed=storedSnapshotSchema.parse(value);return{...parsed,blocks:parsed.blocks.map(block=>({...block,config:parseBlockConfig(block.type,block.config)}))};}

interface DraftInput {
  profile: { username: string; displayName: string; bio: string | null; avatarUrl: string | null };
  page: { title: string | null; description: string | null; visibility: "PUBLIC" | "UNLISTED" | "PRIVATE" };
  theme: unknown;
  blocks: Array<{ id: string; type: string; enabled: boolean; position: number; config: unknown }>;
}

export function buildPublicationSnapshot(input: DraftInput) {
  const snapshot = {
    schemaVersion: 1 as const,
    profile: input.profile,
    page: input.page,
    theme: themeConfigSchema.parse(input.theme),
    blocks: input.blocks.filter((block) => block.enabled).sort((a, b) => a.position - b.position).map((block) => ({ id: block.id, type: block.type, config: parseBlockConfig(block.type, block.config) })),
    generatedAt: new Date().toISOString(),
  };
  return Object.freeze(snapshot);
}
