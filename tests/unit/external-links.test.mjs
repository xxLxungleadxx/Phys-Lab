import test from "node:test";
import assert from "node:assert/strict";
import { collectLinks, checkUrl } from "../../scripts/check-external-links.mjs";

test("collect only external anchors, decode ampersands, strip fragments and deduplicate", () => {
  assert.deepEqual(collectLinks('<a href="https://example.com/?a=1&amp;b=2#part">A</a><a href="https://example.com/?a=1&amp;b=2">B</a><a href="https://xxlxungleadxx.github.io/Phys-Lab/">Home</a><a href="../note/">Notes</a>'), ["https://example.com/?a=1&b=2"]);
});

test("success and explicit error statuses", async () => {
  for (const status of [200, 204, 404, 403, 429, 500]) {
    const result = await checkUrl("https://example.com/", async () => new Response(null, { status }));
    assert.equal(result.ok, status < 300);
    if ([403, 429].includes(status)) assert.match(result.reason, /manual confirmation/);
  }
});

test("HEAD rejection retries GET, follows redirects and stops redirect loops", async () => {
  const calls = [];
  const result = await checkUrl("https://example.com/", async (url, options) => {
    calls.push([url.href, options.method]);
    if (url.pathname === "/") return new Response(null, { status: 302, headers: { location: "/next" } });
    return new Response(null, { status: options.method === "HEAD" ? 405 : 200 });
  });
  assert.equal(result.ok, true);
  assert.deepEqual(calls.map(call => call[1]), ["HEAD", "HEAD", "GET"]);
  const loop = await checkUrl("https://example.com/", async () => new Response(null, { status: 301, headers: { location: "/" } }));
  assert.match(loop.reason, /too many redirects/);
});

test("network exceptions and private or non-HTTPS redirects are not ignored", async () => {
  assert.equal((await checkUrl("https://example.com/", async () => { throw Error("offline"); })).ok, false);
  for (const href of ["http://example.com/", "https://127.0.0.1/", "https://localhost/", "https://example.internal/"]) {
    const result = await checkUrl(href, async () => { assert.fail("must not fetch unsafe target"); });
    assert.equal(result.ok, false);
  }
  const redirect = await checkUrl("https://example.com/", async () => new Response(null, { status: 302, headers: { location: "http://127.0.0.1/" } }));
  assert.equal(redirect.ok, false);
});
