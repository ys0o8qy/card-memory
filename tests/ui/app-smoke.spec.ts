import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const screenshotDir = "test-results/lightweight-screenshots";

test.beforeAll(async () => {
  await mkdir(screenshotDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("captures core app states for lightweight visual review", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "从 5 张 PAO 演示开始" }),
  ).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/home.png` });

  await page.getByRole("button", { name: "PAO 表" }).click();
  await expect(
    page.getByRole("heading", { name: "默认映射，可随时修改" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "秦始皇", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/pao-table.png` });

  await page.getByRole("button", { name: "训练模式" }).click();
  await page.getByRole("button", { name: "5 张 PAO 快速演示" }).click();
  await expect(page.getByText("PAO 快速演示 1 / 5")).toBeVisible();
  await expect(page.getByText("把这张牌想象成一个画面：")).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/pao-demo.png` });
});

test("edits a PAO mapping through the real UI", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "PAO 表" }).click();

  const spadeAControls = page.locator("tbody tr", { hasText: "黑桃A" });
  await expect(spadeAControls).toHaveCount(1);
  await spadeAControls.getByRole("button", { name: "编辑" }).click();

  await page.getByLabel("Persona").fill("测试人物");
  await page.getByLabel("Action").fill("测试动作");
  await page.getByLabel("Object").fill("测试物品");
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page.getByText("测试人物")).toBeVisible();
  await expect(page.getByText("测试动作")).toBeVisible();
  await expect(page.getByText("测试物品")).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/pao-edited.png` });
});
