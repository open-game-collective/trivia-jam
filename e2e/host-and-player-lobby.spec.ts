import { expect, test } from "@playwright/test";

test.describe("Host creates game, player joins lobby", () => {
  test("two contexts: host creates game, player joins and both see lobby", async ({
    browser,
  }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();

    try {
      const hostPage = await hostContext.newPage();
      const playerPage = await playerContext.newPage();

      // Host: homepage → Create New Game
      await hostPage.goto("/");
      await hostPage.getByRole("link", { name: /create new game/i }).click();
      await expect(hostPage).toHaveURL(/\/games\/[a-f0-9-]+/i);

      const gamePath = new URL(hostPage.url()).pathname;

      // Player: open same game URL → Join Game form
      await playerPage.goto(gamePath);
      await expect(
        playerPage.getByRole("heading", { name: /join game/i })
      ).toBeVisible();
      await expect(
        playerPage.getByLabel(/your name/i)
      ).toBeVisible();

      // Player: enter name and join
      await playerPage.getByLabel(/your name/i).fill("E2E Player");
      await playerPage.getByRole("button", { name: /join game/i }).click();

      // Player: should see lobby (waiting for host or player list)
      await expect(
        playerPage.getByText(/waiting for host|players|empty slot/i)
      ).toBeVisible({ timeout: 15_000 });

      // Host: should see at least 1 player (themselves or the joiner)
      await expect(
        hostPage.getByText(/\d+\/\d+\s*players?/i)
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});
