import { z } from "zod";
import { parseBlockConfig } from "~/server/page/block-schemas";
import {
  migrateThemeConfig,
  themeConfigV2Schema,
  type ThemeConfigV2,
} from "./theme-v2";

export const themeConfigSchema = z.preprocess(
  migrateThemeConfig,
  themeConfigV2Schema,
);

export type ThemeConfig = ThemeConfigV2;
export const normalizeThemeConfig = migrateThemeConfig;
export const defaultSeoConfig = {
  schemaVersion: 1,
  robots: "index,follow",
} as const;
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
const storedSnapshotSchema=z.object({schemaVersion:z.literal(1),profile:z.object({username:z.string(),displayName:z.string(),bio:z.string().nullable(),avatarUrl:z.string().nullable(),verified:z.boolean().default(false)}),page:z.object({title:z.string().nullable(),description:z.string().nullable(),visibility:z.enum(["PUBLIC","UNLISTED","PRIVATE"])}),seo:seoConfigSchema.default(defaultSeoConfig),theme:themeConfigSchema,blocks:z.array(z.object({id:z.string(),type:z.string(),config:z.unknown()})),generatedAt:z.string().datetime()});
export function parsePublicationSnapshot(value:unknown){const parsed=storedSnapshotSchema.parse(value);return{...parsed,blocks:parsed.blocks.map(block=>({...block,config:parseBlockConfig(block.type,block.config)}))};}

interface DraftInput {
  profile: { username: string; displayName: string; bio: string | null; avatarUrl: string | null; verified?: boolean };
  page: { title: string | null; description: string | null; visibility: "PUBLIC" | "UNLISTED" | "PRIVATE" };
  seo?: unknown;
  theme: unknown;
  blocks: Array<{ id: string; type: string; enabled: boolean; position: number; config: unknown }>;
}

export function buildPublicationSnapshot(input: DraftInput) {
  const snapshot = {
    schemaVersion: 1 as const,
    profile: input.profile,
    page: input.page,
    seo: seoConfigSchema.parse(input.seo ?? defaultSeoConfig),
    theme: migrateThemeConfig(input.theme),
    blocks: input.blocks.filter((block) => block.enabled).sort((a, b) => a.position - b.position).map((block) => ({ id: block.id, type: block.type, config: parseBlockConfig(block.type, block.config) })),
    generatedAt: new Date().toISOString(),
  };
  return Object.freeze(snapshot);
}
