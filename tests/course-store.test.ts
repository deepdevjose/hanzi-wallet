import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { INTRODUCING_YOURSELF as lesson } from "../src/course/introducing-yourself";
import type { CourseExercise } from "../src/core/course";
import type { CourseDraft } from "../src/core/course-session";
import { openCourseStore, type CourseStore } from "../src/core/course-store";

const characters = new Set(["我"]);
const draftFor = (exercise: CourseExercise): CourseDraft => ({
  response:
    exercise.type === "choice"
      ? { type: "choice", optionId: exercise.answerId }
      : exercise.type === "order"
        ? { type: "order", tokenIds: [...exercise.answer] }
        : {
            type: "writing",
            strokes: [
              [
                { x: 0.2, y: 0.3 },
                { x: 0.6, y: 0.8 },
              ],
            ],
          },
  hintsUsed: 0,
  supports: { pinyin: false, translation: false, transcript: false },
});

describe("transactional course storage", () => {
  let factory: IDBFactory;
  const stores = new Set<CourseStore>();
  const open = async (name = "test-course"): Promise<CourseStore> => {
    const store = await openCourseStore(characters, factory, name);
    stores.add(store);
    return store;
  };
  beforeEach(() => {
    factory = new IDBFactory();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    for (const store of stores) store.close();
    stores.clear();
  });

  it("reopens each saved answer, feedback and next step through completion", async () => {
    let store = await open();
    let session = await store.startSession("journey", lesson, 10);
    expect(await store.exportProgress()).toMatchObject({
      sessions: [session],
      attempts: [],
      deletedSessions: [],
    });
    for (const [index, exercise] of lesson.exercises.entries()) {
      expect(session.stepIndex).toBe(index);
      const draft = draftFor(exercise);
      session = await store.saveDraft(
        session.id,
        session.revision,
        draft,
        20 + index * 10,
      );
      store.close();
      store = await open();
      expect(await store.getSession(session.id)).toEqual(session);
      expect((await store.getSession(session.id))?.draft).toEqual(draft);
      const result = await store.submitAttempt(
        session.id,
        session.revision,
        `attempt-${index}`,
        draft,
        21 + index * 10,
      );
      store.close();
      store = await open();
      session = (await store.getSession(session.id))!;
      expect(session.feedbackId).toBe(result.attempt.id);
      expect((await store.exportProgress()).attempts).toHaveLength(index + 1);
      session = await store.advance(
        session.id,
        session.revision,
        22 + index * 10,
      );
      store.close();
      store = await open();
      expect(await store.getSession(session.id)).toEqual(session);
    }
    expect(session).toMatchObject({
      status: "completed",
      attemptCounts: [1, 1, 1, 1],
      stepIndex: 3,
    });
    expect(
      (await store.exportProgress()).attempts.map(
        (attempt) => attempt.evidence.outcome,
      ),
    ).toEqual(["correct", "correct", "correct", "unassessed"]);
    await expect(
      store.advance(session.id, session.revision, 100),
    ).rejects.toMatchObject({ code: "conflict" });
  });

  it("pins a cloned lesson while later catalogue versions use a new session", async () => {
    const store = await open();
    const source = { ...lesson, title: { ...lesson.title } };
    const first = await store.startSession("pinned", source, 10);
    source.title.en = "Changed after starting";
    expect((await store.getSession(first.id))?.lesson.title.en).toBe(
      lesson.title.en,
    );
    const next = {
      ...lesson,
      version: "0.2.0",
      title: { ...lesson.title, en: "Second version" },
    };
    await expect(store.startSession(first.id, next, 20)).rejects.toMatchObject({
      code: "conflict",
    });
    expect(await store.startSession(first.id, lesson, 30)).toEqual(first);
    expect((await store.startSession("new-version", next, 20)).lesson).toEqual(
      next,
    );
    store.close();
    const reopened = await open();
    expect((await reopened.getSession(first.id))?.lesson).toEqual(lesson);
  });
  it("reopens aids with no selected answer and rejects submitting that empty draft", async () => {
    let store = await open();
    await store.startSession("unanswered", lesson, 10);
    const draft: CourseDraft = {
      response: { type: "choice", optionId: null },
      hintsUsed: 1,
      supports: { pinyin: false, translation: true, transcript: false },
    };
    const saved = await store.saveDraft("unanswered", 0, draft, 20);
    store.close();
    store = await open();
    expect(await store.getSession("unanswered")).toEqual(saved);
    const before = await store.exportProgress();
    await expect(
      store.submitAttempt("unanswered", 1, "not-an-answer", draft, 30),
    ).rejects.toMatchObject({ code: "invalid" });
    expect(await store.exportProgress()).toEqual(before);
    const answered = await store.submitAttempt(
      "unanswered",
      1,
      "real-answer",
      {
        ...draft,
        response: { type: "choice", optionId: "name-li" },
      },
      40,
    );
    expect(answered.attempt.evidence).toMatchObject({
      attemptIndex: 1,
      hintsUsed: 1,
      supports: draft.supports,
    });
  });

  it("retries a committed attempt ID without duplicating evidence or moving the step", async () => {
    const store = await open();
    const session = await store.startSession("retry", lesson, 10);
    const draft = draftFor(lesson.exercises[0]!);
    const first = await store.submitAttempt(
      session.id,
      0,
      "command-a",
      draft,
      20,
    );
    expect(
      await store.submitAttempt(session.id, 0, "command-a", draft, 30),
    ).toEqual(first);
    const next = await store.advance(session.id, first.session.revision, 40);
    const repeated = await store.submitAttempt(
      session.id,
      0,
      "command-a",
      draft,
      50,
    );
    expect(repeated.attempt).toEqual(first.attempt);
    expect(repeated.session).toEqual(next);
    expect((await store.exportProgress()).attempts).toEqual([first.attempt]);
    expect(next.attemptCounts).toEqual([1, 0, 0, 0]);
    await expect(
      store.submitAttempt(
        session.id,
        0,
        "command-a",
        { ...draft, hintsUsed: 1 },
        60,
      ),
    ).rejects.toMatchObject({ code: "conflict" });
    await expect(
      store.submitAttempt(session.id, 1, "command-a", draft, 60),
    ).rejects.toMatchObject({ code: "conflict" });
    await store.startSession("other-session", lesson, 10);
    await expect(
      store.submitAttempt("other-session", 0, "command-a", draft, 60),
    ).rejects.toMatchObject({ code: "conflict" });
    expect((await store.getSession("other-session"))?.revision).toBe(0);
  });

  it("serializes two connections and rejects stale drafts and attempts", async () => {
    const first = await open();
    const second = await open();
    await first.startSession("shared", lesson, 10);
    const draft = draftFor(lesson.exercises[0]!);
    const drafts = await Promise.allSettled([
      first.saveDraft("shared", 0, draft, 20),
      second.saveDraft("shared", 0, { ...draft, hintsUsed: 1 }, 21),
    ]);
    expect(
      drafts.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      drafts.filter((result) => result.status === "rejected"),
    ).toMatchObject([{ reason: { code: "conflict" } }]);
    const attempts = await Promise.allSettled([
      first.submitAttempt("shared", 1, "tab-a", draft, 30),
      second.submitAttempt("shared", 1, "tab-b", draft, 31),
    ]);
    expect(
      attempts.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      attempts.filter((result) => result.status === "rejected"),
    ).toMatchObject([{ reason: { code: "conflict" } }]);
    const snapshot = await first.exportProgress();
    expect(snapshot.attempts).toHaveLength(1);
    expect(snapshot.sessions[0]).toMatchObject({
      revision: 2,
      attemptCounts: [1, 0, 0, 0],
    });
    expect(await second.exportProgress()).toEqual(snapshot);
  });

  it.each([
    ["AbortError", "unavailable"],
    ["QuotaExceededError", "quota"],
  ])(
    "rolls back evidence when %s interrupts the following session write",
    async (errorName, code) => {
      const store = await open();
      const session = await store.startSession("interrupted", lesson, 10);
      const before = await store.exportProgress();
      const draft = draftFor(lesson.exercises[0]!);
      const original = IDBObjectStore.prototype.put;
      const put = vi
        .spyOn(IDBObjectStore.prototype, "put")
        .mockImplementation(function (
          this: IDBObjectStore,
          value: unknown,
          key?: IDBValidKey,
        ) {
          if (this.name === "sessions") {
            if (errorName === "AbortError") this.transaction.abort();
            throw new DOMException("Simulated interrupted commit", errorName);
          }
          return original.call(this, value, key);
        });
      await expect(
        store.submitAttempt(session.id, 0, "recoverable", draft, 20),
      ).rejects.toMatchObject({ code });
      put.mockRestore();
      expect(await store.exportProgress()).toEqual(before);
      const retry = await store.submitAttempt(
        session.id,
        0,
        "recoverable",
        draft,
        20,
      );
      expect(retry.session.attemptCounts).toEqual([1, 0, 0, 0]);
      expect((await store.exportProgress()).attempts).toHaveLength(1);
    },
  );

  it("merges repeated and older backups without reverting progress or other sessions", async () => {
    const source = await open("source");
    await source.startSession("travel", lesson, 10);
    const older = await source.exportProgress();
    const answered = await source.submitAttempt(
      "travel",
      0,
      "travel-answer",
      draftFor(lesson.exercises[0]!),
      20,
    );
    await source.advance("travel", answered.session.revision, 30);
    const newer = await source.exportProgress();
    const target = await open("target");
    const unrelated = await target.startSession("local-study", lesson, 5);
    await target.importProgress(newer);
    const firstImport = await target.exportProgress();
    await target.importProgress(newer);
    await target.importProgress(older);
    expect(await target.exportProgress()).toEqual(firstImport);
    expect((await target.getSession("travel"))?.stepIndex).toBe(1);
    expect(await target.getSession(unrelated.id)).toEqual(unrelated);
    await expect(
      target.importProgress({ wallet: {}, history: [] }),
    ).rejects.toMatchObject({ code: "invalid" });
    expect(await target.exportProgress()).toEqual(firstImport);
  });

  it("keeps deletions authoritative across backup imports and removes their attempts", async () => {
    const source = await open("source");
    await source.startSession("removed", lesson, 10);
    const answer = await source.submitAttempt(
      "removed",
      0,
      "removed-answer",
      draftFor(lesson.exercises[0]!),
      20,
    );
    const saved = await source.exportProgress();
    await expect(source.deleteSession("removed", 0, 30)).rejects.toMatchObject({
      code: "conflict",
    });
    await source.deleteSession("removed", answer.session.revision, 30);
    const deleted = await source.exportProgress();
    expect(deleted).toEqual({
      schemaVersion: 1,
      sessions: [],
      attempts: [],
      deletedSessions: [{ id: "removed", deletedAt: 30 }],
    });
    await source.importProgress(saved);
    await source.deleteSession("removed", 0, 50);
    expect(await source.exportProgress()).toEqual(deleted);
    await expect(
      source.startSession("removed", lesson, 60),
    ).rejects.toMatchObject({ code: "deleted" });
    const target = await open("target");
    await target.importProgress(saved);
    await target.importProgress(deleted);
    await target.importProgress(saved);
    expect(await target.exportProgress()).toEqual(deleted);
    expect(await target.getSession("removed")).toBeUndefined();
  });

  it("rejects conflicting histories without mutating either stored branch", async () => {
    const first = await open("first");
    const second = await open("second");
    const draft = draftFor(lesson.exercises[0]!);
    await first.startSession("branched", lesson, 10);
    await second.startSession("branched", lesson, 10);
    await first.saveDraft("branched", 0, draft, 20);
    await second.saveDraft("branched", 0, { ...draft, hintsUsed: 1 }, 20);
    const local = await first.exportProgress();
    const remote = await second.exportProgress();
    await expect(first.importProgress(remote)).rejects.toMatchObject({
      code: "conflict",
    });
    expect(await first.exportProgress()).toEqual(local);
    expect(await second.exportProgress()).toEqual(remote);
  });

  it("rolls back an import quota failure after clearing stores", async () => {
    const source = await open("source");
    await source.startSession("from-backup", lesson, 10);
    const incoming = await source.exportProgress();
    const target = await open("target");
    await target.startSession("already-local", lesson, 10);
    const before = await target.exportProgress();
    const original = IDBObjectStore.prototype.add;
    const add = vi
      .spyOn(IDBObjectStore.prototype, "add")
      .mockImplementation(function (
        this: IDBObjectStore,
        value: unknown,
        key?: IDBValidKey,
      ) {
        if (this.name === "sessions")
          throw new DOMException("Simulated quota limit", "QuotaExceededError");
        return original.call(this, value, key);
      });
    await expect(target.importProgress(incoming)).rejects.toMatchObject({
      code: "quota",
    });
    add.mockRestore();
    expect(await target.exportProgress()).toEqual(before);
    await target.importProgress(incoming);
    expect(
      (await target.exportProgress()).sessions.map((session) => session.id),
    ).toEqual(["already-local", "from-backup"]);
  });

  it("reports unavailable storage without pretending a write was saved", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await expect(openCourseStore(characters)).rejects.toMatchObject({
      code: "unavailable",
    });
    const store = await open();
    await store.startSession("stored", lesson, 10);
    store.close();
    await expect(
      store.saveDraft("stored", 0, draftFor(lesson.exercises[0]!), 20),
    ).rejects.toMatchObject({ code: "unavailable" });
    const reopened = await open();
    expect((await reopened.getSession("stored"))?.revision).toBe(0);
  });
});
