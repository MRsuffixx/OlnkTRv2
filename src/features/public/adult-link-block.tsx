"use client";

import { ExternalLink, ShieldAlert, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";

import { trackPublicBlockClick } from "~/app/[username]/analytics-beacon";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/cn";
import {
  hasAdultConsent,
  rememberAdultConsent,
} from "./adult-consent";

export interface AdultLinkLabels {
  badge: string;
  dialogTitle: string;
  dialogDescription: string;
  confirmation: string;
  cancel: string;
  continue: string;
}

interface AdultLinkBlockProps {
  profileId: string;
  blockId: string;
  title: string;
  url: string;
  description?: string;
  platformLabel?: string;
  labels: AdultLinkLabels;
  className?: string;
  style?: CSSProperties;
}

function openExternalDestination(url: string) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) window.location.assign(url);
}

export function AdultLinkBlock({
  profileId,
  blockId,
  title,
  url,
  description,
  platformLabel,
  labels,
  className,
  style,
}: AdultLinkBlockProps) {
  const [open, setOpen] = useState(false);
  const continuing = useRef(false);

  function visit() {
    if (hasAdultConsent(window.sessionStorage, profileId)) {
      trackPublicBlockClick(profileId, blockId);
      openExternalDestination(url);
      return;
    }
    setOpen(true);
  }

  function confirm() {
    if (continuing.current) return;
    continuing.current = true;
    rememberAdultConsent(window.sessionStorage, profileId);
    trackPublicBlockClick(profileId, blockId);
    setOpen(false);
    openExternalDestination(url);
    continuing.current = false;
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <button
        type="button"
        className={cn(
          "group flex w-full items-center justify-between gap-3 border border-warning/35 bg-warning/10 px-4 py-3 text-left transition-[transform,filter,box-shadow,background-color] duration-200",
          className,
        )}
        style={style}
        onClick={visit}
      >
        <span className="min-w-0">
          <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-warning uppercase">
            <ShieldAlert aria-hidden="true" className="size-3" />
            {labels.badge}
            {platformLabel ? ` · ${platformLabel}` : null}
          </span>
          <strong className="block truncate">{title}</strong>
          {description ? (
            <span className="mt-0.5 block truncate text-xs opacity-70">
              {description}
            </span>
          ) : null}
        </span>
        <ExternalLink
          aria-hidden="true"
          className="size-4 shrink-0 opacity-55 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </button>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=closed]:animate-none data-[state=open]:animate-enter" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface-raised p-5 text-foreground shadow-floating outline-none data-[state=open]:animate-popover">
          <div className="mb-4 grid gap-1.5 pr-8">
          <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-warning/12 text-warning">
            <ShieldAlert aria-hidden="true" className="size-5" />
          </span>
            <DialogPrimitive.Title className="text-base font-semibold tracking-[-0.01em]">
              {labels.dialogTitle}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {labels.dialogDescription}
            </DialogPrimitive.Description>
          </div>
          <p className="rounded-md border border-warning/25 bg-warning/8 p-3 text-sm font-medium">
            {labels.confirmation}
          </p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {labels.cancel}
            </Button>
            <Button type="button" onClick={confirm}>
              {labels.continue}
              <ExternalLink aria-hidden="true" />
            </Button>
          </div>
          <DialogPrimitive.Close
            aria-label={labels.cancel}
            className="absolute top-3.5 right-3.5 flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-[color,background-color] duration-150 hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
