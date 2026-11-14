import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALES } from "../src/i18n";
import {
  ITEMS,
  DEFAULT_SHIRT_COLOR,
  SHIRT_COLORS,
  MAX_LEVEL,
  applyPlacement,
  buyItem,
  changeAppearance,
  changeBase,
  equipItem,
  getLearningXP,
  initialProfile,
  itemName,
  levelFromXP,
  levelProgress,
  loadProfile,
  profileLevel,
  readProfile,
  saveProfile,
  syncProfile,
  setSessionLearningXP,
  unequipItem,
  xpForLevel,
} from "../src/core/profile";
import { PLACEMENT_QUESTIONS, assessPlacement } from "../src/core/placement";
import { defaultAppearance, type Appearance } from "../src/core/appearance";

describe("avatar progression and one-time rewards", () => {
  afterEach(() => {
    setSessionLearningXP(null);
    vi.unstubAllGlobals();
  });
  it("shares in-memory XP with avatar levels and coins when storage is denied", () => {
    vi.stubGlobal("localStorage", {
      getItem: (): never => {
        throw new Error("denied");
      },
    });
    expect(getLearningXP()).toBe(0);
    setSessionLearningXP(35);
    const synced = syncProfile(
      applyPlacement(initialProfile(), "0"),
      getLearningXP(),
    );
    expect(getLearningXP()).toBe(35);
    expect(profileLevel(synced, getLearningXP())).toBe(1);
    expect(synced.coins).toBe(115);
    expect(syncProfile(synced, getLearningXP()).coins).toBe(115);
    setSessionLearningXP(null);
    vi.stubGlobal("localStorage", {
      getItem: (): string => JSON.stringify({ xp: 90 }),
    });
    expect(getLearningXP()).toBe(90);
    setSessionLearningXP(100);
    expect(getLearningXP()).toBe(100);
    setSessionLearningXP(null);
    expect(getLearningXP()).toBe(90);
  });

  it("keeps unsaved setup in this session when storage is denied", () => {
    const entries = new Map<string, string>();
    const storage = {
      getItem: (key: string): string | null => entries.get(key) ?? null,
      setItem: (key: string, value: string): void => {
        entries.set(key, value);
      },
    };
    vi.stubGlobal("localStorage", storage);
    const old = { ...initialProfile(), name: "Older" };
    expect(saveProfile(old)).toBe(true);
    const latest = applyPlacement({ ...old, name: "Latest" }, "4");
    vi.stubGlobal("localStorage", {
      getItem: storage.getItem,
      setItem: (): never => {
        throw new Error("quota");
      },
    });
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
    const restored = readProfile(
      JSON.parse(JSON.stringify(nakedFrame)) as unknown,
    );
    expect(restored.equipped.frame).toBeUndefined();
    expect(restored.equipped.outfit).toBe("everyday");
  });
  it("starts at level zero and gradually increases the effort per level", () => {
    const profile = initialProfile();
    expect(profileLevel(profile, 0)).toBe(0);
    expect(levelProgress(profile, 10)).toEqual({
      level: 0,
      current: 10,
      needed: 25,
      ratio: 0.4,
    });
    expect(levelFromXP(24)).toBe(0);
    expect(levelFromXP(25)).toBe(1);
    for (let level = 1; level < MAX_LEVEL; level++) {
      expect(xpForLevel(level + 1) - xpForLevel(level)).toBeGreaterThan(
        xpForLevel(level) - xpForLevel(level - 1),
      );
      expect(levelFromXP(xpForLevel(level))).toBe(level);
    }
    expect(levelFromXP(Number.MAX_SAFE_INTEGER)).toBe(MAX_LEVEL);
    expect(levelProgress(profile, Number.MAX_SAFE_INTEGER).ratio).toBe(1);
    expect(levelFromXP(Number.NaN)).toBe(0);
  });

  it("preserves legacy purchases and maps old bases without inventing progress", () => {
    const profile = readProfile(
      {
        name: "  Mei  ",
        base: "scholar",
        coins: 87,
        accountedXP: 250,
        owned: ["hat", "red", "dragon", "fake"],
        equipped: { head: "hat", outfit: "red", aura: "dragon", frame: "hat" },
        completed: true,
      },
      250,
    );
    expect(profile.base).toBe("female");
    expect(profile.shirtColor).toBe(DEFAULT_SHIRT_COLOR);
    expect(profile.name).toBe("Mei");
    expect(profile.coins).toBe(87);
    expect(profile.owned).toContain("dragon");
    expect(profile.owned).not.toContain("fake");
    expect(profile.equipped).toMatchObject({
      head: "hat",
      outfit: "red",
      aura: "dragon",
    });
    expect(profile.equipped.frame).toBeUndefined();
    expect(profile.placement).toBeNull();
    expect(syncProfile(profile, 250).coins).toBe(87);
    expect(readProfile(null, 200).accountedXP).toBe(200);
  });

  it("migrates the legacy skin swatch into a distinct base appearance without changing progress", () => {
    const profile = readProfile(
      {
        name: "Mei",
        base: "scholar",
        coins: 195,
        accountedXP: 180,
        completed: true,
        owned: ["deep", "hat", "red"],
        equipped: { skin: "deep", head: "hat", outfit: "red" },
        placement: { band: "2", level: 10, awarded: true },
        achievements: ["first-step", "placement-2"],
      },
      180,
    );
    expect(profile).toMatchObject({
      name: "Mei",
      base: "female",
      coins: 195,
      accountedXP: 180,
      completed: true,
      equipped: { skin: "deep", head: "hat", outfit: "red" },
      appearance: { ...defaultAppearance("female"), skinTone: "#89583f" },
      placement: { band: "2", level: 10, awarded: true },
    });
    expect(profile.achievements).toEqual(["first-step", "placement-2"]);
    expect(syncProfile(profile, 180).coins).toBe(195);
  });

  it("preserves the complete creator appearance through backups, XP, purchases and temporary storage failure", () => {
    const appearance: Appearance = {
      face: "round",
      eyes: "monolid",
      brows: "straight",
      nose: "defined",
      mouth: "small",
      hair: "flowing",
      hairColor: "#805548",
      eyeColor: "#667c8b",
      skinTone: "#b57b55",
      body: "slender",
      height: "tall",
      cheeks: "freckles",
    };
    const entries = new Map<string, string>();
    const storage = {
      getItem: (key: string): string | null => entries.get(key) ?? null,
      setItem: (key: string, value: string): void => {
        entries.set(key, value);
      },
    };
    vi.stubGlobal("localStorage", storage);
    const original = readProfile({
      ...applyPlacement(initialProfile(), "4"),
      name: "Lin",
      appearance,
      completed: true,
    });
    expect(original.equipped.skin).toBeUndefined();
    expect(saveProfile(original)).toBe(true);
    expect(loadProfile().appearance).toEqual(appearance);
    const practiced = syncProfile(loadProfile(), 35);
    const bought = buyItem(practiced, "linen", 35);
    expect(bought.appearance).toEqual(appearance);
    expect(bought.coins).toBe(original.coins + 35 - 60);
    const backup = readProfile(
      JSON.parse(JSON.stringify(bought)) as unknown,
      35,
    );
    expect(backup.appearance).toEqual(appearance);
    expect(backup.name).toBe("Lin");
    expect(syncProfile(backup, 35).coins).toBe(bought.coins);
    vi.stubGlobal("localStorage", {
      getItem: storage.getItem,
      setItem: (): never => {
        throw new Error("quota");
      },
    });
    expect(saveProfile(backup)).toBe(false);
    expect(loadProfile().appearance).toEqual(appearance);
    expect(loadProfile().coins).toBe(bought.coins);
    vi.stubGlobal("localStorage", storage);
    expect(saveProfile(loadProfile())).toBe(true);
  });

  it("switches base defaults while retaining chosen features, identity and inventory", () => {
    const initial = {
      ...applyPlacement(initialProfile(), "2"),
      name: "Lin",
      nationality: "MX",
      gender: "unspecified" as const,
    };
    const female = changeBase(initial, "female");
    expect(female.appearance).toEqual(defaultAppearance("female"));
    expect(female.base).toBe("female");
    expect(female.coins).toBe(initial.coins);
    expect(female.name).toBe(initial.name);
    expect(female.gender).toBe("unspecified");
    const chosen = changeAppearance(
      changeAppearance(
        changeAppearance(initial, "hair", "crop"),
        "face",
        "round",
      ),
      "eyeColor",
      "#667c8b",
    );
    const changed = changeBase(chosen, "female");
    expect(changed.appearance).toMatchObject({
      hair: "crop",
      face: "round",
      eyeColor: "#667c8b",
      brows: "arched",
      nose: "soft",
      mouth: "gentle",
      body: "soft",
    });
    expect(changed.owned).toEqual(initial.owned);
    expect(changed.equipped).toEqual(initial.equipped);
    expect(changeBase(changed, "female")).toBe(changed);
    expect(changeAppearance(changed, "hair", "not-a-style")).toBe(changed);
    expect(changeAppearance(changed, "unknown" as "hair", "bob")).toBe(changed);
  });

  it("keeps wardrobe swatches and free creator skin choices in sync without spending coins", () => {
    const original = applyPlacement(initialProfile(), "0");
    const dark = equipItem(original, "deep");
    expect(dark.appearance.skinTone).toBe("#89583f");
    expect(dark.equipped.skin).toBe("deep");
    const light = changeAppearance(dark, "skinTone", "#F4CFB0");
    expect(light.appearance.skinTone).toBe("#f4cfb0");
    expect(light.equipped.skin).toBe("light");
    const bronze = changeAppearance(light, "skinTone", "#b57b55");
    expect(bronze.appearance.skinTone).toBe("#b57b55");
    expect(bronze.equipped.skin).toBeUndefined();
    expect(unequipItem(dark, "skin").appearance.skinTone).toBe("#e9b68e");
    expect(unequipItem(dark, "skin").equipped.skin).toBeUndefined();
    const withoutOwnedSwatch = {
      ...original,
      owned: original.owned.filter((id) => id !== "deep"),
    };
    const acquired = buyItem(withoutOwnedSwatch, "deep", 0);
    expect(acquired.appearance.skinTone).toBe("#89583f");
    expect(acquired.equipped.skin).toBe("deep");
    for (const result of [dark, light, bronze, acquired])
      expect(result.coins).toBe(original.coins);
    const canonical = readProfile({
      ...dark,
      appearance: { ...dark.appearance, skinTone: "#c88b66" },
    });
    expect(canonical.equipped.skin).toBe("olive");
    expect(canonical.appearance.skinTone).toBe("#c88b66");
  });

  it("keeps the chosen shirt color through persistence, rewards and outfit changes", () => {
    const entries = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string): string | null => entries.get(key) ?? null,
      setItem: (key: string, value: string): void => {
        entries.set(key, value);
      },
    });
    const color = SHIRT_COLORS.find((entry) => entry.id === "seal")!.color;
    const original = {
      ...applyPlacement(initialProfile(), "0"),
      name: "Mei",
      shirtColor: color,
      completed: true,
    };
    expect(saveProfile(original)).toBe(true);
    const restored = loadProfile();
    expect(restored).toMatchObject({
      name: "Mei",
      shirtColor: color,
      completed: true,
      coins: 80,
    });
    const practiced = syncProfile(restored, 35);
    const bought = buyItem(practiced, "linen", 35);
    const wearingStarter = equipItem(bought, "everyday");
    expect(wearingStarter).toMatchObject({
      shirtColor: color,
      coins: 55,
      accountedXP: 35,
      equipped: { outfit: "everyday" },
    });
    expect(saveProfile(wearingStarter)).toBe(true);
    expect(loadProfile().shirtColor).toBe(color);
    expect(syncProfile(loadProfile(), 35).coins).toBe(55);
  });

  it("persists a new shop purchase without duplicating coins or changing an existing wardrobe and custom body", () => {
    const entries = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string): string | null => entries.get(key) ?? null,
      setItem: (key: string, value: string): void => {
        entries.set(key, value);
      },
    });
    const starter = applyPlacement(initialProfile(), "0");
    const original = readProfile({
      ...starter,
      name: "Mei",
      shirtColor: SHIRT_COLORS.find((entry) => entry.id === "seal")!.color,
      appearance: {
        ...starter.appearance,
        body: "slender",
        height: "tall",
        hair: "flowing",
      },
      owned: [...starter.owned, "linen", "hat"],
      equipped: { ...starter.equipped, outfit: "linen", head: "hat" },
      completed: true,
    });
    expect(buyItem(original, "cloud-tee", 0)).toBe(original);
    const bought = buyItem(original, "cloud-tee", 25);
    expect(bought.coins).toBe(original.coins - 45);
    expect(bought.owned).toEqual([...original.owned, "cloud-tee"]);
    expect(bought.equipped).toEqual({
      ...original.equipped,
      outfit: "cloud-tee",
    });
    expect(bought.appearance).toEqual(original.appearance);
    expect(bought.shirtColor).toBe(original.shirtColor);
    expect(buyItem(bought, "night-brocade", 25)).toBe(bought);
    expect(saveProfile(bought)).toBe(true);
    const restored = loadProfile();
    expect(restored).toEqual(bought);
    expect(buyItem(restored, "cloud-tee", 25)).toBe(restored);
    expect(restored.owned.filter((id) => id === "cloud-tee")).toHaveLength(1);
    const returned = equipItem(equipItem(restored, "linen"), "cloud-tee");
    expect(returned.coins).toBe(bought.coins);
    expect(returned.appearance).toEqual(original.appearance);
    expect(saveProfile(returned)).toBe(true);
    expect(loadProfile().equipped.outfit).toBe("cloud-tee");
    expect(loadProfile().owned).toEqual(bought.owned);
  });

  it("accepts palette colors while rejecting invalid or injected shirt colors", () => {
    for (const entry of SHIRT_COLORS) {
      expect(readProfile({ shirtColor: entry.color }).shirtColor).toBe(
        entry.color,
      );
      expect(
        readProfile({ shirtColor: entry.color.toUpperCase() }).shirtColor,
      ).toBe(entry.color);
    }
    for (const value of [
      null,
      4,
      {},
      [],
      "#fff",
      "#123456",
      "red;fill:url(https://example.com)",
    ])
      expect(readProfile({ shirtColor: value }).shirtColor).toBe(
        DEFAULT_SHIRT_COLOR,
      );
    expect(readProfile({}).shirtColor).toBe(DEFAULT_SHIRT_COLOR);
  });

  it("validates corrupt identity, coins, equipped slots and placement data", () => {
    const profile = readProfile(
      {
        name: "a".repeat(100),
        base: "oops",
        coins: -2,
        accountedXP: Infinity,
        nationality: "<script>",
        age: 250,
        gender: "other",
        owned: {},
        equipped: { head: "crown" },
        placement: { band: "oops", level: 90, awarded: true },
        achievements: ["placement-4", "javascript", "placement-4"],
      },
      15,
    );
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
    const placed = readProfile({
      placement: { band: "4", level: 9999, awarded: true },
    });
    expect(placed.placement?.level).toBe(28);
  });

  it("grants placement once and keeps its baseline out of practice coin minting", () => {
    const placed = applyPlacement(initialProfile(), "5");
    expect(placed.placement?.level).toBe(40);
    expect(profileLevel(placed, 0)).toBe(40);
    expect(placed.coins).toBe(1080);
    expect(placed.owned).toEqual(
      expect.arrayContaining(["hanfu", "gold", "plum"]),
    );
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
    const hat = equipItem(
      { ...bought, owned: [...bought.owned, "hat"] },
      "hat",
    );
    expect(unequipItem(hat, "head").equipped.head).toBeUndefined();
    expect(bought.coins).toBeGreaterThanOrEqual(0);
  });

  it("provides all cosmetic categories and localized product names", () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(35);
    expect(new Set(ITEMS.map((item) => item.id)).size).toBe(ITEMS.length);
    expect(new Set(ITEMS.map((item) => item.slot)).size).toBe(8);
    for (const item of ITEMS)
      for (const locale of LOCALES)
        expect(itemName(item, locale).length).toBeGreaterThan(0);
  });
});

describe("indicative reading placement", () => {
  it("requires continuous success and cannot jump levels from isolated hard answers", () => {
    expect(assessPlacement([])).toMatchObject({
      band: "0",
      level: 0,
      correct: 0,
      total: 21,
    });
    const hardOnly = PLACEMENT_QUESTIONS.filter((q) => q.band === "7-9").map(
      (q) => ({ id: q.id, choice: q.answer }),
    );
    expect(assessPlacement(hardOnly).band).toBe("0");
    const all = PLACEMENT_QUESTIONS.map((q) => ({
      id: q.id,
      choice: q.answer,
    }));
    expect(assessPlacement(all)).toEqual({
      band: "7-9",
      level: 70,
      correct: 21,
      total: 21,
    });
    const firstFour = PLACEMENT_QUESTIONS.filter((q) =>
      ["1", "2", "3", "4"].includes(q.band),
    ).map((q) => ({ id: q.id, choice: q.answer }));
    expect(assessPlacement(firstFour)).toMatchObject({
      band: "4",
      level: 28,
      correct: 12,
    });
  });

  it("ignores unknown answers and cannot improve a score by repeating a question", () => {
    const first = PLACEMENT_QUESTIONS[0]!;
    const answers = [
      { id: first.id, choice: -1 },
      { id: first.id, choice: first.answer },
      { id: "unknown", choice: 0 },
    ];
    expect(assessPlacement(answers).correct).toBe(0);
    expect(
      assessPlacement([
        { id: first.id, choice: first.answer },
        { id: first.id, choice: first.answer },
      ]).correct,
    ).toBe(1);
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
