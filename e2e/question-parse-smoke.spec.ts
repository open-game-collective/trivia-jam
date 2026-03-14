import { expect, test } from "@playwright/test";

// @smoke: real Gemini API
// This test depends on GEMINI_API_KEY being set in the environment.
// It keeps the document tiny to minimize latency and cost.

test("host can import a simple questions document and see parsed questions @smoke", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("link", { name: /create new game/i }).click();
  await expect(page).toHaveURL(/\/games\/[a-f0-9-]+/i);
  await expect(
    page.getByRole("heading", { name: /import questions/i })
  ).toBeVisible();

  const doc = `What is 2 + 2?\n4\n\nWhat color is the sky on a clear day?\na) Red b) Blue c) Green d) Yellow\nCorrect answer: B`;

  await page.locator("textarea").fill(doc);
  await page.getByRole("button", { name: /submit/i }).click();

  // Wait for at least one parsed question to appear (Gemini + parsing pipeline).
  const firstParsed = page.getByTestId("parsed-question-1");
  await expect(firstParsed).toBeVisible({ timeout: 30_000 });

  // Basic sanity check on the text to ensure we didn't hit some unrelated UI.
  await expect(firstParsed).toContainText(/what is 2 \+ 2\?/i);
});
