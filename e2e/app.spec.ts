import { expect, test, type Page } from "@playwright/test";

const tempoInput = (page: Page) => page.getByRole("spinbutton", { name: "Tempo in BPM" });
const beatButtons = (page: Page) => page.getByRole("button", { name: /^Mute beat/ });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows the default metronome", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Metronome" })).toBeVisible();
  await expect(tempoInput(page)).toHaveValue("80");
  await expect(page.getByTestId("tempo-marking")).toHaveText("Andante");
  await expect(beatButtons(page)).toHaveCount(4);
  await expect(
    page.getByRole("group", { name: "Beats" }).getByRole("radio", { name: "4" }),
  ).toBeChecked();
});

test("starts and stops, flashing the beats", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(page.locator(".beat.lit")).toHaveCount(1, { timeout: 3000 });
  await expect
    .poll(() => beatButtons(page).nth(1).getAttribute("class"), { intervals: [10] })
    .toContain("lit");
  expect(page.workers()).toHaveLength(1);

  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
  await expect(page.locator(".beat.lit")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("changes the tempo with buttons, typing and the slider", async ({ page }) => {
  await page.getByRole("button", { name: "Increase tempo" }).click();
  await expect(tempoInput(page)).toHaveValue("81");
  await page.getByRole("button", { name: "Decrease tempo" }).click();
  await page.getByRole("button", { name: "Decrease tempo" }).click();
  await expect(tempoInput(page)).toHaveValue("79");

  await tempoInput(page).fill("300");
  await tempoInput(page).press("Enter");
  await expect(tempoInput(page)).toHaveValue("252");
  await expect(page.getByTestId("tempo-marking")).toHaveText("Prestissimo");

  await page.getByRole("slider", { name: "Tempo slider" }).fill("120");
  await expect(tempoInput(page)).toHaveValue("120");
  await expect(page.getByTestId("tempo-marking")).toHaveText("Allegro");
});

test("responds to keyboard shortcuts", async ({ page }) => {
  await page.keyboard.press("ArrowUp");
  await expect(tempoInput(page)).toHaveValue("81");
  await page.keyboard.press("Shift+ArrowUp");
  await expect(tempoInput(page)).toHaveValue("91");
  await page.keyboard.press("ArrowLeft");
  await expect(tempoInput(page)).toHaveValue("90");
  await page.keyboard.press("Shift+ArrowDown");
  await expect(tempoInput(page)).toHaveValue("80");

  await page.keyboard.press("t");
  await page.waitForTimeout(500);
  await page.keyboard.press("t");
  await expect(tempoInput(page)).not.toHaveValue("80");

  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
});

test("leaves space to focused controls", async ({ page }) => {
  await page.getByRole("button", { name: "Settings" }).focus();
  await page.keyboard.press("Space");
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();

  const sixBeats = page.getByRole("group", { name: "Beats" }).getByRole("radio", { name: "6" });
  await sixBeats.focus();
  await page.keyboard.press("Space");
  await expect(sixBeats).toBeChecked();

  await page.getByRole("button", { name: "Start" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start" })).toBeFocused();
});

test("keeps settings across reloads", async ({ page }) => {
  await page.getByRole("button", { name: "Increase tempo" }).click();
  await page.getByRole("group", { name: "Beats" }).getByRole("radio", { name: "6" }).check();
  await beatButtons(page).nth(2).click();

  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await dialog.getByLabel("Sound").selectOption({ label: "Pluck" });
  await dialog.getByLabel("Emphasize first beat").uncheck();
  await dialog.getByRole("radio", { name: "Dark" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await dialog.getByRole("button", { name: "Close" }).click();

  await page.reload();

  await expect(tempoInput(page)).toHaveValue("81");
  await expect(beatButtons(page)).toHaveCount(6);
  await expect(beatButtons(page).nth(2)).toHaveAttribute("aria-pressed", "true");
  await expect(beatButtons(page).nth(1)).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(dialog.getByLabel("Sound")).toHaveValue("pluck");
  await expect(dialog.getByLabel("Emphasize first beat")).not.toBeChecked();
});
