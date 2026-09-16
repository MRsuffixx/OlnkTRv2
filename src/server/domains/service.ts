import { randomBytes } from "node:crypto";
import { resolveCname, resolveTxt } from "node:dns/promises";

import { AppError } from "~/server/errors";
import { can } from "~/server/entitlements/service";
import { db } from "~/server/db";
import { normalizeHostname } from "./hostname";

const cnameTarget = "domains.olnk.tr";

export async function addCustomDomain(userId: string, profileId: string, hostnameInput: string) {
  const entitlement = await can(userId, "CUSTOM_DOMAIN");
  if (!entitlement.allowed) throw new AppError("FEATURE_NOT_AVAILABLE", "Custom domains require Premium");
  const profile = await db.profile.findFirst({ where: { id: profileId, userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found");
  const hostname = normalizeHostname(hostnameInput);
  return db.$transaction(async (tx) => {
    const domain = await tx.customDomain.create({ data: { profileId, hostname, verificationToken: randomBytes(24).toString("base64url") } });
    await tx.auditLog.create({ data: { actorId: userId, actorType: "USER", action: "CUSTOM_DOMAIN_ADDED", targetType: "CustomDomain", targetId: domain.id, metadata: { hostname } } });
    return domain;
  }).catch((error: unknown) => {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") throw new AppError("CONFLICT", "This hostname is already connected");
    throw error;
  });
}

export async function verifyCustomDomain(userId: string, id: string) {
  const domain = await db.customDomain.findFirst({ where: { id, profile: { userId } } });
  if (!domain) throw new AppError("NOT_FOUND", "Domain not found");
  const challenge = `_olnk-challenge.${domain.hostname}`;
  const [cnames, textRecords] = await Promise.all([
    resolveCname(domain.hostname).catch(() => [] as string[]),
    resolveTxt(challenge).catch(() => [] as string[][]),
  ]);
  const cnameReady = cnames.some((value) => value.replace(/\.$/, "").toLowerCase() === cnameTarget);
  const tokenReady = textRecords.some((parts) => parts.join("") === domain.verificationToken);
  if (!cnameReady || !tokenReady) return { active: false, cnameReady, tokenReady };
  await db.$transaction([
    db.customDomain.update({ where: { id }, data: { status: "ACTIVE", verifiedAt: new Date() } }),
    db.auditLog.create({ data: { actorId: userId, actorType: "USER", action: "CUSTOM_DOMAIN_VERIFIED", targetType: "CustomDomain", targetId: id, metadata: { hostname: domain.hostname } } }),
  ]);
  return { active: true, cnameReady: true, tokenReady: true };
}

export async function removeCustomDomain(userId: string, id: string) {
  const domain = await db.customDomain.findFirst({ where: { id, profile: { userId } } });
  if (!domain) throw new AppError("NOT_FOUND", "Domain not found");
  await db.$transaction([
    db.customDomain.delete({ where: { id } }),
    db.auditLog.create({ data: { actorId: userId, actorType: "USER", action: "CUSTOM_DOMAIN_REMOVED", targetType: "CustomDomain", targetId: id, metadata: { hostname: domain.hostname } } }),
  ]);
  return { removed: true };
}

export const customDomainCnameTarget = cnameTarget;
