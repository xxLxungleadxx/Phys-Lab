// Serve only public website assets, under the same project prefix as GitHub Pages.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prefix = "/Phys-Lab/";
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".pdf": "application/pdf",
  ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon"
};
const server = http.createServer(async (req, res) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    if (!pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
    let relative = pathname.slice(prefix.length);
    const publicDirectories = ["assets", "slide", "note", "link", "tools", "mechanics", "thermodynamics", "waves", "electromagnetism", "atomic"];
    if (relative.includes("/") && !publicDirectories.includes(relative.split("/")[0])) {
      res.writeHead(404).end(); return;
    }
    if (relative.split("/").some(part => part.startsWith(".") || part === "..")) {
      res.writeHead(404).end(); return;
    }
    if (pathname.endsWith("/")) relative += "index.html";
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep) || !types[path.extname(target)]) {
      res.writeHead(404).end(); return;
    }
    const realTarget = await fs.realpath(target);
    if (!realTarget.startsWith(root + path.sep)) { res.writeHead(404).end(); return; }
    const data = await fs.readFile(realTarget);
    res.writeHead(200, { "Content-Type": types[path.extname(target)], "Cache-Control": "no-store" });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch { res.writeHead(404).end(); }
});
server.listen(4173, "127.0.0.1", () => console.log("Test site: http://127.0.0.1:4173/Phys-Lab/"));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
