import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  "", "mechanics/", "thermodynamics/", "waves/", "electromagnetism/", "atomic/",
  "slide/", "note/", "link/", "tools/", "tools/mechanics/",
  "tools/thermodynamics/", "tools/waves/", "tools/electromagnetism/",
  "tools/atomic/", "tools/mechanics/projectile.html"
];
const projectile = "tools/mechanics/projectile.html";

test("legacy notes are not listed while replacements are being prepared", async ({ page }) => {
  for (const route of [...routes, "404.html"]) {
    await page.goto(route || "./");
    await expect(page.locator('a[href*="note/"], a[href$=".pdf"][data-type="note"]')).toHaveCount(0);
    await expect(page.locator('[data-type="note"]')).toHaveCount(0);
  }
  await page.goto("note/");
  await expect(page.getByText("PDFノートは差し替え準備のため、掲載を一時停止しています。", { exact: false })).toBeVisible();
});

for (const route of routes) {
  test("layout and accessibility: " + (route || "home"), async ({ page }, info) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    const response = await page.goto(route || "./");
    expect(response.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, "page-wide horizontal overflow").toBeLessThanOrEqual(dimensions.viewport + 1);
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(accessibility.violations, JSON.stringify(accessibility.violations, null, 2)).toEqual([]);
    expect(errors).toEqual([]);
    const screenshot = info.outputPath("page.png");
    await page.screenshot({ path: screenshot, fullPage: true });
    await info.attach("rendered-page", { path: screenshot, contentType: "image/png" });
  });
}

test("all internal navigation and assets respond under the project prefix", async ({ page, request }) => {
  const urls = new Set();
  for (const route of routes) {
    await page.goto(route || "./");
    const refs = await page.locator("a[href], link[rel=stylesheet], img[src], script[src]").evaluateAll(nodes =>
      nodes.map(node => node.href || node.src).filter(Boolean));
    for (const ref of refs) {
      const url = new URL(ref);
      if (url.origin !== "http://127.0.0.1:4173") continue;
      expect(url.pathname).toMatch(/^\/Phys-Lab\//);
      if (url.hash && url.pathname === new URL(page.url()).pathname) {
        expect(await page.locator('[id="' + decodeURIComponent(url.hash.slice(1)) + '"]').count()).toBe(1);
      }
      url.hash = ""; urls.add(url.href);
    }
  }
  for (const url of urls) expect((await request.head(url)).status(), url).toBe(200);
});

test("skip link and native slider work with the keyboard", async ({ page, browserName }) => {
  await page.goto(projectile);
  // macOS WebKit uses Option+Tab to include links in keyboard navigation.
  const navigationKey = browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";
  await page.keyboard.press(navigationKey);
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  const angle = page.locator("#angle");
  await angle.focus();
  await page.keyboard.press("ArrowRight");
  await expect(angle).toHaveValue("43");
  await expect(page.locator("#angleValue")).toHaveText("43°");
  await page.keyboard.press("Home");
  await expect(angle).toHaveValue("0");
  await expect(page.locator("#range")).toHaveText("0.0 m");
  await page.keyboard.press("End");
  await expect(angle).toHaveValue("90");
  await expect(page.locator("#range")).toHaveText("0.0 m");
  await expect(page.locator("#timeOfFlight")).toHaveText("4.90 s");
});

test("reduced motion, playback, reset, and live preference changes", async ({ page }) => {
  await page.goto(projectile);
  const button = page.locator("#playPause");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  const activate = async locator => {
    if (test.info().project.use.hasTouch) await locator.tap();
    else await locator.click();
  };
  await activate(button);
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await activate(page.locator("#reset"));
  await expect(page.locator("#timeOfFlight")).not.toHaveText("NaN s");
  await activate(button);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await activate(button);
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(button).toHaveAttribute("aria-pressed", "false");
});

test("large text reflows without page-wide overflow", async ({ page }) => {
  for (const route of ["", "mechanics/", "note/", projectile]) {
    await page.goto(route || "./");
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, route || "home").toBeLessThanOrEqual(1);
  }
});
