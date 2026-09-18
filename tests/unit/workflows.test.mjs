import fs from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
import YAML from "yaml";

async function workflow(name) {
  return YAML.parse(await fs.readFile(new URL("../../.github/workflows/" + name, import.meta.url), "utf8"));
}

test("site workflow checks dev/main pushes and PRs with read-only permissions", async () => {
  const config = await workflow("site-checks.yml");
  assert.deepEqual(config.on.push.branches, ["dev", "main"]);
  assert.deepEqual(config.on.pull_request.branches, ["dev", "main"]);
  assert.deepEqual(config.permissions, { contents: "read" });
  assert.equal(config.jobs.browser.needs, "static");
  const staticCommands = config.jobs.static.steps.map(step => step.run).filter(Boolean);
  assert.ok(staticCommands.includes("npm run test:static"));
  assert.ok(staticCommands.includes("npm run test:offline"));
  const commands = config.jobs.browser.steps.map(step => step.run).filter(Boolean);
  assert.ok(commands.includes("npm run test:browser"));
  assert.ok(commands.includes("npx playwright install --with-deps chromium firefox webkit"));
});

test("monthly external-link workflow does not become a push/PR release gate", async () => {
  const config = await workflow("external-links.yml");
  assert.equal(config.on.schedule[0].cron, "23 3 1 * *");
  assert.equal(config.on.push, undefined);
  assert.equal(config.on.pull_request, undefined);
  assert.deepEqual(config.permissions, { contents: "read" });
});

test("workflows neither upload reports nor deploy and avoid persisted checkout credentials", async () => {
  for (const name of ["site-checks.yml", "external-links.yml"]) {
    const config = await workflow(name);
    for (const job of Object.values(config.jobs)) {
      assert.ok(job["timeout-minutes"] <= 20);
      for (const step of job.steps) {
        assert.doesNotMatch(step.uses || "", /upload-artifact|deploy-pages|upload-pages/);
        assert.doesNotMatch(step.run || "", /git push|continue-on-error/);
        assert.equal(step["continue-on-error"], undefined);
        if (step.uses?.startsWith("actions/checkout")) assert.equal(step.with["persist-credentials"], false);
      }
    }
  }
});
