"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "~/components/ui/button";

export function CopyButton({ value, copiedMessage, children, ...props }: ButtonProps & { value: string; copiedMessage: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(copiedMessage);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return <Button type="button" onClick={copy} {...props}>{copied ? <Check /> : <Copy />}{children}</Button>;
}
