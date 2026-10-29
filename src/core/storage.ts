import type { AppState, SavedCharacter, Preferences, Stroke } from "./types";
const KEY = "hanzi-wallet-v3";
const DAY = 86_400_000;
export const defaults: Preferences = {
  theme: "light",
  reducedGlass: false,
  inkWidth: 2.6,
  goal: 5,
};
export const emptyState = (): AppState => ({
  version: 3,
  wallet: {},
  history: [],
  preferences: defaults,
  personal: {},
});
const record = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const num = (x: unknown, fallback = 0): number =>
  typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : fallback;
export function saved(char: string, now = Date.now()): SavedCharacter {
  return {
    char,
    addedAt: now,
    nextReview: now,
    interval: 0,
    ease: 2.5,
    reviews: 0,
    lapses: 0,
    writing: 0,
    bestScore: 0,
    mastered: false,
  };
}
export function parseState(
  input: unknown,
  valid: ReadonlySet<string>,
): AppState {
  if (!record(input) || !record(input.wallet))
    throw new Error("El archivo no contiene una wallet válida.");
  const wallet: Record<string, SavedCharacter> = {};
  for (const [char, value] of Object.entries(input.wallet)) {
    if (!valid.has(char) || !record(value)) continue;
    wallet[char] = {
      char,
      addedAt: num(value.addedAt, Date.now()),
      nextReview: num(value.nextReview, num(value.next)),
      interval: Math.min(365, num(value.interval)),
      ease: Math.min(3, Math.max(1.3, num(value.ease, 2.5))),
      reviews: num(value.reviews),
      lapses: num(value.lapses),
      writing: num(value.writing),
      bestScore: Math.min(100, num(value.bestScore)),
      mastered: value.mastered === true,
    };
  }
  const p = record(input.preferences) ? input.preferences : {};
  const history: AppState["history"] = Array.isArray(input.history)
    ? input.history
        .filter(
          (x): x is AppState["history"][number] =>
            record(x) &&
            typeof x.char === "string" &&
            valid.has(x.char) &&
            typeof x.timestamp === "number" &&
            Number.isFinite(x.timestamp) &&
            typeof x.score === "number" &&
            Number.isFinite(x.score) &&
            x.score >= 0 &&
            x.score <= 100 &&
            typeof x.passed === "boolean",
        )
        .slice(-3000)
    : [];
  const personal: Record<string, (readonly Stroke[])[]> = {};
  if (record(input.personal))
    for (const [h, examples] of Object.entries(input.personal)) {
      if (!valid.has(h) || !Array.isArray(examples)) continue;
      personal[h] = examples
        .filter(
          (e): e is Stroke[] =>
            Array.isArray(e) &&
            e.length > 0 &&
            e.length <= 25 &&
            e.every(
              (s) =>
                Array.isArray(s) &&
                s.length > 0 &&
                s.length <= 5000 &&
                s.every(
                  (p) =>
                    record(p) &&
                    typeof p.x === "number" &&
                    typeof p.y === "number" &&
                    Number.isFinite(p.x) &&
                    Number.isFinite(p.y) &&
                    p.x >= 0 &&
                    p.x <= 1 &&
                    p.y >= 0 &&
                    p.y <= 1,
                ),
            ),
        )
        .slice(-5);
    }
  return {
    version: 3,
    wallet,
    history,
    personal,
    preferences: {
      theme: p.theme === "dark" || p.theme === "system" ? p.theme : "light",
      reducedGlass: p.reducedGlass === true,
      inkWidth: Math.min(6, Math.max(1.5, num(p.inkWidth, 2.6))),
      goal: Math.min(30, Math.max(1, num(p.goal, 5))),
    },
  };
}
export function loadState(valid: ReadonlySet<string>): {
  state: AppState;
  warning: string;
} {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw)
      return {
        state: parseState(JSON.parse(raw) as unknown, valid),
        warning: "",
      };
    const legacy = localStorage.getItem("hanzi-studio-v2");
    if (legacy)
      return {
        state: parseState({ wallet: JSON.parse(legacy) as unknown }, valid),
        warning: "Recuperamos tu colección de Hanzi Studio.",
      };
    return { state: emptyState(), warning: "" };
  } catch {
    return {
      state: emptyState(),
      warning:
        "No se pudo leer el progreso anterior. Puedes importar una copia.",
    };
  }
}
export function persist(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    throw new Error("No se pudo guardar. Exporta una copia de tu progreso.");
  }
}
export function schedule(
  card: SavedCharacter,
  rating: "again" | "hard" | "good",
  now = Date.now(),
): SavedCharacter {
  const interval =
    rating === "again"
      ? 0
      : rating === "hard"
        ? Math.max(1, Math.round(card.interval * 1.2))
        : card.reviews === 0 || card.interval === 0
          ? 1
          : card.interval === 1
            ? 3
            : Math.min(365, Math.round(card.interval * card.ease));
  return {
    ...card,
    interval,
    nextReview: now + (rating === "again" ? 600_000 : interval * DAY),
    ease: Math.min(
      3,
      Math.max(
        1.3,
        card.ease +
          (rating === "again" ? -0.2 : rating === "hard" ? -0.15 : 0.05),
      ),
    ),
    reviews: card.reviews + 1,
    lapses: card.lapses + (rating === "again" ? 1 : 0),
    mastered: rating === "again" ? false : interval >= 7,
  };
}
export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
