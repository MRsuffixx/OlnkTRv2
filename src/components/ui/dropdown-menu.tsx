"use client";

import { Check, ChevronRight } from "lucide-react";
import { DropdownMenu as MenuPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/cn";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuGroup = MenuPrimitive.Group;
export const DropdownMenuSub = MenuPrimitive.Sub;
export const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content sideOffset={sideOffset} className={cn("z-50 min-w-48 rounded-md border border-border bg-surface-raised p-1.5 text-foreground shadow-floating outline-none data-[state=open]:animate-popover", className)} {...props} />
    </MenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, inset, ...props }: ComponentProps<typeof MenuPrimitive.Item> & { inset?: boolean }) {
  return <MenuPrimitive.Item className={cn("relative flex h-8 cursor-default items-center gap-2 rounded-sm px-2 text-sm outline-none select-none focus:bg-surface-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-45", inset && "pl-8", className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof MenuPrimitive.Label>) {
  return <MenuPrimitive.Label className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn("-mx-0.5 my-1 h-px bg-border-subtle", className)} {...props} />;
}

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return <MenuPrimitive.RadioItem className={cn("relative flex h-8 cursor-default items-center rounded-sm py-1 pr-2 pl-8 text-sm outline-none focus:bg-surface-hover", className)} {...props}><span className="absolute left-2 flex size-4 items-center justify-center"><MenuPrimitive.ItemIndicator><Check className="size-3.5" /></MenuPrimitive.ItemIndicator></span>{children}</MenuPrimitive.RadioItem>;
}

export function DropdownMenuSubTrigger({ className, children, ...props }: ComponentProps<typeof MenuPrimitive.SubTrigger>) {
  return <MenuPrimitive.SubTrigger className={cn("flex h-8 cursor-default items-center rounded-sm px-2 text-sm outline-none focus:bg-surface-hover data-[state=open]:bg-surface-hover", className)} {...props}>{children}<ChevronRight className="ml-auto size-3.5" /></MenuPrimitive.SubTrigger>;
}

export function DropdownMenuSubContent({ className, ...props }: ComponentProps<typeof MenuPrimitive.SubContent>) {
  return <MenuPrimitive.SubContent className={cn("min-w-40 rounded-md border border-border bg-surface-raised p-1.5 shadow-floating data-[state=open]:animate-popover", className)} {...props} />;
}
