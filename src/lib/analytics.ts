export interface AnalyticsSeriesRow {
  date: Date | string;
  views: number;
  uniqueViews: number;
  clicks: number;
}

export interface AnalyticsPoint {
  date: string;
  views: number;
  uniqueViews: number;
  clicks: number;
}

function utcDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function fillAnalyticsSeries(rows: AnalyticsSeriesRow[], days: number, now = new Date()): AnalyticsPoint[] {
  const totals = new Map<string, Omit<AnalyticsPoint, "date">>();
  for (const row of rows) {
    const key = utcDateKey(row.date instanceof Date ? row.date : new Date(row.date));
    const current = totals.get(key) ?? { views: 0, uniqueViews: 0, clicks: 0 };
    totals.set(key, {
      views: current.views + row.views,
      uniqueViews: current.uniqueViews + row.uniqueViews,
      clicks: current.clicks + row.clicks,
    });
  }

  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (days - index - 1));
    const key = utcDateKey(date);
    return { date: key, ...(totals.get(key) ?? { views: 0, uniqueViews: 0, clicks: 0 }) };
  });
}

export function blockDisplayName(block: { type: string; config: unknown } | null | undefined) {
  if (!block || !block.config || typeof block.config !== "object") return "Untitled block";
  const config = block.config as Record<string, unknown>;
  if (typeof config.title === "string" && config.title.trim()) return config.title;
  if (typeof config.text === "string" && config.text.trim()) return config.text.slice(0, 60);
  return block.type.charAt(0) + block.type.slice(1).toLowerCase();
}
