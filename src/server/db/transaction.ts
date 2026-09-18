type DatabaseErrorShape = {
  code?: unknown;
  kind?: unknown;
  originalCode?: unknown;
  cause?: unknown;
};

export function isRetryableTransactionError(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object") return false;
    const candidate = current as DatabaseErrorShape;
    if (
      candidate.code === "P2034" ||
      candidate.originalCode === "40001" ||
      candidate.kind === "TransactionWriteConflict"
    ) {
      return true;
    }
    current = candidate.cause;
  }

  return false;
}
