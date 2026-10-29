import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  assess,
  dtw,
  features,
  normalize,
  resample,
  templateDistance,
} from "../src/core/geometry";
import { infer } from "../src/core/neural";
import { recognize } from "../src/core/recognition";
import { emptyState, parseState, saved, schedule } from "../src/core/storage";
import type { CharacterTemplate, NeuralModel, Stroke } from "../src/core/types";
const read = <T>(p: string): T =>
  JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8")) as T;
const templates = read<CharacterTemplate[]>("../public/data/templates.json");
const model = read<NeuralModel>("../public/model/ink-mlp.json");
const get = (char: string): CharacterTemplate =>
  templates.find((t) => t.char === char)!;
const known = new Set(templates.map((t) => t.char));
const fixtures = read<
  {
    char: string;
    strokes: Stroke[];
    features: number[];
    prediction: number[];
  }[]
>("./model-fixtures.json");

describe("Neural model and feature extraction", () => {
  it("matches the Python preprocessing and exported inference", () => {
    for (const fixture of fixtures) {
      const input = features(fixture.strokes);
      expect(input.length).toBe(609);
      expect(
        Math.max(...input.map((v, i) => Math.abs(v - fixture.features[i]!))),
      ).toBeLessThan(0.0001);
      const output = infer(model, input);
      expect(
        Math.max(...output.map((v, i) => Math.abs(v - fixture.prediction[i]!))),
      ).toBeLessThan(0.0005);
      expect(model.classes[output.indexOf(Math.max(...output))]).toBe(
        fixture.char,
      );
    }
  });
  it("rejects incompatible model input dimensions", () => {
    expect(() => infer(model, new Float32Array(3))).toThrow();
  });
  it("contains 151 distinct classes matching the data", () => {
    expect(new Set(model.classes).size).toBe(151);
    expect(model.classes).toEqual(templates.map((t) => t.char));
  });
});

describe("Stroke recognition and evaluation", () => {
  it("recognizes every canonical character as the top hypothesis", () => {
    for (const t of templates) {
      const r = recognize(t.medians, templates, model);
      expect(r.rejected, t.char).toBe(false);
      expect(r.candidates[0]?.char, t.char).toBe(t.char);
    }
  }, 30000);
  it("recognizes shifted, scaled and nonuniformly sampled strokes", () => {
    for (const char of ["你", "好", "学", "水", "永", "一", "十", "木"]) {
      const strokes = get(char).medians.map((s) =>
        resample(s, 35).map((p) => ({
          x: p.x * 0.7 + 0.12,
          y: p.y * 0.7 + 0.17,
        })),
      );
      const r = recognize(strokes, templates, model);
      expect(
        r.candidates.slice(0, 3).map((c) => c.char),
        char,
      ).toContain(char);
    }
  });
  it("rejects an empty drawing and tiny accidental taps", () => {
    expect(recognize([], templates, model).rejected).toBe(true);
    expect(
      recognize(
        [
          [
            { x: 0.5, y: 0.5 },
            { x: 0.501, y: 0.501 },
          ],
        ],
        templates,
        model,
      ).rejected,
    ).toBe(true);
  });
  it("supports geometric fallback if the model is unavailable", () => {
    expect(
      recognize(get("水").medians, templates, null).candidates[0]?.char,
    ).toBe("水");
  });
  it("passes correct strokes, rejects incorrect order and reversed direction", () => {
    const ten = get("十");
    expect(assess(ten.medians, ten).passed).toBe(true);
    const swapped = [...ten.medians].reverse();
    const wrong = assess(swapped, ten);
    expect(wrong.shape).toBeGreaterThan(90);
    expect(wrong.order).toBe(0);
    expect(wrong.passed).toBe(false);
    const one = get("一");
    const reversed = assess(
      one.medians.map((s) => [...s].reverse()),
      one,
    );
    expect(reversed.shape).toBeGreaterThan(90);
    expect(reversed.direction).toBe(0);
    expect(reversed.passed).toBe(false);
  });
  it("does not pass missing or extra strokes", () => {
    const t = get("永");
    expect(assess(t.medians.slice(1), t).passed).toBe(false);
    expect(assess([...t.medians, t.medians[0]!], t).passed).toBe(false);
  });
  it("retains aspect ratio and handles duplicate points and empty sequences", () => {
    expect(resample([], 10)).toEqual([]);
    const flat = [
      { x: 1, y: 1 },
      { x: 1, y: 1 },
    ];
    expect(resample(flat, 3)).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 1 },
    ]);
    expect(dtw([], flat)).toBe(1);
    expect(normalize([])).toEqual([]);
    expect(templateDistance([], [])).toBe(1);
  });
});

describe("Persistence validation and spaced repetition", () => {
  it("clamps untrusted imports and discards unknown characters and non-finite numbers", () => {
    const state = parseState(
      {
        wallet: {
          你: {
            interval: Infinity,
            nextReview: -1,
            bestScore: 1000,
            reviews: "oops",
          },
          "<script>": { mastered: true },
        },
        preferences: { theme: "evil", inkWidth: 999 },
      },
      known,
    );
    expect(Object.keys(state.wallet)).toEqual(["你"]);
    expect(state.wallet["你"]?.interval).toBe(0);
    expect(state.wallet["你"]?.bestScore).toBe(100);
    expect(state.wallet["你"]?.reviews).toBe(0);
    expect(state.preferences.theme).toBe("light");
    expect(state.preferences.inkWidth).toBe(6);
  });
  it("rejects malformed root and excludes invalid examples and invalid history", () => {
    expect(() => parseState([], known)).toThrow();
    expect(() => parseState({ wallet: [] }, known)).toThrow();
    const state = parseState(
      {
        wallet: {},
        personal: {
          你: [[[{ x: NaN, y: 0.2 }]]],
          水: [
            [
              [
                { x: 0, y: 0 },
                { x: 0.3, y: 0.4 },
              ],
            ],
          ],
        },
        history: [{ char: "你", timestamp: NaN, score: 70, passed: true }],
      },
      known,
    );
    expect(state.personal["你"]).toHaveLength(0);
    expect(state.personal["水"]).toHaveLength(1);
    expect(state.history).toHaveLength(0);
  });
  it("round-trips an exported state without losing personal examples", () => {
    const state = {
      ...emptyState(),
      wallet: { 你: saved("你", 100) },
      personal: { 你: [get("你").medians] },
    };
    // Exported templates are outside the writing surface only before normalisation.
    const safe = { ...state, personal: { 你: [normalize(get("你").medians)] } };
    expect(
      parseState(JSON.parse(JSON.stringify(safe)) as unknown, known),
    ).toEqual(safe);
  });
  it("uses finite increasing intervals, relearns failures and consolidates only over time", () => {
    const now = 1000;
    let card = saved("你", now);
    expect(card.mastered).toBe(false);
    card = schedule(card, "good", now);
    expect(card.interval).toBe(1);
    expect(card.nextReview).toBe(now + 86_400_000);
    card = schedule(card, "good", now);
    expect(card.interval).toBe(3);
    expect(card.mastered).toBe(false);
    card = schedule(card, "good", now);
    expect(card.interval).toBeGreaterThanOrEqual(7);
    expect(card.mastered).toBe(true);
    card = schedule(card, "again", now);
    expect(card.interval).toBe(0);
    expect(card.mastered).toBe(false);
    expect(card.nextReview).toBe(now + 600_000);
    for (let i = 0; i < 50; i++) card = schedule(card, "good", now);
    expect(card.interval).toBeLessThanOrEqual(365);
    expect(Number.isFinite(card.nextReview)).toBe(true);
  });
});
