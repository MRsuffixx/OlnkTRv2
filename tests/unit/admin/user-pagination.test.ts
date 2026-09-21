import { describe, expect, it } from "vitest";

import {
  ADMIN_USERS_PAGE_SIZE,
  adminUsersPageHref,
  resolveAdminUsersPagination,
} from "~/server/admin/user-pagination";

describe("admin user pagination", () => {
  it("uses a fixed 100-user page size and clamps requested pages", () => {
    expect(ADMIN_USERS_PAGE_SIZE).toBe(100);
    expect(resolveAdminUsersPagination(2, 250)).toEqual({
      page: 2,
      pageCount: 3,
      pageSize: 100,
      skip: 100,
    });
    expect(resolveAdminUsersPagination(99, 250).page).toBe(3);
    expect(resolveAdminUsersPagination(-2, 0)).toEqual({
      page: 1,
      pageCount: 1,
      pageSize: 100,
      skip: 0,
    });
  });

  it("preserves active filters in page navigation links", () => {
    expect(
      adminUsersPageHref({
        page: 3,
        query: "alice@example.com",
        role: "USER",
        status: "ACTIVE",
      }),
    ).toBe(
      "/admin?q=alice%40example.com&role=USER&status=ACTIVE&page=3",
    );
    expect(adminUsersPageHref({ page: 1, query: "", role: undefined, status: undefined })).toBe(
      "/admin",
    );
  });
});

