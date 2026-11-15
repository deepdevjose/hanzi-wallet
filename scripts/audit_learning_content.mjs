import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import ts from "typescript";

// Read-only audit of canonical checked-in course resources. It never downloads
// content, executes application modules, or reads profile/environment files.
const root = new URL("../", import.meta.url);
const json = async (path) =>
  JSON.parse(await readFile(new URL(path, root), "utf8"));
const source = async (path) =>
  ts.createSourceFile(
    path,
    await readFile(new URL(path, root), "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
const unwrap = (node) =>
  ts.isAsExpression(node) || ts.isSatisfiesExpression(node)
    ? unwrap(node.expression)
    : node;
function initializer(file, name) {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const declaration = statement.declarationList.declarations.find(
      (d) => ts.isIdentifier(d.name) && d.name.text === name,
    );
    if (declaration?.initializer) return unwrap(declaration.initializer);
  }
  throw new Error(`Missing declaration ${name} in ${file.fileName}`);
}
function objectKeys(file, name) {
  const object = initializer(file, name);
  if (!ts.isObjectLiteralExpression(object))
    throw new Error(`${name} is not an object literal`);
  return object.properties.map((property) => {
    if (
      !ts.isPropertyAssignment(property) ||
      !property.name ||
      !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
    ) {
      throw new Error(`Unsupported key in ${name}; review audit parser`);
    }
    return property.name.text;
  });
}
const [vocabulary, templates, audio, audioBytes, levels, learning, profile] =
  await Promise.all([
    json("public/data/vocabulary.json"),
    json("public/data/templates.json"),
    json("public/audio/index.json"),
    readFile(new URL("public/audio/pronunciation.bin", root)),
    json("src/hsk-levels.json"),
    source("src/learning-content.ts"),
    source("src/core/profile.ts"),
  ]);
const chars = new Set(vocabulary.map((entry) => entry.char));
const templateChars = new Set(templates.map((entry) => entry.char));
const contexts = objectKeys(learning, "CONTEXT");
const components = objectKeys(learning, "COMPONENTS");
const lessons = initializer(learning, "LESSONS");
if (!ts.isArrayLiteralExpression(lessons))
  throw new Error("LESSONS is not an array literal");
const catalogue = initializer(profile, "ITEMS");
if (!ts.isArrayLiteralExpression(catalogue))
  throw new Error("ITEMS is not an array literal");
const items = catalogue.elements.map((entry) => {
  if (
    !ts.isCallExpression(entry) ||
    !ts.isIdentifier(entry.expression) ||
    entry.expression.text !== "item" ||
    !ts.isStringLiteral(entry.arguments[0]) ||
    !ts.isStringLiteral(entry.arguments[1])
  )
    throw new Error("Unsupported item declaration; review audit parser");
  return { id: entry.arguments[0].text, slot: entry.arguments[1].text };
});
const sha256 = createHash("sha256").update(audioBytes).digest("hex");
const invalidClips = Object.entries(audio.clips)
  .filter(
    ([, clip]) =>
      !Number.isSafeInteger(clip.offset) ||
      !Number.isSafeInteger(clip.length) ||
      clip.offset < 0 ||
      clip.length <= 0 ||
      clip.offset + clip.length > audioBytes.length,
  )
  .map(([key]) => key);
const requiredMaTones = ["ma1", "ma2", "ma3", "ma4", "ma5"];
const hskCharacters = new Set(levels.flatMap((level) => [...level.chars]));
const report = {
  schemaVersion: 1,
  sources: {
    vocabulary: "public/data/vocabulary.json",
    templates: "public/data/templates.json",
    audioIndex: "public/audio/index.json",
    audioArchive: "public/audio/pronunciation.bin",
    hsk: "src/hsk-levels.json",
    contexts: "src/learning-content.ts",
    wardrobe: "src/core/profile.ts",
  },
  vocabulary: {
    entries: vocabulary.length,
    uniqueCharacters: chars.size,
    charactersInHSKBands: [...chars].filter((char) => hskCharacters.has(char))
      .length,
    charactersOutsideHSKBands: [...chars].filter(
      (char) => !hskCharacters.has(char),
    ),
    missingMeanings: ["es", "en", "zh-CN", "fr", "pt"].map((locale) => ({
      locale,
      count: vocabulary.filter((entry) => !entry.meanings?.[locale]?.trim())
        .length,
    })),
  },
  templates: {
    entries: templates.length,
    uniqueCharacters: templateChars.size,
    missingVocabularyCharacters: [...chars].filter(
      (char) => !templateChars.has(char),
    ),
    mismatchedStrokeCounts: templates
      .filter((entry) => entry.paths.length !== entry.medians.length)
      .map((entry) => entry.char),
  },
  audio: {
    clips: Object.keys(audio.clips).length,
    bytes: audioBytes.length,
    sha256,
    checksumMatchesIndex: sha256 === audio.sha256,
    invalidClips,
    availableMaTones: requiredMaTones.filter((key) =>
      Object.hasOwn(audio.clips, key),
    ),
    missingMaTones: requiredMaTones.filter(
      (key) => !Object.hasOwn(audio.clips, key),
    ),
  },
  context: {
    entries: contexts.length,
    componentExplanations: components.length,
    charactersWithEitherSupport: new Set([...contexts, ...components]).size,
    thematicGroups: lessons.elements.length,
  },
  hsk: levels.map((level) => ({
    band: level.label,
    available: [...new Set(level.chars)].filter((char) => chars.has(char))
      .length,
    listedCharacters: new Set(level.chars).size,
    referenceTotal: level.total,
  })),
  wardrobe: {
    items: items.length,
    uniqueIds: new Set(items.map((item) => item.id)).size,
    bySlot: Object.fromEntries(
      [...new Set(items.map((item) => item.slot))].map((slot) => [
        slot,
        items.filter((item) => item.slot === slot).length,
      ]),
    ),
  },
};
if (process.argv.includes("--json"))
  console.log(JSON.stringify(report, null, 2));
else {
  console.log("Hanzi Wallet — inventario local de aprendizaje");
  console.log(
    `Caracteres: ${chars.size}; con geometrías: ${[...chars].filter((char) => templateChars.has(char)).length}; asociados a bandas HSK: ${report.vocabulary.charactersInHSKBands}`,
  );
  console.log(
    `Audio: ${report.audio.clips} clips, ${audioBytes.length} bytes, checksum ${report.audio.checksumMatchesIndex ? "correcto" : "INCORRECTO"}`,
  );
  console.log(
    `Tonos de ma ausentes: ${report.audio.missingMaTones.join(", ") || "ninguno"}`,
  );
  console.log(
    `Contextos: ${contexts.length}; explicaciones de componentes: ${components.length}; agrupaciones temáticas: ${report.context.thematicGroups}`,
  );
  for (const band of report.hsk)
    console.log(
      `HSK ${band.band}: ${band.available}/${band.referenceTotal} caracteres disponibles (${band.listedCharacters} en la lista local)`,
    );
  console.log(
    `Tienda: ${report.wardrobe.items} artículos; ${report.wardrobe.bySlot.outfit ?? 0} prendas`,
  );
  console.log(
    "Conteos de recursos, no validación lingüística ni cobertura de un curso completo. Use --json para el informe estructurado.",
  );
}
if (
  !report.audio.checksumMatchesIndex ||
  invalidClips.length ||
  chars.size !== vocabulary.length ||
  templateChars.size !== templates.length ||
  report.templates.missingVocabularyCharacters.length ||
  report.templates.mismatchedStrokeCounts.length ||
  report.wardrobe.items !== report.wardrobe.uniqueIds ||
  report.vocabulary.missingMeanings.some((row) => row.count)
) {
  process.exitCode = 1;
}
