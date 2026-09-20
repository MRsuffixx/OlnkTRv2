"use client";

import { Crown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "~/components/ui/segmented-control";
import { Slider } from "~/components/ui/slider";
import { Textarea } from "~/components/ui/textarea";
import { MediaPicker } from "~/features/media/media-picker";
import type { ThemeConfig } from "~/server/publishing/snapshot";
import type {
  EditorDocument,
  EditorSection,
  EditorSeoConfig,
} from "./editor-reducer";

const fontOptions = [
  ["geist", "Geist", false],
  ["inter", "Inter", false],
  ["manrope", "Manrope", false],
  ["dm-sans", "DM Sans", false],
  ["space-grotesk", "Space Grotesk", false],
  ["lora", "Lora", false],
  ["space-mono", "Space Mono", false],
  ["playfair-display", "Playfair Display · PRO", true],
  ["jetbrains-mono", "JetBrains Mono · PRO", true],
] as const;

const blankOverlay = {
  color: "#000000",
  opacity: 0,
  blur: 0,
  glass: 0,
} as const;

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm font-medium">
      <span>{label}</span>
      <span className="flex items-center gap-2 rounded-sm border border-border bg-surface-raised p-1 pr-2 text-xs font-normal text-muted-foreground">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-7 cursor-pointer rounded-xs border-0 bg-transparent p-0"
        />
        {value.toUpperCase()}
      </span>
    </label>
  );
}

function SectionTitle({
  children,
  premium = false,
}: {
  children: React.ReactNode;
  premium?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h4 className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {children}
      </h4>
      {premium ? (
        <Badge variant="primary" className="gap-1 text-[9px]">
          <Crown className="size-2.5" /> PRO
        </Badge>
      ) : null}
    </div>
  );
}

function ControlSection({
  title,
  children,
  premium,
}: {
  title: string;
  children: React.ReactNode;
  premium?: boolean;
}) {
  return (
    <section>
      <SectionTitle premium={premium}>{title}</SectionTitle>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
        <span>{label}</span>
        <span className="text-xs font-normal tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => {
          const next = values[0];
          if (typeof next === "number") onChange(next);
        }}
      />
    </div>
  );
}

export function AppearanceInspector({
  section,
  document,
  profile,
  onThemeChange,
  onPageChange,
  onSeoChange,
  onAvatarChange,
}: {
  section: Exclude<EditorSection, "content">;
  document: EditorDocument;
  profile: { avatarAssetId: string | null };
  onThemeChange: (theme: ThemeConfig) => void;
  onPageChange: (
    patch: Partial<
      Pick<EditorDocument, "title" | "description" | "visibility">
    >,
  ) => void;
  onSeoChange: (seo: EditorSeoConfig) => void;
  onAvatarChange: (assetId: string | null) => Promise<void>;
}) {
  const t = useTranslations("editor");
  const presets = useTranslations("presets");
  const common = useTranslations("common");
  const theme = document.theme;
  const replace = (patch: Partial<ThemeConfig>) =>
    onThemeChange({ ...theme, ...patch });
  const replaceColors = (patch: Partial<ThemeConfig["colors"]>) =>
    replace({ colors: { ...theme.colors, ...patch } });
  const replaceDarkColors = (
    patch: Partial<ThemeConfig["mode"]["darkColors"]>,
  ) =>
    replace({
      mode: {
        ...theme.mode,
        darkColors: { ...theme.mode.darkColors, ...patch },
      },
    });
  const replaceOverlay = (
    patch: Partial<ThemeConfig["background"]["overlay"]>,
  ) =>
    replace({
      background: {
        ...theme.background,
        overlay: { ...theme.background.overlay, ...patch },
      },
    });
  const primaryBackgroundColor =
    theme.background.type === "SOLID"
      ? theme.background.color
      : theme.background.type === "GRADIENT" ||
          theme.background.type === "ANIMATED_GRADIENT"
        ? (theme.background.stops[0] ?? theme.colors.background)
        : theme.colors.background;

  function updateBackgroundColor(value: string, index = 0) {
    if (theme.background.type === "SOLID") {
      replace({
        background: { ...theme.background, color: value },
        colors: { ...theme.colors, background: value },
      });
      return;
    }
    if (
      theme.background.type === "GRADIENT" ||
      theme.background.type === "ANIMATED_GRADIENT"
    ) {
      const stops = [...theme.background.stops];
      stops[index] = value;
      replace({ background: { ...theme.background, stops } });
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-border-subtle p-4">
        <p className="text-xs font-medium text-muted-foreground">
          {t("design")}
        </p>
        <h3 className="mt-1 text-sm font-semibold">{t(section)}</h3>
      </div>
      <div className="grid gap-7 p-4">
        {section === "themes" ? (
          <div>
            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              {presets("description")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["studio", "#F7F7FA", "#181824", "#6558E8", "#ECEAFB"],
                ["midnight", "#11111B", "#F3F1FF", "#9B8CFF", "#26214A"],
                ["sunset", "#FFF5EF", "#3D1E22", "#E45D5D", "#FFD5B8"],
                ["paper", "#F5F0E6", "#28251F", "#766A55", "#E6DCCB"],
              ].map(([key, background, text, accent, end]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() =>
                    onThemeChange({
                      ...theme,
                      colors: {
                        ...theme.colors,
                        background: background!,
                        text: text!,
                        mutedText: text!,
                        accent: accent!,
                        button: accent!,
                      },
                      background: {
                        type: "GRADIENT",
                        stops: [background!, end!],
                        angle: 145,
                        overlay: blankOverlay,
                      },
                    })
                  }
                  className="overflow-hidden rounded-md border border-border bg-surface-raised text-left shadow-xs transition-[border-color,transform] hover:-translate-y-0.5 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
                >
                  <span
                    className="block h-20"
                    style={{
                      background: `linear-gradient(145deg, ${background}, ${end})`,
                    }}
                  />
                  <span className="block px-3 py-2 text-xs font-medium">
                    {presets(key as "studio")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {section === "appearance" ? (
          <>
            <ControlSection title={t("pageMode")}>
              <Field label={t("modeStrategy")} htmlFor="mode-strategy">
                <select
                  id="mode-strategy"
                  value={theme.mode.strategy}
                  onChange={(event) =>
                    replace({
                      mode: {
                        ...theme.mode,
                        strategy: event.target
                          .value as ThemeConfig["mode"]["strategy"],
                      },
                    })
                  }
                  className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                >
                  <option value="light">{t("modeLight")}</option>
                  <option value="dark">{t("modeDark")}</option>
                  <option value="system">{t("modeSystem")}</option>
                  <option value="scheduled">{t("modeScheduled")}</option>
                </select>
              </Field>
              {theme.mode.strategy === "scheduled" ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("dayStarts")} htmlFor="day-start">
                    <Input
                      id="day-start"
                      type="time"
                      value={theme.mode.dayStart}
                      onChange={(event) =>
                        replace({
                          mode: { ...theme.mode, dayStart: event.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label={t("nightStarts")} htmlFor="night-start">
                    <Input
                      id="night-start"
                      type="time"
                      value={theme.mode.nightStart}
                      onChange={(event) =>
                        replace({
                          mode: {
                            ...theme.mode,
                            nightStart: event.target.value,
                          },
                        })
                      }
                    />
                  </Field>
                </div>
              ) : null}
            </ControlSection>
            <ControlSection title={t("nightPalette")}>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("nightPaletteDescription")}
              </p>
              <ColorField
                label={t("backgroundColor")}
                value={theme.mode.darkColors.background}
                onChange={(background) => replaceDarkColors({ background })}
              />
              <ColorField
                label={t("textColor")}
                value={theme.mode.darkColors.text}
                onChange={(text) => replaceDarkColors({ text })}
              />
              <ColorField
                label={t("mutedTextColor")}
                value={theme.mode.darkColors.mutedText}
                onChange={(mutedText) => replaceDarkColors({ mutedText })}
              />
              <ColorField
                label={t("accentColor")}
                value={theme.mode.darkColors.accent}
                onChange={(accent) => replaceDarkColors({ accent })}
              />
              <ColorField
                label={t("buttonColor")}
                value={theme.mode.darkColors.button}
                onChange={(button) => replaceDarkColors({ button })}
              />
              <ColorField
                label={t("buttonTextColor")}
                value={theme.mode.darkColors.buttonText}
                onChange={(buttonText) => replaceDarkColors({ buttonText })}
              />
            </ControlSection>
            <ControlSection title={t("layout")}>
              <Field label={t("profileLayout")} htmlFor="profile-layout">
                <select
                  id="profile-layout"
                  value={theme.layout.profileLayout}
                  onChange={(event) =>
                    replace({
                      layout: {
                        ...theme.layout,
                        profileLayout: event.target
                          .value as ThemeConfig["layout"]["profileLayout"],
                      },
                    })
                  }
                  className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                >
                  <option value="centered">{t("layoutCentered")}</option>
                  <option value="left-card">{t("layoutLeftCard")}</option>
                  <option value="banner">{t("layoutBannerPro")}</option>
                </select>
              </Field>
              <Field label={t("alignment")} htmlFor="alignment">
                <SegmentedControl
                  type="single"
                  value={theme.layout.alignment}
                  onValueChange={(value) =>
                    value &&
                    replace({
                      layout: {
                        ...theme.layout,
                        alignment: value as "left" | "center",
                      },
                    })
                  }
                >
                  <SegmentedControlItem value="left">
                    {t("left")}
                  </SegmentedControlItem>
                  <SegmentedControlItem value="center">
                    {t("center")}
                  </SegmentedControlItem>
                </SegmentedControl>
              </Field>
              <RangeField
                label={t("profileWidth")}
                value={theme.layout.maxWidth}
                min={360}
                max={960}
                step={20}
                suffix="px"
                onChange={(maxWidth) =>
                  replace({ layout: { ...theme.layout, maxWidth } })
                }
              />
            </ControlSection>
            <ControlSection title={t("spacing")}>
              <RangeField
                label={t("blockGap")}
                value={theme.layout.blockGap}
                min={4}
                max={48}
                step={2}
                suffix="px"
                onChange={(blockGap) =>
                  replace({ layout: { ...theme.layout, blockGap } })
                }
              />
              <RangeField
                label={t("pagePadding")}
                value={theme.layout.pagePadding}
                min={12}
                max={80}
                step={2}
                suffix="px"
                onChange={(pagePadding) =>
                  replace({ layout: { ...theme.layout, pagePadding } })
                }
              />
            </ControlSection>
          </>
        ) : null}

        {section === "profile" ? (
          <>
            <ControlSection title={t("avatar")}>
              <MediaPicker
                kind="IMAGE"
                value={profile.avatarAssetId}
                label={t("chooseAvatar")}
                description={t("chooseAvatarDescription")}
                onSelect={(asset) => void onAvatarChange(asset.id)}
              />
              {profile.avatarAssetId ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void onAvatarChange(null)}
                >
                  {t("removeAvatar")}
                </Button>
              ) : null}
              <RangeField
                label={t("avatarSize")}
                value={theme.avatar.size}
                min={48}
                max={192}
                step={4}
                suffix="px"
                onChange={(size) =>
                  replace({ avatar: { ...theme.avatar, size } })
                }
              />
              <Field label={t("shape")} htmlFor="avatar-shape">
                <select
                  id="avatar-shape"
                  value={theme.avatar.shape}
                  onChange={(event) =>
                    replace({
                      avatar: {
                        ...theme.avatar,
                        shape: event.target
                          .value as ThemeConfig["avatar"]["shape"],
                      },
                    })
                  }
                  className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                >
                  <option value="circle">{t("circle")}</option>
                  <option value="rounded">{t("rounded")}</option>
                  <option value="square">{t("square")}</option>
                </select>
              </Field>
              <RangeField
                label={t("borderWidth")}
                value={theme.avatar.borderWidth}
                min={0}
                max={10}
                step={1}
                suffix="px"
                onChange={(borderWidth) =>
                  replace({ avatar: { ...theme.avatar, borderWidth } })
                }
              />
              <ColorField
                label={t("borderColor")}
                value={theme.avatar.borderColor}
                onChange={(borderColor) =>
                  replace({ avatar: { ...theme.avatar, borderColor } })
                }
              />
            </ControlSection>
            <ControlSection title={t("avatarFrame")}>
              <Field label={t("ringStyle")} htmlFor="avatar-ring">
                <select
                  id="avatar-ring"
                  value={theme.avatar.ring.style}
                  onChange={(event) =>
                    replace({
                      avatar: {
                        ...theme.avatar,
                        ring: {
                          ...theme.avatar.ring,
                          style: event.target
                            .value as ThemeConfig["avatar"]["ring"]["style"],
                        },
                      },
                    })
                  }
                  className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                >
                  <option value="none">{t("none")}</option>
                  <option value="solid">{t("solid")}</option>
                  <option value="gradient">{t("gradient")}</option>
                  <option value="neon">{t("neonPro")}</option>
                </select>
              </Field>
              <ColorField
                label={t("ringColor")}
                value={theme.avatar.ring.colors[0] ?? theme.colors.accent}
                onChange={(value) =>
                  replace({
                    avatar: {
                      ...theme.avatar,
                      ring: {
                        ...theme.avatar.ring,
                        colors: [value, ...theme.avatar.ring.colors.slice(1)],
                      },
                    },
                  })
                }
              />
              <Field label={t("shadow")} htmlFor="avatar-shadow">
                <select
                  id="avatar-shadow"
                  value={theme.avatar.shadow}
                  onChange={(event) =>
                    replace({
                      avatar: {
                        ...theme.avatar,
                        shadow: event.target
                          .value as ThemeConfig["avatar"]["shadow"],
                      },
                    })
                  }
                  className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                >
                  <option value="none">{t("none")}</option>
                  <option value="soft">{t("soft")}</option>
                  <option value="strong">{t("strong")}</option>
                  <option value="glow">{t("glow")}</option>
                </select>
              </Field>
            </ControlSection>
            <ControlSection title={t("cropAndZoom")}>
              <RangeField
                label={t("horizontalPosition")}
                value={theme.avatar.cropX}
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={(cropX) =>
                  replace({ avatar: { ...theme.avatar, cropX } })
                }
              />
              <RangeField
                label={t("verticalPosition")}
                value={theme.avatar.cropY}
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={(cropY) =>
                  replace({ avatar: { ...theme.avatar, cropY } })
                }
              />
              <RangeField
                label={t("zoom")}
                value={theme.avatar.zoom}
                min={1}
                max={3}
                step={0.1}
                suffix="×"
                onChange={(zoom) =>
                  replace({ avatar: { ...theme.avatar, zoom } })
                }
              />
            </ControlSection>
          </>
        ) : null}

        {section === "background" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <MediaPicker
                kind="IMAGE"
                value={
                  theme.background.type === "IMAGE"
                    ? theme.background.assetId
                    : null
                }
                label={t("chooseBackgroundImage")}
                description={t("chooseBackgroundImageDescription")}
                onSelect={(asset) =>
                  replace({
                    background: {
                      type: "IMAGE",
                      assetId: asset.id,
                      fit: "cover",
                      focalX: 50,
                      focalY: 50,
                      opacity: 100,
                      overlay: theme.background.overlay,
                    },
                  })
                }
              />
              <MediaPicker
                kind="VIDEO"
                value={
                  theme.background.type === "VIDEO"
                    ? theme.background.assetId
                    : null
                }
                label={t("chooseBackgroundVideo")}
                description={t("chooseBackgroundVideoDescription")}
                onSelect={(asset) =>
                  replace({
                    background: {
                      type: "VIDEO",
                      assetId: asset.id,
                      opacity: 100,
                      overlay: theme.background.overlay,
                    },
                  })
                }
              />
            </div>
            <Field label={t("backgroundType")} htmlFor="background-type">
              <select
                id="background-type"
                value={theme.background.type}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "SOLID")
                    replace({
                      background: {
                        type: "SOLID",
                        color: primaryBackgroundColor,
                        overlay: theme.background.overlay,
                      },
                    });
                  if (value === "GRADIENT")
                    replace({
                      background: {
                        type: "GRADIENT",
                        stops: [primaryBackgroundColor, theme.colors.accent],
                        angle: 135,
                        overlay: theme.background.overlay,
                      },
                    });
                  if (value === "ANIMATED_GRADIENT")
                    replace({
                      background: {
                        type: "ANIMATED_GRADIENT",
                        stops: [
                          primaryBackgroundColor,
                          theme.colors.accent,
                          theme.colors.button,
                        ],
                        angle: 135,
                        motion: "shift",
                        speed: 18,
                        overlay: theme.background.overlay,
                      },
                    });
                }}
                className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
              >
                <option value="SOLID">{t("solidColor")}</option>
                <option value="GRADIENT">{t("gradient")}</option>
                <option value="ANIMATED_GRADIENT">
                  {t("animatedGradient")}
                </option>
                {theme.background.type === "IMAGE" ? (
                  <option value="IMAGE">{t("backgroundImage")}</option>
                ) : null}
                {theme.background.type === "VIDEO" ? (
                  <option value="VIDEO">{t("backgroundVideoPro")}</option>
                ) : null}
              </select>
            </Field>
            <ColorField
              label={t("backgroundColor")}
              value={primaryBackgroundColor}
              onChange={(value) => updateBackgroundColor(value)}
            />
            {theme.background.type === "GRADIENT" ||
            theme.background.type === "ANIMATED_GRADIENT" ? (
              <>
                <ColorField
                  label={t("gradientEnd")}
                  value={theme.background.stops[1] ?? theme.colors.accent}
                  onChange={(value) => updateBackgroundColor(value, 1)}
                />
                <RangeField
                  label={t("angle")}
                  value={theme.background.angle}
                  min={0}
                  max={360}
                  step={5}
                  suffix="°"
                  onChange={(angle) => {
                    if (
                      theme.background.type !== "GRADIENT" &&
                      theme.background.type !== "ANIMATED_GRADIENT"
                    )
                      return;
                    replace({ background: { ...theme.background, angle } });
                  }}
                />
              </>
            ) : null}
            {theme.background.type === "ANIMATED_GRADIENT" ? (
              <>
                <Field label={t("motionStyle")} htmlFor="gradient-motion">
                  <select
                    id="gradient-motion"
                    value={theme.background.motion}
                    onChange={(event) => {
                      if (theme.background.type !== "ANIMATED_GRADIENT") return;
                      replace({
                        background: {
                          ...theme.background,
                          motion: event.target.value as "shift" | "waves",
                        },
                      });
                    }}
                    className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                  >
                    <option value="shift">{t("gradientShift")}</option>
                    <option value="waves">{t("gentleWavesPro")}</option>
                  </select>
                </Field>
                <RangeField
                  label={t("speed")}
                  value={theme.background.speed}
                  min={8}
                  max={40}
                  step={1}
                  suffix="s"
                  onChange={(speed) => {
                    if (theme.background.type !== "ANIMATED_GRADIENT") return;
                    replace({ background: { ...theme.background, speed } });
                  }}
                />
              </>
            ) : null}
            {theme.background.type === "IMAGE" ? (
              <>
                <Field label={t("imageFit")} htmlFor="background-image-fit">
                  <select
                    id="background-image-fit"
                    value={theme.background.fit}
                    onChange={(event) => {
                      if (theme.background.type !== "IMAGE") return;
                      replace({
                        background: {
                          ...theme.background,
                          fit: event.target.value as "cover" | "contain",
                        },
                      });
                    }}
                    className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                  >
                    <option value="cover">{t("cover")}</option>
                    <option value="contain">{t("contain")}</option>
                  </select>
                </Field>
                <RangeField
                  label={t("horizontalPosition")}
                  value={theme.background.focalX}
                  min={0}
                  max={100}
                  step={1}
                  suffix="%"
                  onChange={(focalX) => {
                    if (theme.background.type !== "IMAGE") return;
                    replace({
                      background: { ...theme.background, focalX },
                    });
                  }}
                />
                <RangeField
                  label={t("verticalPosition")}
                  value={theme.background.focalY}
                  min={0}
                  max={100}
                  step={1}
                  suffix="%"
                  onChange={(focalY) => {
                    if (theme.background.type !== "IMAGE") return;
                    replace({
                      background: { ...theme.background, focalY },
                    });
                  }}
                />
              </>
            ) : null}
            {theme.background.type === "IMAGE" ||
            theme.background.type === "VIDEO" ? (
              <RangeField
                label={t("mediaOpacity")}
                value={theme.background.opacity}
                min={10}
                max={100}
                step={1}
                suffix="%"
                onChange={(opacity) => {
                  if (
                    theme.background.type !== "IMAGE" &&
                    theme.background.type !== "VIDEO"
                  )
                    return;
                  replace({ background: { ...theme.background, opacity } });
                }}
              />
            ) : null}
            <ControlSection title={t("overlay")} premium>
              <ColorField
                label={t("overlayColor")}
                value={theme.background.overlay.color}
                onChange={(color) => replaceOverlay({ color })}
              />
              <RangeField
                label={t("opacity")}
                value={theme.background.overlay.opacity}
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={(opacity) => replaceOverlay({ opacity })}
              />
              <RangeField
                label={t("blur")}
                value={theme.background.overlay.blur}
                min={0}
                max={30}
                step={1}
                suffix="px"
                onChange={(blur) => replaceOverlay({ blur })}
              />
              <RangeField
                label={t("glassIntensity")}
                value={theme.background.overlay.glass}
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={(glass) => replaceOverlay({ glass })}
              />
            </ControlSection>
            <ControlSection title={t("colorPalette")}>
              {(
                [
                  ["textColor", "text"],
                  ["mutedTextColor", "mutedText"],
                  ["accentColor", "accent"],
                  ["buttonColor", "button"],
                  ["buttonTextColor", "buttonText"],
                  ["borderColor", "border"],
                  ["shadowColor", "shadow"],
                ] as const
              ).map(([label, key]) => (
                <ColorField
                  key={key}
                  label={t(label)}
                  value={theme.colors[key]}
                  onChange={(value) => replaceColors({ [key]: value })}
                />
              ))}
            </ControlSection>
          </>
        ) : null}

        {section === "typography" ? (
          <>
            {(["heading", "body"] as const).map((kind) => {
              const style = theme.typography[kind];
              return (
                <ControlSection
                  key={kind}
                  title={kind === "heading" ? t("headings") : t("bodyText")}
                >
                  <Field
                    label={t("fontFamily")}
                    htmlFor={`${kind}-font-family`}
                  >
                    <select
                      id={`${kind}-font-family`}
                      value={style.family}
                      onChange={(event) =>
                        replace({
                          typography: {
                            ...theme.typography,
                            [kind]: {
                              ...style,
                              family: event.target
                                .value as ThemeConfig["typography"][typeof kind]["family"],
                            },
                          },
                        })
                      }
                      className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                    >
                      {fontOptions.map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <RangeField
                    label={t("fontScale")}
                    value={style.scale}
                    min={75}
                    max={160}
                    step={5}
                    suffix="%"
                    onChange={(scale) =>
                      replace({
                        typography: {
                          ...theme.typography,
                          [kind]: { ...style, scale },
                        },
                      })
                    }
                  />
                  <Field
                    label={t("fontWeight")}
                    htmlFor={`${kind}-font-weight`}
                  >
                    <select
                      id={`${kind}-font-weight`}
                      value={style.weight}
                      onChange={(event) =>
                        replace({
                          typography: {
                            ...theme.typography,
                            [kind]: {
                              ...style,
                              weight: Number(event.target.value) as
                                | 400
                                | 500
                                | 600
                                | 700,
                            },
                          },
                        })
                      }
                      className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                    >
                      <option value="400">400</option>
                      <option value="500">500</option>
                      <option value="600">600</option>
                      <option value="700">700</option>
                    </select>
                  </Field>
                  <RangeField
                    label={t("letterSpacing")}
                    value={style.letterSpacing}
                    min={-0.08}
                    max={0.2}
                    step={0.01}
                    suffix="em"
                    onChange={(letterSpacing) =>
                      replace({
                        typography: {
                          ...theme.typography,
                          [kind]: { ...style, letterSpacing },
                        },
                      })
                    }
                  />
                  {kind === "body" ? (
                    <RangeField
                      label={t("lineHeight")}
                      value={theme.typography.body.lineHeight}
                      min={1.2}
                      max={2}
                      step={0.05}
                      onChange={(lineHeight) =>
                        replace({
                          typography: {
                            ...theme.typography,
                            body: { ...theme.typography.body, lineHeight },
                          },
                        })
                      }
                    />
                  ) : null}
                </ControlSection>
              );
            })}
          </>
        ) : null}

        {section === "buttons" ? (
          <>
            <ControlSection title={t("buttonStyle")}>
              <Field label={t("style")} htmlFor="button-style">
                <select
                  id="button-style"
                  value={theme.buttons.style}
                  onChange={(event) =>
                    replace({
                      buttons: {
                        ...theme.buttons,
                        style: event.target
                          .value as ThemeConfig["buttons"]["style"],
                      },
                    })
                  }
                  className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                >
                  <option value="solid">{t("solid")}</option>
                  <option value="outline">{t("outline")}</option>
                  <option value="transparent">{t("transparent")}</option>
                  <option value="soft">{t("soft")}</option>
                  <option value="glass">{t("glassPro")}</option>
                  <option value="neon">{t("neonPro")}</option>
                </select>
              </Field>
              <Field label={t("shape")} htmlFor="button-shape">
                <select
                  id="button-shape"
                  value={theme.buttons.shape}
                  onChange={(event) =>
                    replace({
                      buttons: {
                        ...theme.buttons,
                        shape: event.target
                          .value as ThemeConfig["buttons"]["shape"],
                      },
                    })
                  }
                  className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                >
                  <option value="sharp">{t("sharp")}</option>
                  <option value="rounded">{t("rounded")}</option>
                  <option value="pill">{t("pill")}</option>
                  <option value="brutalist">{t("brutalist")}</option>
                </select>
              </Field>
              <RangeField
                label={t("height")}
                value={theme.buttons.height}
                min={40}
                max={80}
                step={2}
                suffix="px"
                onChange={(height) =>
                  replace({ buttons: { ...theme.buttons, height } })
                }
              />
              <RangeField
                label={t("radius")}
                value={theme.buttons.radius}
                min={0}
                max={40}
                step={1}
                suffix="px"
                onChange={(radius) =>
                  replace({ buttons: { ...theme.buttons, radius } })
                }
              />
              <RangeField
                label={t("borderWidth")}
                value={theme.buttons.borderWidth}
                min={0}
                max={6}
                step={1}
                suffix="px"
                onChange={(borderWidth) =>
                  replace({ buttons: { ...theme.buttons, borderWidth } })
                }
              />
            </ControlSection>
            <ControlSection title={t("interaction")}>
              <Field label={t("hoverEffect")} htmlFor="hover-effect">
                <select
                  id="hover-effect"
                  value={theme.buttons.hoverEffect}
                  onChange={(event) =>
                    replace({
                      buttons: {
                        ...theme.buttons,
                        hoverEffect: event.target
                          .value as ThemeConfig["buttons"]["hoverEffect"],
                      },
                    })
                  }
                  className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                >
                  <option value="none">{t("none")}</option>
                  <option value="expand">{t("expand")}</option>
                  <option value="color-shift">{t("colorShift")}</option>
                  <option value="pulse">{t("pulsePro")}</option>
                  <option value="neon">{t("neonGlowPro")}</option>
                </select>
              </Field>
              <Field label={t("shadow")} htmlFor="button-shadow">
                <select
                  id="button-shadow"
                  value={theme.buttons.shadow}
                  onChange={(event) =>
                    replace({
                      buttons: {
                        ...theme.buttons,
                        shadow: event.target
                          .value as ThemeConfig["buttons"]["shadow"],
                      },
                    })
                  }
                  className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                >
                  <option value="none">{t("none")}</option>
                  <option value="soft">{t("soft")}</option>
                  <option value="hard">{t("hardShadow")}</option>
                  <option value="glow">{t("glow")}</option>
                </select>
              </Field>
              <ColorField
                label={t("shadowColor")}
                value={theme.buttons.shadowColor}
                onChange={(shadowColor) =>
                  replace({ buttons: { ...theme.buttons, shadowColor } })
                }
              />
            </ControlSection>
          </>
        ) : null}

        {section === "effects" ? (
          <>
            <ControlSection title={t("vibeLayer")}>
              <Field label={t("effect")} htmlFor="vibe-layer">
                <select
                  id="vibe-layer"
                  value={theme.effects.layer}
                  onChange={(event) =>
                    replace({
                      effects: {
                        ...theme.effects,
                        layer: event.target
                          .value as ThemeConfig["effects"]["layer"],
                      },
                    })
                  }
                  className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                >
                  <option value="none">{t("none")}</option>
                  <option value="animated-gradient">
                    {t("animatedGradient")}
                  </option>
                  <option value="stars">{t("stars")}</option>
                  <option value="snow">{t("snow")}</option>
                  <option value="waves">{t("wavesPro")}</option>
                  <option value="digital-rain">{t("digitalRainPro")}</option>
                </select>
              </Field>
              <RangeField
                label={t("density")}
                value={theme.effects.density}
                min={1}
                max={100}
                step={1}
                suffix="%"
                onChange={(density) =>
                  replace({ effects: { ...theme.effects, density } })
                }
              />
              <RangeField
                label={t("speed")}
                value={theme.effects.speed}
                min={1}
                max={100}
                step={1}
                suffix="%"
                onChange={(speed) =>
                  replace({ effects: { ...theme.effects, speed } })
                }
              />
              <RangeField
                label={t("intensity")}
                value={theme.effects.intensity}
                min={1}
                max={100}
                step={1}
                suffix="%"
                onChange={(intensity) =>
                  replace({ effects: { ...theme.effects, intensity } })
                }
              />
              <Field
                label={t("reducedMotionFallback")}
                htmlFor="reduced-motion"
              >
                <select
                  id="reduced-motion"
                  value={theme.effects.reducedMotion}
                  onChange={(event) =>
                    replace({
                      effects: {
                        ...theme.effects,
                        reducedMotion: event.target
                          .value as ThemeConfig["effects"]["reducedMotion"],
                      },
                    })
                  }
                  className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
                >
                  <option value="static">{t("staticFallback")}</option>
                  <option value="off">{t("disableEffect")}</option>
                </select>
              </Field>
            </ControlSection>
            <ControlSection title={t("branding")} premium>
              <label className="flex items-center justify-between gap-4 text-sm font-medium">
                {t("showBranding")}
                <input
                  type="checkbox"
                  checked={theme.branding.visible}
                  onChange={(event) =>
                    replace({ branding: { visible: event.target.checked } })
                  }
                  className="size-4 accent-[var(--primary)]"
                />
              </label>
            </ControlSection>
          </>
        ) : null}

        {section === "socials" ? (
          <ControlSection title={t("socialPlacement")}>
            <Field label={t("placement")} htmlFor="social-placement">
              <select
                id="social-placement"
                value={theme.layout.socialPlacement}
                onChange={(event) =>
                  replace({
                    layout: {
                      ...theme.layout,
                      socialPlacement: event.target
                        .value as ThemeConfig["layout"]["socialPlacement"],
                    },
                  })
                }
                className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
              >
                <option value="top">{t("placementTop")}</option>
                <option value="bottom">{t("placementBottom")}</option>
                <option value="fixed-footer">{t("placementFooter")}</option>
              </select>
            </Field>
          </ControlSection>
        ) : null}

        {section === "seo" ? (
          <>
            <Field label={t("pageTitle")} htmlFor="page-title">
              <Input
                id="page-title"
                value={document.title ?? ""}
                onChange={(event) =>
                  onPageChange({ title: event.target.value || null })
                }
              />
            </Field>
            <Field
              label={t("pageDescription")}
              htmlFor="page-description"
              optional={common("optional")}
            >
              <Textarea
                id="page-description"
                value={document.description ?? ""}
                onChange={(event) =>
                  onPageChange({ description: event.target.value || null })
                }
              />
            </Field>
            <Field label={t("visibility")} htmlFor="visibility">
              <select
                id="visibility"
                value={document.visibility}
                onChange={(event) =>
                  onPageChange({
                    visibility: event.target
                      .value as EditorDocument["visibility"],
                  })
                }
                className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
              >
                <option value="PUBLIC">{t("public")}</option>
                <option value="UNLISTED">{t("unlisted")}</option>
                <option value="PRIVATE">{t("private")}</option>
              </select>
            </Field>
            <Field label={t("robots")} htmlFor="robots">
              <select
                id="robots"
                value={document.seo.robots}
                onChange={(event) =>
                  onSeoChange({
                    ...document.seo,
                    robots: event.target.value as EditorSeoConfig["robots"],
                  })
                }
                className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"
              >
                <option value="index,follow">index, follow</option>
                <option value="noindex,nofollow">noindex, nofollow</option>
              </select>
            </Field>
          </>
        ) : null}
      </div>
    </div>
  );
}
