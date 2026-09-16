import { z } from "zod";

import { addCustomDomain, customDomainCnameTarget, removeCustomDomain, verifyCustomDomain } from "~/server/domains/service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const domainRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => ctx.db.customDomain.findMany({
    where: { profile: { userId: ctx.session.user.id } },
    orderBy: { createdAt: "desc" },
    select: { id: true, hostname: true, verificationToken: true, verifiedAt: true, status: true, profileId: true },
  })),
  configuration: protectedProcedure.query(() => ({ cnameTarget: customDomainCnameTarget, txtNamePrefix: "_olnk-challenge" })),
  add: protectedProcedure.input(z.object({ profileId: z.string().cuid(), hostname: z.string().min(1).max(253) })).mutation(({ ctx, input }) => addCustomDomain(ctx.session.user.id, input.profileId, input.hostname)),
  verify: protectedProcedure.input(z.object({ id: z.string().cuid() })).mutation(({ ctx, input }) => verifyCustomDomain(ctx.session.user.id, input.id)),
  remove: protectedProcedure.input(z.object({ id: z.string().cuid() })).mutation(({ ctx, input }) => removeCustomDomain(ctx.session.user.id, input.id)),
});
