import fs from "node:fs/promises";
import path from "node:path";
import { isIP } from "node:net";
import { pathToFileURL } from "node:url";
import { htmlFiles, root, publicBase } from "./site-files.mjs";

export function collectLinks(source) {
  const urls = new Set();
  for (const [, href] of source.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
    if (!/^https?:\/\//i.test(href)) continue;
    const url = new URL(href.replaceAll("&amp;", "&"));
    if (url.origin === new URL(publicBase).origin) continue;
    url.hash = "";
    urls.add(url.href);
  }
  return [...urls];
}

function publicHttps(url) {
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return url.protocol === "https:" && !url.username && !url.password &&
    !isIP(host) && host.includes(".") && !/\.(local|localhost|internal|test|invalid)$/.test(host);
}

export async function checkUrl(href, fetchImpl = fetch) {
  let url = new URL(href);
  const signal = AbortSignal.timeout(15000);
  let method = "HEAD";
  for (let redirects = 0; redirects <= 5;) {
    if (!publicHttps(url)) return { ok: false, reason: "unsafe/non-HTTPS URL" };
    try {
      const response = await fetchImpl(url, {
        method, redirect: "manual", signal,
        headers: { "User-Agent": "Phys-Lab-Link-Check/1.0", ...(method === "GET" ? { Range: "bytes=0-1023" } : {}) }
      });
      await response.body?.cancel();
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) return { ok: false, reason: "redirect without Location" };
        url = new URL(location, url);
        redirects++;
        continue;
      }
      if (method === "HEAD" && [405, 501].includes(response.status)) { method = "GET"; continue; }
      const ok = response.status >= 200 && response.status < 300;
      const blocked = [401, 403, 429].includes(response.status);
      return { ok, reason: blocked ? `HTTP ${response.status} (access/rate limit; manual confirmation needed)` : `HTTP ${response.status}` };
    } catch { return { ok: false, reason: "network error or 15s timeout; manual confirmation needed" }; }
  }
  return { ok: false, reason: "too many redirects" };
}

async function main() {
  const urls = new Set();
  for (const file of await htmlFiles())
    for (const url of collectLinks(await fs.readFile(path.join(root, file), "utf8"))) urls.add(url);
  let failed = 0;
  for (const url of urls) {
    const result = await checkUrl(url);
    console.log(`${result.ok ? "PASS" : "CHECK"}: ${url}: ${result.reason}`);
    if (!result.ok) failed++;
  }
  console.log(`External links: ${urls.size - failed}/${urls.size} reachable; ${failed} need confirmation`);
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
