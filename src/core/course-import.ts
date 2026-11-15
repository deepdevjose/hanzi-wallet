import { LOCALES } from "../i18n";
import {
  inspectCourseLesson,
  type CourseAudio,
  type CourseExercise,
  type CourseLesson,
  type CourseTarget,
  type CourseText,
  type CourseUtterance,
  type CourseWord,
} from "./course";

const ID = /^[a-z0-9][a-z0-9.-]{0,79}$/;
const VERSION = /^\d+\.\d+\.\d+$/;

/** Limits apply to a single small mission, independently of backup file size. */
export const COURSE_CONTENT_LIMITS = {
  words: 100,
  utterances: 80,
  audio: 80,
  exercises: 80,
  tokens: 80,
  text: 2000,
} as const;

export class CourseContentError extends Error {
  constructor(readonly path: string) {
    super(`Invalid course content at ${path}`);
    this.name = "CourseContentError";
  }
}

const fail = (path: string): never => {
  throw new CourseContentError(path);
};
const object = (input: unknown, path: string): Record<string, unknown> => {
  if (typeof input !== "object" || input === null || Array.isArray(input))
    return fail(path);
  const prototype: unknown = Object.getPrototypeOf(input);
  if (prototype !== null && prototype !== Object.prototype) return fail(path);
  return input as Record<string, unknown>;
};
// Read only own data properties. JSON has these; inherited values and getters
// must not become trusted content simply because the parser accepts unknown.
const field = (
  input: Record<string, unknown>,
  key: string,
  path: string,
): unknown => {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  if (!descriptor) return undefined;
  if (!("value" in descriptor)) return fail(`${path}.${key}`);
  return descriptor.value as unknown;
};
const string = (input: unknown, path: string, max = 2000): string => {
  if (typeof input !== "string" || !input.trim() || input.length > max)
    return fail(path);
  return input;
};
const id = (input: unknown, path: string): string => {
  const value = string(input, path, 80);
  return ID.test(value) ? value : fail(path);
};
const literal = <T extends string>(
  input: unknown,
  options: readonly T[],
  path: string,
): T => {
  for (const option of options) if (input === option) return option;
  return fail(path);
};
const list = <T>(
  input: unknown,
  path: string,
  max: number,
  parse: (item: unknown, itemPath: string) => T,
): T[] => {
  if (!Array.isArray(input) || input.length > max) return fail(path);
  // Array.from visits holes too, so sparse arrays cannot bypass validation.
  return Array.from(input, (item: unknown, index) =>
    parse(item, `${path}.${index}`),
  );
};
const localized = (input: unknown, path: string): CourseText => {
  const value = object(input, path);
  const text = (locale: (typeof LOCALES)[number]): string =>
    string(field(value, locale, path), `${path}.${locale}`);
  return {
    es: text("es"),
    en: text("en"),
    "zh-CN": text("zh-CN"),
    fr: text("fr"),
    pt: text("pt"),
  };
};
const target = (input: unknown, path: string): CourseTarget => {
  const value = object(input, path);
  const kind = literal(
    field(value, "kind", path),
    ["word", "utterance", "character"],
    `${path}.kind`,
  );
  const identifier = field(value, "id", path);
  return kind === "character"
    ? { kind, id: string(identifier, `${path}.id`, 8) }
    : { kind, id: id(identifier, `${path}.id`) };
};
const word = (input: unknown, path: string): CourseWord => {
  const value = object(input, path);
  return {
    id: id(field(value, "id", path), `${path}.id`),
    hanzi: string(field(value, "hanzi", path), `${path}.hanzi`, 100),
    pinyin: string(field(value, "pinyin", path), `${path}.pinyin`, 500),
    meaning: localized(field(value, "meaning", path), `${path}.meaning`),
  };
};
const utterance = (input: unknown, path: string): CourseUtterance => {
  const value = object(input, path);
  return {
    id: id(field(value, "id", path), `${path}.id`),
    speaker: string(field(value, "speaker", path), `${path}.speaker`, 120),
    hanzi: string(field(value, "hanzi", path), `${path}.hanzi`, 1000),
    pinyin: string(field(value, "pinyin", path), `${path}.pinyin`),
    translation: localized(
      field(value, "translation", path),
      `${path}.translation`,
    ),
    wordIds: list(
      field(value, "wordIds", path),
      `${path}.wordIds`,
      COURSE_CONTENT_LIMITS.words,
      id,
    ),
  };
};
const audio = (input: unknown, path: string): CourseAudio => {
  const value = object(input, path);
  const optionalText = (key: string, max: number): string | undefined => {
    const item = field(value, key, path);
    return item === undefined ? undefined : string(item, `${path}.${key}`, max);
  };
  const resourcePath = optionalText("path", 240);
  const sha256 = optionalText("sha256", 64);
  if (sha256 && !/^[a-f0-9]{64}$/.test(sha256)) fail(`${path}.sha256`);
  const durationMs = field(value, "durationMs", path);
  if (
    durationMs !== undefined &&
    (typeof durationMs !== "number" ||
      !Number.isFinite(durationMs) ||
      durationMs <= 0 ||
      durationMs > 600_000)
  )
    fail(`${path}.durationMs`);
  const license = optionalText("license", 500);
  const reviewer = optionalText("reviewer", 120);
  return {
    id: id(field(value, "id", path), `${path}.id`),
    utteranceId: id(field(value, "utteranceId", path), `${path}.utteranceId`),
    review: literal(
      field(value, "review", path),
      ["pending", "approved"],
      `${path}.review`,
    ),
    ...(resourcePath === undefined ? {} : { path: resourcePath }),
    ...(sha256 === undefined ? {} : { sha256 }),
    ...(typeof durationMs === "number" ? { durationMs } : {}),
    ...(license === undefined ? {} : { license }),
    ...(reviewer === undefined ? {} : { reviewer }),
  };
};
const exercise = (input: unknown, path: string): CourseExercise => {
  const value = object(input, path);
  const base = {
    id: id(field(value, "id", path), `${path}.id`),
    prompt: localized(field(value, "prompt", path), `${path}.prompt`),
    explanation: localized(
      field(value, "explanation", path),
      `${path}.explanation`,
    ),
  };
  const type = literal(
    field(value, "type", path),
    ["choice", "order", "writing"],
    `${path}.type`,
  );
  const skill = field(value, "skill", path);
  if (type === "choice") {
    const audioId = field(value, "audioId", path);
    return {
      ...base,
      type,
      skill: literal(skill, ["reading", "listening"], `${path}.skill`),
      target: target(field(value, "target", path), `${path}.target`),
      ...(audioId === undefined
        ? {}
        : { audioId: id(audioId, `${path}.audioId`) }),
      options: list(
        field(value, "options", path),
        `${path}.options`,
        6,
        (item, optionPath) => {
          const option = object(item, optionPath);
          return {
            id: id(field(option, "id", optionPath), `${optionPath}.id`),
            label: localized(
              field(option, "label", optionPath),
              `${optionPath}.label`,
            ),
          };
        },
      ),
      answerId: id(field(value, "answerId", path), `${path}.answerId`),
    };
  }
  if (type === "order")
    return {
      ...base,
      type,
      skill: literal(skill, ["reading"], `${path}.skill`),
      utteranceId: id(field(value, "utteranceId", path), `${path}.utteranceId`),
      tokens: list(
        field(value, "tokens", path),
        `${path}.tokens`,
        COURSE_CONTENT_LIMITS.tokens,
        (item, tokenPath) => {
          const token = object(item, tokenPath);
          return {
            id: id(field(token, "id", tokenPath), `${tokenPath}.id`),
            text: string(
              field(token, "text", tokenPath),
              `${tokenPath}.text`,
              100,
            ),
          };
        },
      ),
      answer: list(
        field(value, "answer", path),
        `${path}.answer`,
        COURSE_CONTENT_LIMITS.tokens,
        id,
      ),
    };
  return {
    ...base,
    type,
    skill: literal(skill, ["writing"], `${path}.skill`),
    character: string(field(value, "character", path), `${path}.character`, 8),
  };
};

/** Decode a bounded content snapshot; editorial blockers remain blockers. */
export function parseCourseLesson(
  input: unknown,
  characters: ReadonlySet<string>,
): CourseLesson {
  const path = "lesson";
  const value = object(input, path);
  if (field(value, "schemaVersion", path) !== 1) fail(`${path}.schemaVersion`);
  const version = string(field(value, "version", path), `${path}.version`, 32);
  if (!VERSION.test(version)) fail(`${path}.version`);
  const reviewerInput = field(value, "reviewer", path);
  const lesson: CourseLesson = {
    schemaVersion: 1,
    id: id(field(value, "id", path), `${path}.id`),
    version,
    status: literal(
      field(value, "status", path),
      ["draft", "published"],
      `${path}.status`,
    ),
    linguisticReview: literal(
      field(value, "linguisticReview", path),
      ["pending", "approved"],
      `${path}.linguisticReview`,
    ),
    ...(reviewerInput === undefined
      ? {}
      : { reviewer: string(reviewerInput, `${path}.reviewer`, 120) }),
    title: localized(field(value, "title", path), `${path}.title`),
    objective: localized(field(value, "objective", path), `${path}.objective`),
    words: list(
      field(value, "words", path),
      `${path}.words`,
      COURSE_CONTENT_LIMITS.words,
      word,
    ),
    utterances: list(
      field(value, "utterances", path),
      `${path}.utterances`,
      COURSE_CONTENT_LIMITS.utterances,
      utterance,
    ),
    audio: list(
      field(value, "audio", path),
      `${path}.audio`,
      COURSE_CONTENT_LIMITS.audio,
      audio,
    ),
    exercises: list(
      field(value, "exercises", path),
      `${path}.exercises`,
      COURSE_CONTENT_LIMITS.exercises,
      exercise,
    ),
  };
  const invalid = inspectCourseLesson(lesson, characters).find(
    (issue) => issue.severity === "error",
  );
  if (invalid) fail(`${path}.${invalid.path}`);
  return lesson;
}
