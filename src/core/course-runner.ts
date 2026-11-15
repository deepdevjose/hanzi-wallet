import type { CourseLesson } from "./course";
import {
  CourseDataError,
  parseCourseDraft,
  prepareCourseAttempt,
  type CourseAttempt,
  type CourseDraft,
  type CourseSession,
} from "./course-session";
import type { CourseStore } from "./course-store";

export interface CourseRunnerState {
  readonly session: CourseSession | null;
  readonly attempts: readonly CourseAttempt[];
  readonly draft: CourseDraft | null;
  readonly saving: boolean;
  readonly error: unknown | null;
  readonly dirty: boolean;
  /** Keep the answer locked until the same command is retried or reloaded. */
  readonly pendingSubmission: boolean;
}
interface PendingSubmission {
  readonly sessionId: string;
  readonly expectedRevision: number;
  readonly id: string;
  readonly draft: CourseDraft;
}
const conflict = (message: string): never => {
  throw new CourseDataError("conflict", message);
};

/** Serializes UI commands while keeping the most recent local answer visible. */
export class CourseRunner {
  private session: CourseSession | null = null;
  private attempts: readonly CourseAttempt[] = [];
  private draft: CourseDraft | null = null;
  private dirty = false;
  private error: unknown | null = null;
  private pendingSubmission: PendingSubmission | null = null;
  private pendingOperations = 0;
  private transitioning = false;
  private draftVersion = 0;
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly store: CourseStore,
    private readonly lesson: CourseLesson,
    private readonly onChange: () => void = () => {},
  ) {}

  get state(): CourseRunnerState {
    return {
      session: this.session,
      attempts: this.attempts,
      draft: this.draft,
      saving: this.pendingOperations > 0,
      error: this.error,
      dirty: this.dirty,
      pendingSubmission: this.pendingSubmission !== null,
    };
  }

  private notify(): void {
    this.onChange();
  }
  private enqueue(operation: () => Promise<void>): Promise<void> {
    this.pendingOperations++;
    this.notify();
    const pending = this.queue.then(async () => {
      try {
        await operation();
        this.error = null;
      } catch (error) {
        this.error = error;
        throw error;
      } finally {
        this.pendingOperations--;
        this.notify();
      }
    });
    // A failed caller still receives its error; later commands can recover.
    this.queue = pending.catch(() => {});
    return pending;
  }
  private command(operation: () => Promise<void>): Promise<void> {
    if (this.transitioning)
      return Promise.reject(
        new CourseDataError("conflict", "Another course command is pending"),
      );
    this.transitioning = true;
    return this.enqueue(operation).finally(() => {
      this.transitioning = false;
    });
  }
  private activeSession(): CourseSession {
    if (!this.session || this.session.status !== "active")
      return conflict("There is no active course session");
    return this.session;
  }

  private async readLatest(): Promise<void> {
    const backup = await this.store.exportProgress();
    const session =
      backup.sessions
        .filter((item) => item.lesson.id === this.lesson.id)
        .sort(
          (a, b) =>
            b.updatedAt - a.updatedAt ||
            b.createdAt - a.createdAt ||
            b.id.localeCompare(a.id),
        )[0] ?? null;
    this.session = session;
    this.attempts = session
      ? backup.attempts.filter((item) => item.evidence.sessionId === session.id)
      : [];
    this.draft = session?.draft ?? null;
    this.dirty = false;
    this.pendingSubmission = null;
    this.draftVersion++;
  }
  /** Background refreshes cannot discard a response after a failed save. */
  load(): Promise<void> {
    return this.command(async () => {
      if (this.dirty || this.pendingSubmission)
        conflict(
          "Keep the local answer or explicitly discard it before reloading",
        );
      await this.readLatest();
    });
  }
  /** Call only after the UI has made discarding the unsaved response explicit. */
  discardAndReload(): Promise<void> {
    return this.command(() => this.readLatest());
  }
  start(): Promise<void> {
    return this.command(async () => {
      if (this.dirty || this.pendingSubmission)
        conflict("Save the current answer before starting another session");
      const now = Math.max(Date.now(), (this.session?.updatedAt ?? 0) + 1);
      const session = await this.store.startSession(
        `session-${crypto.randomUUID()}`,
        this.lesson,
        now,
      );
      this.session = session;
      this.attempts = [];
      this.draft = null;
      this.dirty = false;
      this.pendingSubmission = null;
      this.draftVersion++;
    });
  }

  private async persistDraft(
    version: number,
    draft: CourseDraft,
    sessionId: string,
    exerciseId: string,
  ): Promise<void> {
    const current = this.activeSession();
    if (
      current.id !== sessionId ||
      current.lesson.exercises[current.stepIndex]!.id !== exerciseId
    )
      return conflict("The activity changed before its draft could be saved");
    const saved = await this.store.saveDraft(
      current.id,
      current.revision,
      draft,
    );
    this.session = saved;
    if (this.draftVersion === version) {
      this.draft = saved.draft;
      this.dirty = false;
    }
  }
  async setDraft(input: CourseDraft): Promise<void> {
    if (this.transitioning || this.pendingSubmission)
      return conflict("Finish the pending command before changing the answer");
    const current = this.activeSession();
    const exercise = current.lesson.exercises[current.stepIndex]!;
    const parsed = parseCourseDraft(input, exercise);
    const previous = this.draft;
    const feedback =
      previous === null && current.feedbackId
        ? this.attempts.find((item) => item.id === current.feedbackId)?.evidence
        : undefined;
    const draft: CourseDraft = {
      response: parsed.response,
      hintsUsed: Math.max(
        parsed.hintsUsed,
        previous?.hintsUsed ??
          (feedback ? Math.min(10000, feedback.hintsUsed + 1) : 0),
      ),
      supports: {
        pinyin:
          parsed.supports.pinyin ||
          (previous?.supports.pinyin ?? feedback?.supports.pinyin ?? false),
        translation:
          parsed.supports.translation ||
          (previous?.supports.translation ??
            feedback?.supports.translation ??
            false),
        transcript:
          parsed.supports.transcript ||
          (previous?.supports.transcript ??
            feedback?.supports.transcript ??
            false),
      },
    };
    this.draft = draft;
    this.dirty = true;
    const version = ++this.draftVersion;
    return this.enqueue(() =>
      this.persistDraft(version, draft, current.id, exercise.id),
    );
  }
  private async flushDraft(): Promise<void> {
    if (this.pendingSubmission)
      return conflict(
        "Retry the pending submission before saving another response",
      );
    if (!this.dirty || !this.draft) return;
    const current = this.activeSession();
    await this.persistDraft(
      this.draftVersion,
      this.draft,
      current.id,
      current.lesson.exercises[current.stepIndex]!.id,
    );
  }
  flush(): Promise<void> {
    return this.enqueue(() => this.flushDraft());
  }
  submit(): Promise<void> {
    return this.command(async () => {
      if (!this.pendingSubmission) await this.flushDraft();
      const current = this.activeSession();
      if (!this.pendingSubmission) {
        if (!this.draft)
          return conflict("Choose a response before checking it");
        const id = `attempt-${crypto.randomUUID()}`;
        // Validate completeness before locking the response to a command ID.
        prepareCourseAttempt(current, current.revision, id, this.draft);
        this.pendingSubmission = {
          sessionId: current.id,
          expectedRevision: current.revision,
          id,
          draft: this.draft,
        };
      }
      const pending = this.pendingSubmission;
      try {
        const result = await this.store.submitAttempt(
          pending.sessionId,
          pending.expectedRevision,
          pending.id,
          pending.draft,
        );
        const attempts =
          result.session.revision === pending.expectedRevision + 1
            ? [
                ...this.attempts.filter(
                  (item) => item.id !== result.attempt.id,
                ),
                result.attempt,
              ]
            : (await this.store.exportProgress()).attempts.filter(
                (item) => item.evidence.sessionId === result.session.id,
              );
        this.session = result.session;
        this.attempts = attempts;
        // An idempotent replay returns the latest session. Another tab may
        // already have saved a retry or an answer to the following activity.
        this.draft = result.session.draft;
        this.dirty = false;
        this.pendingSubmission = null;
        this.draftVersion++;
      } catch (error) {
        // Even if a caller lost the commit acknowledgement, reuse this ID.
        this.dirty = true;
        throw error;
      }
    });
  }
  advance(): Promise<void> {
    return this.command(async () => {
      const current = this.activeSession();
      if (this.draft || this.dirty || this.pendingSubmission)
        return conflict("Check the current answer before continuing");
      this.session = await this.store.advance(current.id, current.revision);
      this.draft = this.session.draft;
      this.draftVersion++;
    });
  }
  retry(): Promise<void> {
    return this.command(async () => {
      const current = this.activeSession();
      if (!current.feedbackId || this.dirty || this.pendingSubmission)
        return conflict("Save the current response before retrying");
      const exercise = current.lesson.exercises[current.stepIndex]!;
      const previous = this.attempts.filter(
        (item) => item.evidence.exerciseId === exercise.id,
      );
      const draft: CourseDraft = {
        response:
          exercise.type === "choice"
            ? { type: "choice", optionId: null }
            : exercise.type === "order"
              ? { type: "order", tokenIds: [] }
              : { type: "writing", strokes: [] },
        hintsUsed: Math.min(
          10000,
          Math.max(0, ...previous.map((item) => item.evidence.hintsUsed)) + 1,
        ),
        supports: {
          pinyin: previous.some((item) => item.evidence.supports.pinyin),
          translation: previous.some(
            (item) => item.evidence.supports.translation,
          ),
          transcript: previous.some(
            (item) => item.evidence.supports.transcript,
          ),
        },
      };
      this.draft = draft;
      this.dirty = true;
      const version = ++this.draftVersion;
      this.notify();
      await this.persistDraft(version, draft, current.id, exercise.id);
    });
  }
}
