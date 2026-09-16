import { describe, expect, it } from "vitest";

import { buttonVariants } from "~/components/ui/button";

describe("buttonVariants", () => {
  it("uses semantic primary styles and an explicit focus ring", () => {
    const classes = buttonVariants({ variant: "primary", size: "md" });

    expect(classes).toContain("bg-primary");
    expect(classes).toContain("focus-visible:ring-focus");
    expect(classes).not.toContain("transition-all");
  });

  it("gives destructive actions a semantic danger treatment", () => {
    const classes = buttonVariants({ variant: "danger", size: "sm" });

    expect(classes).toContain("bg-danger");
    expect(classes).toContain("h-8");
  });
});
