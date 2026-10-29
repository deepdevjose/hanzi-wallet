import {
  bounds,
  features,
  length,
  normalize,
  templateDistance,
  coarseDistance,
  clamp,
} from "./geometry";
import { infer } from "./neural";
import type {
  NeuralModel,
  CharacterTemplate,
  Stroke,
  Recognition,
  Candidate,
} from "./types";
export function recognize(
  strokes: readonly Stroke[],
  templates: readonly CharacterTemplate[],
  model: NeuralModel | null,
  personal: Readonly<Record<string, readonly (readonly Stroke[])[]>> = {},
): Recognition {
  const start = performance.now(),
    b = bounds(strokes),
    total = strokes.reduce((n, s) => n + length(s), 0);
  if (!strokes.length || total < 0.035 || Math.max(b.w, b.h) < 0.025)
    return {
      candidates: [],
      rejected: true,
      reason: "Escribe un carácter más grande para poder reconocerlo.",
      elapsed: performance.now() - start,
    };
  if (strokes.length > 25 || total > 25)
    return {
      candidates: [],
      rejected: true,
      reason: "Hay demasiados trazos. Prueba con un solo carácter.",
      elapsed: performance.now() - start,
    };
  const probabilities = model ? infer(model, features(strokes)) : null;
  const ranks = new Map(
    model?.classes.map((h, i) => [h, probabilities?.[i] ?? 0]),
  );
  const geometric = templates
    .map((t) => ({ t, d: coarseDistance(strokes, t.medians) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 16);
  const neural = templates
    .slice()
    .sort((a, b) => (ranks.get(b.char) ?? 0) - (ranks.get(a.char) ?? 0))
    .slice(0, 12);
  const personalized = templates
    .filter((t) => personal[t.char]?.length)
    .map((t) => ({
      t,
      d: Math.min(
        ...(personal[t.char] ?? []).map((example) =>
          coarseDistance(strokes, example),
        ),
      ),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 8);
  const shortlist = [
    ...new Map(
      [
        ...geometric.map((x) => x.t),
        ...neural,
        ...personalized.map((x) => x.t),
      ].map((t) => [t.char, t]),
    ).values(),
  ];
  const all: Candidate[] = shortlist
    .map((t) => {
      let d = templateDistance(strokes, t.medians);
      for (const example of personal[t.char] ?? [])
        d = Math.min(d, templateDistance(strokes, example) * 1.05);
      const geometry = clamp(Math.exp(-d * 6)),
        neural = ranks.get(t.char) ?? 0;
      const score =
        geometry * (model ? 0.82 : 1) +
        Math.sqrt(neural) * 0.18 * (model ? 1 : 0);
      return { char: t.char, score, geometry, neural };
    })
    .sort((a, c) => c.score - a.score);
  const first = all[0],
    normalized = normalize(strokes),
    normLength = normalized.reduce((n, s) => n + length(s), 0);
  const rejected =
    !first || first.geometry < 0.29 || normLength > strokes.length * 3;
  return {
    candidates: all.slice(0, 5),
    rejected,
    reason: rejected
      ? "Sin coincidencia clara. Prueba otra vez o elige un carácter para practicar."
      : "Compara las opciones y elige la que querías escribir.",
    elapsed: performance.now() - start,
  };
}
