import { expect, test } from "@playwright/test";

test("switches between English and Turkish across full navigations", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Language" }).click();
  await page.getByRole("menuitemradio", { name: "Türkçe" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.getByRole("link", { name: "Giriş yap" })).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.getByRole("link", { name: "Giriş yap" })).toBeVisible();

  await page.getByRole("button", { name: "Dil" }).click();
  await page.getByRole("menuitemradio", { name: "English" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
});
