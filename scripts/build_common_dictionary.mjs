import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const SOURCE = "https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt";
// Pinned content digest verified from the successful GitHub Actions build.
const EXPECTED_SHA256 = "744bb05d5b0742e9ee35c37791f94d56a173349b3367569e7ca11e510364d203";
const common = JSON.parse(await readFile(new URL("../src/common-3500.json", import.meta.url), "utf8"));
const allowed = new Set(common);
if (allowed.size !== 3500) throw new Error("Expected exactly 3500 national-standard characters.");

async function download(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "hanzi-wallet-dictionary-build/1.0" },
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error("Dictionary request failed: HTTP " + response.status);
      const raw = await response.text();
      if (raw.length < 1000000) throw new Error("Dictionary download unexpectedly short");
      return raw;
    } catch (error) { lastError = error; }
  }
  throw lastError ?? new Error("Dictionary unavailable");
}

async function downloadText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error("License notice unavailable: HTTP " + response.status);
  return response.text();
}
const raw = await download(SOURCE);
const hash = createHash("sha256").update(raw).digest("hex");
if (hash !== EXPECTED_SHA256) throw new Error("Upstream dictionary changed; review and repin before rebuilding");
const result = {};
for (const line of raw.split(/\r?\n/u)) {
  if (!line.trim()) continue;
  const entry = JSON.parse(line);
  if (!entry || typeof entry.character !== "string" || !allowed.has(entry.character)) continue;
  if (Object.hasOwn(result, entry.character)) continue;
  const pinyin = typeof entry.pinyin === "string" ? entry.pinyin.trim() : "";
  const definition = typeof entry.definition === "string" ? entry.definition.trim() : "";
  result[entry.character] = { pinyin: pinyin.slice(0, 150), definition: definition.slice(0, 900) };
}
const count = Object.keys(result).length;
if (count < 3000 || count > 3500) throw new Error("Dictionary match outside expected range: " + count);
await mkdir("public/data", { recursive: true });
await writeFile("public/data/common-dictionary.json", JSON.stringify(result));
const copying = await downloadText("https://raw.githubusercontent.com/skishore/makemeahanzi/master/COPYING");
const lgpl = await downloadText("https://raw.githubusercontent.com/skishore/makemeahanzi/master/LGPL");
await writeFile("public/data/MAKEME_A_HANZI_COPYING.txt", copying);
await writeFile("public/data/MAKEME_A_HANZI_LGPL.txt", lgpl);
console.log("Make Me a Hanzi: " + count + "/3500 entries; SHA256 " + hash);
