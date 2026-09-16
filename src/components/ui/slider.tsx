"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/cn";

export function Slider({ className, ...props }: ComponentProps<typeof SliderPrimitive.Root>) {
  return <SliderPrimitive.Root className={cn("relative flex h-5 w-full touch-none items-center select-none", className)} {...props}><SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-muted"><SliderPrimitive.Range className="absolute h-full bg-primary" /></SliderPrimitive.Track><SliderPrimitive.Thumb className="block size-4 rounded-full border border-primary/30 bg-surface-raised shadow-sm transition-[box-shadow,transform] duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none" /></SliderPrimitive.Root>;
}
