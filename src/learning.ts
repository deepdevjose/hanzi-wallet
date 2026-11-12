import "./learning.css";
import { meaning } from "./i18n";
import { icon } from "./icons";
import { dayKey } from "./core/storage";
import {
  adaptiveQueue,
  answerOptions,
  correctMeaning,
  DAILY_TARGET,
  dailyQueue,
  emptyLearning,
  finishLearning,
  gradeLearning,
  LEARNING_KEY,
  readLearning,
  streak,
  XP_PER_LEVEL,
  type Answer,
  type LearningProgress,
  type RoundKind,
} from "./core/learning";
import type { VocabularyEntry } from "./core/types";
import {
  COMPONENTS,
  CONTEXT,
  learnText as l,
  levelLessons,
  lessonName,
  localized,
  type Lesson,
} from "./learning-content";
import hskLevels from "./hsk-levels.json";

const LEVEL_KEY = "hanzi-wallet-hsk-level";
const GROUPS_PER_PAGE = 8;

interface Question {
  readonly char: string;
  readonly retry: boolean;
}
interface Round {
  readonly kind: RoundKind;
  readonly day: string;
  readonly lesson?: Lesson;
  readonly total: number;
  readonly queue: Question[];
  index: number;
  firstCorrect: number;
  recovered: number;
  xp: number;
  won: boolean;
}
interface Response {
  readonly grade: Answer;
  readonly entered: boolean;
}

export class LearningView {
  private readonly entries: ReadonlyMap<string, VocabularyEntry>;
  private readonly known: ReadonlySet<string>;
  private level = hskLevels[0]!;
  private page = 0;
  private progress: LearningProgress;
  private canPersist = true;
  private round: Round | null = null;
  private lesson: Lesson | null = null;
  private options: VocabularyEntry[] | null = null;
  private response: Response | null = null;
  private busy = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly vocabulary: readonly VocabularyEntry[],
    private readonly escape: (value: string) => string,
    private readonly speak: (entry: VocabularyEntry) => Promise<void>,
    private readonly write: (char: string) => void,
    private readonly notify: (message: string) => void,
    private readonly onProgress: () => void,
  ) {
    this.entries = new Map(vocabulary.map((entry) => [entry.char, entry]));
    this.known = new Set(this.entries.keys());
    try {
      const label = localStorage.getItem(LEVEL_KEY);
      this.level =
        hskLevels.find((level) => level.label === label) ?? this.level;
    } catch {
      this.canPersist = false;
    }
    this.progress = this.read();
    host.addEventListener("click", (event) => this.click(event));
    host.addEventListener("submit", (event) => this.submit(event));
    window.addEventListener("storage", (event) => {
      if (event.key !== LEARNING_KEY && event.key !== null) return;
      this.progress = this.read();
      this.onProgress();
      if (!this.round && !this.lesson && !this.host.hidden) this.render();
    });
    window.addEventListener("focus", () => {
      if (!this.round && !this.lesson && !this.host.hidden) this.render();
      this.onProgress();
    });
  }

  get due(): number {
    return [...this.level.chars].filter(
      (char) =>
        (this.progress.cards[char]?.nextReview ?? Infinity) <= Date.now(),
    ).length;
  }

  private get lessons(): Lesson[] {
    return levelLessons(this.level.label, this.level.chars);
  }

  private read(): LearningProgress {
    try {
      const raw = localStorage.getItem(LEARNING_KEY);
      return raw
        ? readLearning(JSON.parse(raw) as unknown, this.known)
        : emptyLearning();
    } catch {
      this.canPersist = false;
      return emptyLearning();
    }
  }

  private async update(
    change: (progress: LearningProgress) => LearningProgress,
  ): Promise<number> {
    const apply = (): number => {
      const stored = this.canPersist ? this.read() : this.progress;
      const before = this.canPersist ? stored : this.progress;
      const next = change(before);
      const xp = next.xp - before.xp;
      this.progress = next;
      if (this.canPersist) {
        try {
          localStorage.setItem(LEARNING_KEY, JSON.stringify(next));
        } catch {
          this.canPersist = false;
          this.notify(l("storageError"));
        }
      }
      return xp;
    };
    const xp = navigator.locks
      ? await navigator.locks.request(LEARNING_KEY, apply)
      : apply();
    this.onProgress();
    return xp;
  }

  private lessonChars(lesson: Lesson): string[] {
    return [...lesson.chars].filter((char) => this.known.has(char));
  }

  private start(kind: RoundKind): void {
    const now = Date.now();
    const today = dayKey(now);
    if (kind === "daily" && this.progress.challenges.includes(today)) {
      this.render();
      return;
    }
    const lesson = kind === "lesson" ? (this.lesson ?? undefined) : undefined;
    if (kind === "lesson" && !lesson) return;
    if (kind === "daily" && this.level.chars.length < 5) return;
    const ordered = this.lessons.flatMap((unit) => this.lessonChars(unit));
    const chars = lesson
      ? this.lessonChars(lesson)
      : kind === "daily"
        ? dailyQueue(today, ordered)
        : adaptiveQueue(
            this.progress,
            ordered,
            now,
            kind === "errors" ? "errors" : "adaptive",
          );
    if (!chars.length) return;
    this.round = {
      kind,
      day: today,
      lesson,
      queue: chars.map((char) => ({ char, retry: false })),
      total: chars.length,
      index: 0,
      firstCorrect: 0,
      recovered: 0,
      xp: 0,
      won: false,
    };
    this.render(true);
  }

  private reset(): void {
    this.round = null;
    this.lesson = null;
    this.options = null;
    this.response = null;
    this.render(true);
  }

  private current(): VocabularyEntry | undefined {
    const question = this.round?.queue[this.round.index];
    return question ? this.entries.get(question.char) : undefined;
  }

  private submit(event: SubmitEvent): void {
    if (
      !(event.target instanceof HTMLFormElement) ||
      !event.target.matches(".learn-answer")
    )
      return;
    event.preventDefault();
    const current = this.current();
    const value = new FormData(event.target).get("answer");
    if (
      !current ||
      typeof value !== "string" ||
      !value.trim() ||
      this.response ||
      this.busy
    )
      return;
    this.response = {
      grade: correctMeaning(value, meaning(current)) ? "recall" : "miss",
      entered: true,
    };
    this.render(true);
  }

  private click(event: MouseEvent): void {
    if (!(event.target instanceof Element)) return;
    const button =
      event.target.closest<HTMLButtonElement>("button[data-learn]");
    if (!button || this.busy) return;
    const action = button.dataset.learn;
    const value = button.dataset.value;
    if (action === "back") {
      this.reset();
    } else if (
      action === "adaptive" ||
      action === "daily" ||
      action === "errors" ||
      action === "lesson"
    ) {
      this.start(action);
    } else if (action === "level") {
      const selected = hskLevels.find((level) => level.label === value);
      if (!selected || selected === this.level) return;
      this.level = selected;
      this.page = 0;
      try {
        localStorage.setItem(LEVEL_KEY, selected.label);
      } catch {
        this.canPersist = false;
      }
      this.onProgress();
      this.render();
      this.host
        .querySelector<HTMLButtonElement>(
          '[data-learn="level"][aria-pressed="true"]',
        )
        ?.focus();
    } else if (action === "page-back" || action === "page-next") {
      this.page += action === "page-next" ? 1 : -1;
      this.render();
      this.host
        .querySelector<HTMLButtonElement>('[data-learn="unit"]')
        ?.focus();
    } else if (action === "unit") {
      this.lesson = this.lessons.find((lesson) => lesson.id === value) ?? null;
      this.render(true);
    } else if (action === "listen" || action === "write") {
      const item = value ? this.entries.get(value) : undefined;
      if (!item) return;
      if (action === "write") this.write(item.char);
      else void this.speak(item);
    } else if (action === "next") {
      void this.advance();
    } else if (
      action === "self-grade" &&
      this.response?.entered &&
      this.response.grade === "miss"
    ) {
      this.response = { grade: "choice", entered: true };
      this.render(true);
    } else {
      const item = this.current();
      if (!item || this.response) return;
      if (action === "choices") {
        this.options = answerOptions(item, this.vocabulary, meaning);
      } else if (action === "skip") {
        this.response = { grade: "miss", entered: false };
      } else if (
        action === "pick" &&
        this.options?.some((option) => option.char === value)
      ) {
        this.response = {
          grade: item.char === value ? "choice" : "miss",
          entered: false,
        };
      } else return;
      this.render(true);
    }
  }

  private async advance(): Promise<void> {
    const round = this.round;
    const response = this.response;
    const question = round?.queue[round.index];
    if (!round || !question || !response || this.busy) return;
    this.busy = true;
    const next = this.host.querySelector<HTMLButtonElement>(
      '[data-learn="next"]',
    );
    if (next) next.disabled = true;
    try {
      const willRetry = !question.retry && response.grade === "miss";
      const correct = response.grade !== "miss";
      const firstCorrect =
        round.firstCorrect + Number(!question.retry && correct);
      const complete = !willRetry && round.index + 1 === round.queue.length;
      const now = Date.now();
      if (!question.retry || complete) {
        round.xp += await this.update((progress) => {
          const graded = question.retry
            ? progress
            : gradeLearning(progress, question.char, response.grade, now);
          return complete
            ? finishLearning(
                graded,
                round.kind,
                firstCorrect,
                dayKey(now),
                round.day,
              )
            : graded;
        });
      }
      if (willRetry) {
        // At most one repeat, with up to two intervening questions.
        const insert = Math.min(round.index + 3, round.queue.length);
        round.queue.splice(insert, 0, { char: question.char, retry: true });
      }
      round.firstCorrect = firstCorrect;
      if (question.retry && correct) round.recovered++;
      if (complete)
        round.won = round.kind === "daily" && firstCorrect >= DAILY_TARGET;
      round.index++;
      this.response = null;
      this.options = null;
      this.render(true);
    } catch {
      this.notify(l("storageError"));
      if (next) next.disabled = false;
    } finally {
      this.busy = false;
    }
  }

  updateLocale(): void {
    const item = this.current();
    if (item && this.options)
      this.options = answerOptions(item, this.vocabulary, meaning);
  }

  render(focus = false): void {
    const round = this.round;
    const item = this.current();
    this.host.innerHTML = round
      ? item
        ? this.question(item, round)
        : this.summary(round)
      : this.lesson
        ? this.study(this.lesson)
        : this.dashboard();
    if (focus)
      this.host.querySelector<HTMLElement>("[data-learn-focus]")?.focus();
  }

  private back(): string {
    return `<button class="text-button learn-back" data-learn="back">${icon("back")}${l("back")}</button>`;
  }

  private dashboard(): string {
    const now = Date.now();
    const done = this.progress.challenges.includes(dayKey(now));
    const errors = [...this.level.chars].some((char) => {
      const card = this.progress.cards[char];
      return card?.interval === 0 && card.lapses > 0;
    });
    const canChallenge = this.level.chars.length >= 5;
    const lessons = this.lessons;
    const start = this.page * GROUPS_PER_PAGE;
    const xp = this.progress.xp;
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const levelXp = xp % XP_PER_LEVEL;
    return `<div class="learn-level-picker">
      <div class="learn-level-tabs" role="group" aria-label="${l("path")}">${hskLevels
        .map(
          (level) =>
            `<button class="pill ${level === this.level ? "active" : ""}" data-learn="level" data-value="${level.label}" aria-pressed="${level === this.level}">HSK ${level.label}</button>`,
        )
        .join("")}</div>
      <p>${l("coverage", { available: this.level.chars.length, total: this.level.total })}</p>
    </div><div class="learn-grid">
      <section class="learn-hero" aria-labelledby="learn-main"><div class="learn-hero-content">
        <span class="learn-hero-label">${icon("sparkle")} HSK ${this.level.label}</span>
        <h2 id="learn-main" tabindex="-1" data-learn-focus>${l("adaptive")}</h2><p>${l("adaptiveText")}</p>
        <button class="learn-start" data-learn="adaptive">${l("start")}${icon("arrow")}</button>
      </div><div class="learn-art" aria-hidden="true"><span lang="zh-CN">学</span><small lang="zh-CN">汉字</small></div></section>
      <section class="glass learn-status" aria-label="${l("level", level)}">
        <div class="learn-level"><span class="learn-symbol">${icon("sparkle")}</span><div><h2>${l("level", level)}</h2><p>${xp} XP</p></div></div>
        <progress class="learn-progress" value="${levelXp}" max="${XP_PER_LEVEL}" aria-label="${l("level", level)}"></progress>
        <div class="learn-stats"><div><strong>${streak(this.progress.active, now)}</strong><span>${l("streak")}</span></div><div><strong>${this.due}</strong><span>${l("due")}</span></div></div>
      </section>
    </div>
    <div class="learn-quick">
      <section class="glass learn-tile"><span class="learn-symbol amber">${icon(done ? "check" : "sun")}</span><div><h2>${l(done ? "won" : "daily")}</h2><p>${l(done ? "tomorrow" : canChallenge ? "dailyText" : "dailySmall")}</p></div>
      ${done || !canChallenge ? "" : `<button class="secondary" data-learn="daily">${l("playDaily")}${icon("arrow")}</button>`}</section>
      <section class="glass learn-tile"><span class="learn-symbol">${icon("refresh")}</span><div><h2>${l("errors")}</h2><p>${l(errors ? "errorsText" : "noErrors")}</p></div>
      ${errors ? `<button class="secondary" data-learn="errors">${l("retryErrors")}${icon("arrow")}</button>` : ""}</section>
    </div>
    <section class="learn-path" aria-labelledby="learn-path-title"><div class="section-head"><div><h2 id="learn-path-title">${l("path")}</h2><p>${l("pathText")}</p></div></div>
    <div class="learn-units">${lessons
      .slice(start, start + GROUPS_PER_PAGE)
      .map((unit) => {
        const chars = this.lessonChars(unit);
        const seen = chars.filter(
          (char) => this.progress.cards[char]?.interval,
        ).length;
        return `<button class="glass learn-unit" data-learn="unit" data-value="${unit.id}"><span class="learn-unit-index">${String(unit.number).padStart(2, "0")}</span><span class="learn-unit-glyph" lang="zh-CN">${unit.glyph}</span><strong>${lessonName(unit)}</strong><small>${seen} / ${l("cards", chars.length)}</small></button>`;
      })
      .join("")}</div>
    ${
      lessons.length > GROUPS_PER_PAGE
        ? `<div class="learn-pagination">
      <button class="secondary" data-learn="page-back" ${this.page === 0 ? "disabled" : ""}>${icon("back")}${l("previous")}</button>
      <span>${this.page + 1} / ${Math.ceil(lessons.length / GROUPS_PER_PAGE)}</span>
      <button class="secondary" data-learn="page-next" ${start + GROUPS_PER_PAGE >= lessons.length ? "disabled" : ""}>${l("nextPage")}${icon("next")}</button>
    </div>`
        : ""
    }
    <p class="learn-local">${l("hskNote")} <a href="https://www.chinesetest.cn/syllabus" target="_blank" rel="noopener noreferrer">${l("syllabus")}</a></p></section>
    <p class="learn-local">${icon("shield")}${l(this.canPersist ? "storage" : "storageError")}</p>`;
  }

  private details(item: VocabularyEntry): string {
    const context = CONTEXT[item.char];
    const clue = COMPONENTS[item.char];
    return `${context ? `<p class="learn-context"><span>${l("example")}</span> <strong lang="zh-CN">${context[0]}</strong> <span lang="zh-Latn">${context[1]}</span> · ${this.escape(localized(context[2]))}</p>` : ""}
    ${clue ? `<p class="learn-context"><span>${l("component")}</span> ${this.escape(localized(clue))}</p>` : ""}`;
  }

  private audio(char: string): string {
    return `<button class="tool-button" data-learn="listen" data-value="${this.escape(char)}" aria-label="${l("listen")} ${this.escape(char)}">${icon("volume")}${l("listen")}</button>`;
  }

  private study(lesson: Lesson): string {
    return `<section class="glass learn-board">
      ${this.back()}<div class="learn-board-title"><h2 tabindex="-1" data-learn-focus>${lessonName(lesson)}</h2><p>${l("studyTip")}</p></div>
      <div class="learn-study">${this.lessonChars(lesson)
        .map((char) => {
          const item = this.entries.get(char)!;
          return `<article><strong class="learn-study-char" lang="zh-CN">${this.escape(char)}</strong><span class="learn-pinyin" lang="zh-Latn">${this.escape(item.pinyin)}</span><p>${this.escape(meaning(item))}</p>${this.details(item)}${this.audio(char)}</article>`;
        })
        .join(
          "",
        )}</div><button class="button-primary" data-learn="lesson">${l("quizLesson")}${icon("arrow")}</button>
    </section>`;
  }

  private question(item: VocabularyEntry, round: Round): string {
    const retry = round.queue[round.index]?.retry;
    const label = round.lesson
      ? lessonName(round.lesson)
      : l(round.kind === "lesson" ? "path" : round.kind);
    const response = this.response;
    const last =
      round.index + 1 === round.queue.length &&
      (retry || response?.grade !== "miss");
    return `<section class="glass learn-board learn-quiz">
      ${this.back()}<div class="learn-round-meta"><span>${label}</span><span>${round.index + 1} / ${round.queue.length}</span></div>
      <progress class="learn-progress" value="${round.index}" max="${round.queue.length}" aria-label="${label}"></progress>
      <div class="learn-board-title"><span class="eyebrow">${retry ? l("retry") : l("cue")}</span><h2 tabindex="-1" ${response || this.options ? "" : "data-learn-focus"}>${l("question")}</h2></div>
      <div class="learn-question-glyph" lang="zh-CN">${this.escape(item.char)}</div>
      ${
        response
          ? `<div class="learn-feedback ${response.grade === "miss" ? "miss" : "hit"}">
        <h3 tabindex="-1" data-learn-focus>${icon(response.grade === "miss" ? "info" : "check")} ${l(response.grade === "miss" ? "missed" : "correct")}</h3>
        <p class="learn-answer-text"><strong>${this.escape(meaning(item))}</strong> <span class="learn-pinyin" lang="zh-Latn">${this.escape(item.pinyin)}</span></p>
        ${this.details(item)}
        <div class="learn-feedback-actions">${this.audio(item.char)}<button class="tool-button" data-learn="write" data-value="${this.escape(item.char)}">${icon("pen")}${l("write")}</button></div>
        ${
          response.entered &&
          response.grade === "miss" &&
          round.kind !== "daily"
            ? `<p class="learn-self">${l("typed")} <button class="text-button" data-learn="self-grade">${l("selfGrade")}</button></p>`
            : ""
        }
      </div><button class="button-primary" data-learn="next">${l(last ? "summary" : "next")}${icon("arrow")}</button>`
          : `${
              this.options
                ? `<div class="learn-options">${this.options.map((option, index) => `<button class="secondary" data-learn="pick" data-value="${this.escape(option.char)}" ${index === 0 ? "data-learn-focus" : ""}>${this.escape(meaning(option))}</button>`).join("")}</div>`
                : `<form class="learn-answer"><input class="input" name="answer" aria-label="${l("response")}" placeholder="${l("response")}" required maxlength="100" autocomplete="off" spellcheck="false"><button class="button-primary" type="submit">${l("check")}</button></form>`
            }
      <div class="learn-feedback-actions">${this.options ? "" : `<button class="text-button" data-learn="choices">${l("choices")}</button>`}<button class="text-button" data-learn="skip">${l("skip")}</button></div>`
      }
    </section>`;
  }

  private summary(round: Round): string {
    return `<section class="glass learn-board learn-summary">
      <span class="learn-symbol">${icon("check")}</span><h2 tabindex="-1" data-learn-focus>${l("complete")}</h2>
      ${round.kind === "daily" ? `<p>${l(round.won ? "dailyWin" : "dailyMiss")}</p>` : ""}
      <div class="learn-stats"><div><strong>${round.firstCorrect} / ${round.total}</strong><span>${l("first")}</span></div><div><strong>${round.recovered}</strong><span>${l("recovered")}</span></div><div><strong>+${round.xp}</strong><span>${l("xp")}</span></div></div>
      <button class="button-primary" data-learn="back">${l("back")}${icon("arrow")}</button>
    </section>`;
  }
}
