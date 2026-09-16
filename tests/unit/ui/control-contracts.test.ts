import { describe, expect, it } from "vitest";

import { segmentedControlVariants } from "~/components/ui/segmented-control";
import { sheetContentClasses } from "~/components/ui/sheet";

describe("interactive control contracts", () => {
  it("uses targeted motion for sheets", () => {
    expect(sheetContentClasses).toContain("transition-[transform,opacity]");
    expect(sheetContentClasses).not.toContain("transition-all");
  });

  it("provides an accessible selected treatment for segmented controls", () => {
    const classes = segmentedControlVariants();
    expect(classes).toContain("data-[state=on]:bg-surface-raised");
    expect(classes).toContain("focus-visible:ring-focus");
  });
});
