import {
  gradeCourseExercise,
  type CourseEvidence,
  type CourseExercise,
  type CourseLesson,
  type CourseResponse,
} from "./course";
import { parseCourseLesson } from "./course-import";
import type { Stroke } from "./types";

export class CourseDataError extends Error {
  constructor(
    readonly code: "invalid" | "conflict" | "deleted" | "unavailable" | "quota",
    message: string,
  ) {
    super(message);
    this.name = "CourseDataError";
  }
}
export interface CourseSupports {
  readonly pinyin: boolean;
  readonly translation: boolean;
  readonly transcript: boolean;
}
export type CourseSubmission =
  | CourseResponse
  | { readonly type: "writing"; readonly strokes: readonly Stroke[] };
/** Empty selections can be saved with consulted aids, but never submitted. */
export type CourseDraftResponse =
  | CourseSubmission
  | { readonly type: "choice"; readonly optionId: null };
export interface CourseDraft {
  readonly response: CourseDraftResponse;
  readonly hintsUsed: number;
  readonly supports: CourseSupports;
}
/** The snapshot, not the current catalogue, determines an existing session. */
export interface CourseSession {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly lesson: CourseLesson;
  readonly revision: number;
  readonly lineage: readonly string[];
  readonly stepIndex: number;
  readonly status: "active" | "completed";
  readonly draft: CourseDraft | null;
  readonly attemptCounts: readonly number[];
  readonly feedbackId: string | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}
/** A command ID must be reused after an uncertain commit, never regenerated. */
export interface CourseAttempt {
  readonly id: string;
  readonly expectedRevision: number;
  readonly response: CourseSubmission;
  readonly evidence: CourseEvidence;
}
export interface CourseDeletion {
  readonly id: string;
  readonly deletedAt: number;
}
export interface CourseBackup {
  readonly schemaVersion: 1;
  readonly sessions: readonly CourseSession[];
  readonly attempts: readonly CourseAttempt[];
  readonly deletedSessions: readonly CourseDeletion[];
}
export const BACKUP_MAX_BYTES = 20_000_000;
export const COURSE_LIMITS = {
  sessions: 1000,
  attempts: 20000,
  deletions: 10000,
  revisions: 10000,
} as const;
export const emptyCourseBackup = (): CourseBackup => ({
  schemaVersion: 1,
  sessions: [],
  attempts: [],
  deletedSessions: [],
});
const ID = /^[a-z0-9][a-z0-9.-]{0,79}$/;
export const isRecord = (v: unknown): v is Record<string, unknown> => {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const prototype: unknown = Object.getPrototypeOf(v);
  return (
    (prototype === Object.prototype || prototype === null) &&
    Object.values(Object.getOwnPropertyDescriptors(v)).every(
      (property) => "value" in property,
    )
  );
};
function invalid(path: string): never {
  throw new CourseDataError("invalid", `Invalid course data at ${path}`);
}
function id(v: unknown, path: string): string {
  if (typeof v !== "string" || !ID.test(v)) return invalid(path);
  return v;
}
function natural(
  v: unknown,
  path: string,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0 || v > max)
    return invalid(path);
  return v;
}
function list(v: unknown, path: string, max: number): unknown[] {
  if (!Array.isArray(v) || v.length > max) return invalid(path);
  return Array.from(v);
}
function supports(v: unknown): CourseSupports {
  if (!isRecord(v)) return invalid("supports");
  if (
    [v.pinyin, v.translation, v.transcript].some((x) => typeof x !== "boolean")
  )
    return invalid("supports");
  return {
    pinyin: v.pinyin as boolean,
    translation: v.translation as boolean,
    transcript: v.transcript as boolean,
  };
}
function response(
  v: unknown,
  exercise: CourseExercise,
  partial: true,
): CourseDraftResponse;
function response(
  v: unknown,
  exercise: CourseExercise,
  partial: false,
): CourseSubmission;
function response(
  v: unknown,
  exercise: CourseExercise,
  partial: boolean,
): CourseDraftResponse {
  if (!isRecord(v) || v.type !== exercise.type) return invalid("response.type");
  if (exercise.type === "choice") {
    if (partial && v.optionId === null)
      return { type: "choice", optionId: null };
    const optionId = id(v.optionId, "response.optionId");
    if (!exercise.options.some((option) => option.id === optionId))
      return invalid("response.optionId");
    return { type: "choice", optionId };
  }
  if (exercise.type === "order") {
    const tokenIds = list(
      v.tokenIds,
      "response.tokenIds",
      exercise.tokens.length,
    ).map((token) => id(token, "response.tokenIds"));
    if (
      new Set(tokenIds).size !== tokenIds.length ||
      tokenIds.some(
        (token) => !exercise.tokens.some((item) => item.id === token),
      ) ||
      (!partial && tokenIds.length !== exercise.tokens.length)
    )
      return invalid("response.tokenIds");
    return { type: "order", tokenIds };
  }
  const strokes = list(v.strokes, "response.strokes", 25).map((stroke) =>
    list(stroke, "response.stroke", 5000).map((point) => {
      if (
        !isRecord(point) ||
        typeof point.x !== "number" ||
        typeof point.y !== "number" ||
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y) ||
        point.x < 0 ||
        point.x > 1 ||
        point.y < 0 ||
        point.y > 1
      )
        return invalid("response.point");
      return { x: point.x, y: point.y };
    }),
  );
  if (strokes.some((stroke) => !stroke.length) || (!partial && !strokes.length))
    return invalid("response.strokes");
  return { type: "writing", strokes };
}
export function parseCourseDraft(
  v: unknown,
  exercise: CourseExercise,
): CourseDraft {
  if (!isRecord(v)) return invalid("draft");
  return {
    response: response(v.response, exercise, true),
    hintsUsed: natural(v.hintsUsed, "draft.hintsUsed", 10000),
    supports: supports(v.supports),
  };
}
export function createCourseSession(
  sessionId: string,
  lesson: CourseLesson,
  characters: ReadonlySet<string>,
  now = Date.now(),
): CourseSession {
  const pinned = parseCourseLesson(lesson, characters);
  return {
    schemaVersion: 1,
    id: id(sessionId, "session.id"),
    lesson: pinned,
    revision: 0,
    lineage: [crypto.randomUUID()],
    stepIndex: 0,
    status: "active",
    draft: null,
    attemptCounts: pinned.exercises.map(() => 0),
    feedbackId: null,
    createdAt: natural(now, "createdAt"),
    updatedAt: now,
  };
}
export function assertRevision(session: CourseSession, expected: number): void {
  if (session.revision !== expected)
    throw new CourseDataError(
      "conflict",
      "Session changed; reload before retrying",
    );
  if (session.revision >= COURSE_LIMITS.revisions)
    throw new CourseDataError(
      "invalid",
      "Session revision limit reached; start another session",
    );
  if (session.status !== "active")
    throw new CourseDataError("conflict", "Session is already completed");
}
export function saveCourseDraft(
  session: CourseSession,
  expected: number,
  draft: CourseDraft | null,
  now = Date.now(),
): CourseSession {
  assertRevision(session, expected);
  const parsed =
    draft === null
      ? null
      : parseCourseDraft(draft, session.lesson.exercises[session.stepIndex]!);
  return {
    ...session,
    revision: session.revision + 1,
    lineage: [...session.lineage, crypto.randomUUID()],
    draft: parsed,
    updatedAt: Math.max(session.updatedAt, natural(now, "updatedAt")),
  };
}
export function prepareCourseAttempt(
  session: CourseSession,
  expected: number,
  attemptId: string,
  draft: CourseDraft,
  now = Date.now(),
): { session: CourseSession; attempt: CourseAttempt } {
  assertRevision(session, expected);
  const exercise = session.lesson.exercises[session.stepIndex]!;
  const parsed = parseCourseDraft(draft, exercise);
  const submitted = response(parsed.response, exercise, false);
  const grade =
    exercise.type === "writing"
      ? {
          exerciseId: exercise.id,
          skill: exercise.skill,
          outcome: "unassessed" as const,
          target: { kind: "character" as const, id: exercise.character },
        }
      : gradeCourseExercise(exercise, submitted as CourseResponse);
  const counts = [...session.attemptCounts];
  counts[session.stepIndex] = counts[session.stepIndex]! + 1;
  const attempt: CourseAttempt = {
    id: id(attemptId, "attempt.id"),
    expectedRevision: expected,
    response: submitted,
    evidence: {
      ...grade,
      id: attemptId,
      sessionId: session.id,
      lessonId: session.lesson.id,
      lessonVersion: session.lesson.version,
      origin: "practice",
      assessor: "deterministic",
      rubricVersion: "course-v1",
      attemptIndex: counts[session.stepIndex]!,
      hintsUsed: parsed.hintsUsed,
      supports: parsed.supports,
      occurredAt: natural(now, "occurredAt"),
    },
  };
  return {
    attempt,
    session: {
      ...session,
      revision: expected + 1,
      lineage: [...session.lineage, crypto.randomUUID()],
      draft: null,
      feedbackId: attempt.id,
      attemptCounts: counts,
      updatedAt: Math.max(session.updatedAt, now),
    },
  };
}
/** Completion records participation. It does not issue coins or assert mastery. */
export function advanceCourseSession(
  session: CourseSession,
  expected: number,
  now = Date.now(),
): CourseSession {
  assertRevision(session, expected);
  if (!session.feedbackId)
    throw new CourseDataError(
      "conflict",
      "Submit the current activity before continuing",
    );
  const completed = session.stepIndex === session.lesson.exercises.length - 1;
  return {
    ...session,
    revision: expected + 1,
    lineage: [...session.lineage, crypto.randomUUID()],
    stepIndex: completed ? session.stepIndex : session.stepIndex + 1,
    status: completed ? "completed" : "active",
    draft: null,
    feedbackId: completed ? session.feedbackId : null,
    updatedAt: Math.max(session.updatedAt, natural(now, "updatedAt")),
  };
}
function parseSession(
  v: unknown,
  characters: ReadonlySet<string>,
): CourseSession {
  if (!isRecord(v) || v.schemaVersion !== 1)
    return invalid("session.schemaVersion");
  const lesson = parseCourseLesson(v.lesson, characters);
  const stepIndex = natural(
    v.stepIndex,
    "session.stepIndex",
    lesson.exercises.length - 1,
  );
  if (v.status !== "active" && v.status !== "completed")
    return invalid("session.status");
  const attemptCounts = list(
    v.attemptCounts,
    "session.attemptCounts",
    lesson.exercises.length,
  ).map((count) => natural(count, "session.attemptCounts", 100000));
  if (attemptCounts.length !== lesson.exercises.length)
    return invalid("session.attemptCounts");
  const createdAt = natural(v.createdAt, "session.createdAt");
  const updatedAt = natural(v.updatedAt, "session.updatedAt");
  if (updatedAt < createdAt) return invalid("session.updatedAt");
  if (
    v.status === "completed" &&
    (stepIndex !== lesson.exercises.length - 1 || v.draft !== null)
  )
    return invalid("session.completed");
  const revision = natural(
    v.revision,
    "session.revision",
    COURSE_LIMITS.revisions,
  );
  const lineage = list(
    v.lineage,
    "session.lineage",
    COURSE_LIMITS.revisions + 1,
  ).map((value) => id(value, "session.lineage"));
  if (
    lineage.length !== revision + 1 ||
    new Set(lineage).size !== lineage.length
  )
    return invalid("session.lineage");
  return {
    schemaVersion: 1,
    id: id(v.id, "session.id"),
    lesson,
    lineage,
    revision,
    stepIndex,
    status: v.status,
    attemptCounts,
    createdAt,
    updatedAt,
    draft:
      v.draft === null
        ? null
        : parseCourseDraft(v.draft, lesson.exercises[stepIndex]!),
    feedbackId:
      v.feedbackId === null ? null : id(v.feedbackId, "session.feedbackId"),
  };
}
/** Strict, bounded parsing before any database or legacy storage write. */
export function parseCourseBackup(
  input: unknown,
  characters: ReadonlySet<string>,
): CourseBackup {
  if (!isRecord(input) || input.schemaVersion !== 1)
    return invalid("backup.schemaVersion");
  const sessions = list(input.sessions, "sessions", COURSE_LIMITS.sessions).map(
    (v) => parseSession(v, characters),
  );
  const bySession = new Map(sessions.map((session) => [session.id, session]));
  if (bySession.size !== sessions.length) return invalid("sessions.duplicate");
  const attempts = list(input.attempts, "attempts", COURSE_LIMITS.attempts).map(
    (v): CourseAttempt => {
      if (!isRecord(v) || !isRecord(v.evidence)) return invalid("attempt");
      const evidence = v.evidence;
      const session = bySession.get(
        id(evidence.sessionId, "evidence.sessionId"),
      );
      const index =
        session?.lesson.exercises.findIndex(
          (exercise) => exercise.id === evidence.exerciseId,
        ) ?? -1;
      if (!session || index < 0) return invalid("evidence.exerciseId");
      const baseRevision = natural(
        v.expectedRevision,
        "attempt.expectedRevision",
      );
      const attemptId = id(v.id, "attempt.id");
      const prepared = prepareCourseAttempt(
        {
          ...session,
          revision: baseRevision,
          stepIndex: index,
          status: "active",
          attemptCounts: session.attemptCounts.map((count, i) =>
            i === index
              ? natural(
                  evidence.attemptIndex,
                  "evidence.attemptIndex",
                  100000,
                ) - 1
              : count,
          ),
        },
        baseRevision,
        attemptId,
        {
          response: response(
            v.response,
            session.lesson.exercises[index]!,
            false,
          ),
          hintsUsed: natural(evidence.hintsUsed, "evidence.hintsUsed", 10000),
          supports: supports(evidence.supports),
        },
        natural(evidence.occurredAt, "evidence.occurredAt"),
      );
      if (
        !isRecord(evidence.target) ||
        evidence.id !== attemptId ||
        evidence.lessonId !== session.lesson.id ||
        evidence.lessonVersion !== session.lesson.version ||
        evidence.skill !== prepared.attempt.evidence.skill ||
        evidence.outcome !== prepared.attempt.evidence.outcome ||
        evidence.target.kind !== prepared.attempt.evidence.target.kind ||
        evidence.target.id !== prepared.attempt.evidence.target.id ||
        evidence.origin !== "practice" ||
        evidence.assessor !== "deterministic" ||
        evidence.rubricVersion !== "course-v1" ||
        evidence.attemptIndex === 0 ||
        baseRevision >= session.revision
      )
        return invalid("evidence");
      return prepared.attempt;
    },
  );
  if (new Set(attempts.map((attempt) => attempt.id)).size !== attempts.length)
    return invalid("attempts.duplicate");
  for (const session of sessions) {
    const own = attempts.filter(
      (attempt) => attempt.evidence.sessionId === session.id,
    );
    if (
      new Set(own.map((attempt) => attempt.expectedRevision)).size !==
      own.length
    )
      return invalid("session.attemptRevisions");
    for (const [index, exercise] of session.lesson.exercises.entries()) {
      const ordered = own
        .filter((attempt) => attempt.evidence.exerciseId === exercise.id)
        .sort((a, b) => a.evidence.attemptIndex - b.evidence.attemptIndex);
      const indices = ordered.map((attempt) => attempt.evidence.attemptIndex);
      if (
        ordered.some(
          (attempt, i) =>
            i > 0 &&
            attempt.expectedRevision <= ordered[i - 1]!.expectedRevision,
        )
      )
        return invalid("session.attemptOrder");
      if (
        indices.length !== session.attemptCounts[index] ||
        indices.some((n, i) => n !== i + 1)
      )
        return invalid("session.attemptCounts");
      if (index > session.stepIndex && indices.length)
        return invalid("session.futureAttempt");
      if (index < session.stepIndex && !indices.length)
        return invalid("session.skippedStep");
    }
    const feedback = own.find((attempt) => attempt.id === session.feedbackId);
    if (
      (session.feedbackId !== null &&
        (!feedback ||
          feedback.evidence.exerciseId !==
            session.lesson.exercises[session.stepIndex]!.id ||
          feedback.evidence.attemptIndex !==
            session.attemptCounts[session.stepIndex])) ||
      (session.feedbackId === null &&
        session.attemptCounts[session.stepIndex] !== 0) ||
      (session.status === "completed" && !feedback)
    )
      return invalid("session.feedbackId");
  }
  const deletedSessions = list(
    input.deletedSessions,
    "deletedSessions",
    COURSE_LIMITS.deletions,
  ).map((v): CourseDeletion => {
    if (!isRecord(v)) return invalid("deletedSession");
    const deletion = {
      id: id(v.id, "deletedSession.id"),
      deletedAt: natural(v.deletedAt, "deletedAt"),
    };
    if (bySession.has(deletion.id)) return invalid("deletedSession.active");
    return deletion;
  });
  if (new Set(deletedSessions.map((v) => v.id)).size !== deletedSessions.length)
    return invalid("deletedSessions.duplicate");
  return { schemaVersion: 1, sessions, attempts, deletedSessions };
}
/** Stable comparisons ignore property order, never content differences. */
export function sameCourseData(a: unknown, b: unknown): boolean {
  const stable = (v: unknown): string => {
    if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
    if (isRecord(v))
      return `{${Object.keys(v)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${stable(v[key])}`)
        .join(",")}}`;
    return JSON.stringify(v);
  };
  return stable(a) === stable(b);
}
/** Merge branches only if one is an extension. Never silently discard evidence. */
export function mergeCourseBackups(
  local: CourseBackup,
  incoming: CourseBackup,
): CourseBackup {
  const deleted = new Map(local.deletedSessions.map((item) => [item.id, item]));
  for (const item of incoming.deletedSessions) {
    const old = deleted.get(item.id);
    if (!old || item.deletedAt > old.deletedAt) deleted.set(item.id, item);
  }
  const attempts = new Map(local.attempts.map((item) => [item.id, item]));
  for (const item of incoming.attempts) {
    if (deleted.has(item.evidence.sessionId)) continue;
    const old = attempts.get(item.id);
    if (old && !sameCourseData(old, item))
      throw new CourseDataError("conflict", "Attempt ID has different content");
    attempts.set(item.id, item);
  }
  const sessions = new Map(
    local.sessions.map((session) => [session.id, session]),
  );
  for (const session of incoming.sessions) {
    if (deleted.has(session.id)) continue;
    const old = sessions.get(session.id);
    if (old) {
      if (!sameCourseData(old.lesson, session.lesson))
        throw new CourseDataError("conflict", "Pinned lesson differs");
      const older = old.revision < session.revision ? old : session;
      const newer = old.revision < session.revision ? session : old;
      const olderAttempts = (older === old ? local : incoming).attempts.filter(
        (item) => item.evidence.sessionId === session.id,
      );
      const newerAttempts = new Map(
        (newer === old ? local : incoming).attempts.map((item) => [
          item.id,
          item,
        ]),
      );
      if (
        older.lineage.some((token, index) => token !== newer.lineage[index]) ||
        (old.revision === session.revision && !sameCourseData(old, session)) ||
        olderAttempts.some((item) => !newerAttempts.has(item.id))
      )
        throw new CourseDataError(
          "conflict",
          "Session histories diverged; keep both backups",
        );
      sessions.set(session.id, newer);
    } else sessions.set(session.id, session);
  }
  return {
    schemaVersion: 1,
    sessions: [...sessions.values()].filter((item) => !deleted.has(item.id)),
    attempts: [...attempts.values()].filter(
      (item) => !deleted.has(item.evidence.sessionId),
    ),
    deletedSessions: [...deleted.values()],
  };
}
