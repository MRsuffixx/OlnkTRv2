import {createTRPCRouter,protectedProcedure} from "../trpc";
import {getUserEntitlements} from "~/server/entitlements/service";
import {developmentBillingProvider} from "~/server/billing/provider";
export const subscriptionRouter=createTRPCRouter({entitlements:protectedProcedure.query(({ctx})=>getUserEntitlements(ctx.session.user.id)),current:protectedProcedure.query(({ctx})=>ctx.db.subscription.findFirst({where:{userId:ctx.session.user.id},include:{plan:true},orderBy:{updatedAt:"desc"}})),createDevelopmentCheckout:protectedProcedure.mutation(({ctx})=>developmentBillingProvider.createCheckout(ctx.session.user.id,"PREMIUM"))});
