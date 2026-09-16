"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/cn";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return <SelectPrimitive.Trigger className={cn("flex h-9 w-full items-center justify-between gap-2 rounded-sm border border-border bg-surface-raised px-3 text-sm text-foreground shadow-xs transition-[border-color,box-shadow,background-color] duration-150 focus:border-primary focus:ring-3 focus:ring-primary/12 focus:outline-none disabled:opacity-50", className)} {...props}>{children}<SelectPrimitive.Icon><ChevronDown className="size-3.5 text-muted-foreground" /></SelectPrimitive.Icon></SelectPrimitive.Trigger>;
}

export function SelectContent({ className, position = "popper", ...props }: ComponentProps<typeof SelectPrimitive.Content>) {
  return <SelectPrimitive.Portal><SelectPrimitive.Content position={position} className={cn("z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-surface-raised p-1.5 shadow-floating data-[state=open]:animate-popover", className)} {...props}><SelectPrimitive.Viewport>{props.children}</SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Portal>;
}

export function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return <SelectPrimitive.Item className={cn("relative flex h-8 cursor-default items-center rounded-sm pr-8 pl-2 text-sm outline-none select-none focus:bg-surface-hover data-[disabled]:opacity-45", className)} {...props}>{children}<span className="absolute right-2"><SelectPrimitive.ItemIndicator><Check className="size-3.5" /></SelectPrimitive.ItemIndicator></span></SelectPrimitive.Item>;
}

export const SelectItemText = SelectPrimitive.ItemText;
