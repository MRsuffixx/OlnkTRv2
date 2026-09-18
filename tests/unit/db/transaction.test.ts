import { describe, expect, it } from "vitest";

import { isRetryableTransactionError } from "~/server/db/transaction";

describe("transaction conflict classification", () => {
  it("recognizes PostgreSQL serialization conflicts from the Prisma driver adapter", () => {
    expect(
      isRetryableTransactionError({
        name: "DriverAdapterError",
        cause: {
          kind: "TransactionWriteConflict",
          originalCode: "40001",
        },
      }),
    ).toBe(true);
  });

  it("does not retry unrelated database errors", () => {
    expect(isRetryableTransactionError({ code: "P2002" })).toBe(false);
    expect(isRetryableTransactionError(new Error("connection refused"))).toBe(
      false,
    );
  });
});
