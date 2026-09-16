import { z } from "zod";

import { storage } from "~/server/storage";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const mediaRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => ctx.db.mediaAsset.findMany({
    where: { ownerId: ctx.session.user.id, status: "READY" },
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, mimeType: true, size: true, width: true, height: true, createdAt: true },
  })),
  delete: protectedProcedure.input(z.object({ id: z.string().cuid() })).mutation(async ({ ctx, input }) => {
    const asset = await ctx.db.mediaAsset.findFirst({ where: { id: input.id, ownerId: ctx.session.user.id, status: "READY" } });
    if (!asset) return { deleted: false };
    await storage.deleteObject(asset.objectKey);
    await ctx.db.mediaAsset.update({ where: { id: asset.id }, data: { status: "DELETED" } });
    return { deleted: true };
  }),
});
