import { z } from "zod";
import { safeExternalUrlSchema } from "~/server/security/url";

const link = z.object({ title: z.string().trim().min(1).max(120), url: safeExternalUrlSchema, description: z.string().max(240).optional() }).strict();
const text = z.object({ text: z.string().trim().min(1).max(5000) }).strict();
const heading = z.object({ text: z.string().trim().min(1).max(200), level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2) }).strict();
const divider = z.object({}).strict();
const image = z.object({ assetId: z.string().cuid(), alt: z.string().max(300), href: safeExternalUrlSchema.optional() }).strict();
const socials = z.object({ items: z.array(z.object({ label: z.string().min(1).max(50), url: safeExternalUrlSchema }).strict()).max(30) }).strict();

export const blockConfigSchemas = { LINK: link, TEXT: text, HEADING: heading, DIVIDER: divider, IMAGE: image, SOCIALS: socials } as const;
export type SupportedBlockType = keyof typeof blockConfigSchemas;
export function parseBlockConfig(type: string, config: unknown): unknown {
  const schema = blockConfigSchemas[type as SupportedBlockType];
  if (!schema) throw new Error(`Unsupported block type: ${type}`);
  return schema.parse(config);
}
