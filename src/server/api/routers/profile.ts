import { z } from "zod";

import { changeUsername, completeOnboarding, updateProfile } from "~/server/profile/service";
import { usernameSchema } from "~/server/profile/username";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const profileRouter = createTRPCRouter({
  mine: protectedProcedure.query(({ ctx }) => ctx.db.profile.findMany({
    where: { userId: ctx.session.user.id },
    include: {
      page: {
        include: {
          publication: { select: { versionId: true, publishedAt: true } },
        },
      },
    },
  })),
  usernameAvailable: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const parsed = usernameSchema.safeParse(input.username);
      if (!parsed.success) return false;
      return !(await ctx.db.profile.findUnique({ where: { username: parsed.data } }))
        && !(await ctx.db.reservedUsername.findUnique({ where: { username: parsed.data } }));
    }),
  onboard: protectedProcedure
    .input(z.object({ username: z.string(), displayName: z.string().trim().min(1).max(80) }))
    .mutation(({ ctx, input }) => completeOnboarding(ctx.session.user.id, input)),
  update: protectedProcedure
    .input(z.object({ profileId: z.string().cuid(), displayName: z.string().min(1).max(80), bio: z.string().max(500).nullable().optional() }))
    .mutation(({ ctx, input }) => updateProfile(ctx.session.user.id, input)),
  changeUsername: protectedProcedure
    .input(z.object({ profileId: z.string().cuid(), username: z.string() }))
    .mutation(({ ctx, input }) => changeUsername(ctx.session.user.id, input)),
});
