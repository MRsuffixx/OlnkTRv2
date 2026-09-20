import type { CSSProperties } from "react";

import type { ThemeConfigV2 } from "~/server/publishing/theme-v2";

const fontStacks: Record<ThemeConfigV2["typography"]["body"]["family"], string> = {
  geist: "var(--font-geist-sans), Inter, ui-sans-serif, sans-serif",
  inter: "var(--font-inter), var(--font-geist-sans), ui-sans-serif, sans-serif",
  manrope:
    "var(--font-manrope), var(--font-geist-sans), ui-sans-serif, sans-serif",
  "dm-sans":
    "var(--font-dm-sans), var(--font-geist-sans), ui-sans-serif, sans-serif",
  "space-grotesk":
    "var(--font-space-grotesk), var(--font-geist-sans), ui-sans-serif, sans-serif",
  lora: "var(--font-lora), ui-serif, Georgia, serif",
  "playfair-display":
    "var(--font-playfair-display), ui-serif, Georgia, serif",
  "space-mono": "var(--font-space-mono), ui-monospace, monospace",
  "jetbrains-mono": "var(--font-jetbrains-mono), ui-monospace, monospace",
};

export function themeFontStack(
  family: ThemeConfigV2["typography"]["body"]["family"],
) {
  return fontStacks[family];
}

export function themeBackgroundStyle(theme: ThemeConfigV2): CSSProperties {
  return themeBackgroundStyleForMode(theme, false);
}

export function themeBackgroundStyleForMode(
  theme: ThemeConfigV2,
  dark: boolean,
): CSSProperties {
  const source = theme.background;
  if (source.type === "SOLID") {
    return {
      background: dark ? theme.mode.darkColors.background : source.color,
    };
  }
  if (source.type === "IMAGE" || source.type === "VIDEO") {
    return {
      background: dark
        ? theme.mode.darkColors.background
        : theme.colors.background,
    };
  }

  const colors = (dark
    ? source.stops.map(
        (color) =>
          `color-mix(in srgb, ${color} 34%, ${theme.mode.darkColors.background})`,
      )
    : source.stops
  ).join(", ");
  return {
    backgroundImage: `linear-gradient(${source.angle}deg, ${colors})`,
    backgroundSize:
      source.type === "ANIMATED_GRADIENT" ? "300% 300%" : undefined,
  };
}

export function themeColorVariables(
  theme: ThemeConfigV2,
  dark: boolean,
): CSSProperties {
  const colors = dark ? theme.mode.darkColors : theme.colors;
  return {
    "--olnk-page-background": colors.background,
    "--olnk-page-text": colors.text,
    "--olnk-page-muted": colors.mutedText,
    "--olnk-page-accent": colors.accent,
    "--olnk-page-button": colors.button,
    "--olnk-page-button-text": colors.buttonText,
    "--olnk-page-border": colors.border,
    "--olnk-page-shadow": colors.shadow,
  } as CSSProperties;
}

export function themeOverlayStyle(theme: ThemeConfigV2): CSSProperties {
  const overlay = theme.background.overlay;
  return {
    backgroundColor: overlay.color,
    opacity: overlay.opacity / 100,
    backdropFilter:
      overlay.blur || overlay.glass
        ? `blur(${overlay.blur}px) saturate(${100 + overlay.glass}%)`
        : undefined,
  };
}

export function avatarRadius(theme: ThemeConfigV2) {
  if (theme.avatar.shape === "circle") return 999;
  if (theme.avatar.shape === "square") return 4;
  return 20;
}

export function avatarFrameStyle(theme: ThemeConfigV2): CSSProperties {
  const { avatar } = theme;
  const ring = avatar.ring;
  const ringColor =
    ring.style === "gradient" || ring.style === "neon"
      ? `linear-gradient(135deg, ${ring.colors.join(", ")})`
      : ring.colors[0];
  const shadow =
    avatar.shadow === "strong"
      ? "0 14px 34px color-mix(in srgb, var(--olnk-page-shadow) 32%, transparent)"
      : avatar.shadow === "soft"
        ? "0 7px 20px color-mix(in srgb, var(--olnk-page-shadow) 18%, transparent)"
        : avatar.shadow === "glow"
          ? `0 0 26px color-mix(in srgb, ${ring.colors[0]} 68%, transparent)`
          : undefined;

  return {
    width: avatar.size,
    height: avatar.size,
    borderRadius: avatarRadius(theme),
    border: `${avatar.borderWidth}px solid ${avatar.borderColor}`,
    background: ring.style === "none" ? undefined : ringColor,
    padding: ring.style === "none" ? 0 : 3,
    boxShadow: shadow,
  };
}

export function buttonStyle(theme: ThemeConfigV2): CSSProperties {
  const button = theme.buttons;
  const radius =
    button.shape === "pill"
      ? 999
      : button.shape === "sharp" || button.shape === "brutalist"
        ? 0
        : button.radius;
  const hardShadow = `${Math.max(3, button.borderWidth + 3)}px ${Math.max(3, button.borderWidth + 3)}px 0 ${button.shadowColor}`;
  const shadow =
    button.shape === "brutalist" || button.shadow === "hard"
      ? hardShadow
      : button.shadow === "soft"
        ? `0 7px 20px color-mix(in srgb, ${button.shadowColor} 18%, transparent)`
        : button.shadow === "glow" || button.style === "neon"
        ? "0 0 24px color-mix(in srgb, var(--olnk-page-button) 60%, transparent)"
          : undefined;
  const fill = button.style === "solid" || button.shape === "brutalist";

  return {
    minHeight: button.height,
    borderRadius: radius,
    border:
      button.style === "outline" || button.shape === "brutalist"
        ? `${Math.max(1, button.borderWidth)}px solid ${theme.colors.border}`
        : button.style === "transparent"
          ? `${button.borderWidth}px solid transparent`
          : `${button.borderWidth}px solid color-mix(in srgb, ${theme.colors.border} 45%, transparent)`,
    background:
      fill
        ? "var(--olnk-page-button)"
        : button.style === "soft"
          ? "color-mix(in srgb, var(--olnk-page-button) 14%, transparent)"
          : button.style === "glass"
            ? `color-mix(in srgb, var(--olnk-page-button) ${button.glassOpacity}%, transparent)`
            : "transparent",
    color: fill ? "var(--olnk-page-button-text)" : "var(--olnk-page-text)",
    boxShadow: shadow,
    backdropFilter: button.style === "glass" ? "blur(14px)" : undefined,
  };
}

export function buttonMotionClass(theme: ThemeConfigV2) {
  return {
    none: "",
    expand: "hover:scale-[1.015]",
    "color-shift": "hover:saturate-150 hover:brightness-105",
    pulse: "hover:animate-pulse",
    neon: "hover:brightness-125",
  }[theme.buttons.hoverEffect];
}
