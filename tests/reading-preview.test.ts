import { afterEach, describe, expect, it } from "vitest";
import { inspectCourseLesson, gradeCourseExercise } from "../src/core/course";
import { INTRODUCING_YOURSELF } from "../src/course/introducing-yourself";
import { READING_PREVIEW } from "../src/course/reading-preview";
import { courseText } from "../src/course/text";
import { getLocale, LOCALES, setLocale } from "../src/i18n";

const initialLocale = getLocale();
afterEach(() => setLocale(initialLocale));

describe("editorial reading preview", () => {
  it("has a separate identity and remains blocked by editorial review and audio", () => {
    expect(READING_PREVIEW.id).not.toBe(INTRODUCING_YOURSELF.id);
    expect(READING_PREVIEW.version).toBe("0.1.0");
    const issues = inspectCourseLesson(READING_PREVIEW, new Set());
    expect(issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(
      issues
        .filter((issue) => issue.severity === "blocker")
        .map((issue) => issue.path),
    ).toEqual([
      "status",
      "linguisticReview",
      "audio.audio-lin",
      "audio.audio-li",
      "audio.audio-question",
    ]);
  });

  it("records only reading and never grades pending audio as listening", () => {
    expect(READING_PREVIEW.exercises.map((exercise) => exercise.id)).toEqual([
      "read-name",
      "read-jiao",
      "order-question",
    ]);
    expect(
      READING_PREVIEW.exercises.every(
        (exercise) => exercise.skill === "reading",
      ),
    ).toBe(true);
    const first = READING_PREVIEW.exercises[0]!;
    expect(first).not.toHaveProperty("audioId");
    expect(
      gradeCourseExercise(first, { type: "choice", optionId: "name-li" }),
    ).toMatchObject({
      skill: "reading",
      outcome: "correct",
      exerciseId: "read-name",
    });
    for (const locale of LOCALES)
      expect(first.prompt[locale].trim().length).toBeGreaterThan(0);
  });

  it("keeps independent resource data and preserves the original fixture", () => {
    expect(READING_PREVIEW.words).toEqual(INTRODUCING_YOURSELF.words);
    expect(READING_PREVIEW.words).not.toBe(INTRODUCING_YOURSELF.words);
    expect(READING_PREVIEW.utterances).not.toBe(
      INTRODUCING_YOURSELF.utterances,
    );
    expect(READING_PREVIEW.audio).toEqual(INTRODUCING_YOURSELF.audio);
    expect(INTRODUCING_YOURSELF.exercises[0]).toMatchObject({
      id: "listen-name",
      skill: "listening",
      audioId: "audio-li",
    });
    expect(INTRODUCING_YOURSELF.exercises.at(-1)?.type).toBe("writing");
    const before = JSON.stringify(INTRODUCING_YOURSELF);
    gradeCourseExercise(READING_PREVIEW.exercises[0]!, {
      type: "choice",
      optionId: "name-lin",
    });
    expect(JSON.stringify(INTRODUCING_YOURSELF)).toBe(before);
  });

  it("provides localised feedback and stable parameter interpolation", () => {
    for (const locale of LOCALES) {
      setLocale(locale);
      for (const key of [
        "preview",
        "draftNote",
        "saveError",
        "summaryNote",
        "conflict",
        "reading",
      ] as const)
        expect(courseText(key).trim().length).toBeGreaterThan(0);
      expect(courseText("steps", { n: 2, count: 3 })).toContain("2");
      expect(courseText("steps", { n: 2, count: 3 })).toContain("3");
      expect(courseText("removeToken", { token: "名字" })).toContain("名字");
      expect(courseText("removeToken")).toContain("{token}");
    }
    setLocale("es");
    expect(courseText("reading")).toBe("Lectura");
    setLocale("en");
    expect(courseText("reading")).toBe("Reading");
  });
});
