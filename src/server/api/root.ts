import {createCallerFactory,createTRPCRouter} from "./trpc";
import {accountRouter} from "./routers/account";import {profileRouter} from "./routers/profile";import {pageRouter} from "./routers/page";import {subscriptionRouter} from "./routers/subscription";import {adminRouter} from "./routers/admin";import {moderationRouter} from "./routers/moderation";import {analyticsRouter} from "./routers/analytics";
export const appRouter=createTRPCRouter({account:accountRouter,profile:profileRouter,page:pageRouter,subscription:subscriptionRouter,admin:adminRouter,moderation:moderationRouter,analytics:analyticsRouter});
export type AppRouter=typeof appRouter;export const createCaller=createCallerFactory(appRouter);
