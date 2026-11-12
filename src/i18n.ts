import messages from "./locales/messages.json";
import type { VocabularyEntry } from "./core/types";
export const LOCALES = ["es", "en", "zh-CN", "fr", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export type MessageKey = keyof typeof messages;
export const LANGUAGE_NAMES: Readonly<Record<Locale, string>> = {
  es: "Español",
  en: "English",
  "zh-CN": "简体中文",
  fr: "Français",
  pt: "Português",
};
let current: Locale = "es";
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.some((l) => l === value);
}
export function getLocale(): Locale {
  return current;
}
export function setLocale(value: Locale): void {
  current = value;
  if (typeof document !== "undefined") document.documentElement.lang = value;
}
export function t(
  key: MessageKey,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return messages[key][current].replace(
    /\{(\w+)\}/g,
    (token: string, name: string) =>
      Object.hasOwn(params, name) ? String(params[name]) : token,
  );
}
export function tr(source: string): string {
  return Object.hasOwn(messages, source) ? t(source as MessageKey) : source;
}
export function meaning(e: VocabularyEntry): string {
  return (
    e.meanings?.[current] ??
    (current === "es" ? e.meaning : (e.meanings?.en ?? e.meaning))
  );
}
export function dayLabel(count: number): string {
  return t(count === 1 ? "{count} día" : "{count} días", { count });
}
export function strokeLabel(count: number): string {
  return t(count === 1 ? "{count} trazo" : "{count} trazos", { count });
}
// Rebind existing static text on locale changes; keep the canvas, handlers and focus.
// Dynamic cards and result messages are rendered by their existing view functions.
export function translateStatic(root: HTMLElement): void {
  const reverse = new Map<string, MessageKey>();
  for (const key of Object.keys(messages) as MessageKey[])
    for (const locale of LOCALES) {
      const value = messages[key][locale];
      if (!value.includes("{") && !reverse.has(value)) reverse.set(value, key);
    }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (
      node.parentElement?.closest(
        ".gloss,.character-meaning,.candidate-info p,.search-result small,.flash-meaning,.character-pinyin,.reading,.glyph,.candidate-glyph,.flash-glyph,.brand",
      )
    )
      continue;
    const original = node.textContent ?? "",
      text = original.trim(),
      key = reverse.get(text);
    if (key) node.textContent = original.replace(text, t(key));
  }
  for (const element of root.querySelectorAll<HTMLElement>(
    "[aria-label],[placeholder],[title]",
  ))
    for (const attribute of ["aria-label", "placeholder", "title"]) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const key = reverse.get(value);
      if (key) element.setAttribute(attribute, t(key));
    }
}
