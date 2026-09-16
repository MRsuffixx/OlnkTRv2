import { z } from "zod";

import { getUserEntitlements } from "~/server/entitlements/service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function topCounts<T extends string>(rows: Array<Record<T, string | null> & { _count: { _all: number } }>, key: T) {
  return rows
    .flatMap((row) => row[key] ? [{ value: row[key] as string, count: row._count._all }] : [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export const analyticsRouter = createTRPCRouter({
  summary: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const { grants } = await getUserEntitlements(ctx.session.user.id);
      const retention = grants.find((item) => item.featureKey === "ANALYTICS_RETENTION")?.limit;
      const days = retention === null ? input.days : Math.min(input.days, retention ?? 30);
      const since = new Date();
      since.setUTCDate(since.getUTCDate() - days + 1);
      since.setUTCHours(0, 0, 0, 0);

      const profiles = await ctx.db.profile.findMany({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });
      const profileIds = profiles.map((item) => item.id);
      const [daily, top, countries, devices, referrers] = await Promise.all([
        ctx.db.profileAnalyticsDaily.findMany({
          where: { profileId: { in: profileIds }, date: { gte: since } },
          orderBy: { date: "asc" },
        }),
        ctx.db.blockAnalyticsDaily.groupBy({
          by: ["blockId"],
          where: { date: { gte: since }, block: { page: { profile: { userId: ctx.session.user.id } } } },
          _sum: { clicks: true },
          orderBy: { _sum: { clicks: "desc" } },
          take: 10,
        }),
        ctx.db.analyticsEvent.groupBy({
          by: ["country"],
          where: { profileId: { in: profileIds }, occurredAt: { gte: since }, country: { not: null } },
          _count: { _all: true },
        }),
        ctx.db.analyticsEvent.groupBy({
          by: ["device"],
          where: { profileId: { in: profileIds }, occurredAt: { gte: since }, device: { not: null } },
          _count: { _all: true },
        }),
        ctx.db.analyticsEvent.groupBy({
          by: ["referrerHost"],
          where: { profileId: { in: profileIds }, occurredAt: { gte: since }, referrerHost: { not: null } },
          _count: { _all: true },
        }),
      ]);
      const blocks = await ctx.db.block.findMany({
        where: { id: { in: top.map((item) => item.blockId) } },
        select: { id: true, type: true, config: true },
      });
      const blockMap = new Map(blocks.map((block) => [block.id, block]));
      const totals = daily.reduce(
        (value, row) => ({ views: value.views + row.views, uniqueViews: value.uniqueViews + row.uniqueViews, clicks: value.clicks + row.clicks }),
        { views: 0, uniqueViews: 0, clicks: 0 },
      );

      return {
        days,
        totals: { ...totals, ctr: totals.views ? totals.clicks / totals.views : 0 },
        daily,
        topBlocks: top.map((item) => ({ block: blockMap.get(item.blockId) ?? null, clicks: item._sum.clicks ?? 0 })),
        breakdowns: {
          countries: topCounts(countries, "country"),
          devices: topCounts(devices, "device"),
          referrers: topCounts(referrers, "referrerHost"),
        },
      };
    }),
});
