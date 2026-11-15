import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { READING_PREVIEW as lesson } from "../src/course/reading-preview";
import { CourseRunner } from "../src/core/course-runner";
import { CourseDataError, type CourseDraft } from "../src/core/course-session";
import { openCourseStore, type CourseStore } from "../src/core/course-store";

const draft = (optionId: string | null = "name-li"): CourseDraft => ({
  response: { type: "choice", optionId },
  hintsUsed: 0,
  supports: { pinyin: false, translation: false, transcript: false },
});

describe("course UI command runner", () => {
  let factory: IDBFactory;
  let store: CourseStore;
  let runner: CourseRunner;
  const stores: CourseStore[] = [];
  const open = async (): Promise<CourseStore> => {
    const result = await openCourseStore(new Set(["我"]), factory, "runner");
    stores.push(result);
    return result;
  };
  beforeEach(async () => {
    factory = new IDBFactory();
    store = await open();
    runner = new CourseRunner(store, lesson);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const opened of stores) opened.close();
    stores.length = 0;
  });

  it("loads empty, creates independently pinned sessions and chooses the latest even when completed", async () => {
    await runner.load();
    expect(runner.state.session).toBeNull();
    await runner.start();
    const first = runner.state.session!;
    await runner.setDraft(draft());
    await runner.submit();
    await runner.advance();
    await runner.start();
    const second = runner.state.session!;
    expect(second.id).not.toBe(first.id);
    expect(second.updatedAt).toBeGreaterThan(first.updatedAt);
    expect((await store.exportProgress()).sessions).toHaveLength(2);
    expect((await store.exportProgress()).attempts).toHaveLength(1);
    const resumed = new CourseRunner(store, { ...lesson, version: "0.2.0" });
    await resumed.load();
    expect(resumed.state.session?.id).toBe(second.id);
    expect(resumed.state.session?.lesson.version).toBe("0.1.0");
    for (const exercise of lesson.exercises) {
      const answer: CourseDraft = {
        ...draft(),
        response:
          exercise.type === "choice"
            ? { type: "choice", optionId: exercise.answerId }
            : exercise.type === "order"
              ? { type: "order", tokenIds: exercise.answer }
              : { type: "writing", strokes: [[{ x: 0, y: 0 }]] },
      };
      await resumed.setDraft(answer);
      await resumed.submit();
      await resumed.advance();
    }
    await runner.load();
    expect(runner.state.session?.id).toBe(second.id);
    expect(runner.state.session?.status).toBe("completed");
  });

  it("shows the newest local draft immediately while serializing overlapping saves", async () => {
    await runner.start();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = store.saveDraft.bind(store);
    const saved = vi
      .spyOn(store, "saveDraft")
      .mockImplementationOnce(async (...args) => {
        await gate;
        return original(...args);
      });
    const first = runner.setDraft(draft("name-lin"));
    const second = runner.setDraft(draft("name-li"));
    expect(runner.state.draft?.response).toEqual({
      type: "choice",
      optionId: "name-li",
    });
    expect(runner.state.saving).toBe(true);
    expect(runner.state.dirty).toBe(true);
    await Promise.resolve();
    release();
    await Promise.all([first, second]);
    expect(saved.mock.calls.map((call) => call[1])).toEqual([0, 1]);
    expect(runner.state.session?.revision).toBe(2);
    expect(runner.state.dirty).toBe(false);
    expect(runner.state.saving).toBe(false);
    expect(
      (await store.getSession(runner.state.session!.id))?.draft?.response,
    ).toEqual({ type: "choice", optionId: "name-li" });
  });

  it("retains aids after hiding them and restores edits and feedback on a new runner", async () => {
    await runner.start();
    await runner.setDraft({
      ...draft(null),
      hintsUsed: 1,
      supports: { pinyin: true, translation: true, transcript: false },
    });
    await runner.setDraft(draft());
    const resumed = new CourseRunner(await open(), lesson);
    await resumed.load();
    expect(resumed.state.draft).toMatchObject({
      hintsUsed: 1,
      supports: { pinyin: true, translation: true },
    });
    await resumed.submit();
    expect(resumed.state.attempts[0]?.evidence).toMatchObject({
      hintsUsed: 1,
      supports: { pinyin: true, translation: true },
    });
    await runner.load();
    expect(runner.state.draft).toBeNull();
    expect(runner.state.session?.feedbackId).toBe(runner.state.attempts[0]?.id);
  });

  it("retains a failed autosave for export or retry, and refuses implicit discard", async () => {
    await runner.start();
    const fail = vi
      .spyOn(store, "saveDraft")
      .mockRejectedValue(new CourseDataError("quota", "Test quota"));
    await expect(runner.setDraft(draft())).rejects.toMatchObject({
      code: "quota",
    });
    expect(runner.state).toMatchObject({
      draft: draft(),
      dirty: true,
      saving: false,
      error: { code: "quota" },
    });
    expect(
      (await store.getSession(runner.state.session!.id))?.draft,
    ).toBeNull();
    await expect(runner.load()).rejects.toMatchObject({ code: "conflict" });
    await expect(runner.start()).rejects.toMatchObject({ code: "conflict" });
    expect(runner.state.draft).toEqual(draft());
    fail.mockRestore();
    await runner.flush();
    expect(runner.state).toMatchObject({
      dirty: false,
      error: null,
      draft: draft(),
    });
  });

  it("keeps the stable attempt ID after a lost commit acknowledgement and never duplicates evidence", async () => {
    await runner.start();
    await runner.setDraft(draft());
    const original = store.submitAttempt.bind(store);
    const submit = vi
      .spyOn(store, "submitAttempt")
      .mockImplementationOnce(async (...args) => {
        await original(...args);
        throw new CourseDataError("unavailable", "Acknowledgement lost");
      });
    await expect(runner.submit()).rejects.toMatchObject({
      code: "unavailable",
    });
    expect(runner.state).toMatchObject({
      draft: draft(),
      dirty: true,
      pendingSubmission: true,
    });
    expect((await store.exportProgress()).attempts).toHaveLength(1);
    await expect(runner.setDraft(draft("name-lin"))).rejects.toMatchObject({
      code: "conflict",
    });
    await runner.submit();
    expect(submit.mock.calls[0]?.[2]).toBe(submit.mock.calls[1]?.[2]);
    expect(runner.state).toMatchObject({
      draft: null,
      dirty: false,
      pendingSubmission: false,
      error: null,
    });
    expect((await store.exportProgress()).attempts).toHaveLength(1);
    expect(runner.state.attempts).toHaveLength(1);
  });

  it("refreshes replayed evidence if another connection advanced after an uncertain submission", async () => {
    await runner.start();
    await runner.setDraft(draft());
    const original = store.submitAttempt.bind(store);
    vi.spyOn(store, "submitAttempt").mockImplementationOnce(async (...args) => {
      const committed = await original(...args);
      await store.advance(committed.session.id, committed.session.revision);
      throw new CourseDataError("unavailable", "Acknowledgement lost");
    });
    await expect(runner.submit()).rejects.toThrow();
    await runner.submit();
    expect(runner.state.session?.stepIndex).toBe(1);
    expect(runner.state.attempts).toHaveLength(1);
  });

  it.each([false, true])(
    "keeps another connection's saved draft after an uncertain submission replay (advanced=%s)",
    async (advanced) => {
      await runner.start();
      await runner.setDraft(draft());
      const other = await open();
      const remoteDraft: CourseDraft = {
        response: {
          type: "choice",
          optionId: advanced ? "introduce" : null,
        },
        hintsUsed: 2,
        supports: { pinyin: true, translation: true, transcript: false },
      };
      const original = store.submitAttempt.bind(store);
      const submit = vi
        .spyOn(store, "submitAttempt")
        .mockImplementationOnce(async (...args) => {
          const committed = await original(...args);
          const remote = advanced
            ? await other.advance(
                committed.session.id,
                committed.session.revision,
              )
            : committed.session;
          await other.saveDraft(remote.id, remote.revision, remoteDraft);
          throw new CourseDataError("unavailable", "Acknowledgement lost");
        });
      await expect(runner.submit()).rejects.toMatchObject({
        code: "unavailable",
      });
      await runner.submit();
      expect(submit.mock.calls[0]?.[2]).toBe(submit.mock.calls[1]?.[2]);
      expect(runner.state.session?.stepIndex).toBe(advanced ? 1 : 0);
      expect(runner.state.draft).toEqual(remoteDraft);
      expect(runner.state.session?.draft).toEqual(remoteDraft);
      expect(runner.state).toMatchObject({
        dirty: false,
        pendingSubmission: false,
        error: null,
      });
      expect(runner.state.attempts).toHaveLength(1);
      expect((await store.exportProgress()).attempts).toHaveLength(1);
      expect((await other.getSession(runner.state.session!.id))?.draft).toEqual(
        remoteDraft,
      );
    },
  );

  it("rejects empty submissions without locking the answer and blocks advance while editing", async () => {
    await runner.start();
    await runner.setDraft(draft(null));
    await expect(runner.submit()).rejects.toMatchObject({ code: "invalid" });
    expect(runner.state.pendingSubmission).toBe(false);
    await runner.setDraft(draft());
    await expect(runner.advance()).rejects.toMatchObject({ code: "conflict" });
    expect((await store.exportProgress()).attempts).toHaveLength(0);
    await runner.submit();
    await runner.advance();
    expect(runner.state.session?.stepIndex).toBe(1);
  });

  it("persists a blank retry, marks feedback as assistance and keeps it on resume", async () => {
    await runner.start();
    await runner.setDraft(draft("name-lin"));
    await runner.submit();
    expect(runner.state.attempts[0]?.evidence.outcome).toBe("incorrect");
    await runner.retry();
    expect(runner.state.draft).toMatchObject({
      response: { type: "choice", optionId: null },
      hintsUsed: 1,
    });
    const resumed = new CourseRunner(await open(), lesson);
    await resumed.load();
    expect(resumed.state.draft).toEqual(runner.state.draft);
    expect(resumed.state.session?.feedbackId).not.toBeNull();
    await resumed.setDraft(draft());
    await resumed.submit();
    expect(resumed.state.attempts[1]?.evidence).toMatchObject({
      outcome: "correct",
      attemptIndex: 2,
      hintsUsed: 1,
    });
  });

  it("preserves the local answer on stale revisions until an explicit reload succeeds", async () => {
    await runner.start();
    const id = runner.state.session!.id;
    const other = await open();
    await other.saveDraft(id, 0, draft("name-lin"));
    await expect(runner.setDraft(draft())).rejects.toMatchObject({
      code: "conflict",
    });
    expect(runner.state).toMatchObject({ draft: draft(), dirty: true });
    await expect(runner.load()).rejects.toMatchObject({ code: "conflict" });
    await runner.discardAndReload();
    expect(runner.state).toMatchObject({
      draft: draft("name-lin"),
      dirty: false,
      error: null,
    });
  });

  it("does not discard a local recovery draft when the explicit reload cannot read storage", async () => {
    await runner.start();
    vi.spyOn(store, "saveDraft").mockRejectedValueOnce(
      new CourseDataError("quota", "Test quota"),
    );
    await expect(runner.setDraft(draft())).rejects.toThrow();
    vi.spyOn(store, "exportProgress").mockRejectedValueOnce(
      new CourseDataError("unavailable", "Cannot read"),
    );
    await expect(runner.discardAndReload()).rejects.toMatchObject({
      code: "unavailable",
    });
    expect(runner.state.draft).toEqual(draft());
    expect(runner.state.dirty).toBe(true);
  });
});
