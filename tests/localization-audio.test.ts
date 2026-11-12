import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import postcss from "postcss";
import { ASSET_REVISION, assetURL } from "../src/assets";
import messages from "../src/locales/messages.json";
import {
  LOCALES,
  getLocale,
  isLocale,
  setLocale,
  t,
  meaning,
  dayLabel,
  strokeLabel,
} from "../src/i18n";
import { pinyinKey, selectMandarinVoice } from "../src/pronunciation";
import type { AudioIndex } from "../src/pronunciation";
import { emptyState, parseState } from "../src/core/storage";
import type { VocabularyEntry } from "../src/core/types";
const read = (file: string): Buffer =>
  readFileSync(new URL(file, import.meta.url));
const vocabulary = JSON.parse(
  read("../public/data/vocabulary.json").toString(),
) as VocabularyEntry[];
const valid = new Set(vocabulary.map((e) => e.char));
afterEach(() => setLocale("es"));
describe("Five complete languages", () => {
  it("includes all UI messages and keeps placeholders consistent", () => {
    const tokens = (s: string): string =>
      [...s.matchAll(/\{(\w+)\}/g)]
        .map((m) => m[1])
        .sort()
        .join(",");
    for (const [key, translations] of Object.entries(messages))
      for (const locale of LOCALES) {
        expect(translations[locale], `${key}:${locale}`).toBeTruthy();
        expect(tokens(translations[locale]), `${key}:${locale}`).toBe(
          tokens(key),
        );
      }
  });
  it("translates meanings for every character with no missing locale", () => {
    expect(vocabulary).toHaveLength(500);
    for (const entry of vocabulary)
      for (const locale of LOCALES) {
        setLocale(locale);
        expect(
          entry.meanings?.[locale],
          `${entry.char}:${locale}`,
        ).toBeTruthy();
        expect(meaning(entry)).toBe(entry.meanings?.[locale]);
      }
  });
  it("formats dynamic text, days and stroke counts in the chosen locale", () => {
    setLocale("en");
    expect(t("Explorar los {count}", { count: 500 })).toBe("Explore all 500");
    expect(dayLabel(1)).toBe("1 day");
    expect(dayLabel(2)).toBe("2 days");
    setLocale("zh-CN");
    expect(strokeLabel(8)).toBe("8 笔");
    expect(getLocale()).toBe("zh-CN");
  });
  it("persists supported languages and migrates old backups to Spanish", () => {
    const original = emptyState();
    expect(
      parseState(
        { ...original, preferences: { ...original.preferences, locale: "fr" } },
        valid,
      ).preferences.locale,
    ).toBe("fr");
    expect(
      parseState({ wallet: {}, preferences: { locale: "xx" } }, valid)
        .preferences.locale,
    ).toBe("es");
    expect(isLocale("zh-CN")).toBe(true);
    expect(isLocale("ja")).toBe(false);
  });
});
describe("Bundled browser pronunciation", () => {
  it("normalizes tones, umlauts, neutral syllables and decomposed Unicode", () => {
    for (const [input, output] of [
      ["nǐ", "ni3"],
      ["lǜ", "lv4"],
      ["nǚ", "nv3"],
      ["me", "me5"],
      ["zhe", "zhe5"],
      ["lu:4", "lv4"],
      ["nǐ".normalize("NFD"), "ni3"],
      ["ma0", "ma5"],
    ])
      expect(pinyinKey(input!)).toBe(output);
    expect(() => pinyinKey("")).toThrow();
    expect(() => pinyinKey("ni hao")).toThrow();
  });
  it("prefers a local Mandarin voice and excludes Cantonese-only voices", () => {
    const voice = (
      lang: string,
      localService = false,
    ): SpeechSynthesisVoice => ({
      lang,
      localService,
      name: lang,
      voiceURI: lang,
      default: false,
    });
    expect(
      selectMandarinVoice([
        voice("zh-HK"),
        voice("zh_CN"),
        voice("cmn-CN", true),
      ])?.lang,
    ).toBe("cmn-CN");
    expect(
      selectMandarinVoice([voice("zh-HK"), voice("en-US")]),
    ).toBeUndefined();
  });
  it("provides independent MP3 data for every supported reading, including neutral tones", () => {
    const index = JSON.parse(
        read("../public/audio/index.json").toString(),
      ) as AudioIndex,
      pack = read("../public/audio/pronunciation.bin");
    expect(createHash("sha256").update(pack).digest("hex")).toBe(index.sha256);
    for (const entry of vocabulary) {
      const clip = index.clips[pinyinKey(entry.pinyin)];
      expect(clip, entry.char).toBeDefined();
      expect(clip!.offset + clip!.length).toBeLessThanOrEqual(pack.length);
      expect(clip!.length).toBeGreaterThan(1000);
      const first = pack.subarray(clip!.offset, clip!.offset + 3).toString();
      expect(first, entry.char).toBe("ID3");
    }
  });
});
describe("Palette-only CSS changes", () => {
  it("retains the original layout, sizing, spacing and interaction declarations", () => {
    const original = read("../tests/fixtures/v1-layout.json").toString(),
      css = postcss.parse(read("../src/style.css").toString());
    const entries: { selector: string; prop: string; value: string }[] = [];
    const colour =
      /^(?:--|color$|background|border(?:$|-color|-top-color|-right-color|-bottom-color|-left-color)|box-shadow$|text-shadow$|outline$|fill$|stroke$|accent-color$)/;
    css.walkDecls((d) => {
      if (!colour.test(d.prop))
        entries.push({
          selector:
            (d.parent as unknown as { selector?: string }).selector ?? "",
          prop: d.prop,
          value: d.value,
        });
    });
    expect(entries).toEqual(JSON.parse(original));
  });
});

describe("Version-coherent offline data", () => {
  it("uses the package version in data URLs and retains the repository subpath", () => {
    const version = (
      JSON.parse(read("../package.json").toString()) as { version: string }
    ).version;
    expect(ASSET_REVISION).toBe(version);
    expect(
      assetURL(
        "audio/index.json",
        new URL("https://example.test/hanzi-wallet/"),
      ).href,
    ).toBe(`https://example.test/hanzi-wallet/audio/index.json?v=${version}`);
  });
});
