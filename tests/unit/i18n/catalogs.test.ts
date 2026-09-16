import { describe, expect, it } from "vitest";

import en from "../../../messages/en.json";
import tr from "../../../messages/tr.json";

function keys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const nested = keys(child, path);
    return nested.length ? nested : [path];
  });
}

describe("translation catalogs", () => {
  it("keeps English and Turkish message keys in parity", () => {
    expect(keys(tr).sort()).toEqual(keys(en).sort());
  });
});
