import { z } from "zod";

import { storage } from "~/server/storage";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const mediaRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const assets = await ctx.db.mediaAsset.findMany({
      where: {
        ownerId: ctx.session.user.id,
        variant: "ORIGINAL",
        status: { not: "DELETED" },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        kind: true,
        status: true,
        processingErrorCode: true,
        size: true,
        width: true,
        height: true,
        durationMs: true,
        createdAt: true,
        derivatives: {
          where: { status: "READY" },
          select: { id: true, variant: true },
        },
      },
    });
    return assets.map(({ derivatives, ...asset }) => ({
      ...asset,
      posterAssetId:
        derivatives.find((item) => item.variant === "POSTER")?.id ?? null,
      optimizedAssetId:
        derivatives.find((item) => item.variant === "OPTIMIZED")?.id ?? null,
    }));
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const asset = await ctx.db.mediaAsset.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id,
          variant: "ORIGINAL",
          status: { in: ["READY", "REJECTED"] },
        },
        include: { derivatives: true },
      });
      if (!asset) return { deleted: false };
      await Promise.all(
        [asset, ...asset.derivatives].map((item) =>
          storage.deleteObject(item.objectKey),
        ),
      );
      await ctx.db.mediaAsset.updateMany({
        where: { id: { in: [asset.id, ...asset.derivatives.map((item) => item.id)] } },
        data: { status: "DELETED" },
      });
      return { deleted: true };
    }),
});
