import { describe, expect, it } from "vitest";
import common from "./common-3500.json";
import hsk from "./hsk-all.json";
import { ITEMS, MAX_LEVEL } from "./core/profile";

describe("official common-character catalogue", () => {
  it("contains exactly 3500 unique single-codepoint characters", () => {
    expect(common).toHaveLength(3500);
    expect(new Set(common).size).toBe(3500);
    for (const char of common) expect([...char]).toHaveLength(1);
  });
  it("assigns HSK levels only to included characters", () => {
    const list = new Set<string>(common);
    for (const [char, level] of Object.entries(hsk)) {
      expect(list.has(char)).toBe(true);
      expect([
        "HSK1",
        "HSK2",
        "HSK3",
        "HSK4",
        "HSK5",
        "HSK6",
        "HSK7-9",
      ]).toContain(level);
    }
    expect(Object.keys(hsk).length).toBeGreaterThan(2500);
  });
  it("has distinct shop IDs, nonnegative prices and attainable prerequisites", () => {
    expect(new Set(ITEMS.map((item) => item.id)).size).toBe(ITEMS.length);
    for (const item of ITEMS) {
      expect(item.level).toBeGreaterThanOrEqual(0);
      expect(item.level).toBeLessThanOrEqual(MAX_LEVEL);
      expect(Number.isSafeInteger(item.price)).toBe(true);
      expect(item.price).toBeGreaterThanOrEqual(0);
    }
  });
});
