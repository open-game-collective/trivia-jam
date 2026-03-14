import { expect, test } from "@playwright/test";

test.describe("Host: create game and see Game Setup", () => {
  test("homepage → Create New Game → Game Setup with Import Questions and Share Game Link", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /trivia jam/i })
    ).toBeVisible();

    await page.getByRole("link", { name: /create new game/i }).click();

    await expect(page).toHaveURL(/\/games\/[a-f0-9-]+/i);
    await expect(
      page.getByRole("heading", { name: /game setup/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /import questions/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /share game link/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /start game/i })
    ).toBeVisible();
  });

  test("Start Game is disabled when there are no questions", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /create new game/i }).click();
    await expect(page).toHaveURL(/\/games\/[a-f0-9-]+/i);

    const startButton = page.getByRole("button", { name: /start game/i });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeDisabled();
  });
});
