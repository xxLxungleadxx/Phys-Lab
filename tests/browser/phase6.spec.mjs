import { test, expect } from "@playwright/test";

test("compact hero, anchor clearance, and keyboard focus visibility", async ({ page, browserName }) => {
  await page.goto("./");
  const width = page.viewportSize().width;
  expect(await page.locator(".hero").evaluate(el => el.getBoundingClientRect().height))
    .toBe(width <= 860 ? 190 : 210);
  const key = browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";
  await page.keyboard.press(key);
  await expect(page.locator(".skip-link")).toBeFocused();
  for (let i = 0; i < 14; i++) {
    const focus = await page.evaluate(() => {
      const el = document.activeElement;
      const rect = el.getBoundingClientRect();
      const header = document.querySelector("header");
      const style = getComputedStyle(el);
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
        height: innerHeight, width: innerWidth, outline: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth),
        headerBottom: header.getBoundingClientRect().bottom,
        inHeader: header.contains(el), skip: el.classList.contains("skip-link") };
    });
    expect(focus.outline).not.toBe("none");
    expect(focus.outlineWidth).toBeGreaterThan(0);
    expect(focus.top).toBeGreaterThanOrEqual(-1);
    expect(focus.bottom).toBeLessThanOrEqual(focus.height + 1);
    expect(focus.left).toBeGreaterThanOrEqual(-1);
    expect(focus.right).toBeLessThanOrEqual(focus.width + 1);
    if (!focus.inHeader && !focus.skip) expect(focus.top).toBeGreaterThanOrEqual(focus.headerBottom - 1);
    await page.keyboard.press(key);
  }
  for (const id of ["subjects", "contents", "approach", "status"]) {
    await page.goto("./#" + id);
    const bounds = await page.evaluate(id => ({
      target: document.getElementById(id).getBoundingClientRect().top,
      header: document.querySelector("header").getBoundingClientRect().bottom
    }), id);
    expect(bounds.target, id).toBeGreaterThanOrEqual(bounds.header - 1);
  }
});

test("real DOM boundary inputs and canvas resizing stay consistent", async ({ page }) => {
  await page.goto("tools/mechanics/projectile.html");
  const failures = await page.evaluate(() => {
    const errors = [];
    for (const speed of [5, 24, 50]) for (const angle of [0, 5, 45, 85, 90])
      for (const gravity of [1.6, 9.8, 12]) for (const limits of [[20, 10], [250, 300]]) {
        for (const [id, value] of Object.entries({ speed, angle, gravity, xMax: limits[0], yMax: limits[1] })) {
          const input = document.getElementById(id);
          input.value = String(value);
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
        const radians = angle * Math.PI / 180;
        const vy = angle === 0 ? 0 : speed * Math.sin(radians);
        const vx = angle === 90 ? 0 : speed * Math.cos(radians);
        const flight = 2 * vy / gravity;
        for (const [id, expected, decimals] of [["timeOfFlight", flight, 2], ["range", vx * flight, 1], ["maxHeight", vy * vy / (2 * gravity), 1]]) {
          const actual = parseFloat(document.getElementById(id).textContent);
          if (!Number.isFinite(actual) || Math.abs(actual - expected) > 0.51 * 10 ** -decimals)
            errors.push({ speed, angle, gravity, id, actual, expected });
        }
      }
    return errors;
  });
  expect(failures).toEqual([]);
  for (const width of [320, 768, 1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.locator("canvas").evaluate(el =>
      Math.abs(el.width - Math.floor(el.parentElement.clientWidth) * Math.min(2, devicePixelRatio)))).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});
