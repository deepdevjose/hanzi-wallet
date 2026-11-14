import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  inspectCourseLesson,
  gradeCourseExercise,
  type CourseLesson,
  type CourseExercise,
} from "../src/core/course";
import { INTRODUCING_YOURSELF as lesson } from "../src/course/introducing-yourself";
const templates = JSON.parse(
  readFileSync(
    new URL("../public/data/templates.json", import.meta.url),
    "utf8",
  ),
) as { char: string }[];
const characters = new Set(templates.map((entry) => entry.char));
const issues = (candidate: CourseLesson) =>
  inspectCourseLesson(candidate, characters);
const errors = (candidate: CourseLesson) =>
  issues(candidate).filter((issue) => issue.severity === "error");
const replace = (exercise: CourseExercise): CourseLesson => ({
  ...lesson,
  exercises: lesson.exercises.map((item) =>
    item.id === exercise.id ? exercise : item,
  ),
});
const choice = lesson.exercises[0]!;
const order = lesson.exercises[2]!;
if (choice.type !== "choice" || order.type !== "order")
  throw new Error("Invalid test fixture");

describe("course authoring and skill-specific grading", () => {
  it("keeps the editorial fixture valid but blocked by missing review and audio", () => {
    expect(errors(lesson)).toEqual([]);
    expect(
      issues(lesson)
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
  it("rejects dangling content, duplicate IDs and untranslated content", () => {
    expect(
      errors({ ...lesson, words: [...lesson.words, lesson.words[0]!] }).some(
        (issue) => issue.message === "Duplicate content ID",
      ),
    ).toBe(true);
    expect(
      errors({ ...lesson, utterances: [] }).some(
        (issue) => issue.message === "Unknown audio utterance",
      ),
    ).toBe(true);
    expect(
      errors({ ...lesson, title: { ...lesson.title, fr: "" } }).some(
        (issue) => issue.path === "title.fr",
      ),
    ).toBe(true);
    expect(errors({ ...lesson, version: "current" })).not.toEqual([]);
  });
  it("requires listening audio to refer to the actual assessed utterance", () => {
    expect(
      errors(replace({ ...choice, audioId: undefined })).some(
        (issue) => issue.message === "Listening requires audio",
      ),
    ).toBe(true);
    expect(
      errors(replace({ ...choice, audioId: "audio-lin" })).some(
        (issue) =>
          issue.message === "Listening target must match its audio utterance",
      ),
    ).toBe(true);
    expect(
      errors(replace({ ...choice, answerId: "unknown" })).some(
        (issue) => issue.message === "Answer is not an option",
      ),
    ).toBe(true);
  });
  it("rejects indistinguishable choices in any supported language", () => {
    expect(
      errors(
        replace({
          ...choice,
          options: choice.options.map((option) => ({
            ...option,
            label: { ...option.label, pt: "igual" },
          })),
        }),
      ).some(
        (issue) => issue.message === "Choice labels must be distinguishable",
      ),
    ).toBe(true);
  });
  it("accepts interchanged tokens with the same visible text", () => {
    const repeated = {
      ...order,
      tokens: [
        { id: "first", text: "我" },
        { id: "second", text: "我" },
      ],
      answer: ["first", "second"],
    };
    expect(
      gradeCourseExercise(repeated, {
        type: "order",
        tokenIds: ["second", "first"],
      }).outcome,
    ).toBe("correct");
  });
  it("requires a complete one-to-one token answer matching the utterance", () => {
    expect(
      errors(replace({ ...order, answer: [...order.answer].reverse() })).some(
        (issue) =>
          issue.message === "Ordered tokens do not match the utterance",
      ),
    ).toBe(true);
    expect(
      errors(
        replace({ ...order, answer: [order.answer[0]!, order.answer[0]!] }),
      ).some((issue) => issue.message === "Answer must use every token once"),
    ).toBe(true);
  });
  it("does not accept remote or traversing course audio paths", () => {
    for (const path of [
      "https://example.com/voice.mp3",
      "audio/courses/../voice.mp3",
    ]) {
      expect(
        errors({ ...lesson, audio: [{ ...lesson.audio[0]!, path }] }).some(
          (issue) => issue.path.endsWith(".path"),
        ),
      ).toBe(true);
    }
  });
  it("rejects writing without a local character template", () => {
    expect(
      inspectCourseLesson(lesson, new Set()).some(
        (issue) => issue.message === "Writing character has no local template",
      ),
    ).toBe(true);
  });
  it("grades listening without asserting reading or pronunciation mastery", () => {
    expect(
      gradeCourseExercise(choice, { type: "choice", optionId: "name-li" }),
    ).toEqual({
      exerciseId: "listen-name",
      skill: "listening",
      outcome: "correct",
      target: { kind: "utterance", id: "line-li" },
    });
    expect(
      gradeCourseExercise(choice, { type: "choice", optionId: "name-lin" })
        .outcome,
    ).toBe("incorrect");
    expect(
      gradeCourseExercise(choice, { type: "choice", optionId: "forged" })
        .outcome,
    ).toBe("unusable");
  });
  it("grades order while rejecting duplicated or missing tokens", () => {
    expect(
      gradeCourseExercise(order, { type: "order", tokenIds: order.answer })
        .outcome,
    ).toBe("correct");
    expect(
      gradeCourseExercise(order, {
        type: "order",
        tokenIds: [...order.answer].reverse(),
      }).outcome,
    ).toBe("incorrect");
    expect(
      gradeCourseExercise(order, {
        type: "order",
        tokenIds: [order.answer[0]!, order.answer[0]!],
      }).outcome,
    ).toBe("unusable");
  });
  it("leaves writing unassessed until integrated with real stroke assessment", () => {
    expect(
      gradeCourseExercise(lesson.exercises[3]!, {
        type: "choice",
        optionId: "correct",
      }),
    ).toMatchObject({ skill: "writing", outcome: "unassessed" });
  });
  it("does not mutate lesson content when validating or grading repeated attempts", () => {
    const before = JSON.stringify(lesson);
    issues(lesson);
    gradeCourseExercise(choice, { type: "choice", optionId: "name-li" });
    gradeCourseExercise(choice, { type: "choice", optionId: "name-li" });
    expect(JSON.stringify(lesson)).toBe(before);
  });
});
