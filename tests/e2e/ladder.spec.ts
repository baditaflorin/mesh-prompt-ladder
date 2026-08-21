import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";

test("a facilitator confirms a shared request for the next discussion rung", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix: "mesh-prompt-ladder",
  });
  try {
    await a.getByLabel("Your display name").fill("Ari");
    await b.getByLabel("Your display name").fill("Bea");
    await a.getByRole("button", { name: "Start as facilitator" }).click();
    await expect(b.getByText(/Warm up, rung 1/i)).toBeVisible({ timeout: 10_000 });
    await b.getByRole("button", { name: "Request next rung" }).click();
    await expect(a.getByText(/requested the next rung/i)).toBeVisible({ timeout: 10_000 });
    await a.getByRole("button", { name: "Confirm and advance" }).click();
    await expect(b.getByText(/Grounded, rung 2/i)).toBeVisible({ timeout: 10_000 });
  } finally {
    await cleanup();
  }
});
