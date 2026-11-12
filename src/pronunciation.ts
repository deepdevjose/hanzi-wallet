import { assetURL } from "./assets";
import type { VocabularyEntry } from "./core/types";
export interface AudioClip {
  readonly offset: number;
  readonly length: number;
  readonly source: string;
}
export interface AudioIndex {
  readonly version: 1;
  readonly sha256: string;
  readonly clips: Readonly<Record<string, AudioClip>>;
}
export type PlaybackStatus = "idle" | "loading" | "playing";
const toneMarks: Readonly<Record<string, readonly [string, number]>> = {
  ā: ["a", 1],
  á: ["a", 2],
  ǎ: ["a", 3],
  à: ["a", 4],
  ē: ["e", 1],
  é: ["e", 2],
  ě: ["e", 3],
  è: ["e", 4],
  ī: ["i", 1],
  í: ["i", 2],
  ǐ: ["i", 3],
  ì: ["i", 4],
  ō: ["o", 1],
  ó: ["o", 2],
  ǒ: ["o", 3],
  ò: ["o", 4],
  ū: ["u", 1],
  ú: ["u", 2],
  ǔ: ["u", 3],
  ù: ["u", 4],
  ǖ: ["v", 1],
  ǘ: ["v", 2],
  ǚ: ["v", 3],
  ǜ: ["v", 4],
  ü: ["v", 5],
};
export function pinyinKey(pinyin: string): string {
  let tone = 5,
    plain = "";
  const input = pinyin
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/u:/g, "v");
  const numbered = /^([a-zv]+)([0-5])$/.exec(input);
  if (numbered) return numbered[1]! + (numbered[2] === "0" ? "5" : numbered[2]);
  for (const char of input) {
    const mark = toneMarks[char];
    if (mark) {
      plain += mark[0];
      if (mark[1] !== 5) tone = mark[1];
    } else if (/[a-zv]/.test(char)) plain += char;
    else throw new Error("Unsupported pinyin syllable.");
  }
  if (!plain) throw new Error("Empty pinyin syllable.");
  return plain + tone;
}
export function selectMandarinVoice(
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const normalized = (v: SpeechSynthesisVoice): string =>
    v.lang.replace(/_/g, "-").toLowerCase();
  return (
    voices.find(
      (v) =>
        /^(zh-cn|cmn-cn|cmn-hans-cn)$/.test(normalized(v)) && v.localService,
    ) ??
    voices.find((v) => /^(zh-cn|cmn-cn|cmn-hans-cn)$/.test(normalized(v))) ??
    voices.find((v) =>
      /^(zh|cmn|zh-tw|cmn-tw|zh-hans|zh-hant)$/.test(normalized(v)),
    )
  );
}
export class NativePronunciation {
  public onStatus: (status: PlaybackStatus) => void = () => {};
  private context: AudioContext | null = null;
  private active: AudioBufferSourceNode | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private generation = 0;
  private index: AudioIndex | null = null;
  private bytes: ArrayBuffer | null = null;
  private loading: Promise<void> | null = null;
  private readonly decoded = new Map<string, AudioBuffer>();
  constructor(private readonly base: URL) {
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.getVoices();
  }
  private load(): Promise<void> {
    if (this.index && this.bytes) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = Promise.all([
      fetch(assetURL("audio/index.json", this.base)),
      fetch(assetURL("audio/pronunciation.bin", this.base)),
    ])
      .then(async ([a, b]) => {
        if (!a.ok || !b.ok)
          throw new Error("Pronunciation assets could not load.");
        const index = (await a.json()) as AudioIndex,
          bytes = await b.arrayBuffer();
        if (index.version !== 1 || !index.clips)
          throw new Error("Invalid audio index.");
        this.index = index;
        this.bytes = bytes;
      })
      .catch((error) => {
        this.loading = null;
        throw error;
      });
    return this.loading;
  }
  public stop(): void {
    this.generation++;
    if (this.active) {
      this.active.onended = null;
      try {
        this.active.stop();
      } catch {
        /* Already ended. */
      }
      this.active.disconnect();
      this.active = null;
    }
    if (this.utterance && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.utterance = null;
    }
    this.onStatus("idle");
  }
  public async speak(entry: VocabularyEntry): Promise<void> {
    this.stop();
    const id = this.generation;
    this.onStatus("loading");
    try {
      if (!("AudioContext" in window))
        throw new Error("Web Audio unavailable.");
      this.context ??= new AudioContext();
      // Resume inside the click's activation, before fetching or decoding asynchronously.
      const resume = this.context.resume();
      await Promise.all([resume, this.load()]);
      if (id !== this.generation) return;
      const key = pinyinKey(entry.pinyin),
        clip = this.index?.clips[key];
      if (
        !clip ||
        !this.bytes ||
        clip.offset < 0 ||
        clip.length <= 0 ||
        clip.offset + clip.length > this.bytes.byteLength
      )
        throw new Error("Missing audio clip.");
      let buffer = this.decoded.get(key);
      if (!buffer) {
        buffer = await this.context.decodeAudioData(
          this.bytes.slice(clip.offset, clip.offset + clip.length),
        );
        this.decoded.set(key, buffer);
        if (this.decoded.size > 32)
          this.decoded.delete(this.decoded.keys().next().value!);
      }
      if (id !== this.generation) return;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.onended = () => {
        if (id === this.generation) {
          source.disconnect();
          this.active = null;
          this.onStatus("idle");
        }
      };
      this.active = source;
      source.start();
      this.onStatus("playing");
    } catch (error) {
      if (id !== this.generation) return;
      try {
        await this.speakWithSystem(entry.char, id);
      } catch {
        this.onStatus("idle");
        throw error;
      }
    }
  }
  private async speakWithSystem(text: string, id: number): Promise<void> {
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    )
      throw new Error("Speech synthesis unavailable.");
    const synth = window.speechSynthesis;
    let voices = synth.getVoices();
    if (!selectMandarinVoice(voices))
      voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
        const finish = (): void => {
          clearTimeout(timeout);
          synth.removeEventListener("voiceschanged", changed);
          resolve(synth.getVoices());
        };
        const changed = (): void => {
          if (selectMandarinVoice(synth.getVoices())) finish();
        };
        const timeout = window.setTimeout(finish, 1500);
        synth.addEventListener("voiceschanged", changed);
        changed();
      });
    if (id !== this.generation) return;
    const voice = selectMandarinVoice(voices);
    if (!voice) throw new Error("Mandarin voice unavailable.");
    await new Promise<void>((resolve, reject) => {
      const u = new SpeechSynthesisUtterance(text);
      this.utterance = u;
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = 0.8;
      u.volume = 1;
      u.onstart = () => {
        if (id === this.generation) this.onStatus("playing");
      };
      u.onend = () => {
        if (id === this.generation) {
          this.utterance = null;
          this.onStatus("idle");
        }
        resolve();
      };
      u.onerror = (e) => {
        if (
          id !== this.generation ||
          e.error === "canceled" ||
          e.error === "interrupted"
        )
          resolve();
        else reject(new Error(e.error));
      };
      synth.resume();
      synth.speak(u);
    });
  }
}
