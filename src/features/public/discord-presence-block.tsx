"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Presence {
  discord_status?: "online" | "idle" | "dnd" | "offline";
  discord_user?: { username?: string; avatar?: string; id?: string };
  spotify?: {
    song?: string;
    artist?: string;
    album_art_url?: string;
    timestamps?: { start?: number; end?: number };
  } | null;
  activities?: Array<{
    type?: number;
    name?: string;
    state?: string;
    details?: string;
    created_at?: number;
    emoji?: { name?: string };
  }>;
}

const statusTranslation = {
  online: "discordOnline",
  idle: "discordIdle",
  dnd: "discordDnd",
  offline: "discordOffline",
} as const;

export function DiscordPresenceBlock({
  discordUserId,
  showSpotify,
  showActivity,
}: {
  discordUserId: string;
  showSpotify: boolean;
  showActivity: boolean;
}) {
  const t = useTranslations("publicBlocks");
  const [presence, setPresence] = useState<Presence | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    let socket: WebSocket | null = null;
    let heartbeat: number | undefined;
    let reconnect: number | undefined;
    let active = true;
    const connect = () => {
      socket = new WebSocket("wss://api.lanyard.rest/socket");
      socket.addEventListener("message", (event) => {
        let message: {
          op?: number;
          t?: string;
          d?: Presence & { heartbeat_interval?: number };
        };
        try {
          message = JSON.parse(String(event.data)) as typeof message;
        } catch {
          return;
        }
        if (message.op === 1) {
          socket?.send(
            JSON.stringify({ op: 2, d: { subscribe_to_id: discordUserId } }),
          );
          heartbeat = window.setInterval(
            () => socket?.send(JSON.stringify({ op: 3 })),
            message.d?.heartbeat_interval ?? 30_000,
          );
        }
        if (
          message.op === 0 &&
          (message.t === "INIT_STATE" || message.t === "PRESENCE_UPDATE")
        ) {
          setPresence(message.d ?? null);
        }
      });
      socket.addEventListener("close", () => {
        if (heartbeat) window.clearInterval(heartbeat);
        if (active) reconnect = window.setTimeout(connect, 5000);
      });
    };
    connect();
    return () => {
      active = false;
      if (heartbeat) window.clearInterval(heartbeat);
      if (reconnect) window.clearTimeout(reconnect);
      socket?.close();
    };
  }, [discordUserId]);
  useEffect(() => {
    if (!presence?.spotify?.timestamps) return;
    const update = () => setCurrentTime(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [presence?.spotify?.timestamps]);

  const status = presence?.discord_status ?? "offline";
  const custom = presence?.activities?.find((activity) => activity.type === 4);
  const activity = presence?.activities?.find(
    (candidate) => candidate.type === 0,
  );
  const timestamps = presence?.spotify?.timestamps;
  const progress = timestamps?.start && timestamps.end
    ? Math.max(0, Math.min(100, ((currentTime - timestamps.start) / (timestamps.end - timestamps.start)) * 100))
    : 0;

  return (
    <section className="w-full rounded-2xl border border-current/15 bg-current/5 p-4 text-left backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {presence?.discord_user?.username ?? t("discordPresence")}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs opacity-65">
            <span
              className="size-2 rounded-full"
              style={{
                backgroundColor: {
                  online: "#22c55e",
                  idle: "#f59e0b",
                  dnd: "#ef4444",
                  offline: "#94a3b8",
                }[status],
              }}
            />
            {t(statusTranslation[status])}
          </p>
        </div>
        <span className="rounded-full border border-current/15 px-2 py-1 text-[10px] font-semibold tracking-wider uppercase opacity-60">
          Discord
        </span>
      </div>
      {custom?.state ? (
        <p className="mt-3 text-sm opacity-80">
          {custom.emoji?.name ? `${custom.emoji.name} ` : ""}
          {custom.state}
        </p>
      ) : null}
      {showSpotify && presence?.spotify ? (
        <div className="mt-3 flex gap-3 rounded-xl bg-current/7 p-3">
          {presence.spotify.album_art_url ? (
            <span
              aria-hidden="true"
              className="size-12 shrink-0 rounded-lg bg-cover bg-center"
              style={{ backgroundImage: `url(${presence.spotify.album_art_url})` }}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{presence.spotify.song}</p>
            <p className="truncate text-[11px] opacity-60">{presence.spotify.artist}</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-current/10">
              <div className="h-full rounded-full bg-current/55" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      ) : null}
      {showActivity && activity ? (
        <div className="mt-3 text-sm">
          <p className="font-medium">{activity.name}</p>
          <p className="text-xs opacity-65">{activity.details ?? activity.state}</p>
        </div>
      ) : null}
    </section>
  );
}
