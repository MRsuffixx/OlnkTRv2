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

test("adult links require session-scoped confirmation before navigation", async ({
  page,
  request,
}) => {
  const stamp = Date.now();
  const email = `adult-link-${stamp}@example.test`;
  const username = `adult${stamp.toString(36)}`;

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page).toHaveURL(/verify-request/, { timeout: 15_000 });
  await page.goto(await waitForMagicLink(request, email));

  await page.getByLabel("Choose your username").fill(username);
  await page.getByLabel("Display name").fill("Adult Link Creator");
  await expect(page.getByText("Username is available")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Create my page" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

  await page.goto("/dashboard/page");
  await page.getByRole("button", { name: "Add block" }).first().click();
  await page.getByLabel("Search blocks").fill("Adult Link");
  await page.getByRole("button", { name: /Adult Link/ }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await page.getByLabel("Title").fill("Private community");
  await page.getByLabel("URL").fill("http://localhost:3000/features");
  await expect(
    page.locator('[aria-live="polite"]').filter({ hasText: "Saved" }),
  ).toHaveText("Saved", { timeout: 15_000 });
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("Your page is live.")).toBeVisible({
    timeout: 15_000,
  });

  let blockClicks = 0;
  page.on("request", (outgoing) => {
    if (!outgoing.url().endsWith("/api/analytics")) return;
    const payload = outgoing.postDataJSON() as { eventType?: string } | null;
    if (payload?.eventType === "BLOCK_CLICK") blockClicks += 1;
  });

  await page.goto(`/${username}`);
  const adultLink = page.getByRole("button", { name: /Private community/ });
  await adultLink.click();
  const dialog = page.getByRole("dialog", { name: "Before you continue" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Go back" }).click();
  await expect(dialog).toBeHidden();
  await expect(adultLink).toBeFocused();
  expect(blockClicks).toBe(0);

  await adultLink.click();
  const firstPopupPromise = page.waitForEvent("popup");
  await page
    .getByRole("dialog", { name: "Before you continue" })
    .getByRole("button", { name: "Continue to external site" })
    .click();
  const firstPopup = await firstPopupPromise;
  await firstPopup.close();
  await expect.poll(() => blockClicks).toBe(1);
  const consentEntries = await page.evaluate(() =>
    Array.from({ length: sessionStorage.length }, (_, index) => {
      const key = sessionStorage.key(index);
      return key ? ([key, sessionStorage.getItem(key)] as const) : null;
    }).filter(
      (entry): entry is readonly [string, string | null] =>
        Boolean(entry?.[0].startsWith("olnk:adult-consent:v1:")),
    ),
  );
  expect(consentEntries).toHaveLength(1);
  expect(consentEntries[0]?.[1]).toBe("confirmed");

  const secondPopupPromise = page.waitForEvent("popup");
  await adultLink.click();
  const secondPopup = await secondPopupPromise;
  await secondPopup.close();
  await expect(dialog).toBeHidden();
  await expect.poll(() => blockClicks).toBe(2);
});
