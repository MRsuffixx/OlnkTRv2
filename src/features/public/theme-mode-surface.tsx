"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  themeBackgroundStyleForMode,
  themeColorVariables,
} from "~/lib/theme-rendering";
import type { ThemeConfig } from "~/server/publishing/snapshot";

function scheduledDark(dayStart: string, nightStart: string) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [dayHour = 7, dayMinute = 0] = dayStart.split(":").map(Number);
  const [nightHour = 19, nightMinute = 0] = nightStart
    .split(":")
    .map(Number);
  const day = dayHour * 60 + dayMinute;
  const night = nightHour * 60 + nightMinute;
  return day < night
    ? minutes < day || minutes >= night
    : minutes >= night && minutes < day;
}

export function ThemeModeSurface({
  theme,
  element = "div",
  id,
  tabIndex,
  className,
  style,
  children,
}: {
  theme: ThemeConfig;
  element?: "main" | "div";
  id?: string;
  tabIndex?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [dark, setDark] = useState(theme.mode.strategy === "dark");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = () => {
      if (theme.mode.strategy === "dark") setDark(true);
      else if (theme.mode.strategy === "light") setDark(false);
      else if (theme.mode.strategy === "system") setDark(media.matches);
      else setDark(scheduledDark(theme.mode.dayStart, theme.mode.nightStart));
    };
    resolve();
    media.addEventListener("change", resolve);
    const interval = window.setInterval(resolve, 60_000);
    return () => {
      media.removeEventListener("change", resolve);
      window.clearInterval(interval);
    };
  }, [theme.mode.dayStart, theme.mode.nightStart, theme.mode.strategy]);

  const Element = element;
  return (
    <Element
      id={id}
      tabIndex={tabIndex}
      data-theme-mode={theme.mode.strategy}
      data-resolved-mode={dark ? "dark" : "light"}
      className={className}
      style={{
        ...themeBackgroundStyleForMode(theme, dark),
        ...themeColorVariables(theme, dark),
        ...style,
        color: "var(--olnk-page-text)",
      }}
    >
      {children}
    </Element>
  );
}
