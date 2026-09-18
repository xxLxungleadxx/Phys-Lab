import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const publicBase = "https://xxlxungleadxx.github.io/Phys-Lab/";
const directories = ["atomic", "electromagnetism", "link", "mechanics", "note", "slide", "thermodynamics", "tools", "waves"];

export async function htmlFiles() {
  const files = ["index.html", "404.html"];
  async function walk(directory) {
    for (const entry of await fs.readdir(path.join(root, directory), { withFileTypes: true })) {
      const relative = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(relative);
      else if (entry.isFile() && entry.name.endsWith(".html")) files.push(relative);
    }
  }
  for (const directory of directories) await walk(directory);
  return files.sort();
}
