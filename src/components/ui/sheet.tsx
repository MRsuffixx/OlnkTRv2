"use client";

import { X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

import { cn } from "~/lib/cn";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

export const sheetContentClasses = "fixed z-50 overscroll-contain bg-surface-raised shadow-floating outline-none transition-[transform,opacity] duration-200 ease-product";

export function SheetContent({ className, children, side = "right", ...props }: ComponentProps<typeof SheetPrimitive.Content> & { side?: "left" | "right" | "bottom" }) {
  const t = useTranslations("common");
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-enter" />
      <SheetPrimitive.Content
        className={cn(
          sheetContentClasses,
          side === "right" && "inset-y-0 right-0 w-[min(90vw,25rem)] border-l border-border data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
          side === "left" && "inset-y-0 left-0 w-[min(90vw,20rem)] border-r border-border data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[90vh] rounded-t-xl border-t border-border data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute top-3.5 right-3.5 flex size-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none">
          <X aria-hidden="true" className="size-4" />
          <span className="sr-only">{t("close")}</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-1.5 border-b border-border-subtle p-5 pr-14", className)} {...props} />;
}

export const SheetTitle = SheetPrimitive.Title;
export const SheetDescription = SheetPrimitive.Description;
