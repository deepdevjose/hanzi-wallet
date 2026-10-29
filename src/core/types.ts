export interface Point {
  readonly x: number;
  readonly y: number;
  readonly pressure?: number;
}
export type Stroke = readonly Point[];
export interface VocabularyEntry {
  readonly id: number;
  readonly char: string;
  readonly pinyin: string;
  readonly meaning: string;
  readonly category: string;
}
export interface CharacterTemplate {
  readonly char: string;
  readonly medians: readonly Stroke[];
  readonly paths: readonly string[];
}
export interface Candidate {
  readonly char: string;
  readonly score: number;
  readonly neural: number;
  readonly geometry: number;
}
export interface Recognition {
  readonly candidates: readonly Candidate[];
  readonly rejected: boolean;
  readonly reason: string;
  readonly elapsed: number;
}
export interface Assessment {
  readonly shape: number;
  readonly order: number;
  readonly direction: number;
  readonly complete: boolean;
  readonly passed: boolean;
  readonly expected: number;
  readonly actual: number;
  readonly feedback: string;
}
export interface SavedCharacter {
  readonly char: string;
  readonly addedAt: number;
  readonly nextReview: number;
  readonly interval: number;
  readonly ease: number;
  readonly reviews: number;
  readonly lapses: number;
  readonly writing: number;
  readonly bestScore: number;
  readonly mastered: boolean;
}
export interface PracticeRecord {
  readonly char: string;
  readonly timestamp: number;
  readonly score: number;
  readonly passed: boolean;
}
export interface Preferences {
  readonly theme: "light" | "dark" | "system";
  readonly reducedGlass: boolean;
  readonly inkWidth: number;
  readonly goal: number;
}
export interface AppState {
  readonly version: 3;
  readonly wallet: Readonly<Record<string, SavedCharacter>>;
  readonly history: readonly PracticeRecord[];
  readonly preferences: Preferences;
  readonly personal: Readonly<Record<string, readonly (readonly Stroke[])[]>>;
}
export interface NeuralLayer {
  readonly input: number;
  readonly output: number;
  readonly weights: readonly number[];
  readonly biases: readonly number[];
  readonly activation: "relu" | "softmax";
}
export interface NeuralModel {
  readonly version: 1;
  readonly grid: 24;
  readonly features: number;
  readonly classes: readonly string[];
  readonly layers: readonly NeuralLayer[];
}
