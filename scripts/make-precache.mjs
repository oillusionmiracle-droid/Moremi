import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const root = new URL("../dist/client/", import.meta.url);
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : join(dir, entry.name)));
  return nested.flat();
}
const paths = (await walk(root.pathname)).filter(path => !relative(root.pathname,path).split("/").some(part=>part.startsWith(".")) && !/(?:\.map$|\/_headers$|\/sw\.js$|\/offline-manifest\.json$|vinext-client-entry-manifest\.json$|\/404\.html$)/.test(path)).sort();
const files = await Promise.all(paths.map(async path => {
  const bytes = await readFile(path);
  const name = relative(root.pathname, path);
  return { url: name === "index.html" ? "/" : "/" + name, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}));
if (!files.some(file => file.url === "/")) throw new Error("Static export has no index.html");
const version = createHash("sha256").update(JSON.stringify(files)).digest("hex").slice(0, 16);
const manifest = { version, totalBytes: files.reduce((sum, file) => sum + file.bytes, 0), files };
const template = await readFile(new URL("./service-worker.template.js", import.meta.url), "utf8");
await writeFile(new URL("sw.js", root), template.replace("__PRECACHE_MANIFEST__", JSON.stringify(manifest)));
await writeFile(new URL("offline-manifest.json", root), JSON.stringify(manifest));
const headers = new URL("_headers", root);
await writeFile(headers, (await readFile(headers, "utf8")) + "\n/sw.js\n  Cache-Control: no-cache\n/offline-manifest.json\n  Cache-Control: no-cache\n/\n  Cache-Control: no-cache\n");
console.log(`Offline pack: ${files.length} files, ${(manifest.totalBytes / 1_000_000).toFixed(2)} MB, ${version}`);
