"use client";

import { useEffect, useState } from "react";

export function VisitorCounterBlock({
  profileId,
  label,
  period,
}: {
  profileId: string;
  label: string;
  period: "daily" | "total";
}) {
  const [views, setViews] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/public/stats/${profileId}?period=${period}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((value: { views?: number } | null) =>
        setViews(typeof value?.views === "number" ? value.views : null),
      );
    return () => controller.abort();
  }, [period, profileId]);
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-current/15 bg-current/5 px-3 py-1.5 text-xs tabular-nums backdrop-blur-sm">
      <span className="size-2 rounded-full bg-current opacity-60" />
      <span>{label}</span>
      <strong>{views === null ? "—" : new Intl.NumberFormat().format(views)}</strong>
    </div>
  );
}
