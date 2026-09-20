import { z } from "zod";

import { safeExternalUrlSchema } from "~/server/security/url";

const link = z
  .object({
    title: z.string().trim().min(1).max(120),
    url: safeExternalUrlSchema,
    description: z.string().max(240).optional(),
  })
  .strict();
const text = z.object({ text: z.string().trim().min(1).max(5000) }).strict();
const heading = z
  .object({
    text: z.string().trim().min(1).max(200),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  })
  .strict();
const divider = z.object({}).strict();
const image = z
  .object({
    assetId: z.string().cuid(),
    alt: z.string().max(300),
    href: safeExternalUrlSchema.optional(),
  })
  .strict();
const socials = z
  .object({
    items: z
      .array(
        z
          .object({
            label: z.string().min(1).max(50),
            url: safeExternalUrlSchema,
          })
          .strict(),
      )
      .max(30),
  })
  .strict();
const highlight = z
  .object({
    title: z.string().trim().min(1).max(100),
    text: z.string().trim().max(300).optional(),
    href: safeExternalUrlSchema.optional(),
    tone: z.enum(["accent", "success", "warning", "neutral"]),
  })
  .strict();
const countdown = z
  .object({
    title: z.string().trim().min(1).max(100),
    targetAt: z.string().datetime({ offset: true }),
    expiredLabel: z.string().trim().min(1).max(80),
  })
  .strict();
const visitorCounter = z
  .object({
    label: z.string().trim().min(1).max(80),
    period: z.enum(["daily", "total"]),
  })
  .strict();
const support = z
  .object({
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().max(240).optional(),
    provider: z.enum(["coffee", "buymeacoffee", "papara", "iban", "custom"]),
    href: safeExternalUrlSchema.optional(),
    iban: z
      .string()
      .transform((value) => value.replaceAll(" ", "").toUpperCase())
      .pipe(z.string().regex(/^[A-Z]{2}[0-9A-Z]{13,32}$/))
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.provider === "iban" && !value.iban) {
      context.addIssue({
        code: "custom",
        path: ["iban"],
        message: "IBAN_REQUIRED",
      });
    }
    if (value.provider !== "iban" && !value.href) {
      context.addIssue({
        code: "custom",
        path: ["href"],
        message: "SUPPORT_URL_REQUIRED",
      });
    }
  });
const poll = z
  .object({
    question: z.string().trim().min(1).max(180),
    options: z
      .array(
        z
          .object({
            key: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,31}$/),
            label: z.string().trim().min(1).max(100),
          })
          .strict(),
      )
      .min(2)
      .max(6),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.options.map((option) => option.key)).size !== value.options.length) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "POLL_OPTION_KEYS_MUST_BE_UNIQUE",
      });
    }
  });
const discord = z
  .object({
    discordUserId: z.string().regex(/^\d{17,20}$/),
    showSpotify: z.boolean(),
    showActivity: z.boolean(),
  })
  .strict();
const github = z
  .object({
    username: z
      .string()
      .regex(/^(?!-)(?!.*--)[A-Za-z0-9-]{1,39}(?<!-)$/),
    showContributions: z.boolean(),
  })
  .strict();
const youtubeUrl = safeExternalUrlSchema.refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    (url.hostname === "youtube.com" || url.hostname === "www.youtube.com")
  );
}, "YouTube channel URL required");
const spotifyUrl = safeExternalUrlSchema.refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname === "open.spotify.com";
}, "Spotify URL required");
const youtube = z.object({ channelUrl: youtubeUrl }).strict();
const twitch = z
  .object({ channel: z.string().regex(/^[A-Za-z0-9_]{3,25}$/) })
  .strict();
const spotify = z.object({ resourceUrl: spotifyUrl }).strict();

export const blockConfigSchemas = {
  LINK: link,
  TEXT: text,
  HEADING: heading,
  DIVIDER: divider,
  IMAGE: image,
  SOCIALS: socials,
  HIGHLIGHT: highlight,
  COUNTDOWN: countdown,
  VISITOR_COUNTER: visitorCounter,
  SUPPORT: support,
  POLL: poll,
  DISCORD: discord,
  GITHUB: github,
  YOUTUBE: youtube,
  TWITCH: twitch,
  SPOTIFY: spotify,
} as const;

export type SupportedBlockType = keyof typeof blockConfigSchemas;

export function parseBlockConfig(type: string, config: unknown): unknown {
  const schema = blockConfigSchemas[type as SupportedBlockType];
  if (!schema) throw new Error(`Unsupported block type: ${type}`);
  return schema.parse(config);
}
