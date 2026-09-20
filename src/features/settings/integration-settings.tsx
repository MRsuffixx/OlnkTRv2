"use client";

import { CircleCheck, ExternalLink, Music2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/cn";
import { api } from "~/trpc/react";

export function IntegrationSettings({
  spotify,
}: {
  spotify: {
    configured: boolean;
    connection: { status: string; updatedAt: Date } | null;
  };
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);
  const disconnect = api.integration.disconnectSpotify.useMutation();

  async function disconnectSpotify() {
    setDisconnecting(true);
    try {
      await disconnect.mutateAsync();
      toast.success(t("spotifyDisconnected"));
      router.refresh();
    } catch {
      toast.error(t("integrationActionFailed"));
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-surface-raised">
      <section className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#1ed760]/12 text-[#159447] dark:text-[#1ed760]">
            <Music2 className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold">Spotify</h4>
              {spotify.connection ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
                  <CircleCheck className="size-3" /> {t("connected")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              {t("spotifyIntegrationDescription")}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              {t("integrationSecurity")}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          {spotify.connection ? (
            <Button
              type="button"
              variant="secondary"
              loading={disconnecting}
              onClick={() => void disconnectSpotify()}
            >
              {t("disconnect")}
            </Button>
          ) : spotify.configured ? (
            <Link
              href="/api/integrations/spotify/connect"
              prefetch={false}
              className={cn(buttonVariants({ variant: "primary" }))}
            >
              {t("connectSpotify")}
              <ExternalLink className="size-4" />
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">
              {t("integrationNotConfigured")}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
