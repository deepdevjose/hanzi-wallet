import type { Point, Stroke, CharacterTemplate, Assessment } from "./types";
export const clamp = (v: number, lo = 0, hi = 1): number =>
  Math.max(lo, Math.min(hi, v));
export const distance = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);
export function length(stroke: Stroke): number {
  let result = 0;
  for (let i = 1; i < stroke.length; i++)
    result += distance(stroke[i - 1]!, stroke[i]!);
  return result;
}
export function bounds(strokes: readonly Stroke[]): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  let x = Infinity,
    y = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (const s of strokes)
    for (const p of s) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      x = Math.min(x, p.x);
      y = Math.min(y, p.y);
      right = Math.max(right, p.x);
      bottom = Math.max(bottom, p.y);
    }
  return x === Infinity
    ? { x: 0, y: 0, w: 0, h: 0 }
    : { x, y, w: right - x, h: bottom - y };
}
export function normalize(strokes: readonly Stroke[]): Stroke[] {
  const b = bounds(strokes),
    scale = Math.max(b.w, b.h, 0.001);
  return strokes
    .filter((s) => s.length > 0)
    .map((s) =>
      s.map((p) => ({
        x: ((p.x - b.x - b.w / 2) / scale) * 0.78 + 0.5,
        y: ((p.y - b.y - b.h / 2) / scale) * 0.78 + 0.5,
      })),
    );
}
export function resample(stroke: Stroke, n = 24): Point[] {
  if (!stroke.length) return [];
  if (stroke.length === 1)
    return Array.from({ length: n }, () => ({ ...stroke[0]! }));
  const total = length(stroke);
  if (total < 1e-7) return Array.from({ length: n }, () => ({ ...stroke[0]! }));
  const cumulative = [0];
  for (let i = 1; i < stroke.length; i++)
    cumulative.push(cumulative[i - 1]! + distance(stroke[i - 1]!, stroke[i]!));
  let j = 1;
  return Array.from({ length: n }, (_, i) => {
    const target = (total * i) / (n - 1);
    while (j < stroke.length - 1 && cumulative[j]! < target) j++;
    const a = stroke[j - 1]!,
      b = stroke[j]!,
      t =
        (target - cumulative[j - 1]!) /
        Math.max(cumulative[j]! - cumulative[j - 1]!, 1e-9);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  });
}
const samples = new WeakMap<Stroke, Point[]>();
function sampled(stroke: Stroke): Point[] {
  let p = samples.get(stroke);
  if (!p) {
    p = resample(stroke, 20);
    samples.set(stroke, p);
  }
  return p;
}
const prepared = new WeakMap<readonly Stroke[], Stroke[]>();
function prepare(strokes: readonly Stroke[]): Stroke[] {
  let p = prepared.get(strokes);
  if (!p) {
    p = normalize(strokes);
    prepared.set(strokes, p);
  }
  return p;
}
export function coarseDistance(
  input: readonly Stroke[],
  reference: readonly Stroke[],
): number {
  const a = prepare(input),
    b = prepare(reference);
  if (!a.length || !b.length) return 1;
  let sum = 0;
  for (const s of a) {
    const sp = sampled(s);
    let best = 1;
    for (const t of b) {
      const tp = sampled(t);
      let d = 0;
      for (let i = 0; i < 20; i++) d += distance(sp[i]!, tp[i]!);
      best = Math.min(best, d / 20);
    }
    sum += best;
  }
  return sum / a.length + Math.abs(a.length - b.length) * 0.055;
}
export function dtw(a: Stroke, b: Stroke): number {
  if (!a.length || !b.length) return 1;
  const p = sampled(a),
    q = sampled(b);
  let prev = new Float64Array(q.length + 1).fill(Infinity);
  prev[0] = 0;
  for (let i = 1; i <= p.length; i++) {
    const row = new Float64Array(q.length + 1).fill(Infinity);
    for (let j = 1; j <= q.length; j++)
      row[j] =
        distance(p[i - 1]!, q[j - 1]!) +
        Math.min(prev[j]!, row[j - 1]!, prev[j - 1]!);
    prev = row;
  }
  return (prev[q.length]! / (p.length + q.length)) * 2;
}
function strokeCost(a: Stroke, b: Stroke): number {
  return (
    0.7 * dtw(a, b) +
    0.15 * distance(a[0]!, b[0]!) +
    0.15 * distance(a[a.length - 1]!, b[b.length - 1]!)
  );
}
export function templateDistance(
  input: readonly Stroke[],
  template: readonly Stroke[],
): number {
  const a = prepare(input),
    b = prepare(template);
  if (!a.length || !b.length) return 1;
  if (a.length === b.length)
    return a.reduce((sum, s, i) => sum + strokeCost(s, b[i]!), 0) / a.length;
  const matrix = Array.from(
    { length: a.length + 1 },
    () => new Float64Array(b.length + 1),
  );
  for (let i = 0; i <= a.length; i++) matrix[i]![0] = i * 0.36;
  for (let j = 0; j <= b.length; j++) matrix[0]![j] = j * 0.36;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j - 1]! + strokeCost(a[i - 1]!, b[j - 1]!),
        matrix[i - 1]![j]! + 0.36,
        matrix[i]![j - 1]! + 0.36,
      );
  return (
    matrix[a.length]![b.length]! / Math.max(a.length, b.length) +
    Math.abs(a.length - b.length) * 0.055
  );
}
export function assess(
  strokes: readonly Stroke[],
  template: CharacterTemplate,
): Assessment {
  const a = normalize(strokes),
    b = normalize(template.medians),
    expected = b.length,
    actual = a.length;
  if (!actual)
    return {
      shape: 0,
      order: 0,
      direction: 0,
      complete: false,
      passed: false,
      expected,
      actual,
      feedback: "Escribe el carácter para evaluar tus trazos.",
    };
  let shape = 0,
    order = 0,
    direction = 0;
  const used = new Set<number>();
  for (let i = 0; i < a.length; i++) {
    const s = a[i]!;
    let best = Infinity,
      index = -1,
      reversed = false;
    for (let j = 0; j < b.length; j++) {
      if (used.has(j)) continue;
      const forward = strokeCost(s, b[j]!),
        backward = strokeCost([...s].reverse(), b[j]!);
      const cost = Math.min(forward, backward);
      if (cost < best) {
        best = cost;
        index = j;
        reversed = backward + 0.025 < forward;
      }
    }
    if (index < 0) continue;
    used.add(index);
    shape += clamp(1 - best / 0.27);
    if (index === i) order++;
    if (!reversed) direction++;
  }
  const divisor = Math.max(expected, actual);
  shape = Math.round((shape / divisor) * 100);
  order = Math.round((order / divisor) * 100);
  direction = Math.round((direction / divisor) * 100);
  const complete = actual === expected;
  const passed = complete && shape >= 67 && order === 100 && direction === 100;
  let feedback = passed
    ? "Muy bien. La forma, el orden y la dirección coinciden."
    : !complete
      ? `Llevas ${actual} de ${expected} trazos. ${actual < expected ? "Completa el carácter." : "Hay trazos extra; deshaz o vuelve a intentarlo."}`
      : shape < 67
        ? "Ajusta la posición y la proporción. Activa la guía para comparar."
        : order < 85
          ? "La forma se parece, pero revisa el orden. Mira la animación e inténtalo de nuevo."
          : "Revisa la dirección: normalmente de arriba abajo y de izquierda a derecha.";
  return {
    shape,
    order,
    direction,
    complete,
    passed,
    expected,
    actual,
    feedback,
  };
}
export const FEATURE_SIZE = 24 * 24 + 24 + 8 + 1;
export function features(strokes: readonly Stroke[]): Float32Array {
  const result = new Float32Array(FEATURE_SIZE),
    normalized = normalize(strokes),
    grid = 24;
  for (const s of normalized) {
    const points = resample(s, Math.max(2, Math.ceil(length(s) / 0.012)));
    for (const p of points) {
      const px = p.x * (grid - 1),
        py = p.y * (grid - 1);
      for (
        let y = Math.max(0, Math.floor(py) - 2);
        y <= Math.min(grid - 1, Math.ceil(py) + 2);
        y++
      )
        for (
          let x = Math.max(0, Math.floor(px) - 2);
          x <= Math.min(grid - 1, Math.ceil(px) + 2);
          x++
        ) {
          const v = Math.exp(-((x - px) ** 2 + (y - py) ** 2) / 0.98);
          const k = y * grid + x;
          result[k] = Math.max(result[k]!, v);
        }
    }
  }
  result[576 + Math.min(23, Math.max(0, strokes.length - 1))] = 1;
  let total = 0;
  for (const s of normalized)
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1]!,
        b = s[i]!,
        l = distance(a, b);
      const bin =
        Math.floor(
          ((Math.atan2(b.y - a.y, b.x - a.x) + Math.PI) / (2 * Math.PI)) * 8,
        ) % 8;
      result[600 + bin] = result[600 + bin]! + l;
      total += l;
    }
  if (total > 0) for (let i = 600; i < 608; i++) result[i] = result[i]! / total;
  const box = bounds(strokes);
  result[608] = Math.min(2, box.w / Math.max(box.h, 0.001)) / 2;
  return result;
}
