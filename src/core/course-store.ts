import type { CourseLesson } from "./course";
import {
  CourseDataError,
  advanceCourseSession,
  COURSE_LIMITS,
  createCourseSession,
  mergeCourseBackups,
  parseCourseBackup,
  parseCourseDraft,
  prepareCourseAttempt,
  sameCourseData,
  saveCourseDraft,
  type CourseAttempt,
  type CourseBackup,
  type CourseDeletion,
  type CourseDraft,
  type CourseSession,
} from "./course-session";

export const COURSE_DATABASE = "hanzi-wallet-course-v1";
const STORES = ["sessions", "attempts", "deletedSessions"];
const request = <T>(pending: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    pending.onsuccess = () => resolve(pending.result);
    pending.onerror = () => reject(pending.error);
  });
function storageError(error: unknown): CourseDataError {
  if (error instanceof CourseDataError) return error;
  return new CourseDataError(
    error instanceof DOMException && error.name === "QuotaExceededError"
      ? "quota"
      : "unavailable",
    "Course storage could not commit; keep the current answer and retry or export",
  );
}
/** Open lazily. No legacy keys are read, migrated, reset or mirrored. */
export async function openCourseStore(
  characters: ReadonlySet<string>,
  factory: IDBFactory | undefined = globalThis.indexedDB,
  name = COURSE_DATABASE,
): Promise<CourseStore> {
  if (!factory)
    throw new CourseDataError("unavailable", "IndexedDB is unavailable");
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown): void => {
      settled = true;
      reject(storageError(error));
    };
    try {
      const pending = factory.open(name, 1);
      pending.onupgradeneeded = () => {
        const db = pending.result;
        db.createObjectStore("sessions", { keyPath: "id" });
        db.createObjectStore("attempts", { keyPath: "id" }).createIndex(
          "sessionId",
          "evidence.sessionId",
        );
        db.createObjectStore("deletedSessions", { keyPath: "id" });
      };
      pending.onblocked = () =>
        fail(
          new CourseDataError(
            "unavailable",
            "Close other tabs and retry opening course storage",
          ),
        );
      pending.onerror = () => fail(pending.error);
      pending.onsuccess = () => {
        if (settled) {
          pending.result.close();
          return;
        }
        pending.result.onversionchange = () => pending.result.close();
        resolve(new CourseStore(pending.result, characters));
      };
    } catch (error) {
      fail(error);
    }
  });
}

export class CourseStore {
  constructor(
    private readonly db: IDBDatabase,
    private readonly characters: ReadonlySet<string>,
  ) {}
  close(): void {
    this.db.close();
  }

  /** Never acknowledge individual requests: only the transaction commit counts. */
  private transaction<T>(
    mode: IDBTransactionMode,
    operation: (tx: IDBTransaction) => Promise<T>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let tx: IDBTransaction;
      let result: T;
      let failure: unknown;
      try {
        tx = this.db.transaction(STORES, mode);
      } catch (error) {
        reject(storageError(error));
        return;
      }
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(storageError(failure ?? tx.error));
      // Do not prevent request errors: IndexedDB must abort the whole operation.
      tx.onerror = () => {
        failure ??= tx.error;
      };
      operation(tx)
        .then((value) => {
          result = value;
        })
        .catch((error: unknown) => {
          failure = error;
          try {
            tx.abort();
          } catch {
            reject(storageError(error));
          }
        });
    });
  }
  private async session(
    tx: IDBTransaction,
    id: string,
  ): Promise<CourseSession> {
    if (await request(tx.objectStore("deletedSessions").get(id)))
      throw new CourseDataError("deleted", "This session was deleted");
    const session = await request<CourseSession | undefined>(
      tx.objectStore("sessions").get(id),
    );
    if (!session) throw new CourseDataError("invalid", "Session not found");
    return session;
  }
  async getSession(id: string): Promise<CourseSession | undefined> {
    return this.transaction("readonly", async (tx) =>
      request<CourseSession | undefined>(tx.objectStore("sessions").get(id)),
    );
  }
  async startSession(
    id: string,
    lesson: CourseLesson,
    now = Date.now(),
  ): Promise<CourseSession> {
    const candidate = createCourseSession(id, lesson, this.characters, now);
    return this.transaction("readwrite", async (tx) => {
      if (await request(tx.objectStore("deletedSessions").get(id)))
        throw new CourseDataError("deleted", "Use a new ID to start again");
      const old = await request<CourseSession | undefined>(
        tx.objectStore("sessions").get(id),
      );
      if (old) {
        if (!sameCourseData(old.lesson, candidate.lesson))
          throw new CourseDataError(
            "conflict",
            "Session ID already pins other content",
          );
        return old;
      }
      if (
        (await request(tx.objectStore("sessions").count())) >=
        COURSE_LIMITS.sessions
      )
        throw new CourseDataError("invalid", "Course session limit reached");
      await request(tx.objectStore("sessions").add(candidate));
      return candidate;
    });
  }
  async saveDraft(
    id: string,
    expectedRevision: number,
    draft: CourseDraft | null,
    now = Date.now(),
  ): Promise<CourseSession> {
    return this.transaction("readwrite", async (tx) => {
      const session = saveCourseDraft(
        await this.session(tx, id),
        expectedRevision,
        draft,
        now,
      );
      await request(tx.objectStore("sessions").put(session));
      return session;
    });
  }
  async submitAttempt(
    id: string,
    expectedRevision: number,
    attemptId: string,
    draft: CourseDraft,
    now = Date.now(),
  ): Promise<{ session: CourseSession; attempt: CourseAttempt }> {
    return this.transaction("readwrite", async (tx) => {
      const session = await this.session(tx, id);
      const existing = await request<CourseAttempt | undefined>(
        tx.objectStore("attempts").get(attemptId),
      );
      if (existing) {
        const exercise = session.lesson.exercises.find(
          (item) => item.id === existing.evidence.exerciseId,
        );
        if (
          !exercise ||
          existing.evidence.sessionId !== id ||
          existing.expectedRevision !== expectedRevision
        )
          throw new CourseDataError(
            "conflict",
            "Attempt ID already used by another command",
          );
        const parsed = parseCourseDraft(draft, exercise);
        if (
          !sameCourseData(existing.response, parsed.response) ||
          existing.evidence.hintsUsed !== parsed.hintsUsed ||
          !sameCourseData(existing.evidence.supports, parsed.supports)
        )
          throw new CourseDataError(
            "conflict",
            "Attempt ID has different content",
          );
        return { session, attempt: existing };
      }
      const prepared = prepareCourseAttempt(
        session,
        expectedRevision,
        attemptId,
        draft,
        now,
      );
      if (
        (await request(tx.objectStore("attempts").count())) >=
        COURSE_LIMITS.attempts
      )
        throw new CourseDataError("invalid", "Course attempt limit reached");
      await request(tx.objectStore("attempts").add(prepared.attempt));
      await request(tx.objectStore("sessions").put(prepared.session));
      return prepared;
    });
  }
  async advance(
    id: string,
    expectedRevision: number,
    now = Date.now(),
  ): Promise<CourseSession> {
    return this.transaction("readwrite", async (tx) => {
      const session = advanceCourseSession(
        await this.session(tx, id),
        expectedRevision,
        now,
      );
      await request(tx.objectStore("sessions").put(session));
      return session;
    });
  }
  async deleteSession(
    id: string,
    expectedRevision: number,
    now = Date.now(),
  ): Promise<void> {
    return this.transaction("readwrite", async (tx) => {
      if (await request(tx.objectStore("deletedSessions").get(id))) return;
      const session = await this.session(tx, id);
      // Completed sessions can also be explicitly removed.
      if (session.revision !== expectedRevision)
        throw new CourseDataError(
          "conflict",
          "Session changed; reload before deleting",
        );
      if (
        (await request(tx.objectStore("deletedSessions").count())) >=
        COURSE_LIMITS.deletions
      )
        throw new CourseDataError("invalid", "Course deletion limit reached");
      if (!Number.isSafeInteger(now) || now < 0)
        throw new CourseDataError("invalid", "Invalid deletion time");
      const keys = await request(
        tx.objectStore("attempts").index("sessionId").getAllKeys(id),
      );
      for (const key of keys) tx.objectStore("attempts").delete(key);
      tx.objectStore("sessions").delete(id);
      await request(
        tx
          .objectStore("deletedSessions")
          .put({ id, deletedAt: now } satisfies CourseDeletion),
      );
    });
  }
  private async snapshot(tx: IDBTransaction): Promise<CourseBackup> {
    const [sessions, attempts, deletedSessions] = await Promise.all([
      request(tx.objectStore("sessions").getAll()),
      request(tx.objectStore("attempts").getAll()),
      request(tx.objectStore("deletedSessions").getAll()),
    ]);
    return parseCourseBackup(
      { schemaVersion: 1, sessions, attempts, deletedSessions },
      this.characters,
    );
  }
  async exportProgress(): Promise<CourseBackup> {
    return this.transaction("readonly", (tx) => this.snapshot(tx));
  }
  async importProgress(input: unknown): Promise<void> {
    // Parsing before opening a write transaction prevents partial imports.
    const incoming = parseCourseBackup(input, this.characters);
    return this.transaction("readwrite", async (tx) => {
      const merged = parseCourseBackup(
        mergeCourseBackups(await this.snapshot(tx), incoming),
        this.characters,
      );
      for (const name of STORES) tx.objectStore(name).clear();
      for (const session of merged.sessions)
        tx.objectStore("sessions").add(session);
      for (const attempt of merged.attempts)
        tx.objectStore("attempts").add(attempt);
      for (const deletion of merged.deletedSessions)
        tx.objectStore("deletedSessions").add(deletion);
    });
  }
}

export async function withCourseStore<T>(
  characters: ReadonlySet<string>,
  action: (store: CourseStore) => Promise<T>,
): Promise<T> {
  const store = await openCourseStore(characters);
  try {
    return await action(store);
  } finally {
    store.close();
  }
}
