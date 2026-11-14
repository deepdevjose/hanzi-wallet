import hskLevels from "../hsk-levels.json";
import type { PlacementBand } from "./profile";
import type { AppState, SavedCharacter } from "./types";
import { saved } from "./storage";

const bands = ["0", "1", "2", "3", "4", "5", "6", "7-9"] as const;
const rank = (band: string): number =>
  bands.findIndex((value) => value === band.replace("–", "-"));

/** The assessment reports the highest passed band, including all lower bands. */
export function placementCharacters(
  band: string,
  known: ReadonlySet<string>,
): readonly string[] {
  const passed = rank(band);
  return hskLevels
    .slice(0, Math.max(0, passed))
    .flatMap((level) => [...level.chars])
    .filter((char) => known.has(char));
}

export function nextStudyBand(band: string): string {
  const passed = rank(band);
  return hskLevels[Math.max(0, Math.min(passed, hskLevels.length - 1))]!.label;
}

export function furthestPlacement(
  first?: PlacementBand,
  second?: PlacementBand,
): PlacementBand | undefined {
  return rank(first ?? "") >= rank(second ?? "") ? first : second;
}

/** Save wallet entries and their initialization marker together, without practice credit. */
export function initializePlacementWallet(
  state: AppState,
  band: PlacementBand,
  known: ReadonlySet<string>,
  now = Date.now(),
): AppState {
  if (rank(state.placementApplied ?? "") >= rank(band)) return state;
  const previous = new Set(
    placementCharacters(state.placementApplied ?? "0", known),
  );
  const wallet = { ...state.wallet };
  for (const char of placementCharacters(band, known)) {
    if (!previous.has(char) && !wallet[char]) wallet[char] = saved(char, now);
  }
  return { ...state, wallet, placementApplied: band };
}

/** A later failed exercise takes precedence over the initial reading estimate. */
export function isRecognitionComplete(
  card: SavedCharacter | undefined,
  placed: boolean,
): boolean {
  return card ? card.interval > 0 : placed;
}

/** Baseline recognition is not an overdue review or a recorded writing attempt. */
export function isUntouchedPlacementCard(
  card: SavedCharacter,
  placed: boolean,
): boolean {
  return (
    placed &&
    card.reviews === 0 &&
    card.writing === 0 &&
    card.bestScore === 0 &&
    card.lapses === 0
  );
}

/** An assessment-only backup must not replace real practice already on this device. */
export function mergePlacementWallet(
  current: AppState["wallet"],
  incoming: AppState["wallet"],
): AppState["wallet"] {
  const wallet = { ...current };
  for (const [char, card] of Object.entries(incoming)) {
    const existing = wallet[char];
    if (
      existing &&
      isUntouchedPlacementCard(card, true) &&
      !isUntouchedPlacementCard(existing, true)
    )
      continue;
    wallet[char] = card;
  }
  return wallet;
}
