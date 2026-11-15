import { expect, test, type Page } from "@playwright/test";

const tempoInput = (page: Page) => page.getByRole("textbox", { name: "Tempo in BPM" });
const beatButtons = (page: Page) => page.getByRole("button", { name: /^Mute beat/ });
const radio = (page: Page, group: string, name: string) =>
  page.getByRole("group", { name: group }).getByRole("radio", { name, exact: true });

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

test("uses space only to start and stop outside settings", async ({ page }) => {
  await page.getByRole("button", { name: "Tap" }).click();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
  await page.waitForTimeout(300);
  await page.keyboard.press("Space");
  await page.keyboard.press("Space");
  await expect(tempoInput(page)).toHaveValue("80");

  const sixBeats = radio(page, "Beats", "6");
  await sixBeats.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(sixBeats).not.toBeChecked();
  await expect(radio(page, "Beats", "4")).toBeChecked();
  await page.keyboard.press("Space");

  await page.getByRole("button", { name: "Start" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();
  const emphasize = page.getByRole("dialog").getByLabel("Emphasize first beat");
  await emphasize.focus();
  await page.keyboard.press("Space");
  await expect(emphasize).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
});

test("cycles beats and subdivisions with B and S", async ({ page }) => {
  await page.keyboard.press("b");
  await expect(beatButtons(page)).toHaveCount(5);
  await page.keyboard.press("Shift+B");
  await page.keyboard.press("Shift+B");
  await page.keyboard.press("Shift+B");
  await page.keyboard.press("Shift+B");
  await expect(beatButtons(page)).toHaveCount(1);
  await page.keyboard.press("Shift+B");
  await expect(beatButtons(page)).toHaveCount(8);
  await page.keyboard.press("b");
  await expect(beatButtons(page)).toHaveCount(1);

  await page.keyboard.press("Shift+S");
  await expect(radio(page, "Subdivisions", "4")).toBeChecked();
  await page.keyboard.press("s");
  await expect(radio(page, "Subdivisions", "1")).toBeChecked();
  await page.keyboard.press("s");
  await expect(radio(page, "Subdivisions", "2")).toBeChecked();
});

test("types a tempo anywhere and applies it on Enter", async ({ page }) => {
  await page.getByRole("button", { name: "Tap" }).focus();
  await page.keyboard.type("120");
  await expect(tempoInput(page)).toBeFocused();
  await expect(tempoInput(page)).toHaveValue("120");
  await expect(tempoInput(page)).toHaveClass(/pending/);
  await expect(page.getByTestId("tempo-marking")).toHaveText("Andante");
  await expect(page.getByRole("slider", { name: "Tempo slider" })).toHaveValue("80");

  await page.keyboard.press("t");
  await page.keyboard.press("b");
  await expect(tempoInput(page)).toHaveValue("120");
  await expect(beatButtons(page)).toHaveCount(4);

  await page.keyboard.press("Enter");
  await expect(tempoInput(page)).not.toBeFocused();
  await expect(tempoInput(page)).toHaveValue("120");
  await expect(tempoInput(page)).not.toHaveClass(/pending/);
  await expect(page.getByTestId("tempo-marking")).toHaveText("Allegro");
});

test("cancels a typed tempo with Escape and confirms it on blur", async ({ page }) => {
  await page.keyboard.type("99");
  await page.keyboard.press("Escape");
  await expect(tempoInput(page)).toHaveValue("80");
  await expect(tempoInput(page)).not.toBeFocused();

  await page.keyboard.type("66");
  await page.getByRole("heading", { name: "Metronome" }).click();
  await expect(tempoInput(page)).toHaveValue("66");
  await expect(page.getByTestId("tempo-marking")).toHaveText("Adagio");
});

test("selects the tempo on click so typing replaces it", async ({ page }) => {
  await tempoInput(page).click();
  await page.keyboard.type("1");
  await expect(tempoInput(page)).toHaveValue("1");
  await page.keyboard.type("4x05");
  await expect(tempoInput(page)).toHaveValue("140");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("tempo-marking")).toHaveText("Allegro");

  await tempoInput(page).click();
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Enter");
  await expect(tempoInput(page)).toHaveValue("140");
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
