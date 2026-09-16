"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { ToggleGroup } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/cn";

export const segmentedControlVariants = cva("inline-flex h-9 items-center justify-center rounded-xs px-2.5 text-xs font-medium text-muted-foreground transition-[color,background-color,box-shadow] duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none data-[state=on]:bg-surface-raised data-[state=on]:text-foreground data-[state=on]:shadow-xs");

export function SegmentedControl({ className, ...props }: ComponentProps<typeof ToggleGroup.Root> & VariantProps<typeof segmentedControlVariants>) {
  return <ToggleGroup.Root className={cn("inline-flex rounded-sm bg-muted p-1", className)} {...props} />;
}

export function SegmentedControlItem({ className, ...props }: ComponentProps<typeof ToggleGroup.Item>) {
  return <ToggleGroup.Item className={cn(segmentedControlVariants(), className)} {...props} />;
}
