"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface WidgetData {
  kind?: string;
  available?: boolean;
  status?: "AVAILABLE" | "STALE" | "UNAVAILABLE" | "MISCONFIGURED";
  href?: string;
  embedUrl?: string;
  recent?: {
    title: string;
    artists: string;
    album: string;
    artworkUrl: string | null;
    playedAt: string;
  };
  username?: string;
  events?: Array<{ id: string; type: string; repository: string; createdAt: string }>;
  video?: { videoId: string; title: string; publishedAt: string; thumbnailUrl: string | null } | null;
  channel?: string;
  stream?: { live: boolean; title?: string; game?: string; viewers?: number; thumbnailUrl?: string };
}

const providerLabel = {
  GITHUB: "GitHub",
  SPOTIFY: "Spotify",
  YOUTUBE: "YouTube",
  TWITCH: "Twitch",
} as const;

export function ExternalWidgetBlock({ blockId, provider }: { blockId: string; provider: string }) {
  const t = useTranslations("publicBlocks");
  const [data, setData] = useState<WidgetData | null>(null);
  useEffect(() => {
    let controller: AbortController | null = null;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      controller?.abort();
      controller = new AbortController();
      void fetch(`/api/public/widgets/${blockId}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : {}))
        .then((value: WidgetData) => setData(value))
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setData({ available: false });
          }
        });
    };
    const visibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [blockId]);

  if (data?.kind === "spotify" && data.recent) {
    return (
      <a
        href={data.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center gap-3 rounded-2xl border border-current/15 bg-current/5 p-3 text-left backdrop-blur-sm transition-transform hover:scale-[1.01]"
      >
        {data.recent.artworkUrl ? (
          <span
            aria-hidden="true"
            className="size-14 shrink-0 rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${data.recent.artworkUrl})` }}
          />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold tracking-wider uppercase opacity-55">
            {t("recentlyPlayed")}
          </span>
          <strong className="mt-0.5 block truncate text-sm">
            {data.recent.title}
          </strong>
          <span className="block truncate text-xs opacity-65">
            {data.recent.artists}
          </span>
        </span>
        <ArrowUpRight className="size-4 shrink-0 opacity-55" />
      </a>
    );
  }
  if (data?.kind === "spotify" && data.embedUrl) {
    return <iframe title="Spotify" src={data.embedUrl} loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" className="h-[152px] w-full rounded-2xl border-0" />;
  }
  const body = data?.kind === "github" ? (
    <div className="mt-3 grid gap-2">
      {data.events?.length ? data.events.slice(0,3).map((event)=><div key={event.id} className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium">{event.repository}</span><span className="shrink-0 opacity-55">{event.type.replace("Event","")}</span></div>) : <p className="text-xs opacity-60">{t("noRecentActivity")}</p>}
    </div>
  ) : data?.kind === "youtube" && data.video ? (
    <div className="mt-3"><p className="line-clamp-2 text-sm font-semibold">{data.video.title}</p><p className="mt-1 text-xs opacity-60">{t("latestVideo")}</p></div>
  ) : data?.kind === "twitch" ? (
    <div className="mt-3"><p className="text-sm font-semibold">{data.stream?.live ? data.stream.title : t("streamOffline")}</p>{data.stream?.live?<p className="mt-1 text-xs opacity-60">{data.stream.game} · {data.stream.viewers} {t("viewers")}</p>:null}</div>
  ) : <p className="mt-3 text-xs opacity-60">{data === null ? t("loadingLiveData") : t("integrationUnavailable")}</p>;
  const resolvedBody = data?.available === false ? (
    <p className="mt-3 text-xs opacity-60">{t("integrationUnavailable")}</p>
  ) : body;
  const content = (
    <>
      <span className="flex items-center justify-between gap-3">
        <strong>
          {providerLabel[provider as keyof typeof providerLabel] ?? provider}
        </strong>
        {data?.href ? <ArrowUpRight className="size-4 opacity-55" /> : null}
      </span>
      {data?.status === "STALE" ? (
        <span className="mt-2 inline-flex rounded-full border border-current/15 px-2 py-0.5 text-[10px] font-medium opacity-60">
          {t("staleData")}
        </span>
      ) : null}
      {resolvedBody}
    </>
  );

  return data?.href ? (
    <a
      href={data.href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-2xl border border-current/15 bg-current/5 p-4 text-left backdrop-blur-sm transition-transform hover:scale-[1.01]"
    >
      {content}
    </a>
  ) : (
    <section className="w-full rounded-2xl border border-current/15 bg-current/5 p-4 text-left backdrop-blur-sm">
      {content}
    </section>
  );
}
