import { expect, test, type APIRequestContext } from "@playwright/test";

type MailpitMessage = {
  ID: string;
  To: Array<{ Address: string }>;
};

async function waitForMagicLink(request: APIRequestContext, email: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const listing = await request.get("http://127.0.0.1:8025/api/v1/messages");
    if (listing.ok()) {
      const body = await listing.json() as { messages: MailpitMessage[] };
      const message = body.messages.find((item) => item.To.some((recipient) => recipient.Address === email));
      if (message) {
        const detailResponse = await request.get(`http://127.0.0.1:8025/api/v1/message/${message.ID}`);
        const detail = await detailResponse.json() as { HTML?: string; Text?: string };
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

test("passwordless onboarding, editing, publishing, and media upload", async ({ browser, page, request }) => {
  const stamp = Date.now();
  const email = `e2e-${stamp}@example.test`;
  const username = `e2e${stamp.toString(36)}`;

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page).toHaveURL(/verify-request/);

  const magicLink = await waitForMagicLink(request, email);
  await page.goto(magicLink);
  await expect(page).toHaveURL(/\/onboarding$/);

  const replayPage = await browser.newPage();
  await replayPage.goto(magicLink);
  await expect(replayPage).toHaveURL(/error|login/);
  await replayPage.close();

  await page.getByLabel("Choose your username").fill(username);
  await page.getByLabel("Display name").fill("E2E Creator");
  await expect(page.getByText("Username is available")).toBeVisible();
  await page.getByRole("button", { name: "Create my page" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /E2E/ })).toBeVisible();

  await page.goto("/dashboard/page");
  await page.getByRole("button", { name: "Add block" }).first().click();
  await page.getByRole("button", { name: /Link Send visitors/ }).click();

  const draftSaved = page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().includes("/dashboard/page") && response.ok(),
  );
  await page.getByLabel("Title").fill("Example portfolio");
  await page.getByLabel("URL").fill("https://example.com/portfolio");
  await draftSaved;
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  const published = page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().includes("/dashboard/page") && response.ok(),
  );
  await page.getByRole("button", { name: "Publish" }).click();
  await published;

  await page.goto(`/${username}`);
  await expect(page.getByRole("heading", { name: "E2E Creator" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Example portfolio" })).toHaveAttribute("href", "https://example.com/portfolio");

  await page.goto("/dashboard/media");
  await page.locator('input[type="file"]').setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByText("Upload completed")).toBeVisible();
  await expect(page.getByText("pixel.png")).toBeVisible();
});
