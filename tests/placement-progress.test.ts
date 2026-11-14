import { describe, expect, it } from "vitest";
import vocabulary from "../public/data/vocabulary.json";
import hskLevels from "../src/hsk-levels.json";
import { emptyState, parseState, saved, schedule } from "../src/core/storage";
import {
  adaptiveQueue,
  emptyLearning,
  gradeLearning,
} from "../src/core/learning";
import {
  placementCharacters,
  nextStudyBand,
  initializePlacementWallet,
  isRecognitionComplete,
  isUntouchedPlacementCard,
  furthestPlacement,
  mergePlacementWallet,
} from "../src/core/placement-progress";

const known = new Set(vocabulary.map((entry) => entry.char));

describe("initial collection and placement recognition", () => {
  it("starts beginners with no saved hanzi or practice records", () => {
    const initial = initializePlacementWallet(emptyState(), "0", known, 123);
    expect(initial.wallet).toEqual({});
    expect(initial.history).toEqual([]);
    expect(initial.placementApplied).toBe("0");
    expect(initializePlacementWallet(initial, "0", known, 456)).toBe(initial);
    expect(nextStudyBand("0")).toBe("1");
  });

  it("recognizes the passed band inclusively and only the supported syllabus", () => {
    expect(placementCharacters("1", known)).toEqual([...hskLevels[0]!.chars]);
    expect(placementCharacters("2", known)).toHaveLength(298);
    expect(placementCharacters("7-9", known)).toHaveLength(499);
    expect(placementCharacters("7–9", known)).toHaveLength(499);
    expect(placementCharacters("invalid", known)).toEqual([]);
    expect(
      new Set(placementCharacters("2", new Set(["你", "好", "🦊"]))),
    ).toEqual(new Set(["你", "好"]));
    expect(nextStudyBand("2")).toBe("3");
    expect(nextStudyBand("6")).toBe("7–9");
    expect(nextStudyBand("7-9")).toBe("7–9");
  });

  it("adds advanced characters without replacing prior work or manufacturing practice", () => {
    const old = schedule(
      { ...saved("你", 10), writing: 3, bestScore: 92 },
      "good",
      30,
    );
    const before = { ...emptyState(), wallet: { 你: old } };
    const placed = initializePlacementWallet(before, "2", known, 100);
    expect(Object.keys(placed.wallet)).toHaveLength(298);
    expect(placed.wallet.你).toBe(old);
    expect(placed.wallet.好).toMatchObject({
      reviews: 0,
      writing: 0,
      bestScore: 0,
      lapses: 0,
      interval: 0,
      mastered: false,
    });
    expect(placed.history).toBe(before.history);
    expect(placed.personal).toBe(before.personal);
    expect(initializePlacementWallet(placed, "2", known, 999)).toBe(placed);
  });

  it("does not restore manual removals on reload or a higher-band migration", () => {
    const first = initializePlacementWallet(emptyState(), "1", known, 100);
    const wallet = { ...first.wallet };
    delete wallet.你;
    const removed = { ...first, wallet };
    expect(initializePlacementWallet(removed, "1", known, 200)).toBe(removed);
    const upgraded = initializePlacementWallet(removed, "2", known, 300);
    expect(upgraded.wallet.你).toBeUndefined();
    expect(Object.keys(upgraded.wallet)).toHaveLength(297);
    expect(upgraded.placementApplied).toBe("2");
    expect(initializePlacementWallet(upgraded, "0", known)).toBe(upgraded);
  });

  it("keeps the initialization marker in backups and rejects invalid markers", () => {
    const placed = initializePlacementWallet(emptyState(), "3", known, 100);
    const restored = parseState(JSON.parse(JSON.stringify(placed)), known);
    expect(restored).toEqual(placed);
    expect(initializePlacementWallet(restored, "3", known)).toBe(restored);
    expect(
      parseState({ wallet: {}, placementApplied: "999" }, known)
        .placementApplied,
    ).toBeUndefined();
    expect(furthestPlacement("3", "1")).toBe("3");
    expect(furthestPlacement(undefined, "2")).toBe("2");
    expect(furthestPlacement()).toBeUndefined();
  });

  it("counts assessment recognition until a later exercise provides actual evidence", () => {
    expect(isRecognitionComplete(undefined, true)).toBe(true);
    expect(isRecognitionComplete(undefined, false)).toBe(false);
    const failed = gradeLearning(emptyLearning(), "你", "miss", 100);
    expect(isRecognitionComplete(failed.cards.你, true)).toBe(false);
    const passed = gradeLearning(emptyLearning(), "你", "recall", 100);
    expect(isRecognitionComplete(passed.cards.你, false)).toBe(true);
    expect(isUntouchedPlacementCard(saved("你", 100), true)).toBe(true);
    expect(isUntouchedPlacementCard(passed.cards.你!, true)).toBe(false);
    expect(
      isUntouchedPlacementCard({ ...saved("你"), bestScore: 40 }, true),
    ).toBe(false);
    expect(isUntouchedPlacementCard(saved("你"), false)).toBe(false);
  });

  it("does not introduce recognized characters as new, but still allows voluntary review", () => {
    const recognized = new Set(["你", "好"]);
    expect(
      adaptiveQueue(
        emptyLearning(),
        ["你", "好", "学"],
        100,
        "adaptive",
        recognized,
      ),
    ).toEqual(["学"]);
    expect(
      adaptiveQueue(emptyLearning(), ["你", "好"], 100, "adaptive", recognized),
    ).toEqual(["你", "好"]);
    expect(
      adaptiveQueue(emptyLearning(), ["你", "好"], 100, "errors", recognized),
    ).toEqual([]);
    const actualMiss = gradeLearning(emptyLearning(), "你", "miss", 0);
    expect(
      adaptiveQueue(
        actualMiss,
        ["你", "好", "学"],
        600_000,
        "adaptive",
        recognized,
      ),
    ).toEqual(["你", "学"]);
    const practiced = gradeLearning(emptyLearning(), "你", "recall", 100);
    expect(
      adaptiveQueue(practiced, ["你", "好"], 101, "adaptive", recognized),
    ).toEqual(["好"]);
  });

  it("does not let an assessment-only backup erase real writing or reviews", () => {
    const practiced = schedule(
      { ...saved("你", 10), writing: 3, bestScore: 95 },
      "good",
      100,
    );
    const merged = mergePlacementWallet(
      { 你: practiced },
      { 你: saved("你", 200), 好: saved("好", 200) },
    );
    expect(merged.你).toBe(practiced);
    expect(merged.好?.reviews).toBe(0);
    expect(Object.keys(merged)).toHaveLength(2);
  });
});
