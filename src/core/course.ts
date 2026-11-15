import { LOCALES, type Locale } from "../i18n";

export type CourseText = Readonly<Record<Locale, string>>;
export type CourseSkill =
  | "reading"
  | "listening"
  | "writing"
  | "speaking"
  | "pronunciation";
export type CourseOutcome =
  | "correct"
  | "incorrect"
  | "partial"
  | "unassessed"
  | "unusable";
export type CourseTarget =
  | { readonly kind: "word"; readonly id: string }
  | { readonly kind: "utterance"; readonly id: string }
  | { readonly kind: "character"; readonly id: string };
export interface CourseWord {
  readonly id: string;
  readonly hanzi: string;
  readonly pinyin: string;
  readonly meaning: CourseText;
}
export interface CourseUtterance {
  readonly id: string;
  readonly speaker: string;
  readonly hanzi: string;
  readonly pinyin: string;
  readonly translation: CourseText;
  readonly wordIds: readonly string[];
}
export interface CourseAudio {
  readonly id: string;
  readonly utteranceId: string;
  readonly review: "pending" | "approved";
  readonly path?: string;
  readonly sha256?: string;
  readonly durationMs?: number;
  readonly license?: string;
  readonly reviewer?: string;
}
interface ExerciseBase {
  readonly id: string;
  readonly prompt: CourseText;
  readonly explanation: CourseText;
}
export type CourseExercise =
  | (ExerciseBase & {
      readonly type: "choice";
      readonly skill: "reading" | "listening";
      readonly target: CourseTarget;
      readonly audioId?: string;
      readonly options: readonly {
        readonly id: string;
        readonly label: CourseText;
      }[];
      readonly answerId: string;
    })
  | (ExerciseBase & {
      readonly type: "order";
      readonly skill: "reading";
      readonly utteranceId: string;
      readonly tokens: readonly {
        readonly id: string;
        readonly text: string;
      }[];
      readonly answer: readonly string[];
    })
  | (ExerciseBase & {
      readonly type: "writing";
      readonly skill: "writing";
      readonly character: string;
    });
export interface CourseLesson {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly version: string;
  readonly status: "draft" | "published";
  readonly linguisticReview: "pending" | "approved";
  readonly reviewer?: string;
  readonly title: CourseText;
  readonly objective: CourseText;
  readonly words: readonly CourseWord[];
  readonly utterances: readonly CourseUtterance[];
  readonly audio: readonly CourseAudio[];
  readonly exercises: readonly CourseExercise[];
}
/** Historical evidence is separate from avatar levels and current session state. */
export interface CourseEvidence {
  readonly id: string;
  readonly sessionId: string;
  readonly lessonId: string;
  readonly lessonVersion: string;
  readonly exerciseId: string;
  readonly target: CourseTarget;
  readonly skill: CourseSkill;
  readonly outcome: CourseOutcome;
  readonly origin: "placement" | "practice" | "delayed_review";
  readonly assessor:
    | "deterministic"
    | "self"
    | "asr"
    | "acoustic"
    | "human"
    | "ai";
  readonly rubricVersion: string;
  readonly attemptIndex: number;
  readonly hintsUsed: number;
  readonly supports: {
    readonly pinyin: boolean;
    readonly translation: boolean;
    readonly transcript: boolean;
  };
  readonly occurredAt: number;
}
export interface CourseIssue {
  readonly severity: "error" | "blocker";
  readonly path: string;
  readonly message: string;
}
const ID = /^[a-z0-9][a-z0-9.-]{0,79}$/;
const normalizeSentence = (value: string): string =>
  value.normalize("NFC").replace(/[\p{P}\p{Z}\s]/gu, "");

/** Authoring checks for typed local content. Not a parser for untrusted imports. */
export function inspectCourseLesson(
  lesson: CourseLesson,
  characters: ReadonlySet<string>,
): readonly CourseIssue[] {
  const issues: CourseIssue[] = [];
  const error = (path: string, message: string): void => {
    issues.push({ severity: "error", path, message });
  };
  const block = (path: string, message: string): void => {
    issues.push({ severity: "blocker", path, message });
  };
  const text = (value: CourseText, path: string): void => {
    for (const locale of LOCALES)
      if (!value[locale]?.trim())
        error(`${path}.${locale}`, "Missing localized text");
  };
  const ids = new Set<string>();
  const identity = (id: string, path: string): void => {
    if (!ID.test(id)) error(path, "Invalid content ID");
    if (ids.has(id)) error(path, "Duplicate content ID");
    ids.add(id);
  };
  identity(lesson.id, "id");
  if (lesson.schemaVersion !== 1)
    error("schemaVersion", "Unsupported course schema");
  if (!/^\d+\.\d+\.\d+$/.test(lesson.version))
    error("version", "Expected semantic content version");
  text(lesson.title, "title");
  text(lesson.objective, "objective");
  if (lesson.status !== "published")
    block("status", "Lesson is an editorial draft");
  if (lesson.linguisticReview !== "approved" || !lesson.reviewer?.trim())
    block("linguisticReview", "Linguistic review pending");
  if (!lesson.exercises.length) error("exercises", "Lesson needs an exercise");
  const words = new Set(lesson.words.map((word) => word.id));
  const utterances = new Map(lesson.utterances.map((line) => [line.id, line]));
  const audio = new Map(lesson.audio.map((asset) => [asset.id, asset]));
  for (const word of lesson.words) {
    identity(word.id, `words.${word.id}`);
    if (!word.hanzi.trim() || !word.pinyin.trim())
      error(`words.${word.id}`, "Missing word or pinyin");
    text(word.meaning, `words.${word.id}.meaning`);
  }
  for (const line of lesson.utterances) {
    identity(line.id, `utterances.${line.id}`);
    if (!line.hanzi.trim() || !line.pinyin.trim() || !line.speaker.trim())
      error(`utterances.${line.id}`, "Incomplete utterance");
    text(line.translation, `utterances.${line.id}.translation`);
    for (const id of line.wordIds)
      if (!words.has(id))
        error(`utterances.${line.id}.wordIds`, `Unknown word ${id}`);
  }
  for (const asset of lesson.audio) {
    const path = `audio.${asset.id}`;
    identity(asset.id, path);
    if (!utterances.has(asset.utteranceId))
      error(path, "Unknown audio utterance");
    if (
      asset.path &&
      (!/^audio\/courses\/[a-z0-9/_.-]+\.(mp3|ogg|webm|wav)$/.test(
        asset.path,
      ) ||
        asset.path.split("/").includes(".."))
    )
      error(`${path}.path`, "Audio must use a local course resource path");
    if (
      asset.review !== "approved" ||
      !asset.path ||
      !asset.sha256?.match(/^[a-f0-9]{64}$/) ||
      !asset.license?.trim() ||
      !asset.reviewer?.trim() ||
      !Number.isFinite(asset.durationMs) ||
      (asset.durationMs ?? 0) <= 0
    )
      block(path, "Reviewed audio, hash, duration and rights required");
  }
  for (const exercise of lesson.exercises) {
    const path = `exercises.${exercise.id}`;
    identity(exercise.id, path);
    text(exercise.prompt, `${path}.prompt`);
    text(exercise.explanation, `${path}.explanation`);
    if (exercise.type === "choice") {
      const target = exercise.target;
      const known =
        target.kind === "word"
          ? words.has(target.id)
          : target.kind === "utterance"
            ? utterances.has(target.id)
            : characters.has(target.id);
      if (!known) error(`${path}.target`, "Unknown target");
      const options = new Set<string>();
      if (exercise.options.length < 2 || exercise.options.length > 6)
        error(`${path}.options`, "Choice needs two to six options");
      for (const option of exercise.options) {
        if (!ID.test(option.id) || options.has(option.id))
          error(`${path}.options`, "Invalid or duplicate option ID");
        options.add(option.id);
        text(option.label, `${path}.options.${option.id}`);
      }
      for (const locale of LOCALES) {
        const labels = exercise.options.map((option) =>
          option.label[locale]?.normalize("NFC").trim(),
        );
        if (new Set(labels).size !== labels.length)
          error(
            `${path}.options.${locale}`,
            "Choice labels must be distinguishable",
          );
      }
      if (!options.has(exercise.answerId))
        error(`${path}.answerId`, "Answer is not an option");
      if (exercise.audioId && !audio.has(exercise.audioId))
        error(`${path}.audioId`, "Unknown audio");
      if (
        exercise.skill === "listening" &&
        (!exercise.audioId || !audio.has(exercise.audioId))
      )
        error(`${path}.audioId`, "Listening requires audio");
      if (
        exercise.skill === "listening" &&
        exercise.audioId &&
        (target.kind !== "utterance" ||
          audio.get(exercise.audioId)?.utteranceId !== target.id)
      )
        error(
          `${path}.target`,
          "Listening target must match its audio utterance",
        );
    } else if (exercise.type === "order") {
      const line = utterances.get(exercise.utteranceId);
      if (!line) error(`${path}.utteranceId`, "Unknown utterance");
      const tokens = new Map(
        exercise.tokens.map((token) => [token.id, token.text]),
      );
      if (
        !exercise.tokens.length ||
        tokens.size !== exercise.tokens.length ||
        exercise.tokens.some(
          (token) => !ID.test(token.id) || !token.text.trim(),
        )
      )
        error(`${path}.tokens`, "Invalid or duplicate tokens");
      if (
        exercise.answer.length !== tokens.size ||
        new Set(exercise.answer).size !== tokens.size ||
        exercise.answer.some((id) => !tokens.has(id))
      )
        error(`${path}.answer`, "Answer must use every token once");
      else if (
        line &&
        normalizeSentence(
          exercise.answer.map((id) => tokens.get(id)!).join(""),
        ) !== normalizeSentence(line.hanzi)
      )
        error(`${path}.answer`, "Ordered tokens do not match the utterance");
    } else if (!characters.has(exercise.character))
      error(`${path}.character`, "Writing character has no local template");
  }
  return issues;
}

export type CourseResponse =
  | { readonly type: "choice"; readonly optionId: string }
  | { readonly type: "order"; readonly tokenIds: readonly string[] };
export interface CourseGrade {
  readonly exerciseId: string;
  readonly skill: CourseSkill;
  readonly outcome: CourseOutcome;
  readonly target: CourseTarget;
}
/** Pure grading: no writes, XP, rewards or inferred mastery of other skills. */
export function gradeCourseExercise(
  exercise: CourseExercise,
  response: CourseResponse,
): CourseGrade {
  const target: CourseTarget =
    exercise.type === "choice"
      ? exercise.target
      : exercise.type === "order"
        ? { kind: "utterance", id: exercise.utteranceId }
        : { kind: "character", id: exercise.character };
  let outcome: CourseOutcome = "unassessed";
  if (exercise.type === "choice" && response.type === "choice") {
    outcome = !exercise.options.some(
      (option) => option.id === response.optionId,
    )
      ? "unusable"
      : response.optionId === exercise.answerId
        ? "correct"
        : "incorrect";
  } else if (exercise.type === "order" && response.type === "order") {
    const ids = new Set(exercise.tokens.map((token) => token.id));
    outcome =
      response.tokenIds.length !== ids.size ||
      new Set(response.tokenIds).size !== ids.size ||
      response.tokenIds.some((id) => !ids.has(id))
        ? "unusable"
        : normalizeSentence(
              response.tokenIds
                .map(
                  (id) =>
                    exercise.tokens.find((token) => token.id === id)!.text,
                )
                .join(""),
            ) ===
            normalizeSentence(
              exercise.answer
                .map(
                  (id) =>
                    exercise.tokens.find((token) => token.id === id)?.text ??
                    "",
                )
                .join(""),
            )
          ? "correct"
          : "incorrect";
  }
  return { exerciseId: exercise.id, skill: exercise.skill, outcome, target };
}
