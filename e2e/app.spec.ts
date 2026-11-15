import { expect, test, type Page } from "@playwright/test";

const tempoInput = (page: Page) => page.getByRole("textbox", { name: "Tempo in BPM" });
const volumeSlider = (page: Page) => page.getByRole("slider", { name: "Volume" });
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

test("steps the tempo once per press and repeats while held", async ({ page }) => {
  const increase = page.getByRole("button", { name: "Increase tempo" });
  const decrease = page.getByRole("button", { name: "Decrease tempo" });
  const tempo = async () => Number(await tempoInput(page).inputValue());

  await increase.hover();
  await page.mouse.down();
  await page.mouse.up();
  await expect(tempoInput(page)).toHaveValue("81");
  await page.waitForTimeout(600);
  await expect(tempoInput(page)).toHaveValue("81");

  await decrease.hover();
  await page.mouse.down();
  await page.waitForTimeout(200);
  await page.mouse.up();
  await expect(tempoInput(page)).toHaveValue("80");

  await increase.hover();
  await page.mouse.down();
  await page.waitForTimeout(1000);
  await page.mouse.up();
  const released = await tempo();
  expect(released).toBeGreaterThan(85);
  await page.waitForTimeout(300);
  expect(await tempo()).toBe(released);

  await increase.focus();
  await page.keyboard.press("Enter");
  await expect(tempoInput(page)).toHaveValue(String(released + 1));
  await page.keyboard.down("Enter");
  await page.keyboard.down("Enter");
  await page.keyboard.up("Enter");
  await expect(tempoInput(page)).toHaveValue(String(released + 3));
});

test("stops repeating at the tempo limit", async ({ page }) => {
  await tempoInput(page).fill("249");
  await tempoInput(page).press("Enter");
  await page.getByRole("button", { name: "Increase tempo" }).hover();
  await page.mouse.down();
  await page.waitForTimeout(800);
  await expect(tempoInput(page)).toHaveValue("252");
  await page.mouse.up();
  await page.waitForTimeout(200);
  await expect(tempoInput(page)).toHaveValue("252");
});

test("confirms a typed tempo before stepping it", async ({ page }) => {
  await page.keyboard.type("120");
  await page.getByRole("button", { name: "Increase tempo" }).click();
  await expect(tempoInput(page)).not.toBeFocused();
  await expect(tempoInput(page)).toHaveValue("121");
  await expect(tempoInput(page)).not.toHaveClass(/pending/);
});

test("scrolls the tempo with the wheel over the number", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 300 });
  await tempoInput(page).evaluate((input) => input.scrollIntoView({ block: "center" }));
  const scrollY = await page.evaluate(() => window.scrollY);
  const maxScrollY = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  expect(scrollY).toBeGreaterThan(0);
  expect(scrollY).toBeLessThan(maxScrollY);

  await tempoInput(page).hover();
  for (let i = 0; i < 3; i++) await page.mouse.wheel(0, -100);
  await expect(tempoInput(page)).toHaveValue("83");
  for (let i = 0; i < 5; i++) await page.mouse.wheel(0, 100);
  await expect(tempoInput(page)).toHaveValue("78");
  await expect(page.getByTestId("tempo-marking")).toHaveText("Andante");
  await expect(page.getByRole("slider", { name: "Tempo slider" })).toHaveValue("78");
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);

  await page.keyboard.type("120");
  await page.mouse.wheel(0, -100);
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(200);
  await expect(tempoInput(page)).toHaveValue("120");
  await expect(tempoInput(page)).toHaveClass(/pending/);
  await expect(page.getByRole("slider", { name: "Tempo slider" })).toHaveValue("78");
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
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
  await page.keyboard.press("w");
  await page.keyboard.press("d");
  await expect(tempoInput(page)).toHaveValue("82");
  await page.keyboard.press("Shift+S");
  await expect(tempoInput(page)).toHaveValue("72");
  await page.keyboard.press("a");
  await page.keyboard.press("Shift+W");
  await expect(tempoInput(page)).toHaveValue("81");
  await page.keyboard.press("Shift+ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(tempoInput(page)).toHaveValue("70");

  await page.keyboard.press("t");
  await page.waitForTimeout(500);
  await page.keyboard.press("t");
  await expect(tempoInput(page)).not.toHaveValue("70");

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

  await page.getByRole("button", { name: "Increase tempo" }).focus();
  await page.keyboard.press("Shift+Space");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(tempoInput(page)).toHaveValue("80");
  await page.keyboard.press("Shift+Space");
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

  await page.keyboard.press("Shift+V");
  await expect(radio(page, "Subdivisions", "4")).toBeChecked();
  await page.keyboard.press("v");
  await expect(radio(page, "Subdivisions", "1")).toBeChecked();
  await page.keyboard.press("v");
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

test("mutes, unmutes and sets the volume", async ({ page }) => {
  await expect(volumeSlider(page)).toHaveValue("75");
  await expect(volumeSlider(page)).toHaveAttribute("aria-valuetext", "75%");

  await page.getByRole("button", { name: "Mute", exact: true }).click();
  await expect(volumeSlider(page)).toHaveValue("0");
  await page.getByRole("button", { name: "Unmute" }).click();
  await expect(volumeSlider(page)).toHaveValue("75");

  await page.getByRole("button", { name: "Mute", exact: true }).click();
  await volumeSlider(page).fill("30");
  await expect(volumeSlider(page)).toHaveAttribute("aria-valuetext", "30%");
  await expect(page.getByRole("button", { name: "Mute", exact: true })).toBeVisible();

  await volumeSlider(page).fill("0");
  await page.getByRole("button", { name: "Unmute" }).click();
  await expect(volumeSlider(page)).toHaveValue("75");
});

test("starts and stops with space while the volume has focus", async ({ page }) => {
  await volumeSlider(page).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(volumeSlider(page)).toHaveValue("74");
  await expect(tempoInput(page)).toHaveValue("80");
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();

  const mute = page.getByRole("button", { name: "Mute", exact: true });
  await mute.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(mute).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
});

interface OutputProbe {
  context: BaseAudioContext;
  peaks: { time: number; peak: number }[];
  windowSeconds: number;
}

declare global {
  interface Window {
    outputProbe: OutputProbe;
  }
}

test("stays silent after muting while stopped and restarting", async ({ page }) => {
  await page.addInitScript(() => {
    const NativeGainNode = window.GainNode;
    window.GainNode = class extends NativeGainNode {
      constructor(context: BaseAudioContext, options?: GainOptions) {
        super(context, options);
        const analyser = new AnalyserNode(context, { fftSize: 2048 });
        this.connect(analyser);
        const samples = new Float32Array(analyser.fftSize);
        const probe: OutputProbe = {
          context,
          peaks: [],
          windowSeconds: analyser.fftSize / context.sampleRate,
        };
        window.outputProbe = probe;
        setInterval(() => {
          analyser.getFloatTimeDomainData(samples);
          probe.peaks.push({ time: context.currentTime, peak: Math.max(...samples.map(Math.abs)) });
        }, 5);
      }
    };
  });
  await page.reload();

  await volumeSlider(page).fill("100");
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.locator(".beat.lit")).toHaveCount(1, { timeout: 3000 });
  await page.getByRole("button", { name: "Stop" }).click();
  await page.getByRole("button", { name: "Mute", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.outputProbe.context.state)).toBe("suspended");
  const freshAfter = await page.evaluate(() => {
    const { context, windowSeconds } = window.outputProbe;
    return context.currentTime + windowSeconds;
  });

  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.locator(".beat.lit")).toHaveCount(1, { timeout: 3000 });
  await page.waitForTimeout(200);
  const peak = await page.evaluate((after) => {
    const fresh = window.outputProbe.peaks.filter((p) => p.time > after);
    return Math.max(0, ...fresh.map((p) => p.peak));
  }, freshAfter);
  expect(peak).toBe(0);
});

test("keeps settings across reloads", async ({ page }) => {
  await page.getByRole("button", { name: "Increase tempo" }).click();
  await page.getByRole("group", { name: "Beats" }).getByRole("radio", { name: "6" }).check();
  await beatButtons(page).nth(2).click();
  await volumeSlider(page).fill("40");
  await page.getByRole("button", { name: "Mute", exact: true }).click();

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
  await expect(volumeSlider(page)).toHaveValue("0");
  await page.getByRole("button", { name: "Unmute" }).click();
  await expect(volumeSlider(page)).toHaveValue("40");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(dialog.getByLabel("Sound")).toHaveValue("pluck");
  await expect(dialog.getByLabel("Emphasize first beat")).not.toBeChecked();
});

test("fits a short phone screen with every beat shown", async ({ page }) => {
  await page.setViewportSize({ width: 357, height: 638 });
  await radio(page, "Beats", "8").check();
  await radio(page, "Subdivisions", "4").check();
  const start = page.getByRole("button", { name: "Start" });
  await expect(start).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("button", { name: "Tap" })).toBeInViewport({ ratio: 1 });
  const rows = await beatButtons(page).evaluateAll(
    (buttons) => new Set(buttons.map((b) => b.getBoundingClientRect().top)).size,
  );
  expect(rows).toBe(1);
});
