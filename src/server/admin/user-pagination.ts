export const ADMIN_USERS_PAGE_SIZE = 100;

export function resolveAdminUsersPagination(
  requestedPage: number,
  total: number,
) {
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_USERS_PAGE_SIZE));
  const integerPage = Number.isFinite(requestedPage)
    ? Math.trunc(requestedPage)
    : 1;
  const page = Math.min(Math.max(integerPage, 1), pageCount);

  return {
    page,
    pageCount,
    pageSize: ADMIN_USERS_PAGE_SIZE,
    skip: (page - 1) * ADMIN_USERS_PAGE_SIZE,
  };
}

export function adminUsersPageHref(input: {
  page: number;
  query: string;
  role: string | undefined;
  status: string | undefined;
}) {
  const params = new URLSearchParams();
  if (input.query) params.set("q", input.query);
  if (input.role) params.set("role", input.role);
  if (input.status) params.set("status", input.status);
  if (input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}
