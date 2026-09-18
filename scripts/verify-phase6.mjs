// Offline checks: DOM/Canvas stubs do not replace real-browser or assistive-technology tests.
// Run from any directory with: node scripts/verify-phase6.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "tools/mechanics/projectile.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

function simulator(reduced = false) {
  const elements = new Map();
  const preference = { matches: reduced, addEventListener(_name, fn) { this.change = fn; } };
  function element(id) {
    if (!elements.has(id)) {
      let text = "";
      elements.set(id, {
        value: "", style: {}, listeners: {}, attrs: {}, writes: 0,
        get textContent() { return text; },
        set textContent(value) { text = value; this.writes++; },
        setAttribute(key, value) { this.attrs[key] = value; },
        addEventListener(name, fn) { this.listeners[name] = fn; }
      });
    }
    return elements.get(id);
  }
  for (const match of html.matchAll(/<input\b[^>]*id="([^"]+)"[^>]*value="([^"]+)"[^>]*>/g)) {
    element(match[1]).value = match[2];
  }
  const context2d = new Proxy({}, {
    get(_target, key) {
      return (...args) => {
        for (const arg of args.flat()) {
          if (typeof arg === "number") assert.ok(Number.isFinite(arg), `non-finite Canvas argument: ${String(key)}`);
        }
      };
    },
    set() { return true; }
  });
  const canvas = element("projectileCanvas");
  canvas.parentElement = { clientWidth: 900 };
  Object.defineProperty(canvas, "clientWidth", { get: () => canvas.parentElement.clientWidth });
  Object.defineProperty(canvas, "clientHeight", { get: () => parseFloat(canvas.style.height) || 520 });
  canvas.getContext = () => context2d;
  const window = {
    devicePixelRatio: 1,
    matchMedia: () => preference,
    addEventListener() {}
  };
  const sandbox = vm.createContext({
    document: { getElementById: element }, window, performance: { now: () => 1000 },
    requestAnimationFrame() {}
  });
  vm.runInContext(script + "\nglobalThis.api = { getParams, positionAt, draw, frame, resizeCanvas, state };", sandbox);
  return { api: sandbox.api, element, canvas, window, preference };
}

const sim = simulator();
assert.equal(sim.api.state.running, true);
assert.equal(sim.element("playPause").attrs["aria-pressed"], "true");
let cases = 0;
for (const speed of [5, 24, 50])
for (const angle of [0, 5, 45, 85, 90])
for (const gravity of [1.6, 9.8, 12])
for (const xMax of [20, 250])
for (const yMax of [10, 300]) {
  for (const [id, value] of Object.entries({ speed, angle, gravity, xMax, yMax })) {
    sim.element(id).value = String(value);
  }
  const p = sim.api.getParams();
  for (const value of Object.values(p)) assert.ok(Number.isFinite(value));
  assert.ok(p.flightTime >= 0 && p.range >= 0 && p.maxHeight >= 0);
  close(sim.api.positionAt(p.flightTime, p).y, 0);
  close(sim.api.positionAt(p.flightTime / 2, p).y, p.maxHeight);
  if (angle === 0) {
    assert.equal(p.flightTime, 0); assert.equal(p.range, 0); assert.equal(p.maxHeight, 0);
  }
  if (angle === 90) {
    assert.equal(p.vx, 0); assert.equal(p.range, 0);
    close(p.maxHeight, speed * speed / (2 * gravity));
  }
  if (angle === 45) close(p.range, speed * speed / gravity);
  sim.api.draw();
  cases++;
}
assert.equal(cases, 180);
for (const width of [240, 320, 520, 768, 1024, 1440])
for (const dpr of [1, 2, 3]) {
  sim.canvas.parentElement.clientWidth = width;
  sim.window.devicePixelRatio = dpr;
  sim.api.resizeCanvas();
  assert.equal(sim.canvas.width, width * Math.min(dpr, 2));
  assert.ok(sim.canvas.clientHeight >= 330 && sim.canvas.clientHeight <= 520);
}
const readout = sim.element("timeOfFlight");
const writes = readout.writes;
sim.api.draw(); sim.api.draw();
assert.equal(readout.writes, writes, "unchanged readouts must not trigger repeated DOM updates");
sim.element("playPause").listeners.click();
assert.equal(sim.api.state.running, false);
assert.equal(sim.element("playPause").attrs["aria-pressed"], "false");
sim.api.state.elapsed = 3;
sim.element("reset").listeners.click();
assert.equal(sim.api.state.elapsed, 0);
sim.element("playPause").listeners.click();
assert.equal(sim.api.state.running, true);
sim.preference.change({ matches: true });
assert.equal(sim.api.state.running, false);
const reduced = simulator(true);
assert.equal(reduced.api.state.running, false);
assert.equal(reduced.element("playPause").textContent, "再生");
reduced.element("playPause").listeners.click();
assert.equal(reduced.api.state.running, true, "explicit playback remains available");
reduced.api.state.elapsed = 2;
reduced.element("angle").listeners.input();
assert.equal(reduced.api.state.elapsed, 0);
reduced.api.frame(1100);
assert.ok(Number.isFinite(reduced.api.state.elapsed));
console.log(`PASS: ${cases} physics cases; 18 stubbed Canvas sizes; playback/reset/input/reduced-motion/readout checks`);

function luminance(hex) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return rgb.reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
for (const [fg, bg] of [
  ["#b9c4c1", "#111b1a"], ["#ffffff", "#1f7a68"],
  ["#145348", "#edf6f3"], ["#5b6765", "#f7f5ef"]
]) {
  const values = [luminance(fg), luminance(bg)].sort((a, b) => a - b);
  const ratio = (values[1] + 0.05) / (values[0] + 0.05);
  assert.ok(ratio >= 4.5);
  console.log(`PASS: solid-color contrast ${fg}/${bg}: ${ratio.toFixed(2)}:1`);
}
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
assert.match(css, /\.site-footer\s*\{[^}]*color:\s*#b9c4c1/);
assert.equal(css.split("{").length, css.split("}").length);
assert.match(css, /min-height: 210px/);
assert.match(css, /min-height: 190px/);
console.log("PASS: footer color, CSS brace balance, compact hero settings");
