import { z } from "zod";

import { createBlock, deleteBlock, duplicateBlock, getOwnedDraft, reorderBlocks, setBlockEnabled, updateBlock, updateDraft } from "~/server/page/service";
import { pageDraftUpdateSchema } from "~/server/publishing/snapshot";
import { publishPage } from "~/server/publishing/service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const pageRouter = createTRPCRouter({
  draft: protectedProcedure
    .input(z.object({ pageId: z.string().cuid() }))
    .query(({ ctx, input }) => getOwnedDraft(ctx.session.user.id, input.pageId)),
  updateDraft: protectedProcedure
    .input(pageDraftUpdateSchema)
    .mutation(({ ctx, input }) => updateDraft(ctx.session.user.id, input)),
  blocks: protectedProcedure
    .input(z.object({ pageId: z.string().cuid() }))
    .query(({ ctx, input }) => ctx.db.block.findMany({
      where: { pageId: input.pageId, deletedAt: null, page: { profile: { userId: ctx.session.user.id } } },
      orderBy: { position: "asc" },
    })),
  createBlock: protectedProcedure
    .input(z.object({ pageId: z.string().cuid(), type: z.string(), config: z.unknown() }))
    .mutation(({ ctx, input }) => createBlock(ctx.session.user.id, input)),
  updateBlock: protectedProcedure
    .input(z.object({ id: z.string().cuid(), type: z.string(), config: z.unknown(), enabled: z.boolean().optional() }))
    .mutation(({ ctx, input }) => updateBlock(ctx.session.user.id, input)),
  setEnabled: protectedProcedure
    .input(z.object({ id: z.string().cuid(), enabled: z.boolean() }))
    .mutation(({ ctx, input }) => setBlockEnabled(ctx.session.user.id, input.id, input.enabled)),
  deleteBlock: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ ctx, input }) => deleteBlock(ctx.session.user.id, input.id)),
  duplicateBlock: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ ctx, input }) => duplicateBlock(ctx.session.user.id, input.id)),
  reorder: protectedProcedure
    .input(z.object({ pageId: z.string().cuid(), ids: z.array(z.string().cuid()).max(500) }))
    .mutation(({ ctx, input }) => reorderBlocks(ctx.session.user.id, input.pageId, input.ids)),
  publish: protectedProcedure
    .input(z.object({ pageId: z.string().cuid() }))
    .mutation(({ ctx, input }) => publishPage(ctx.session.user.id, input.pageId)),
});
