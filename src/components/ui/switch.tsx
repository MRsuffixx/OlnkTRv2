"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/cn";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return <SwitchPrimitive.Root className={cn("inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-muted transition-[background-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary", className)} {...props}><SwitchPrimitive.Thumb className="block size-4 translate-x-0 rounded-full bg-white shadow-sm transition-[transform] duration-150 data-[state=checked]:translate-x-4" /></SwitchPrimitive.Root>;
}
