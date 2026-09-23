import { z } from "zod";

import { safeExternalUrlSchema } from "~/server/security/url";

const schemaVersion = z.literal(1).default(1);

export const basicIconSchema = z.enum([
  "link",
  "star",
  "heart",
  "play",
  "shopping-bag",
  "calendar",
  "message-circle",
  "external-link",
]);

const safeWebUrlSchema = safeExternalUrlSchema.refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}, "HTTP or HTTPS URL required");

function record(value: unknown) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

const link = z.preprocess(
  (value) => {
    const input = record(value);
    return input
      ? { schemaVersion: 1, variant: "standard", ...input }
      : value;
  },
  z
  .object({
    schemaVersion,
    title: z.string().trim().min(1).max(120),
    url: safeExternalUrlSchema,
    description: z.string().trim().max(240).optional(),
    icon: basicIconSchema.optional(),
    variant: z.enum(["standard", "compact"]).default("standard"),
  })
  .strict(),
);
const featuredLink = z
  .object({
    schemaVersion,
    title: z.string().trim().min(1).max(120),
    url: safeExternalUrlSchema,
    description: z.string().trim().max(300).optional(),
    icon: basicIconSchema.optional(),
    assetId: z.string().cuid().optional(),
    presentation: z.enum(["compact", "image", "spotlight"]).default("spotlight"),
  })
  .strict();
const button = z
  .object({
    schemaVersion,
    title: z.string().trim().min(1).max(120),
    url: safeExternalUrlSchema,
    description: z.string().trim().max(240).optional(),
    icon: basicIconSchema.optional(),
    useGlobalStyle: z.boolean().default(true),
    style: z.enum(["solid", "outline", "soft", "minimal"]).default("solid"),
  })
  .strict();
const spacer = z
  .object({
    schemaVersion,
    size: z.enum(["small", "medium", "large", "custom"]).default("medium"),
    customPixels: z.number().int().min(4).max(160).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.size === "custom" && value.customPixels === undefined) {
      context.addIssue({
        code: "custom",
        path: ["customPixels"],
        message: "CUSTOM_SPACER_SIZE_REQUIRED",
      });
    }
    if (value.size !== "custom" && value.customPixels !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["customPixels"],
        message: "CUSTOM_SPACER_SIZE_NOT_ALLOWED",
      });
    }
  });
const adultLink = z
  .object({
    schemaVersion,
    title: z.string().trim().min(1).max(120),
    url: safeWebUrlSchema,
    description: z.string().trim().max(240).optional(),
    icon: basicIconSchema.optional(),
    platformLabel: z.string().trim().min(1).max(80).optional(),
    attestedAdult: z.literal(true),
  })
  .strict();
const text = z.preprocess(
  (value) => {
    const input = record(value);
    return input
      ? { schemaVersion: 1, alignment: "inherit", ...input }
      : value;
  },
  z
    .object({
      schemaVersion,
      title: z.string().trim().min(1).max(120).optional(),
      text: z.string().trim().min(1).max(5000),
      alignment: z.enum(["inherit", "left", "center", "right"]).default("inherit"),
    })
    .strict(),
);
const heading = z.preprocess(
  (value) => {
    const input = record(value);
    return input ? { schemaVersion: 1, ...input } : value;
  },
  z
  .object({
    schemaVersion,
    text: z.string().trim().min(1).max(200),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  })
  .strict(),
);
const divider = z.preprocess(
  (value) => {
    const input = record(value);
    return input
      ? { schemaVersion: 1, style: "line", thickness: 1, width: 100, ...input }
      : value;
  },
  z
    .object({
      schemaVersion,
      style: z.enum(["line", "dashed", "dotted", "space"]).default("line"),
      thickness: z.number().int().min(1).max(8).default(1),
      width: z.number().int().min(10).max(100).default(100),
    })
    .strict(),
);
const image = z.preprocess(
  (value) => {
    const input = record(value);
    return input
      ? {
          schemaVersion: 1,
          decorative: input.alt === "",
          ...input,
        }
      : value;
  },
  z
  .object({
    schemaVersion,
    assetId: z.string().cuid(),
    alt: z.string().trim().max(300),
    decorative: z.boolean().default(false),
    href: safeExternalUrlSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.decorative && value.alt.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["alt"],
        message: "IMAGE_ALT_REQUIRED",
      });
    }
  }),
);
const socialProviderSchema = z.enum([
  "custom",
  "instagram",
  "x",
  "tiktok",
  "github",
  "discord",
  "youtube",
  "twitch",
  "linkedin",
  "telegram",
  "facebook",
  "website",
]);
const socials = z.preprocess(
  (value) => {
    const input = record(value);
    if (!input) return value;
    const items = Array.isArray(input.items)
      ? input.items.map((item) => {
          const social = record(item);
          return social ? { provider: "custom", ...social } : item;
        })
      : input.items;
    return { schemaVersion: 1, ...input, items };
  },
  z
  .object({
    schemaVersion,
    items: z
      .array(
        z
          .object({
            provider: socialProviderSchema.default("custom"),
            label: z.string().min(1).max(50),
            url: safeExternalUrlSchema,
          })
          .strict(),
      )
      .max(30),
  })
  .strict(),
);
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
  FEATURED_LINK: featuredLink,
  BUTTON: button,
  SPACER: spacer,
  ADULT_LINK: adultLink,
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
