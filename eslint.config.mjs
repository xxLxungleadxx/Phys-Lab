import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", ".playwright-browsers/**", "test-results*/**", "playwright-report/**"] },
  js.configs.recommended,
  { files: ["**/*.mjs"], languageOptions: { globals: globals.node } },
  { files: ["assets/**/*.js"], languageOptions: { globals: globals.browser } },
  { files: ["tests/browser/**/*.mjs"], languageOptions: { globals: globals.browser } }
];
