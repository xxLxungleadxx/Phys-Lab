import fs from "node:fs/promises";
import path from "node:path";
import { HtmlValidate } from "html-validate";
import { ESLint } from "eslint";
import stylelint from "stylelint";
import { htmlFiles, root } from "./site-files.mjs";

process.chdir(root);
const validator = new HtmlValidate();
const eslint = new ESLint();
let failed = false;
let inlineCount = 0;
const files = await htmlFiles();
for (const file of files) {
  const report = await validator.validateFile(file);
  if (!report.valid) {
    failed = true;
    for (const result of report.results) for (const message of result.messages)
      console.error(`${file}:${message.line}:${message.column}: ${message.message} (${message.ruleId})`);
  }
  const source = await fs.readFile(path.join(root, file), "utf8");
  for (const [, attributes, code] of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(attributes) || !code.trim()) continue;
    if (/type\s*=\s*["']application\//i.test(attributes)) continue;
    inlineCount++;
    const results = await eslint.lintText(code, { filePath: "assets/inline-" + inlineCount + ".js" });
    for (const result of results) for (const message of result.messages) {
      if (message.severity === 2) failed = true;
      console.error(`${file} inline JS:${message.line}:${message.column}: ${message.message}`);
    }
  }
}
const jsResults = await eslint.lintFiles(["assets/**/*.js", "scripts/**/*.mjs", "tests/**/*.mjs", "*.config.mjs"]);
for (const result of jsResults) for (const message of result.messages) {
  if (message.severity === 2) failed = true;
  console.error(`${path.relative(root, result.filePath)}:${message.line}:${message.column}: ${message.message}`);
}
const css = await stylelint.lint({ files: "style.css", formatter: "string" });
if (css.errored) { failed = true; console.error(css.report); }
if (failed) process.exitCode = 1;
else console.log(`PASS: HTML ${files.length} pages; CSS; standalone JavaScript; ${inlineCount} inline script(s)`);
