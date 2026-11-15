import { describe, expect, it } from "vitest";
import { INTRODUCING_YOURSELF as lesson } from "../src/course/introducing-yourself";
import { inspectCourseLesson } from "../src/core/course";
import {
  COURSE_CONTENT_LIMITS,
  CourseContentError,
  parseCourseLesson,
} from "../src/core/course-import";

const characters = new Set(["我"]);
const parse = (input: unknown) => parseCourseLesson(input, characters);

describe("bounded course snapshot decoding", () => {
  it("round-trips a draft without promoting its review or sharing mutable input", () => {
    const decoded = parse(JSON.parse(JSON.stringify(lesson)) as unknown);
    expect(decoded).toEqual(lesson);
    expect(decoded).not.toBe(lesson);
    expect(decoded.words[0]).not.toBe(lesson.words[0]);
    expect(decoded.status).toBe("draft");
    expect(
      inspectCourseLesson(decoded, characters).filter(
        (issue) => issue.severity === "blocker",
      ),
    ).toHaveLength(5);
  });

  it("rejects malformed and unsupported schemas without echoing content", () => {
    for (const input of [
      null,
      [],
      "secret contents",
      1,
      {},
      { ...lesson, schemaVersion: 2 },
    ])
      expect(() => parse(input)).toThrow(CourseContentError);
    try {
      parse({ ...lesson, id: "secret contents" });
      expect.unreachable("invalid ID should fail");
    } catch (error) {
      expect(error).toMatchObject({ path: "lesson.id" });
      expect(String(error)).not.toContain("secret contents");
    }
  });

  it("strips unknown keys at every parsed layer without prototype pollution", () => {
    const extras: unknown = JSON.parse(
      '{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"unused":"ignore"}',
    );
    const candidate = {
      ...lesson,
      ...(typeof extras === "object" && extras !== null ? extras : {}),
      words: lesson.words.map((word) => ({
        ...word,
        unused: "ignore",
        meaning: { ...word.meaning, unused: "ignore" },
      })),
    };
    const decoded = parse(candidate);
    expect(decoded).toEqual(lesson);
    expect(Object.getPrototypeOf(decoded)).toBe(Object.prototype);
    expect(Object.hasOwn(decoded, "__proto__")).toBe(false);
    expect(Object.hasOwn(decoded, "constructor")).toBe(false);
    expect(Object.hasOwn(Object.prototype, "polluted")).toBe(false);
  });

  it("does not trust inherited properties or evaluate a getter", () => {
    expect(() => parse(Object.create(lesson) as unknown)).toThrow(
      CourseContentError,
    );
    const candidate = { ...lesson };
    let calls = 0;
    Object.defineProperty(candidate, "title", {
      get: () => {
        calls += 1;
        return lesson.title;
      },
    });
    expect(() => parse(candidate)).toThrow("lesson.title");
    expect(calls).toBe(0);
    expect(parse(Object.assign(Object.create(null) as object, lesson))).toEqual(
      lesson,
    );
  });

  it("requires all localized text and finite bounded scalar metadata", () => {
    for (const title of [
      { ...lesson.title, en: " " },
      { ...lesson.title, fr: null },
      { ...lesson.title, es: "x".repeat(COURSE_CONTENT_LIMITS.text + 1) },
    ])
      expect(() => parse({ ...lesson, title })).toThrow(CourseContentError);
    for (const version of [
      "latest",
      "1.0",
      "1.0.0-beta",
      "1".repeat(40) + ".0.0",
      1,
    ])
      expect(() => parse({ ...lesson, version })).toThrow("lesson.version");
    expect(() => parse({ ...lesson, status: "unknown" })).toThrow(
      "lesson.status",
    );
    expect(() => parse({ ...lesson, linguisticReview: true })).toThrow(
      "lesson.linguisticReview",
    );
  });

  it("limits every mission collection and rejects sparse arrays", () => {
    for (const key of ["words", "utterances", "audio", "exercises"] as const)
      expect(() =>
        parse({
          ...lesson,
          [key]: Array(COURSE_CONTENT_LIMITS[key] + 1).fill(lesson[key][0]),
        }),
      ).toThrow(`lesson.${key}`);
    expect(() => parse({ ...lesson, words: Array(1) })).toThrow(
      "lesson.words.0",
    );
  });

  it("validates each discriminated exercise and reference after decoding", () => {
    const choice = lesson.exercises[0]!;
    const order = lesson.exercises[2]!;
    const writing = lesson.exercises[3]!;
    const replace = (exercise: unknown) => ({
      ...lesson,
      exercises: [exercise],
    });
    for (const exercise of [
      { ...choice, type: "script", execute: "anything" },
      { ...choice, skill: "pronunciation" },
      { ...choice, target: { kind: "word", id: "missing" } },
      { ...choice, target: { kind: "other", id: "word-wo" } },
      { ...choice, answerId: "missing" },
      { ...order, skill: "listening" },
      { ...order, tokens: [] },
      { ...writing, character: "你" },
      { ...writing, skill: "reading" },
    ])
      expect(() => parse(replace(exercise))).toThrow(CourseContentError);
  });

  it("rejects duplicate identities, dangling words, and inconsistent token answers", () => {
    expect(() =>
      parse({ ...lesson, words: [...lesson.words, lesson.words[0]!] }),
    ).toThrow(CourseContentError);
    expect(() => parse({ ...lesson, words: [] })).toThrow(CourseContentError);
    const order = lesson.exercises[2]!;
    if (order.type !== "order") throw new Error("Invalid fixture");
    expect(() =>
      parse({
        ...lesson,
        exercises: [{ ...order, answer: [...order.answer].reverse() }],
      }),
    ).toThrow(CourseContentError);
    expect(() =>
      parse({
        ...lesson,
        exercises: [
          {
            ...order,
            tokens: Array(COURSE_CONTENT_LIMITS.tokens + 1).fill(
              order.tokens[0],
            ),
          },
        ],
      }),
    ).toThrow(CourseContentError);
  });

  it("validates optional audio metadata even for pending resources", () => {
    const invalidAudio = (metadata: object) => ({
      ...lesson,
      audio: lesson.audio.map((asset, index) =>
        index === 0 ? { ...asset, ...metadata } : asset,
      ),
    });
    for (const durationMs of [NaN, Infinity, -1, 0, "100", 600_001])
      expect(() => parse(invalidAudio({ durationMs }))).toThrow(
        CourseContentError,
      );
    for (const metadata of [
      { sha256: "bad" },
      { reviewer: false },
      { license: "" },
      { review: "maybe" },
      { path: "https://example.com/audio.mp3" },
      { path: "audio/courses/../audio.mp3" },
    ])
      expect(() => parse(invalidAudio(metadata))).toThrow(CourseContentError);
    expect(
      parse(
        invalidAudio({
          durationMs: 1234.5,
          path: "audio/courses/introduction/l1.mp3",
        }),
      ).audio[0],
    ).toMatchObject({ durationMs: 1234.5 });
  });
});
