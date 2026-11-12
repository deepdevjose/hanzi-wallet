import { dayKey, parseState, saved, schedule } from "./storage";
import type { SavedCharacter, VocabularyEntry } from "./types";

export const LEARNING_KEY = "hanzi-wallet-learning-v1";
export const XP_PER_LEVEL = 100;
export const DAILY_BONUS = 20;
export const DAILY_TARGET = 4;
const ROUND_SIZE = 6;
const NEW_LIMIT = 4;

export interface LearningProgress {
  readonly cards: Readonly<Record<string, SavedCharacter>>;
  readonly xp: number;
  readonly active: readonly string[];
  readonly challenges: readonly string[];
}

export type Answer = "recall" | "choice" | "miss";
export type RoundKind = "adaptive" | "daily" | "errors" | "lesson";

export const emptyLearning = (): LearningProgress => ({
  cards: {},
  xp: 0,
  active: [],
  challenges: [],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function canonicalDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function days(value: unknown): string[] {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (day): day is string =>
              typeof day === "string" && canonicalDay(day),
          ),
        ),
      ]
        .sort()
        .slice(-400)
    : [];
}

export function readLearning(
  value: unknown,
  known: ReadonlySet<string>,
): LearningProgress {
  if (!isRecord(value)) return emptyLearning();
  const cards = isRecord(value.cards)
    ? parseState({ wallet: value.cards }, known).wallet
    : {};
  return {
    cards,
    xp:
      typeof value.xp === "number" &&
      Number.isSafeInteger(value.xp) &&
      value.xp >= 0
        ? value.xp
        : 0,
    active: days(value.active),
    challenges: days(value.challenges),
  };
}

/** Recover the review moment from the scheduling representation already stored. */
function reviewedAt(card: SavedCharacter): number {
  if (card.reviews === 0) return card.addedAt;
  return Math.max(0, card.nextReview - (card.interval === 0 ? 600_000 : card.interval * 86_400_000));
}

/**
 * Importing the same backup twice must neither mint XP nor roll a recent lapse
 * back to an older, longer successful-review interval. XP is a cumulative high
 * water mark; we cannot sum independent-device practice without an event log.
 */
export function mergeLearning(
  current: LearningProgress,
  incoming: unknown,
  known: ReadonlySet<string>,
): LearningProgress {
  const local = readLearning(current, known), imported = readLearning(incoming, known);
  const cards: Record<string, SavedCharacter> = { ...local.cards };
  for (const [char, other] of Object.entries(imported.cards)) {
    const existing = cards[char];
    if (!existing) { cards[char] = other; continue; }
    const localTime = reviewedAt(existing), otherTime = reviewedAt(other);
    const newest = otherTime > localTime || (otherTime === localTime && other.reviews > existing.reviews) ? other : existing;
    cards[char] = {
      ...newest,
      addedAt: Math.min(existing.addedAt, other.addedAt),
      reviews: Math.max(existing.reviews, other.reviews),
      lapses: Math.max(existing.lapses, other.lapses),
      writing: Math.max(existing.writing, other.writing),
      bestScore: Math.max(existing.bestScore, other.bestScore),
    };
  }
  return {
    cards,
    xp: Math.max(local.xp, imported.xp),
    active: days([...local.active, ...imported.active]),
    challenges: days([...local.challenges, ...imported.challenges]),
  };
}

export function gradeLearning(
  progress: LearningProgress,
  char: string,
  answer: Answer,
  now: number,
): LearningProgress {
  const card = progress.cards[char];
  // Early practice can flag a forgotten item, but it cannot advance the schedule or earn XP.
  if (
    card &&
    card.nextReview > now &&
    (answer !== "miss" || card.interval === 0)
  )
    return progress;
  const rating = answer === "miss" ? "again" : "good";
  return {
    ...progress,
    cards: {
      ...progress.cards,
      [char]: schedule(card ?? saved(char, now), rating, now),
    },
    xp: progress.xp + (answer === "recall" ? 10 : answer === "choice" ? 5 : 0),
  };
}

export function finishLearning(
  progress: LearningProgress,
  kind: RoundKind,
  correct: number,
  today: string,
  challengeDay = today,
): LearningProgress {
  const won =
    kind === "daily" &&
    correct >= DAILY_TARGET &&
    !progress.challenges.includes(challengeDay);
  return {
    ...progress,
    xp: progress.xp + (won ? DAILY_BONUS : 0),
    active: days([...progress.active, today]),
    challenges: won
      ? days([...progress.challenges, challengeDay])
      : progress.challenges,
  };
}

export function streak(active: readonly string[], now: number): number {
  const date = new Date(now);
  const visited = new Set(active);
  if (!visited.has(dayKey(now))) date.setDate(date.getDate() - 1);
  let count = 0;
  while (visited.has(dayKey(date.getTime()))) {
    count++;
    date.setDate(date.getDate() - 1);
  }
  return count;
}

export function adaptiveQueue(
  progress: LearningProgress,
  ordered: readonly string[],
  now: number,
  kind: "adaptive" | "errors",
): string[] {
  const seen = ordered
    .map((char) => progress.cards[char])
    .filter((card): card is SavedCharacter => !!card);
  const dueOrder = (a: SavedCharacter, b: SavedCharacter): number =>
    Number(b.interval === 0) - Number(a.interval === 0) ||
    a.nextReview - b.nextReview;
  if (kind === "errors")
    return seen
      .filter((card) => card.interval === 0 && card.lapses > 0)
      .sort(dueOrder)
      .slice(0, ROUND_SIZE)
      .map((card) => card.char);
  const due = seen
    .filter((card) => card.nextReview <= now)
    .sort(dueOrder)
    .slice(0, ROUND_SIZE);
  const fresh = ordered
    .filter((char) => !progress.cards[char])
    .slice(0, Math.min(NEW_LIMIT, ROUND_SIZE - due.length));
  const queue = [...due.map((card) => card.char), ...fresh];
  return queue.length
    ? queue
    : seen
        .sort(dueOrder)
        .slice(0, ROUND_SIZE)
        .map((card) => card.char);
}

export function shuffle<T>(
  values: readonly T[],
  random: () => number = Math.random,
): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function dailyQueue(
  today: string,
  ordered: readonly string[],
): string[] {
  let seed = Number(today.replaceAll("-", ""));
  return shuffle(ordered, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  }).slice(0, 5);
}

function clean(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/ü/g, "v")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function meanings(gloss: string): Set<string> {
  return new Set(
    [gloss, ...gloss.split(/[/;,；、，]/u)]
      .flatMap((part) => [part, part.replace(/\s*\([^)]*\)/g, "")])
      .map(clean)
      .filter(Boolean),
  );
}

export function correctMeaning(answer: string, gloss: string): boolean {
  return meanings(gloss).has(clean(answer));
}

export function answerOptions(
  target: VocabularyEntry,
  pool: readonly VocabularyEntry[],
  gloss: (item: VocabularyEntry) => string,
): VocabularyEntry[] {
  const options = [target];
  const used = meanings(gloss(target));
  const others = shuffle(pool.filter((item) => item.char !== target.char));
  const ranked = [
    ...others.filter((item) => item.category === target.category),
    ...others.filter((item) => item.category !== target.category),
  ];
  for (const item of ranked) {
    const aliases = meanings(gloss(item));
    if (!aliases.size || [...aliases].some((alias) => used.has(alias)))
      continue;
    options.push(item);
    for (const alias of aliases) used.add(alias);
    if (options.length === 4) break;
  }
  return shuffle(options);
}
