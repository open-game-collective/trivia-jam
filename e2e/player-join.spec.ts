import { expect, test } from "@playwright/test";

test.describe("Player: Join Game page", () => {
  test("opening a game URL shows Join Game form with name input", async ({
    page,
    browser,
  }) => {
    // Create a game first so we have a valid game URL
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    await hostPage.goto("/");
    await hostPage.getByRole("link", { name: /create new game/i }).click();
    await expect(hostPage).toHaveURL(/\/games\/[a-f0-9-]+/i);
    const gamePath = new URL(hostPage.url()).pathname;
    await hostContext.close();

    await page.goto(gamePath);

    await expect(
      page.getByRole("heading", { name: /join game/i })
    ).toBeVisible();
    await expect(page.getByLabel(/your name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /join game/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /how to play/i })).toBeVisible();
  });
});
