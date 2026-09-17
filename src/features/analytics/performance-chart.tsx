"use client";

import { useLocale } from "next-intl";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { AnalyticsPoint } from "~/lib/analytics";

export function PerformanceChart({ data, viewsLabel, clicksLabel }: { data: AnalyticsPoint[]; viewsLabel: string; clicksLabel: string }) {
  const locale = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
  const numberFormatter = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  return (
    <div className="h-72 w-full" role="img" aria-label={`${viewsLabel} / ${clicksLabel}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -20 }}>
          <defs><linearGradient id="views-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.24} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
          <XAxis dataKey="date" tickFormatter={(value: string) => dateFormatter.format(new Date(`${value}T00:00:00Z`))} axisLine={false} tickLine={false} minTickGap={28} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <YAxis allowDecimals={false} tickFormatter={(value: number) => numberFormatter.format(value)} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <Tooltip labelFormatter={(value) => dateFormatter.format(new Date(`${String(value)}T00:00:00Z`))} contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-md)", fontSize: 12 }} />
          <Area type="monotone" dataKey="views" name={viewsLabel} stroke="var(--primary)" strokeWidth={2} fill="url(#views-fill)" />
          <Area type="monotone" dataKey="clicks" name={clicksLabel} stroke="var(--muted-foreground)" strokeWidth={1.5} fill="transparent" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
