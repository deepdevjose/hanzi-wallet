import { readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
const vocabulary = JSON.parse(
  await readFile("public/data/vocabulary.json", "utf8"),
);
const root = path.resolve("node_modules/hanzi-writer-data");
const templates = [];
for (const entry of vocabulary) {
  const data = JSON.parse(
    await readFile(path.join(root, `${entry.char}.json`), "utf8"),
  );
  templates.push({
    char: entry.char,
    medians: data.medians.map((s) =>
      s.map(([x, y]) => ({ x: x / 1024, y: (900 - y) / 1024 })),
    ),
    paths: data.strokes,
  });
}
await writeFile("public/data/templates.json", JSON.stringify(templates));
await copyFile(path.join(root, "ARPHICPL.TXT"), "public/data/ARPHICPL.txt");
console.log(
  `Prepared ${templates.length} character templates; Arphic licence included.`,
);
