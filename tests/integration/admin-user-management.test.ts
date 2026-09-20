import { afterAll, describe, expect, it } from "vitest";

import { db } from "~/server/db";
import {
  changeUserRole,
  getManagedUserDetail,
  setProfileModeration,
  setUserSuspended,
} from "~/server/admin/user-management";
import { completeOnboarding } from "~/server/profile/service";

const integration = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

integration("staff user management", () => {
  const userIds: string[] = [];

  afterAll(async () => {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });

  it("lets a moderator suspend an ordinary user and revoke their sessions", async () => {
    const stamp = Date.now();
    const [moderator, user] = await Promise.all([
      db.user.create({ data: { email: `moderator-${stamp}@test.local`, role: "MODERATOR" } }),
      db.user.create({ data: { email: `member-${stamp}@test.local` } }),
    ]);
    userIds.push(moderator.id, user.id);
    const session = await db.session.create({
      data: {
        sessionToken: `staff-test-${stamp}`,
        userId: user.id,
        expires: new Date(Date.now() + 86_400_000),
      },
    });

    await setUserSuspended({
      actorId: moderator.id,
      targetUserId: user.id,
      suspended: true,
      reason: "Repeated phishing links",
    });

    const [updatedUser, updatedSession, audit, securityEvent] = await Promise.all([
      db.user.findUniqueOrThrow({ where: { id: user.id } }),
      db.session.findUniqueOrThrow({ where: { id: session.id } }),
      db.auditLog.findFirstOrThrow({
        where: { actorId: moderator.id, targetId: user.id, action: "USER_SUSPENDED" },
      }),
      db.securityEvent.findFirstOrThrow({
        where: { userId: user.id, type: "ACCOUNT_SUSPENDED_BY_STAFF" },
      }),
    ]);
    expect(updatedUser.status).toBe("SUSPENDED");
    expect(updatedSession.revokedAt).not.toBeNull();
    expect(updatedSession.expires.getTime()).toBeLessThanOrEqual(Date.now());
    expect(audit.metadata).toMatchObject({ reason: "Repeated phishing links" });
    expect(securityEvent.metadata).toMatchObject({ actorId: moderator.id });
  });

  it("prevents a moderator from suspending another moderator", async () => {
    const stamp = Date.now();
    const [actor, target] = await Promise.all([
      db.user.create({ data: { email: `moderator-a-${stamp}@test.local`, role: "MODERATOR" } }),
      db.user.create({ data: { email: `moderator-b-${stamp}@test.local`, role: "MODERATOR" } }),
    ]);
    userIds.push(actor.id, target.id);

    await expect(
      setUserSuspended({
        actorId: actor.id,
        targetUserId: target.id,
        suspended: true,
        reason: "Not allowed",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("places a user's profile under moderation hold with an audit reason", async () => {
    const stamp = Date.now();
    const [moderator, user] = await Promise.all([
      db.user.create({ data: { email: `profile-moderator-${stamp}@test.local`, role: "MODERATOR" } }),
      db.user.create({ data: { email: `profile-member-${stamp}@test.local` } }),
    ]);
    userIds.push(moderator.id, user.id);
    const profile = await completeOnboarding(user.id, {
      username: `moderated_${stamp}`,
      displayName: "Moderated profile",
    });

    await setProfileModeration({
      actorId: moderator.id,
      profileId: profile.id,
      hidden: true,
      reason: "Malware report confirmed",
    });

    const [updated, audit] = await Promise.all([
      db.profile.findUniqueOrThrow({ where: { id: profile.id } }),
      db.auditLog.findFirstOrThrow({
        where: { actorId: moderator.id, targetId: profile.id, action: "PROFILE_MODERATION_HOLD" },
      }),
    ]);
    expect(updated.status).toBe("MODERATION_HOLD");
    expect(audit.metadata).toMatchObject({
      reason: "Malware report confirmed",
      previousStatus: "ACTIVE",
    });
  });

  it("allows a super administrator to assign the moderator role", async () => {
    const stamp = Date.now();
    const [actor, user] = await Promise.all([
      db.user.create({ data: { email: `super-${stamp}@test.local`, role: "SUPER_ADMIN" } }),
      db.user.create({ data: { email: `future-moderator-${stamp}@test.local` } }),
    ]);
    userIds.push(actor.id, user.id);

    await changeUserRole({
      actorId: actor.id,
      targetUserId: user.id,
      role: "MODERATOR",
      reason: "Joined the trust and safety team",
    });

    const [updated, audit] = await Promise.all([
      db.user.findUniqueOrThrow({ where: { id: user.id } }),
      db.auditLog.findFirstOrThrow({
        where: { actorId: actor.id, targetId: user.id, action: "USER_ROLE_CHANGED" },
      }),
    ]);
    expect(updated.role).toBe("MODERATOR");
    expect(audit.metadata).toMatchObject({
      fromRole: "USER",
      toRole: "MODERATOR",
      reason: "Joined the trust and safety team",
    });
  });

  it("returns a scoped detail view only for lower-ranked users", async () => {
    const stamp = Date.now();
    const [moderator, user, peer] = await Promise.all([
      db.user.create({ data: { email: `detail-moderator-${stamp}@test.local`, role: "MODERATOR" } }),
      db.user.create({ data: { email: `detail-member-${stamp}@test.local` } }),
      db.user.create({ data: { email: `detail-peer-${stamp}@test.local`, role: "MODERATOR" } }),
    ]);
    userIds.push(moderator.id, user.id, peer.id);
    await completeOnboarding(user.id, {
      username: `detail_${stamp}`,
      displayName: "Detailed member",
    });
    await db.session.create({
      data: {
        sessionToken: `detail-session-${stamp}`,
        userId: user.id,
        expires: new Date(Date.now() + 86_400_000),
      },
    });

    const detail = await getManagedUserDetail(moderator.id, user.id);
    expect(detail.user).toMatchObject({ id: user.id, role: "USER" });
    expect(detail.profiles).toHaveLength(1);
    expect(detail.activeSessions).toHaveLength(1);
    expect(detail.capabilities).toEqual({
      canModerate: true,
      canAssignRole: false,
      canGrantPremium: false,
    });
    await expect(
      getManagedUserDetail(moderator.id, peer.id),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
