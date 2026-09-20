import { expect, test, type APIRequestContext } from "@playwright/test";

type MailpitMessage = {
  ID: string;
  To: Array<{ Address: string }>;
};

async function waitForMagicLink(request: APIRequestContext, email: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const listing = await request.get("http://127.0.0.1:8025/api/v1/messages");
    if (listing.ok()) {
      const body = (await listing.json()) as { messages: MailpitMessage[] };
      const message = body.messages.find((item) =>
        item.To.some((recipient) => recipient.Address === email),
      );
      if (message) {
        const response = await request.get(
          `http://127.0.0.1:8025/api/v1/message/${message.ID}`,
        );
        const detail = (await response.json()) as {
          HTML?: string;
          Text?: string;
        };
        const link = (detail.HTML ?? detail.Text ?? "")
          .match(/https?:\/\/[^\s"<>]+\/api\/auth\/callback\/[^\s"<>]+/)?.[0]
          ?.replaceAll("&amp;", "&");
        if (link) return link;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No magic link received for ${email}`);
}

test("advanced free customization previews, persists, and publishes", async ({
  page,
  request,
}) => {
  const stamp = Date.now();
  const email = `editor-${stamp}@example.test`;
  const username = `editor${stamp.toString(36)}`;

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page).toHaveURL(/verify-request/, { timeout: 15_000 });
  await page.goto(await waitForMagicLink(request, email));
  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 15_000 });

  await page.getByLabel("Choose your username").fill(username);
  await page.getByLabel("Display name").fill("Advanced Creator");
  await expect(page.getByText("Username is available")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Create my page" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await page.goto("/dashboard/page");
  const editorNavigation = page.getByRole("navigation", { name: "My Page" });

  await editorNavigation.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByLabel("Color mode").selectOption("system");
  await expect(page.locator('[data-theme-mode="system"]')).toBeVisible();

  await editorNavigation.getByRole("button", { name: "Background", exact: true }).click();
  await page.getByLabel("Background type").selectOption("ANIMATED_GRADIENT");
  await expect(page.locator(".animate-theme-gradient")).toBeVisible();

  await editorNavigation.getByRole("button", { name: "Buttons", exact: true }).click();
  await page.getByLabel("Style").selectOption("outline");
  await page.getByLabel("Shape").selectOption("brutalist");

  await editorNavigation.getByRole("button", { name: "Effects", exact: true }).click();
  await page.getByLabel("Effect").selectOption("stars");
  await expect(page.locator('[data-vibe-layer="stars"]')).toBeVisible();
  await expect(
    page.locator('[aria-live="polite"]').filter({ hasText: "Saved" }),
  ).toHaveText("Saved", { timeout: 15_000 });

  await page.reload();
  await editorNavigation.getByRole("button", { name: "Appearance", exact: true }).click();
  await expect(page.getByLabel("Color mode")).toHaveValue("system");
  await editorNavigation.getByRole("button", { name: "Effects", exact: true }).click();
  await expect(page.getByLabel("Effect")).toHaveValue("stars");

  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(editorNavigation).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("Your page is live.")).toBeVisible({
    timeout: 15_000,
  });
  await page.goto(`/${username}`);
  await expect(page.locator('[data-theme-mode="system"]')).toBeVisible();
  await expect(page.locator('[data-vibe-layer="stars"]')).toBeVisible();
});
