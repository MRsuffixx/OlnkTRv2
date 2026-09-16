import type { ButtonHTMLAttributes } from "react";

import { cn } from "~/lib/cn";
import { buttonVariants } from "./button";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ label, className, ...props }: IconButtonProps) {
  return <button aria-label={label} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)} {...props} />;
}
