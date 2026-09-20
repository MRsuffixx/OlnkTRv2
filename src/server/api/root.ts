import { createCallerFactory, createTRPCRouter } from "./trpc";
import { accountRouter } from "./routers/account";
import { adminRouter } from "./routers/admin";
import { analyticsRouter } from "./routers/analytics";
import { domainRouter } from "./routers/domain";
import { integrationRouter } from "./routers/integration";
import { mediaRouter } from "./routers/media";
import { moderationRouter } from "./routers/moderation";
import { pageRouter } from "./routers/page";
import { profileRouter } from "./routers/profile";
import { subscriptionRouter } from "./routers/subscription";

export const appRouter = createTRPCRouter({
  account: accountRouter,
  profile: profileRouter,
  page: pageRouter,
  subscription: subscriptionRouter,
  admin: adminRouter,
  moderation: moderationRouter,
  analytics: analyticsRouter,
  media: mediaRouter,
  domain: domainRouter,
  integration: integrationRouter,
});
export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
