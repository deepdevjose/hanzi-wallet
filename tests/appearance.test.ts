import { describe, expect, it } from "vitest";
import { LOCALES } from "../src/i18n";
import {
  APPEARANCE_OPTIONS,
  defaultAppearance,
  isAppearanceValue,
  readAppearance,
  type AppearanceField,
} from "../src/core/appearance";

describe("character appearance schema", () => {
  it("uses distinguishable base defaults and fills partial imported creators safely", () => {
    const male = defaultAppearance("male"),
      female = defaultAppearance("female");
    expect(male).toMatchObject({
      face: "defined",
      brows: "bold",
      nose: "button",
      mouth: "wide",
      hair: "tousled",
      body: "balanced",
    });
    expect(female).toMatchObject({
      face: "oval",
      brows: "arched",
      nose: "soft",
      mouth: "gentle",
      hair: "buns",
      body: "soft",
    });
    expect(
      readAppearance({ hair: "bob", eyeColor: "#667C8B" }, "female", "#89583f"),
    ).toEqual({
      ...female,
      hair: "bob",
      eyeColor: "#667c8b",
      skinTone: "#89583f",
    });
    expect(
      readAppearance({ skinTone: "#c88b66" }, "female", "#89583f").skinTone,
    ).toBe("#c88b66");
  });

  it("rejects malformed shapes and unsafe or unknown values without importing extra fields", () => {
    const defaults = defaultAppearance("male");
    for (const invalid of [null, [], "text", 42])
      expect(readAppearance(invalid, "male")).toEqual(defaults);
    const corrupt = Object.fromEntries(
      (Object.keys(APPEARANCE_OPTIONS) as AppearanceField[]).map((key) => [
        key,
        "url(javascript:alert(1))",
      ]),
    );
    expect(
      readAppearance({ ...corrupt, coins: 900, prototype: "bad" }, "male"),
    ).toEqual(defaults);
    expect(isAppearanceValue("not-a-field" as AppearanceField, "soft")).toBe(
      false,
    );
    expect(
      readAppearance({ hair: { id: "bob" }, eyes: null, body: [] }, "female"),
    ).toEqual(defaultAppearance("female"));
  });

  it("provides all creator choices and translated labels from one validated catalog", () => {
    expect(Object.keys(APPEARANCE_OPTIONS)).toHaveLength(12);
    expect(APPEARANCE_OPTIONS.hairColor).toHaveLength(6);
    expect(APPEARANCE_OPTIONS.eyeColor).toHaveLength(4);
    expect(APPEARANCE_OPTIONS.skinTone).toHaveLength(6);
    for (const key of Object.keys(APPEARANCE_OPTIONS) as AppearanceField[]) {
      const entries = APPEARANCE_OPTIONS[key];
      expect(new Set(entries.map((entry) => entry.id)).size).toBe(
        entries.length,
      );
      for (const entry of entries) {
        expect(isAppearanceValue(key, entry.id)).toBe(true);
        for (const locale of LOCALES)
          expect(entry.label[locale].trim().length).toBeGreaterThan(0);
      }
    }
  });
});
