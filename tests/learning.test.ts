import { describe, expect, it } from "vitest";
import vocabulary from "../public/data/vocabulary.json";
import hskLevels from "../src/hsk-levels.json";
import { levelLessons } from "../src/learning-content";
import {
  adaptiveQueue,
  answerOptions,
  correctMeaning,
  dailyQueue,
  emptyLearning,
  finishLearning,
  gradeLearning,
  readLearning,
  streak,
} from "../src/core/learning";
import { LOCALES } from "../src/i18n";
import { dayKey } from "../src/core/storage";
import type { VocabularyEntry } from "../src/core/types";

describe("HSK character practice", () => {
  it("puts each supported syllabus character in exactly one group at its level", () => {
    const known = new Set(vocabulary.map((entry) => entry.char));
    const all = hskLevels.flatMap((level) => {
      const groups = levelLessons(level.label, level.chars);
      const list = groups.flatMap((group) => [...group.chars]);
      expect(list.length).toBe(level.chars.length);
      expect(new Set(list)).toEqual(new Set(level.chars));
      expect(list.every((char) => known.has(char))).toBe(true);
      return list;
    });
    expect(new Set(all).size).toBe(all.length);
    expect(hskLevels.map((level) => [level.chars.length, level.total])).toEqual(
      [
        [217, 246],
        [81, 125],
        [111, 284],
        [56, 441],
        [26, 431],
        [6, 413],
        [2, 1148],
      ],
    );
  });

  it("schedules errors early and prevents XP from repeats ahead of schedule", () => {
    const now = 100_000;
    const missed = gradeLearning(emptyLearning(), "你", "miss", now);
    const progress = gradeLearning(missed, "好", "recall", now);
    expect(progress.xp).toBe(10);
    expect(gradeLearning(progress, "好", "recall", now + 1)).toBe(progress);
    expect(gradeLearning(progress, "你", "choice", now + 1)).toBe(progress);
    expect(
      adaptiveQueue(
        progress,
        ["好", "学", "你", "水"],
        now + 600_000,
        "adaptive",
      ),
    ).toEqual(["你", "学", "水"]);
    expect(adaptiveQueue(progress, ["好", "你"], now, "errors")).toEqual([
      "你",
    ]);
    const recovered = gradeLearning(progress, "你", "choice", now + 600_000);
    expect(recovered.xp).toBe(15);
    expect(adaptiveQueue(recovered, ["你"], now + 600_000, "errors")).toEqual(
      [],
    );
    expect(
      readLearning(
        JSON.parse(JSON.stringify(recovered)),
        new Set(["你", "好"]),
      ),
    ).toEqual(recovered);
  });

  it("keeps the daily deck stable and rewards its completion once", () => {
    const chars = [...hskLevels[0]!.chars];
    const date = "2026-11-10";
    const deck = dailyQueue(date, chars);
    expect(new Set(deck).size).toBe(5);
    expect(deck).toEqual(dailyQueue(date, chars));
    expect(deck).not.toEqual(dailyQueue("2026-11-11", chars));
    const failed = finishLearning(emptyLearning(), "daily", 3, date);
    const passed = finishLearning(failed, "daily", 4, date);
    expect(passed.xp).toBe(20);
    expect(finishLearning(passed, "daily", 5, date).xp).toBe(20);
    const now = new Date(2026, 10, 11, 8).getTime();
    expect(
      streak(finishLearning(passed, "lesson", 2, dayKey(now)).active, now),
    ).toBe(2);
  });

  it("accepts normalized recall answers and excludes overlapping distractors", () => {
    expect(correctMeaning(" TÉ! ", "té / infusión")).toBe(true);
    expect(correctMeaning("no", "no (negación)")).toBe(true);
    expect(correctMeaning("sí", "no (negación)")).toBe(false);
    const target = vocabulary.find((entry) => entry.char === "没")!;
    for (const locale of LOCALES) {
      const gloss = (entry: VocabularyEntry): string =>
        entry.meanings?.[locale] ?? entry.meaning;
      const options = answerOptions(target, vocabulary, gloss);
      expect(options).toHaveLength(4);
      expect(options).toContain(target);
      for (const item of options.filter((option) => option !== target))
        for (const term of gloss(item).split(/[/;,；、，]/u))
          expect(correctMeaning(term, gloss(target))).toBe(false);
    }
  });
});
