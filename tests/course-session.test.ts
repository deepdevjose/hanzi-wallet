import { describe, expect, it } from "vitest";
import { INTRODUCING_YOURSELF as lesson } from "../src/course/introducing-yourself";
import {
  advanceCourseSession,
  createCourseSession,
  emptyCourseBackup,
  mergeCourseBackups,
  parseCourseBackup,
  prepareCourseAttempt,
  saveCourseDraft,
  type CourseBackup,
  type CourseDraft,
} from "../src/core/course-session";

const characters = new Set(["我"]);
const start = () => createCourseSession("session-one", lesson, characters, 100);
const draft: CourseDraft = {
  response: { type: "choice", optionId: "name-li" },
  hintsUsed: 1,
  supports: { pinyin: true, translation: false, transcript: false },
};
function attempted(): CourseBackup {
  const result = prepareCourseAttempt(start(), 0, "attempt-one", draft, 200);
  return {
    ...emptyCourseBackup(),
    sessions: [result.session],
    attempts: [result.attempt],
  };
}
const restore = (input: unknown) =>
  parseCourseBackup(JSON.parse(JSON.stringify(input)), characters);

describe("durable course session model", () => {
  it("pins an independent content snapshot and never invents practice at creation", () => {
    const session = start();
    expect(session.lesson).toEqual(lesson);
    expect(session.lesson).not.toBe(lesson);
    expect(session.attemptCounts).toEqual([0, 0, 0, 0]);
    expect(session.revision).toBe(0);
    expect(session.lineage).toHaveLength(1);
    expect(
      restore({ ...emptyCourseBackup(), sessions: [session] }).sessions[0],
    ).toEqual(session);
  });
  it("roundtrips a partial response, aids, attempts and feedback without mutation", () => {
    const before = start();
    const saved = saveCourseDraft(before, 0, draft, 120);
    const recorded = prepareCourseAttempt(saved, 1, "attempt-one", draft, 150);
    expect(before.draft).toBeNull();
    expect(before.revision).toBe(0);
    expect(saved.draft).toEqual(draft);
    const backup = restore({
      ...emptyCourseBackup(),
      sessions: [recorded.session],
      attempts: [recorded.attempt],
    });
    expect(backup.sessions[0]?.feedbackId).toBe("attempt-one");
    expect(backup.attempts[0]?.evidence).toMatchObject({
      skill: "listening",
      outcome: "correct",
      attemptIndex: 1,
      hintsUsed: 1,
      origin: "practice",
      supports: draft.supports,
    });
    expect(backup.sessions[0]?.lineage.slice(0, 2)).toEqual(saved.lineage);
  });
  it("requires an actual submission before advancing and preserves feedback after completion", () => {
    expect(() => advanceCourseSession(start(), 0)).toThrow(/Submit/);
    let session = start();
    const attempts = [];
    for (const exercise of lesson.exercises) {
      const response =
        exercise.type === "choice"
          ? { type: "choice" as const, optionId: exercise.answerId }
          : exercise.type === "order"
            ? { type: "order" as const, tokenIds: exercise.answer }
            : { type: "writing" as const, strokes: [[{ x: 0.2, y: 0.3 }]] };
      const prepared = prepareCourseAttempt(
        session,
        session.revision,
        `attempt-${attempts.length}`,
        { ...draft, response },
        200,
      );
      attempts.push(prepared.attempt);
      session = advanceCourseSession(
        prepared.session,
        prepared.session.revision,
        210,
      );
      expect(
        restore({ ...emptyCourseBackup(), sessions: [session], attempts })
          .sessions[0],
      ).toEqual(session);
    }
    expect(session.status).toBe("completed");
    expect(session.attemptCounts).toEqual([1, 1, 1, 1]);
    expect(attempts[3]?.evidence.outcome).toBe("unassessed");
    expect(() => saveCourseDraft(session, session.revision, draft)).toThrow(
      /completed/,
    );
  });
  it("rejects outdated writers and malformed drafts before recording evidence", () => {
    expect(() => saveCourseDraft(start(), 8, draft)).toThrow(/changed/);
    expect(() => prepareCourseAttempt(start(), 0, "bad id", draft)).toThrow();
    expect(() =>
      prepareCourseAttempt(start(), 0, "attempt-one", {
        ...draft,
        hintsUsed: -1,
      }),
    ).toThrow();
    expect(() =>
      saveCourseDraft(start(), 0, {
        ...draft,
        response: { type: "order", tokenIds: [] },
      }),
    ).toThrow();
  });
  it("preserves partial ordering and ink drafts but rejects malformed coordinates", () => {
    const session = { ...start(), stepIndex: 2 };
    const exercise = session.lesson.exercises[2]!;
    if (exercise.type !== "order") throw new Error("Fixture");
    const partial = {
      ...draft,
      response: { type: "order" as const, tokenIds: [exercise.tokens[0]!.id] },
    };
    expect(saveCourseDraft(session, 0, partial).draft).toEqual(partial);
    expect(() =>
      prepareCourseAttempt(session, 0, "attempt-one", partial),
    ).toThrow();
    const ink = {
      ...draft,
      response: { type: "writing" as const, strokes: [[{ x: 0.3, y: 0.9 }]] },
    };
    expect(saveCourseDraft({ ...start(), stepIndex: 3 }, 0, ink).draft).toEqual(
      ink,
    );
    expect(() =>
      saveCourseDraft({ ...start(), stepIndex: 3 }, 0, {
        ...ink,
        response: { type: "writing", strokes: [[{ x: NaN, y: 1 }]] },
      }),
    ).toThrow();
  });
  it("handles a clock moving backward without invalidating a session", () => {
    const session = saveCourseDraft(start(), 0, draft, 50);
    expect(session.updatedAt).toBe(100);
    expect(
      restore({ ...emptyCourseBackup(), sessions: [session] }).sessions[0],
    ).toEqual(session);
  });
});

describe("course backup validation and merging", () => {
  it("imports duplicates as a no-op, retaining the newer descendant when an older copy returns", () => {
    const backup = attempted();
    expect(mergeCourseBackups(backup, restore(backup))).toEqual(backup);
    const advanced = {
      ...backup,
      sessions: [advanceCourseSession(backup.sessions[0]!, 1, 250)],
    };
    expect(mergeCourseBackups(advanced, backup)).toEqual(advanced);
    expect(mergeCourseBackups(backup, advanced)).toEqual(advanced);
  });
  it("rejects histories that diverged through drafts even when the larger revision has all attempts", () => {
    const backup = attempted();
    const first = advanceCourseSession(backup.sessions[0]!, 1, 220);
    const other = saveCourseDraft(
      saveCourseDraft(backup.sessions[0]!, 1, draft, 220),
      2,
      draft,
      230,
    );
    expect(() =>
      mergeCourseBackups(
        { ...backup, sessions: [first] },
        { ...backup, sessions: [other] },
      ),
    ).toThrow(/diverged/);
  });
  it("rejects conflicting attempt IDs and changed content under the same session ID", () => {
    const backup = attempted();
    expect(() =>
      mergeCourseBackups(backup, {
        ...backup,
        attempts: [
          {
            ...backup.attempts[0]!,
            response: { type: "choice", optionId: "name-lin" },
          },
        ],
      }),
    ).toThrow(/different content/);
    expect(() =>
      mergeCourseBackups(backup, {
        ...backup,
        sessions: [
          { ...backup.sessions[0]!, lesson: { ...lesson, version: "0.2.0" } },
        ],
      }),
    ).toThrow(/Pinned lesson/);
  });
  it("keeps explicit deletions across export, repeated import and old backups", () => {
    const backup = attempted();
    const deleted = {
      ...emptyCourseBackup(),
      deletedSessions: [{ id: "session-one", deletedAt: 300 }],
    };
    expect(mergeCourseBackups(deleted, backup)).toEqual(deleted);
    expect(mergeCourseBackups(backup, deleted)).toEqual(deleted);
    expect(restore(deleted)).toEqual(deleted);
  });
  it("rejects unsupported schemas, duplicate IDs and evidence without its session", () => {
    const backup = attempted();
    for (const invalid of [
      { ...backup, schemaVersion: 2 },
      { ...backup, sessions: [...backup.sessions, ...backup.sessions] },
      { ...backup, attempts: [...backup.attempts, ...backup.attempts] },
      { ...backup, sessions: [] },
      { ...backup, sessions: [{ ...backup.sessions[0]!, stepIndex: 50 }] },
      { ...backup, sessions: [{ ...backup.sessions[0]!, lineage: [] }] },
    ])
      expect(() => restore(invalid)).toThrow();
  });
  it("rejects invented cross-skill, outcome, count and reference changes", () => {
    const backup = attempted();
    for (const fields of [
      { skill: "pronunciation" },
      { outcome: "incorrect" },
      { assessor: "asr" },
      { origin: "placement" },
      { attemptIndex: 0 },
      { attemptIndex: 2 },
      { lessonVersion: "0.2.0" },
      { target: { kind: "word", id: "wo" } },
    ])
      expect(() =>
        restore({
          ...backup,
          attempts: [
            {
              ...backup.attempts[0]!,
              evidence: { ...backup.attempts[0]!.evidence, ...fields },
            },
          ],
        }),
      ).toThrow();
  });
  it("rejects skipped steps, missing attempts and tombstones that also contain active data", () => {
    const backup = attempted();
    for (const invalid of [
      { ...backup, attempts: [] },
      {
        ...backup,
        sessions: [{ ...backup.sessions[0]!, stepIndex: 2, feedbackId: null }],
      },
      { ...backup, deletedSessions: [{ id: "session-one", deletedAt: 200 }] },
    ])
      expect(() => restore(invalid)).toThrow();
  });
  it("rejects impossible attempt revisions and feedback that hides a later attempt", () => {
    const first = attempted();
    const next = prepareCourseAttempt(
      first.sessions[0]!,
      1,
      "attempt-two",
      draft,
      220,
    );
    const backup = {
      ...first,
      sessions: [next.session],
      attempts: [...first.attempts, next.attempt],
    };
    expect(restore(backup)).toEqual(backup);
    expect(() =>
      restore({
        ...backup,
        attempts: [first.attempts[0], { ...next.attempt, expectedRevision: 0 }],
      }),
    ).toThrow();
    expect(() =>
      restore({
        ...backup,
        sessions: [{ ...next.session, feedbackId: "attempt-one" }],
      }),
    ).toThrow();
    expect(() =>
      restore({
        ...backup,
        sessions: [{ ...next.session, revision: Number.MAX_SAFE_INTEGER }],
      }),
    ).toThrow();
  });
  it("does not read inherited or accessor fields while parsing course records", () => {
    const backup = attempted();
    let called = false;
    const input = {
      ...backup,
      get deletedSessions() {
        called = true;
        return [];
      },
    };
    expect(() => parseCourseBackup(input, characters)).toThrow();
    expect(called).toBe(false);
    expect(() =>
      parseCourseBackup(Object.create(backup), characters),
    ).toThrow();
  });
});
