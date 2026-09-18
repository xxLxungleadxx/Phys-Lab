import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = ["", "mechanics/", "thermodynamics/", "waves/", "electromagnetism/", "atomic/",
  "slide/", "note/", "link/", "tools/", "tools/mechanics/", "tools/thermodynamics/",
  "tools/waves/", "tools/electromagnetism/", "tools/atomic/", "tools/mechanics/projectile.html"];
const publicBase = "https://xxlxungleadxx.github.io/Phys-Lab/";

test("sharing metadata is page-specific with valid local assets", async ({ page, request }) => {
  const titles = new Set();
  for (const route of routes) {
    await page.goto(route || "./");
    const title = await page.title();
    expect(titles.has(title)).toBe(false);
    titles.add(title);
    const metadata = async property => page.locator('meta[property="' + property + '"]').getAttribute("content");
    expect(await metadata("og:title")).toBe(title);
    expect(await metadata("og:description")).toBe(await page.locator('meta[name="description"]').getAttribute("content"));
    expect(await metadata("og:url")).toBe(publicBase + route);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(publicBase + route);
    expect(await metadata("og:type")).toBe("website");
    expect(await metadata("og:locale")).toBe("ja_JP");
    const image = await metadata("og:image");
    expect(image).toBe(publicBase + "assets/hero-physics-lab.png");
    expect((await request.get("assets/hero-physics-lab.png")).status()).toBe(200);
    expect(await metadata("og:image:width")).toBe("1672");
    expect(await metadata("og:image:height")).toBe("941");
    expect(await metadata("og:image:alt")).toBeTruthy();
    const favicon = await page.locator('link[rel="icon"]').getAttribute("href");
    const icon = await request.get(favicon);
    expect(icon.status()).toBe(200);
    expect(icon.headers()["content-type"]).toContain("image/svg+xml");
  }
});

test("404 works at missing nested URLs and offers usable recovery", async ({ page, request, browserName }, info) => {
  for (const route of ["missing.html", "tools/mechanics/missing/deep.html", "404.html"]) {
    const response = await page.goto(route);
    expect(response.status()).toBe(route === "404.html" ? 200 : 404);
    await expect(page.locator("h1")).toHaveText("お探しのページが見つかりません");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toBe("noindex");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    for (const href of await page.locator('a[href^="/Phys-Lab/"]').evaluateAll(nodes => nodes.map(node => node.href))) {
      const url = new URL(href);
      url.hash = "";
      expect((await request.head(url.href)).status()).toBe(200);
    }
    const key = browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";
    await page.keyboard.press(key);
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    await page.screenshot({ path: info.outputPath(route.replaceAll("/", "-") + ".png"), fullPage: true });
    await page.getByRole("link", { name: "トップページへ戻る", exact: true }).click();
    await expect(page).toHaveURL("http://127.0.0.1:4173/Phys-Lab/");
    await expect(page.locator("h1")).toHaveText("Phys-Lab");
  }
});

test("test server does not expose local development files", async ({ request }) => {
  for (const route of [".git/config", "docs/PHASE6_REPORT.md", "scripts/test-server.mjs", "package.json", "assets/%2e%2e/%2e%2e/package.json"]) {
    const response = await request.get(route);
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain("お探しのページが見つかりません");
  }
});
