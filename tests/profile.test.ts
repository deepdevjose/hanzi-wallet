import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALES } from "../src/i18n";
import {
  ITEMS, MAX_LEVEL, applyPlacement, buyItem, equipItem, initialProfile,
  itemName, levelFromXP, levelProgress, loadProfile, profileLevel, readProfile, saveProfile,
  syncProfile, unequipItem, xpForLevel,
} from "../src/core/profile";
import { PLACEMENT_QUESTIONS, assessPlacement } from "../src/core/placement";

describe("avatar progression and one-time rewards", () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  it("keeps unsaved setup in this session when storage is denied", () => {
    const entries = new Map<string, string>();
    const storage = { getItem: (key: string): string | null => entries.get(key) ?? null, setItem: (key: string, value: string): void => { entries.set(key, value); } };
    vi.stubGlobal("localStorage", storage);
    const old = { ...initialProfile(), name: "Older" };
    expect(saveProfile(old)).toBe(true);
    const latest = applyPlacement({ ...old, name: "Latest" }, "4");
    vi.stubGlobal("localStorage", { getItem: storage.getItem, setItem: (): never => { throw new Error("quota"); } });
    expect(saveProfile(latest)).toBe(false);
    expect(loadProfile().name).toBe("Latest");
    expect(loadProfile().placement?.band).toBe("4");
    expect(loadProfile().coins).toBe(latest.coins);
    vi.stubGlobal("localStorage", storage);
    expect(saveProfile(loadProfile())).toBe(true);
    expect(loadProfile().name).toBe("Latest");
  });

  it("persists intentionally removed equipment without restoring defaults", () => {
    const profile = initialProfile();
    const nakedFrame = unequipItem(profile, "frame");
    const restored = readProfile(JSON.parse(JSON.stringify(nakedFrame)) as unknown);
    expect(restored.equipped.frame).toBeUndefined();
    expect(restored.equipped.outfit).toBe("everyday");
  });
  it("starts at level zero and gradually increases the effort per level", () => {
    const profile = initialProfile();
    expect(profileLevel(profile, 0)).toBe(0);
    expect(levelProgress(profile, 10)).toEqual({ level: 0, current: 10, needed: 25, ratio: 0.4 });
    expect(levelFromXP(24)).toBe(0);
    expect(levelFromXP(25)).toBe(1);
    for (let level = 1; level < MAX_LEVEL; level++) {
      expect(xpForLevel(level + 1) - xpForLevel(level)).toBeGreaterThan(xpForLevel(level) - xpForLevel(level - 1));
      expect(levelFromXP(xpForLevel(level))).toBe(level);
    }
    expect(levelFromXP(Number.MAX_SAFE_INTEGER)).toBe(MAX_LEVEL);
    expect(levelProgress(profile, Number.MAX_SAFE_INTEGER).ratio).toBe(1);
    expect(levelFromXP(Number.NaN)).toBe(0);
  });

  it("preserves legacy purchases and maps old bases without inventing progress", () => {
    const profile = readProfile({ name: "  Mei  ", base: "scholar", coins: 87, accountedXP: 250, owned: ["hat", "red", "dragon", "fake"], equipped: { head: "hat", outfit: "red", aura: "dragon", frame: "hat" }, completed: true }, 250);
    expect(profile.base).toBe("female");
    expect(profile.name).toBe("Mei");
    expect(profile.coins).toBe(87);
    expect(profile.owned).toContain("dragon");
    expect(profile.owned).not.toContain("fake");
    expect(profile.equipped).toMatchObject({ head: "hat", outfit: "red", aura: "dragon", });
    expect(profile.equipped.frame).toBeUndefined();
    expect(profile.placement).toBeNull();
    expect(syncProfile(profile, 250).coins).toBe(87);
    expect(readProfile(null, 200).accountedXP).toBe(200);
  });

  it("validates corrupt identity, coins, equipped slots and placement data", () => {
    const profile = readProfile({ name: "a".repeat(100), base: "oops", coins: -2, accountedXP: Infinity, nationality: "<script>", age: 250, gender: "other", owned: {}, equipped: { head: "crown" }, placement: { band: "oops", level: 90, awarded: true }, achievements: ["placement-4", "javascript", "placement-4"] }, 15);
    expect(profile.name.length).toBe(40);
    expect(profile.base).toBe("male");
    expect(profile.coins).toBe(0);
    expect(profile.accountedXP).toBe(15);
    expect(profile.nationality).toBe("");
    expect(profile.age).toBeNull();
    expect(profile.gender).toBe("unspecified");
    expect(profile.equipped.head).toBeUndefined();
    expect(profile.placement).toBeNull();
    expect(profile.achievements).toEqual(["placement-4"]);
    const placed = readProfile({ placement: { band: "4", level: 9999, awarded: true } });
    expect(placed.placement?.level).toBe(28);
  });

  it("grants placement once and keeps its baseline out of practice coin minting", () => {
    const placed = applyPlacement(initialProfile(), "5");
    expect(placed.placement?.level).toBe(40);
    expect(profileLevel(placed, 0)).toBe(40);
    expect(placed.coins).toBe(1080);
    expect(placed.owned).toEqual(expect.arrayContaining(["hanfu", "gold", "plum"]));
    expect(applyPlacement(placed, "7-9")).toBe(placed);
    expect(syncProfile(placed, 0).coins).toBe(1080);
    const practiced = syncProfile(placed, 30);
    expect(practiced.coins).toBe(1110);
    expect(syncProfile(practiced, 30).coins).toBe(1110);
    const reset = syncProfile(practiced, 0);
    expect(syncProfile(reset, 30).coins).toBe(1110);
    expect(syncProfile(reset, 40).coins).toBe(1120);
    expect(applyPlacement(initialProfile(), "0").coins).toBe(80);
  });

  it("checks levels and balances atomically and never buys the same item twice", () => {
    const beginner = applyPlacement(initialProfile(), "0");
    expect(buyItem(beginner, "linen", 0)).toBe(beginner);
    expect(buyItem(beginner, "dragon", 0)).toBe(beginner);
    expect(buyItem(beginner, "unknown", 25)).toBe(beginner);
    const bought = buyItem(beginner, "linen", 25);
    expect(bought.coins).toBe(20);
    expect(bought.owned.filter((id) => id === "linen")).toHaveLength(1);
    expect(bought.equipped.outfit).toBe("linen");
    expect(buyItem(bought, "linen", 25)).toBe(bought);
    expect(buyItem(bought, "smile", 25)).toBe(bought);
    expect(equipItem(bought, "crown")).toBe(bought);
    expect(equipItem(bought, "everyday").equipped.outfit).toBe("everyday");
    const hat = equipItem({ ...bought, owned: [...bought.owned, "hat"] }, "hat");
    expect(unequipItem(hat, "head").equipped.head).toBeUndefined();
    expect(bought.coins).toBeGreaterThanOrEqual(0);
  });

  it("provides all cosmetic categories and localized product names", () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(35);
    expect(new Set(ITEMS.map((item) => item.id)).size).toBe(ITEMS.length);
    expect(new Set(ITEMS.map((item) => item.slot)).size).toBe(8);
    for (const item of ITEMS) for (const locale of LOCALES) expect(itemName(item, locale).length).toBeGreaterThan(0);
  });
});

describe("indicative reading placement", () => {
  it("requires continuous success and cannot jump levels from isolated hard answers", () => {
    expect(assessPlacement([])).toMatchObject({ band: "0", level: 0, correct: 0, total: 21 });
    const hardOnly = PLACEMENT_QUESTIONS.filter((q) => q.band === "7-9").map((q) => ({ id: q.id, choice: q.answer }));
    expect(assessPlacement(hardOnly).band).toBe("0");
    const all = PLACEMENT_QUESTIONS.map((q) => ({ id: q.id, choice: q.answer }));
    expect(assessPlacement(all)).toEqual({ band: "7-9", level: 70, correct: 21, total: 21 });
    const firstFour = PLACEMENT_QUESTIONS.filter((q) => ["1", "2", "3", "4"].includes(q.band)).map((q) => ({ id: q.id, choice: q.answer }));
    expect(assessPlacement(firstFour)).toMatchObject({ band: "4", level: 28, correct: 12 });
  });

  it("ignores unknown answers and cannot improve a score by repeating a question", () => {
    const first = PLACEMENT_QUESTIONS[0]!;
    const answers = [{ id: first.id, choice: -1 }, { id: first.id, choice: first.answer }, { id: "unknown", choice: 0 }];
    expect(assessPlacement(answers).correct).toBe(0);
    expect(assessPlacement([{ id: first.id, choice: first.answer }, { id: first.id, choice: first.answer }]).correct).toBe(1);
  });

  it("has valid four-option questions in every supported locale", () => {
    expect(new Set(PLACEMENT_QUESTIONS.map((q) => q.id)).size).toBe(21);
    for (const question of PLACEMENT_QUESTIONS) {
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(4);
      for (const locale of LOCALES) {
        expect(question.prompt[locale].length).toBeGreaterThan(0);
        expect(question.options[locale]).toHaveLength(4);
        expect(new Set(question.options[locale]).size).toBe(4);
      }
    }
  });
});
