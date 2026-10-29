import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
async function walk(dir) {
  const paths = [];
  for (const f of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) paths.push(...(await walk(p)));
    else if (!p.endsWith(".map") && !p.endsWith("sw.js")) paths.push(p);
  }
  return paths;
}
const files = (await walk("dist")).sort();
const hash = createHash("sha256");
for (const f of files) hash.update(await readFile(f));
const version = "hanzi-wallet-" + hash.digest("hex").slice(0, 12);
const assets = files.map((f) => "./" + f.replace(/^dist\//, ""));
await writeFile(
  "dist/sw.js",
  `// Generated from this exact build. No off-origin requests are cached.\nconst CACHE=${JSON.stringify(version)};\nconst ASSETS=${JSON.stringify(assets)};\nself.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});\nself.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hanzi-wallet-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});\nself.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request);if(hit)return hit;try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate'){const fallback=await cache.match(new URL('./index.html',self.registration.scope));if(fallback)return fallback;}throw error;}}));});\n`,
);
console.log(`Offline cache ${version}: ${assets.length} local assets.`);
