"use client";

import { AlignLeft, Blocks, CaseSensitive, ImageIcon, MousePointer2, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "~/lib/cn";
import type { EditorSection } from "./editor-reducer";

const sections = [
  { id: "content", key: "content", icon: Blocks },
  { id: "appearance", key: "appearance", icon: AlignLeft },
  { id: "background", key: "background", icon: ImageIcon },
  { id: "typography", key: "typography", icon: CaseSensitive },
  { id: "buttons", key: "buttons", icon: MousePointer2 },
  { id: "seo", key: "seo", icon: Search },
] as const;

export function EditorNavigation({ value, onChange }: { value: EditorSection; onChange: (value: EditorSection) => void }) {
  const t = useTranslations("editor");
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface p-2 lg:w-44 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0 lg:p-3" aria-label={t("title")}>
      {sections.map((section) => {
        const Icon = section.icon;
        const active = section.id === value;
        return <button key={section.id} type="button" onClick={() => onChange(section.id)} aria-current={active ? "page" : undefined} className={cn("flex h-9 shrink-0 items-center gap-2.5 rounded-sm px-2.5 text-xs font-medium text-muted-foreground transition-[color,background-color] duration-150 hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none lg:w-full", active && "bg-surface-active text-foreground")}><Icon className="size-4" />{t(section.key)}</button>;
      })}
    </nav>
  );
}
