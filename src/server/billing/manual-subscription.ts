import { Prisma } from "../../../generated/prisma/client";
import { z } from "zod";

import { db } from "~/server/db";
import { isRetryableTransactionError } from "~/server/db/transaction";
import { AppError } from "~/server/errors";

const MANUAL_PROVIDER = "manual";
const MIN_GRANT_MONTHS = 1;
const MAX_GRANT_MONTHS = 24;
const MAX_TRANSACTION_ATTEMPTS = 3;

export const manualPremiumGrantSchema = z.object({
  userId: z.string().cuid(),
  months: z.number().int().min(MIN_GRANT_MONTHS).max(MAX_GRANT_MONTHS),
  reason: z.string().trim().min(3).max(300),
  confirmation: z.literal("CONFIRM"),
});

export type ManualPremiumGrantInput = z.infer<
  typeof manualPremiumGrantSchema
> & { actorId: string };

export function addUtcCalendarMonths(base: Date, months: number): Date {
  if (
    !Number.isInteger(months) ||
    months < MIN_GRANT_MONTHS ||
    months > MAX_GRANT_MONTHS
  ) {
    throw new Error("MANUAL_SUBSCRIPTION_MONTHS_INVALID");
  }

  const targetMonthStart = new Date(
    Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth() + months,
      1,
      base.getUTCHours(),
      base.getUTCMinutes(),
      base.getUTCSeconds(),
      base.getUTCMilliseconds(),
    ),
  );
  const lastDay = new Date(
    Date.UTC(
      targetMonthStart.getUTCFullYear(),
      targetMonthStart.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  targetMonthStart.setUTCDate(Math.min(base.getUTCDate(), lastDay));
  return targetMonthStart;
}

export async function grantManualPremium(input: ManualPremiumGrantInput) {
  const grant = manualPremiumGrantSchema.parse(input);
  const reason = grant.reason;

  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await db.$transaction(
        async (tx) => {
          const [user, actor, premiumPlan] = await Promise.all([
            tx.user.findUnique({
              where: { id: input.userId },
              select: { id: true },
            }),
            tx.user.findUnique({
              where: { id: input.actorId },
              select: { id: true },
            }),
            tx.plan.findUnique({ where: { key: "PREMIUM" } }),
          ]);
          if (!user) throw new AppError("NOT_FOUND", "User not found");
          if (!actor) throw new AppError("UNAUTHORIZED", "Actor not found");
          if (!premiumPlan?.active) {
            throw new AppError(
              "FEATURE_NOT_AVAILABLE",
              "Premium plan is not available",
            );
          }

          const providerSubscriptionId = `manual:${input.userId}`;
          const existing = await tx.subscription.findUnique({
            where: {
              provider_providerSubscriptionId: {
                provider: MANUAL_PROVIDER,
                providerSubscriptionId,
              },
            },
          });
          const now = new Date();
          const extendsExistingPeriod =
            existing?.currentPeriodEnd && existing.currentPeriodEnd > now;
          const base = extendsExistingPeriod
            ? existing.currentPeriodEnd!
            : now;
          const currentPeriodEnd = addUtcCalendarMonths(base, grant.months);
          const currentPeriodStart = extendsExistingPeriod
            ? existing.currentPeriodStart
            : now;

          const subscription = await tx.subscription.upsert({
            where: {
              provider_providerSubscriptionId: {
                provider: MANUAL_PROVIDER,
                providerSubscriptionId,
              },
            },
            create: {
              userId: input.userId,
              planId: premiumPlan.id,
              provider: MANUAL_PROVIDER,
              providerSubscriptionId,
              status: "ACTIVE",
              currentPeriodStart,
              currentPeriodEnd,
            },
            update: {
              planId: premiumPlan.id,
              status: "ACTIVE",
              currentPeriodStart,
              currentPeriodEnd,
              canceledAt: null,
            },
            include: { plan: true },
          });

          await tx.subscriptionEvent.create({
            data: {
              subscriptionId: subscription.id,
              type: "manual.granted",
              fromStatus: existing?.status,
              toStatus: "ACTIVE",
              metadata: {
                actorId: input.actorId,
                months: grant.months,
                reason,
                previousPeriodEnd:
                  existing?.currentPeriodEnd?.toISOString() ?? null,
                grantedThrough: currentPeriodEnd.toISOString(),
              },
            },
          });
          await tx.auditLog.create({
            data: {
              actorId: input.actorId,
              actorType: "ADMIN",
              action: "SUBSCRIPTION_MANUAL_GRANT",
              targetType: "User",
              targetId: input.userId,
              metadata: {
                subscriptionId: subscription.id,
                months: grant.months,
                reason,
                grantedThrough: currentPeriodEnd.toISOString(),
              },
            },
          });

          return subscription;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 10_000,
        },
      );
    } catch (error) {
      if (
        isRetryableTransactionError(error) &&
        attempt < MAX_TRANSACTION_ATTEMPTS - 1
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new AppError("CONFLICT", "The subscription grant could not be applied");
}
