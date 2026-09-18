import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const assetId = z.string().cuid();
const clockTime = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);

export const fontFamilySchema = z.enum([
  "geist",
  "inter",
  "manrope",
  "dm-sans",
  "space-grotesk",
  "lora",
  "playfair-display",
  "space-mono",
  "jetbrains-mono",
]);

const overlaySchema = z
  .object({
    color: hexColor,
    opacity: z.number().int().min(0).max(100),
    blur: z.number().int().min(0).max(30),
    glass: z.number().int().min(0).max(100),
  })
  .strict();

const backgroundSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("SOLID"),
      color: hexColor,
      overlay: overlaySchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("GRADIENT"),
      stops: z.array(hexColor).min(2).max(4),
      angle: z.number().int().min(0).max(360),
      overlay: overlaySchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("ANIMATED_GRADIENT"),
      stops: z.array(hexColor).min(3).max(5),
      angle: z.number().int().min(0).max(360),
      motion: z.enum(["shift", "waves"]),
      speed: z.number().int().min(8).max(40),
      overlay: overlaySchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("IMAGE"),
      assetId,
      fit: z.enum(["cover", "contain"]),
      focalX: z.number().int().min(0).max(100),
      focalY: z.number().int().min(0).max(100),
      opacity: z.number().int().min(10).max(100),
      overlay: overlaySchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("VIDEO"),
      assetId,
      posterAssetId: assetId.optional(),
      opacity: z.number().int().min(10).max(100),
      overlay: overlaySchema,
    })
    .strict(),
]);

const typeStyleSchema = z
  .object({
    family: fontFamilySchema,
    scale: z.number().int().min(75).max(160),
    weight: z.union([
      z.literal(400),
      z.literal(500),
      z.literal(600),
      z.literal(700),
    ]),
    letterSpacing: z.number().min(-0.08).max(0.2),
  })
  .strict();

export const themeConfigV2Schema = z
  .object({
    schemaVersion: z.literal(2),
    mode: z
      .object({
        strategy: z.enum(["light", "dark", "system", "scheduled"]),
        dayStart: clockTime,
        nightStart: clockTime,
      })
      .strict(),
    colors: z
      .object({
        background: hexColor,
        text: hexColor,
        mutedText: hexColor,
        accent: hexColor,
        button: hexColor,
        buttonText: hexColor,
        border: hexColor,
        shadow: hexColor,
      })
      .strict(),
    background: backgroundSchema,
    layout: z
      .object({
        alignment: z.enum(["left", "center"]),
        maxWidth: z.number().int().min(360).max(960),
        blockGap: z.number().int().min(4).max(48),
        pagePadding: z.number().int().min(12).max(80),
        profileLayout: z.enum(["centered", "left-card", "banner"]),
        socialPlacement: z.enum(["top", "bottom", "fixed-footer"]),
        coverAssetId: assetId.optional(),
      })
      .strict(),
    avatar: z
      .object({
        size: z.number().int().min(48).max(192),
        shape: z.enum(["circle", "rounded", "square"]),
        borderWidth: z.number().int().min(0).max(10),
        borderColor: hexColor,
        ring: z
          .object({
            style: z.enum(["none", "solid", "gradient", "neon"]),
            colors: z.array(hexColor).min(1).max(4),
          })
          .strict(),
        shadow: z.enum(["none", "soft", "strong", "glow"]),
        cropX: z.number().int().min(0).max(100),
        cropY: z.number().int().min(0).max(100),
        zoom: z.number().min(1).max(3),
      })
      .strict(),
    typography: z
      .object({
        heading: typeStyleSchema,
        body: typeStyleSchema.extend({ lineHeight: z.number().min(1.2).max(2) }),
      })
      .strict(),
    buttons: z
      .object({
        style: z.enum([
          "solid",
          "outline",
          "transparent",
          "soft",
          "glass",
          "neon",
        ]),
        shape: z.enum(["sharp", "rounded", "pill", "brutalist"]),
        height: z.number().int().min(40).max(80),
        radius: z.number().int().min(0).max(40),
        borderWidth: z.number().int().min(0).max(6),
        shadow: z.enum(["none", "soft", "hard", "glow"]),
        shadowColor: hexColor,
        glassOpacity: z.number().int().min(0).max(100),
        hoverEffect: z.enum([
          "none",
          "expand",
          "color-shift",
          "pulse",
          "neon",
        ]),
      })
      .strict(),
    effects: z
      .object({
        layer: z.enum([
          "none",
          "animated-gradient",
          "waves",
          "snow",
          "stars",
          "digital-rain",
        ]),
        density: z.number().int().min(1).max(100),
        speed: z.number().int().min(1).max(100),
        intensity: z.number().int().min(1).max(100),
        reducedMotion: z.enum(["static", "off"]),
      })
      .strict(),
    branding: z.object({ visible: z.boolean() }).strict(),
  })
  .strict();

export type ThemeConfigV2 = z.infer<typeof themeConfigV2Schema>;

const defaultOverlay = {
  color: "#000000",
  opacity: 0,
  blur: 0,
  glass: 0,
} as const;

export const defaultThemeConfig: ThemeConfigV2 = themeConfigV2Schema.parse({
  schemaVersion: 2,
  mode: { strategy: "system", dayStart: "07:00", nightStart: "19:00" },
  colors: {
    background: "#f7f7fa",
    text: "#181824",
    mutedText: "#626273",
    accent: "#6558e8",
    button: "#6558e8",
    buttonText: "#ffffff",
    border: "#dedee8",
    shadow: "#181824",
  },
  background: {
    type: "SOLID",
    color: "#f7f7fa",
    overlay: defaultOverlay,
  },
  layout: {
    alignment: "center",
    maxWidth: 560,
    blockGap: 12,
    pagePadding: 24,
    profileLayout: "centered",
    socialPlacement: "bottom",
  },
  avatar: {
    size: 80,
    shape: "circle",
    borderWidth: 1,
    borderColor: "#dedee8",
    ring: { style: "none", colors: ["#6558e8", "#b66cff"] },
    shadow: "soft",
    cropX: 50,
    cropY: 50,
    zoom: 1,
  },
  typography: {
    heading: {
      family: "geist",
      scale: 100,
      weight: 600,
      letterSpacing: -0.02,
    },
    body: {
      family: "geist",
      scale: 100,
      weight: 500,
      letterSpacing: 0,
      lineHeight: 1.5,
    },
  },
  buttons: {
    style: "solid",
    shape: "rounded",
    height: 52,
    radius: 14,
    borderWidth: 1,
    shadow: "soft",
    shadowColor: "#181824",
    glassOpacity: 16,
    hoverEffect: "expand",
  },
  effects: {
    layer: "none",
    density: 35,
    speed: 35,
    intensity: 30,
    reducedMotion: "static",
  },
  branding: { visible: true },
});

const v1ThemeSchema = z
  .object({
    schemaVersion: z.literal(1),
    colors: z
      .object({
        background: hexColor,
        text: hexColor,
        accent: hexColor.default("#6d5dfc"),
      })
      .strict(),
    layout: z
      .object({
        alignment: z.enum(["left", "center"]).default("center"),
        maxWidth: z.number().int().min(360).max(840).default(560),
        blockGap: z.number().int().min(4).max(40).default(12),
        pagePadding: z.number().int().min(12).max(64).default(24),
        avatarShape: z
          .enum(["circle", "rounded", "square"])
          .default("circle"),
      })
      .strict()
      .default({
        alignment: "center",
        maxWidth: 560,
        blockGap: 12,
        pagePadding: 24,
        avatarShape: "circle",
      }),
    background: z
      .discriminatedUnion("type", [
        z.object({ type: z.literal("COLOR") }).strict(),
        z
          .object({
            type: z.literal("GRADIENT"),
            from: hexColor,
            to: hexColor,
            angle: z.number().int().min(0).max(360),
          })
          .strict(),
      ])
      .default({ type: "COLOR" }),
    typography: z
      .object({
        family: z.enum(["geist", "serif", "mono"]).default("geist"),
        scale: z.number().int().min(80).max(130).default(100),
        weight: z
          .enum(["regular", "medium", "semibold"])
          .default("medium"),
        lineHeight: z.number().min(1.2).max(2).default(1.5),
      })
      .strict()
      .default({
        family: "geist",
        scale: 100,
        weight: "medium",
        lineHeight: 1.5,
      }),
    buttons: z
      .object({
        style: z
          .enum(["fill", "outline", "soft", "minimal"])
          .default("fill"),
        shape: z.enum(["square", "rounded", "pill"]).default("rounded"),
        height: z.number().int().min(40).max(72).default(52),
        shadow: z.enum(["none", "soft", "strong"]).default("soft"),
      })
      .strict()
      .default({
        style: "fill",
        shape: "rounded",
        height: 52,
        shadow: "soft",
      }),
  })
  .strict();

function legacyFont(value: "geist" | "serif" | "mono") {
  if (value === "serif") return "lora" as const;
  if (value === "mono") return "space-mono" as const;
  return "geist" as const;
}

export function migrateThemeConfig(value: unknown): ThemeConfigV2 {
  const current = themeConfigV2Schema.safeParse(value);
  if (current.success) return current.data;

  const legacy = v1ThemeSchema.parse(value);
  const family = legacyFont(legacy.typography.family);
  const weight =
    legacy.typography.weight === "regular"
      ? 400
      : legacy.typography.weight === "semibold"
        ? 600
        : 500;
  const background =
    legacy.background.type === "GRADIENT"
      ? {
          type: "GRADIENT" as const,
          stops: [legacy.background.from, legacy.background.to],
          angle: legacy.background.angle,
          overlay: defaultOverlay,
        }
      : {
          type: "SOLID" as const,
          color: legacy.colors.background,
          overlay: defaultOverlay,
        };

  return themeConfigV2Schema.parse({
    ...defaultThemeConfig,
    colors: {
      ...defaultThemeConfig.colors,
      background: legacy.colors.background,
      text: legacy.colors.text,
      mutedText: legacy.colors.text,
      accent: legacy.colors.accent,
      button: legacy.colors.accent,
    },
    background,
    layout: {
      ...defaultThemeConfig.layout,
      alignment: legacy.layout.alignment,
      maxWidth: legacy.layout.maxWidth,
      blockGap: legacy.layout.blockGap,
      pagePadding: legacy.layout.pagePadding,
    },
    avatar: {
      ...defaultThemeConfig.avatar,
      shape: legacy.layout.avatarShape,
    },
    typography: {
      heading: {
        ...defaultThemeConfig.typography.heading,
        family,
        scale: legacy.typography.scale,
        weight,
      },
      body: {
        ...defaultThemeConfig.typography.body,
        family,
        scale: legacy.typography.scale,
        weight,
        lineHeight: legacy.typography.lineHeight,
      },
    },
    buttons: {
      ...defaultThemeConfig.buttons,
      style:
        legacy.buttons.style === "fill"
          ? "solid"
          : legacy.buttons.style === "minimal"
            ? "transparent"
            : legacy.buttons.style,
      shape:
        legacy.buttons.shape === "square" ? "sharp" : legacy.buttons.shape,
      height: legacy.buttons.height,
      shadow:
        legacy.buttons.shadow === "strong"
          ? "hard"
          : legacy.buttons.shadow,
    },
  });
}
