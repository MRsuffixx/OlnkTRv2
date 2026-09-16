"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/cn";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return <PopoverPrimitive.Portal><PopoverPrimitive.Content sideOffset={sideOffset} className={cn("z-50 w-72 rounded-md border border-border bg-surface-raised p-3 shadow-floating outline-none data-[state=open]:animate-popover", className)} {...props} /></PopoverPrimitive.Portal>;
}
