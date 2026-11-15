import "./view.css";
import { getLocale } from "../i18n";
import { icon } from "../icons";
import { CourseRunner } from "../core/course-runner";
import { openCourseStore } from "../core/course-store";
import {
  CourseDataError,
  isRecord,
  parseCourseDraft,
  type CourseDraft,
} from "../core/course-session";
import type { CourseExercise, CourseUtterance } from "../core/course";
import { READING_PREVIEW, supportsReadingPreview } from "./reading-preview";
import { courseText as c, type CourseTextKey } from "./text";

const escape = (text: string): string =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

/** Opt-in editorial preview. Existing learning routes keep their own state. */
export class MissionView {
  active = false;
  private runner: CourseRunner | null = null;
  private loaded = false;
  private loading = false;
  private busy = false;
  private screen: "overview" | "activity" = "overview";
  private locale = getLocale();
  private showPinyin = false;
  private showTranslation = false;
  private showDialogue = false;
  private openError: unknown = null;
  private notice: CourseTextKey | null = null;
  private failedCommand: (() => Promise<void>) | null = null;
  private failedFocus: "heading" | "feedback" | undefined;

  constructor(
    private readonly host: HTMLElement,
    private readonly characters: ReadonlySet<string>,
    private readonly exit: () => void,
    private readonly write: (char: string) => void,
  ) {
    host.addEventListener("click", (event) => {
      if (!this.active || !(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>(
        "button[data-course]",
      );
      if (button && !button.disabled) void this.click(button);
    });
    host.addEventListener("submit", (event) => {
      if (
        !this.active ||
        !(event.target instanceof HTMLFormElement) ||
        !event.target.matches("[data-course-form]")
      )
        return;
      event.preventDefault();
      if (this.canSubmit())
        void this.perform(() => this.runner!.submit(), "feedback");
    });
    host.addEventListener("change", (event) => {
      if (
        !this.active ||
        !(event.target instanceof HTMLInputElement) ||
        !event.target.matches("[data-course-recovery]")
      )
        return;
      const input = event.target;
      const file = input.files?.[0];
      if (file)
        void this.restoreRecovery(file).finally(() => {
          input.value = "";
        });
    });
    window.addEventListener("beforeunload", (event) => {
      if (!this.runner?.state.dirty && !this.runner?.state.pendingSubmission)
        return;
      event.preventDefault();
      event.returnValue = "";
    });
    window.addEventListener("hanzi-wallet:course-imported", () => {
      // A pending answer stays available for recovery rather than being replaced.
      if (!this.runner || this.runner.state.dirty || this.busy) return;
      void this.perform(() => this.refresh(), "heading");
    });
  }

  async open(): Promise<void> {
    this.active = true;
    if (
      this.loaded &&
      (this.runner?.state.dirty ||
        this.runner?.state.saving ||
        this.runner?.state.pendingSubmission)
    ) {
      this.render(true);
      return;
    }
    this.loading = true;
    this.render(true);
    try {
      this.runner ??= new CourseRunner(
        await openCourseStore(this.characters),
        READING_PREVIEW,
        () => this.patchStatus(),
      );
      await this.refresh();
      this.loaded = true;
      this.openError = null;
      if (this.runner.state.session) this.screen = "activity";
    } catch (error) {
      this.openError = error;
    } finally {
      this.loading = false;
      this.render(true);
    }
  }

  private async refresh(discard = false): Promise<void> {
    if (discard) await this.runner!.discardAndReload();
    else await this.runner!.load();
    this.showPinyin = this.showTranslation = this.showDialogue = false;
  }

  /** Focus events do not recreate a live activity or discard its selection. */
  render(focus = false): void {
    if (!this.active) return;
    const languageChanged = this.locale !== getLocale();
    if (
      !focus &&
      !languageChanged &&
      this.host.querySelector("[data-course-root]")
    ) {
      this.patchStatus();
      return;
    }
    this.locale = getLocale();
    this.paint(focus ? "heading" : undefined);
  }

  private get session() {
    return this.runner?.state.session ?? null;
  }
  private get exercise(): CourseExercise | undefined {
    return this.session?.lesson.exercises[this.session.stepIndex];
  }
  private get feedback() {
    const session = this.session;
    return session && !this.runner?.state.draft
      ? this.runner?.state.attempts.find(
          (item) => item.id === session.feedbackId,
        )
      : undefined;
  }
  private get lesson() {
    return this.session?.lesson ?? READING_PREVIEW;
  }
  private button(action: string, label: string, css = "secondary"): string {
    const toggle = action.startsWith("pinyin")
      ? this.showPinyin
      : action.startsWith("translation")
        ? this.showTranslation
        : action === "dialogue"
          ? this.showDialogue
          : undefined;
    return `<button type="button" class="${css}" data-course="${action}" ${toggle === undefined ? "" : `aria-pressed="${toggle}"`}>${label}</button>`;
  }
  private canSubmit(): boolean {
    if (
      this.busy ||
      this.feedback ||
      !this.exercise ||
      !supportsReadingPreview(this.lesson)
    )
      return false;
    const response = this.runner?.state.draft?.response;
    if (this.exercise.type === "choice")
      return response?.type === "choice" && response.optionId !== null;
    return (
      this.exercise.type === "order" &&
      response?.type === "order" &&
      response.tokenIds.length === this.exercise.tokens.length
    );
  }
  private baseDraft(): CourseDraft {
    const existing = this.runner?.state.draft;
    if (existing) return structuredClone(existing);
    const evidence = this.feedback?.evidence;
    return {
      response:
        this.exercise?.type === "order"
          ? { type: "order", tokenIds: [] }
          : { type: "choice", optionId: null },
      hintsUsed: evidence ? Math.min(10000, evidence.hintsUsed + 1) : 0,
      supports: evidence
        ? { ...evidence.supports }
        : { pinyin: false, translation: false, transcript: false },
    };
  }

  private paint(focus?: "heading" | "feedback" | string): void {
    if (!this.active) return;
    const content = this.loading
      ? `<h2 tabindex="-1" data-course-heading>${c("loading")}</h2>`
      : this.openError
        ? `<h2 tabindex="-1" data-course-heading>${c("restoreError")}</h2>${this.button("open", c("tryAgain"))}`
        : !supportsReadingPreview(this.lesson)
          ? `<h2 tabindex="-1" data-course-heading>${c("unsupported")}</h2><p class="mission-note">${c("unsupportedNote")}</p>`
          : this.screen === "overview"
            ? this.overview()
            : this.session?.status === "completed"
              ? this.summary()
              : this.activity();
    this.host.innerHTML = `<section class="glass learn-board mission-board" data-course-root>
      ${this.button("exit", `${icon("back")}${c("back")}`, "text-button learn-back")}
      ${content}
      <div class="mission-save" role="status" aria-live="polite" data-course-save></div>
      <div data-course-error></div>
      ${!this.loading && this.loaded && supportsReadingPreview(this.lesson) ? `<div class="learn-feedback-actions">${this.button("import-recovery", c("importRecovery"), "text-button")}</div><input type="file" accept="application/json,.json" data-course-recovery hidden><p class="mission-note" role="status" data-course-notice>${this.notice ? c(this.notice) : ""}</p>` : ""}
    </section>`;
    this.patchStatus();
    if (focus && !this.host.hidden) {
      const selector =
        focus === "feedback"
          ? "[data-course-feedback]"
          : focus === "heading"
            ? "[data-course-heading]"
            : focus;
      const target = this.host.querySelector<HTMLElement>(selector);
      target?.focus();
      if (
        target &&
        (focus === "heading" ||
          focus === "feedback" ||
          selector.includes('[role="alert"]')) &&
        matchMedia("(max-width: 680px), (max-height: 700px)").matches
      )
        target.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }

  private overview(): string {
    const lesson = this.lesson;
    const locale = getLocale();
    return `<div class="learn-board-title"><span class="eyebrow">${c("preview")}</span>
      <h2 tabindex="-1" data-course-heading>${escape(lesson.title[locale])}</h2><p>${escape(lesson.objective[locale])}</p></div>
      <p class="mission-note">${c("draftNote")}</p>
      <div class="mission-dialogue">${lesson.utterances
        .slice(0, 2)
        .map((line) => this.line(line))
        .join("")}</div>
      <div class="learn-feedback-actions">${this.button("pinyin-overview", c("pinyin"), "tool-button")}${this.button("translation-overview", c("translation"), "tool-button")}</div>
      <div class="mission-footer">${this.button(this.session ? "resume" : "start", `${c(this.session ? "resume" : "start")}${icon("arrow")}`, "button-primary")}</div>`;
  }
  private line(line: CourseUtterance, showSpeaker = true): string {
    return `<article class="mission-line">${showSpeaker ? `<span class="mission-speaker" lang="zh-CN">${escape(line.speaker)}</span>` : ""}
      <p class="mission-hanzi" lang="zh-CN">${escape(line.hanzi)}</p>
      ${this.showPinyin ? `<p class="learn-pinyin" lang="zh-Latn">${escape(line.pinyin)}</p>` : ""}
      ${this.showTranslation ? `<p>${escape(line.translation[getLocale()])}</p>` : ""}
      </article>`;
  }
  private activity(): string {
    const session = this.session;
    const exercise = this.exercise;
    if (!session || !exercise) return this.overview();
    const feedback = this.feedback;
    const locale = getLocale();
    const line =
      exercise.type === "choice" && exercise.target.kind === "utterance"
        ? this.lesson.utterances.find((item) => item.id === exercise.target.id)
        : undefined;
    const body = feedback
      ? this.feedbackHTML()
      : `<form data-course-form>
      ${exercise.type === "choice" ? this.choices() : this.ordering()}
      <div class="mission-footer"><button type="submit" class="button-primary" data-course-check ${this.canSubmit() ? "" : "disabled"}>${c("check")}${icon("check")}</button></div></form>`;
    return `<div class="learn-round-meta"><span>${c("preview")}</span><span>${session.stepIndex + 1} / ${this.lesson.exercises.length}</span></div>
      <progress class="learn-progress" value="${session.stepIndex}" max="${this.lesson.exercises.length}" aria-label="${escape(this.lesson.title[locale])}"></progress>
      <div class="learn-board-title"><span class="eyebrow">${c("reading")}</span><h2 tabindex="-1" data-course-heading>${escape(exercise.prompt[locale])}</h2></div>
      ${line ? this.line(line, false) : ""}${body}
      ${feedback ? "" : `<div class="learn-feedback-actions">${this.button("pinyin", c("pinyin"), "tool-button")}${this.button("translation", c("translation"), "tool-button")}${this.button("dialogue", c("reviewDialogue"), "tool-button")}</div>`}
      ${this.helpContent()}
      <div class="mission-footer">${this.button("overview", `${icon("back")}${c("dialogue")}`, "text-button")}</div>`;
  }
  private helpContent(): string {
    const exercise = this.exercise;
    const line =
      exercise?.type === "order"
        ? this.lesson.utterances.find(
            (item) => item.id === exercise.utteranceId,
          )
        : exercise?.type === "choice" && exercise.target.kind === "word"
          ? this.lesson.utterances.find((item) => item.id === "line-li")
          : undefined;
    const word =
      exercise?.type === "choice" && exercise.target.kind === "word"
        ? this.lesson.words.find((word) => word.id === exercise.target.id)
        : undefined;
    return `${
      (this.showPinyin || this.showTranslation) && (line || word)
        ? `<aside class="mission-help"><span>${c("helpUsed")}</span>
      ${this.showPinyin ? `<p class="learn-pinyin" lang="zh-Latn">${escape(word?.pinyin ?? line!.pinyin)}</p>` : ""}
      ${this.showTranslation ? `<p>${escape(word?.meaning[getLocale()] ?? line!.translation[getLocale()])}</p>` : ""}</aside>`
        : ""
    }
      ${
        this.showDialogue
          ? `<aside class="mission-help"><span>${c("helpUsed")}</span>${this.lesson.utterances
              .slice(0, 2)
              .map((line) => this.line(line))
              .join("")}</aside>`
          : ""
      }`;
  }
  private choices(): string {
    const exercise = this.exercise;
    if (exercise?.type !== "choice") return "";
    const response = this.runner?.state.draft?.response;
    return `<div class="learn-options" role="group" aria-label="${escape(exercise.prompt[getLocale()])}">${exercise.options
      .map(
        (option) =>
          `<button type="button" class="secondary mission-option" data-course="choice" data-value="${option.id}" aria-pressed="${response?.type === "choice" && response.optionId === option.id}">${escape(option.label[getLocale()])}</button>`,
      )
      .join("")}</div>`;
  }
  private ordering(): string {
    const exercise = this.exercise;
    if (exercise?.type !== "order") return "";
    const response = this.runner?.state.draft?.response;
    const selected = response?.type === "order" ? response.tokenIds : [];
    return `<div class="mission-order"><p id="mission-selected-label">${c("orderSelected")}</p>
      <div class="mission-token-row mission-answer-row" role="group" aria-labelledby="mission-selected-label">
        ${
          selected
            .map((id) => {
              const token = exercise.tokens.find((item) => item.id === id)!;
              return `<button type="button" class="secondary mission-token" data-course="remove" data-value="${id}" aria-label="${escape(c("removeToken", { token: token.text }))}"><span lang="zh-CN">${escape(token.text)}</span>${icon("close")}</button>`;
            })
            .join("") ||
          `<span class="mission-placeholder">${c("emptyOrder")}</span>`
        }
      </div><p id="mission-available-label">${c("orderAvailable")}</p><div class="mission-token-row" role="group" aria-labelledby="mission-available-label">
        ${exercise.tokens
          .filter((item) => !selected.includes(item.id))
          .map(
            (token) =>
              `<button type="button" class="secondary mission-token" data-course="token" data-value="${token.id}"><span lang="zh-CN">${escape(token.text)}</span></button>`,
          )
          .join("")}
      </div></div>`;
  }
  private feedbackHTML(): string {
    const feedback = this.feedback;
    if (!feedback || !this.exercise) return "";
    const correct = feedback.evidence.outcome === "correct";
    return `<div class="learn-feedback ${correct ? "hit" : "miss"}"><h3 tabindex="-1" data-course-feedback>${icon(correct ? "check" : "info")}${c(correct ? "correct" : "incorrect")}</h3>
      <p>${escape(this.exercise.explanation[getLocale()])}</p>
      ${feedback.evidence.hintsUsed || Object.values(feedback.evidence.supports).some(Boolean) ? `<small>${c("assisted")}</small>` : ""}
      </div><div class="learn-feedback-actions">${this.button("retry", c("retry"))}
      ${correct ? this.button("next", `${c(this.session!.stepIndex === this.lesson.exercises.length - 1 ? "finish" : "continue")}${icon("arrow")}`, "button-primary") : ""}</div>`;
  }
  private summary(): string {
    const attempts = this.runner?.state.attempts ?? [];
    const first = this.lesson.exercises.map(
      (exercise) =>
        attempts
          .filter((item) => item.evidence.exerciseId === exercise.id)
          .sort((a, b) => a.evidence.attemptIndex - b.evidence.attemptIndex)[0],
    );
    const autonomous = first.filter(
      (item) =>
        item?.evidence.outcome === "correct" &&
        !item.evidence.hintsUsed &&
        !Object.values(item.evidence.supports).some(Boolean),
    ).length;
    const assisted = this.lesson.exercises.filter((exercise) =>
      attempts.some(
        (item) =>
          item.evidence.exerciseId === exercise.id &&
          (item.evidence.hintsUsed ||
            Object.values(item.evidence.supports).some(Boolean)),
      ),
    ).length;
    return `<div class="learn-board-title"><span class="eyebrow">${c("preview")}</span><h2 tabindex="-1" data-course-heading>${c("summary")}</h2><p>${c("summaryNote")}</p></div>
      <div class="learn-stats mission-results"><div><strong>${autonomous} / ${this.lesson.exercises.length}</strong><span>${c("firstAttempts")}</span></div><div><strong>${assisted}</strong><span>${c("assisted")}</span></div></div>
      <div class="learn-feedback-actions">${this.button("write", `${icon("pen")}${c("writingLink")}`)}${this.button("practice-again", c("practiceAgain"), "text-button")}</div>
      <div data-course-restart hidden class="mission-help"><p>${c("restartConfirm")}</p><div class="learn-feedback-actions">${this.button("start", c("start"))}${this.button("cancel-restart", c("cancel"), "text-button")}</div></div>`;
  }

  private patchStatus(): void {
    if (!this.active || !this.host.querySelector("[data-course-root]")) return;
    const state = this.runner?.state;
    const status = this.host.querySelector<HTMLElement>("[data-course-save]");
    if (status)
      status.textContent = state?.saving
        ? c("saving")
        : state?.dirty
          ? c("unsaved")
          : this.session
            ? c("saved")
            : "";
    const error = this.host.querySelector<HTMLElement>("[data-course-error]");
    if (error) {
      const hasError = !!state?.error;
      // Repeated autosaves update the status without replacing buttons/focus.
      if (hasError && !error.children.length) {
        const conflict =
          state?.error instanceof CourseDataError &&
          ["conflict", "deleted"].includes(state.error.code);
        error.innerHTML = `<aside class="mission-help mission-error" role="alert" tabindex="-1"><p>${c(conflict ? "conflict" : "saveError")}</p><p>${c("recoveryNote")}</p><div class="learn-feedback-actions">${this.button("save", c("retrySave"))}${this.button("recovery", c("exportRecovery"))}${this.button("reload", c("reload"), "text-button")}</div></aside>`;
      } else if (!hasError) error.replaceChildren();
    }
    this.host
      .querySelectorAll<HTMLButtonElement>(
        '[data-course="choice"],[data-course="token"],[data-course="remove"],[data-course="pinyin"],[data-course="translation"],[data-course="dialogue"],[data-course="overview"],[data-course="pinyin-overview"],[data-course="translation-overview"]',
      )
      .forEach((button) => {
        button.disabled = this.busy || !!state?.pendingSubmission;
      });
    const check = this.host.querySelector<HTMLButtonElement>(
      "[data-course-check]",
    );
    if (check) check.disabled = !this.canSubmit();
    this.host
      .querySelectorAll<HTMLButtonElement>(
        '[data-course="next"],[data-course="start"],[data-course="retry"],[data-course="reload"]',
      )
      .forEach((button) => {
        button.disabled = this.busy;
      });
  }

  private async perform(
    operation: () => Promise<void>,
    focus?: "heading" | "feedback",
  ): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.patchStatus();
    try {
      await operation();
      this.failedCommand = null;
      this.failedFocus = undefined;
    } catch {
      this.failedCommand = operation;
      this.failedFocus = focus;
    } finally {
      this.busy = false;
      this.paint(
        this.runner?.state.error ? '[data-course-error] [role="alert"]' : focus,
      );
    }
  }
  private async saveDraft(draft: CourseDraft): Promise<void> {
    this.failedCommand = null;
    this.failedFocus = undefined;
    try {
      await this.runner!.setDraft(draft);
    } catch {
      /* Keep response and controls usable; the error panel explains recovery. */
    }
  }
  private async click(button: HTMLButtonElement): Promise<void> {
    const action = button.dataset.course;
    if (action === "exit") {
      this.active = false;
      this.exit();
      return;
    }
    if (action === "open") {
      await this.open();
      return;
    }
    if (!this.runner || this.busy) return;
    if (action === "start") {
      this.screen = "activity";
      this.showPinyin = this.showTranslation = this.showDialogue = false;
      await this.perform(() => this.runner!.start(), "heading");
    } else if (action === "resume") {
      this.screen = "activity";
      this.paint("heading");
    } else if (action === "overview") {
      if (!this.feedback && this.session?.status === "active") {
        const draft = this.baseDraft();
        await this.saveDraft({
          ...draft,
          hintsUsed: Math.min(
            10000,
            draft.hintsUsed + (draft.supports.transcript ? 0 : 1),
          ),
          supports: { ...draft.supports, transcript: true },
        });
      }
      this.screen = "overview";
      this.paint("heading");
    } else if (action === "choice" && this.exercise?.type === "choice") {
      const draft = this.baseDraft();
      const next = {
        ...draft,
        response: { type: "choice" as const, optionId: button.dataset.value! },
      };
      const pending = this.saveDraft(next);
      this.host
        .querySelectorAll<HTMLButtonElement>('[data-course="choice"]')
        .forEach((option) =>
          option.setAttribute("aria-pressed", String(option === button)),
        );
      this.patchStatus();
      await pending;
    } else if (
      (action === "token" || action === "remove") &&
      this.exercise?.type === "order"
    ) {
      const draft = this.baseDraft();
      const selected =
        draft.response.type === "order" ? draft.response.tokenIds : [];
      const id = button.dataset.value!;
      const ids =
        action === "remove"
          ? selected.filter((token) => token !== id)
          : [...selected, id];
      const pending = this.saveDraft({
        ...draft,
        response: { type: "order", tokenIds: ids },
      });
      this.paint(
        `[data-course="${action === "token" ? "remove" : "token"}"][data-value="${id}"]`,
      );
      await pending;
    } else if (
      [
        "pinyin",
        "translation",
        "dialogue",
        "pinyin-overview",
        "translation-overview",
      ].includes(action ?? "")
    ) {
      const key = action!.startsWith("pinyin")
        ? "pinyin"
        : action!.startsWith("translation")
          ? "translation"
          : "transcript";
      const opening =
        key === "pinyin"
          ? !this.showPinyin
          : key === "translation"
            ? !this.showTranslation
            : !this.showDialogue;
      if (key === "pinyin") this.showPinyin = opening;
      else if (key === "translation") this.showTranslation = opening;
      else this.showDialogue = opening;
      const draft =
        this.exercise && this.session?.status === "active" && !this.feedback
          ? this.baseDraft()
          : null;
      if (draft && opening) {
        await this.saveDraft({
          ...draft,
          hintsUsed: Math.min(
            10000,
            draft.hintsUsed + (draft.supports[key] ? 0 : 1),
          ),
          supports: { ...draft.supports, [key]: true },
        });
      }
      this.paint(`[data-course="${action}"]`);
    } else if (action === "retry") {
      this.showPinyin = this.showTranslation = this.showDialogue = false;
      await this.perform(() => this.runner!.retry(), "heading");
    } else if (action === "next") {
      this.showPinyin = this.showTranslation = this.showDialogue = false;
      await this.perform(() => this.runner!.advance(), "heading");
    } else if (action === "save") {
      const state = this.runner.state;
      const operation = state.pendingSubmission
        ? () => this.runner!.submit()
        : state.dirty
          ? () => this.runner!.flush()
          : (this.failedCommand ?? (() => this.runner!.flush()));
      await this.perform(
        operation,
        state.pendingSubmission
          ? "feedback"
          : state.dirty
            ? "heading"
            : this.failedFocus,
      );
    } else if (action === "reload")
      await this.perform(() => this.refresh(true), "heading");
    else if (action === "recovery") this.exportRecovery();
    else if (action === "import-recovery")
      this.host
        .querySelector<HTMLInputElement>("[data-course-recovery]")
        ?.click();
    else if (action === "write") this.write("我");
    else if (action === "practice-again" || action === "cancel-restart") {
      const confirm = this.host.querySelector<HTMLElement>(
        "[data-course-restart]",
      );
      if (confirm) {
        confirm.hidden = action === "cancel-restart";
        if (!confirm.hidden) confirm.querySelector("button")?.focus();
        else
          this.host
            .querySelector<HTMLElement>('[data-course="practice-again"]')
            ?.focus();
      }
    }
  }
  private async restoreRecovery(file: File): Promise<void> {
    try {
      if (
        file.size > 2_000_000 ||
        !this.runner ||
        !this.session ||
        !this.exercise ||
        this.busy
      )
        throw new Error("Invalid recovery");
      const input: unknown = JSON.parse(await file.text());
      if (
        !isRecord(input) ||
        input.schemaVersion !== 1 ||
        input.type !== "hanzi-wallet-pending-answer" ||
        input.sessionId !== this.session.id ||
        input.lessonId !== this.lesson.id ||
        input.lessonVersion !== this.lesson.version ||
        input.exerciseId !== this.exercise.id ||
        this.session.status !== "active"
      )
        throw new Error("Recovery belongs to another activity");
      const draft = parseCourseDraft(input.draft, this.exercise);
      this.notice = "recoveryRestored";
      await this.perform(() => this.runner!.setDraft(draft), "heading");
      if (this.runner.state.error) this.notice = "unsaved";
    } catch {
      this.notice = "recoveryInvalid";
    }
    this.paint("heading");
  }
  private exportRecovery(): void {
    const state = this.runner?.state;
    if (!state) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            schemaVersion: 1,
            type: "hanzi-wallet-pending-answer",
            sessionId: state.session?.id,
            lessonId: state.session?.lesson.id,
            lessonVersion: state.session?.lesson.version,
            exerciseId: this.exercise?.id,
            draft: state.draft,
            exportedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hanzi-wallet-pending-answer.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}
