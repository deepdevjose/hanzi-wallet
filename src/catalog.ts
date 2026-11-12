import "./catalog.css";
import { assetURL } from "./assets";
import common from "./common-3500.json";
import hskAll from "./hsk-all.json";
import type { VocabularyEntry } from "./core/types";

const PAGE_SIZE = 100;
const chars: readonly string[] = common;
interface DictionaryEntry {
  readonly pinyin: string;
  readonly definition: string;
}
type Dictionary = Readonly<Record<string, DictionaryEntry>>;
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
async function loadDictionary(): Promise<Dictionary> {
  const base = new URL(import.meta.env.BASE_URL, location.href);
  const response = await fetch(assetURL("data/common-dictionary.json", base));
  if (!response.ok) throw new Error("Dictionary HTTP " + response.status);
  const raw: unknown = await response.json();
  if (!isObject(raw) || Object.keys(raw).length < 3000) throw new Error("Incomplete dictionary");
  const result: Record<string, DictionaryEntry> = {};
  for (const [char, info] of Object.entries(raw)) {
    if (!isObject(info) || typeof info.pinyin !== "string" || typeof info.definition !== "string") continue;
    result[char] = { pinyin: info.pinyin, definition: info.definition };
  }
  return result;
}
function element<K extends keyof HTMLElementTagNameMap>(name: K, className = "", content = ""): HTMLElementTagNameMap[K] {
  const result = document.createElement(name);
  result.className = className;
  result.textContent = content;
  return result;
}
export function mountCatalog(
  vocabulary: readonly VocabularyEntry[],
  choose: (char: string) => void,
  speak: (entry: VocabularyEntry) => Promise<void>,
): void {
  const supported = new Map(vocabulary.map((entry) => [entry.char, entry]));
  const hsk = new Map<string, string>(Object.entries(hskAll));
  let dictionary: Dictionary = {};
  let loadPromise: Promise<void> | null = null;
  const button = element("button", "profile-trigger", "字 3,500 hanzi");
  button.type = "button";
  document.querySelector(".top-actions")?.prepend(button);
  const layer = element("div", "catalog-overlay");
  layer.hidden = true;
  const dialog = element("section", "catalog-dialog");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", "Catálogo de 3500 caracteres");
  const heading = element("div", "catalog-heading");
  const title = element("h2", "", "3,500 caracteres comunes");
  const close = element("button", "", "Cerrar ✕");
  close.type = "button";
  close.onclick = () => { layer.hidden = true; };
  heading.append(title, close);
  dialog.append(heading);
  const note = element("p", "", "Lista oficial china de 2013, nivel 1. HSK es una clasificación independiente. Los 500 caracteres originales tienen además estudio manuscrito y un modelo de reconocimiento.");
  dialog.append(note);
  const status = element("p", "catalog-count", "Cargando diccionario local…");
  const tools = element("div", "catalog-tools");
  const search = element("input");
  search.type = "search";
  search.placeholder = "Buscar carácter, pinyin o significado";
  search.setAttribute("aria-label", "Buscar en catálogo");
  const select = element("select");
  select.setAttribute("aria-label", "Filtrar nivel HSK");
  for (const [id, label] of [["all","Todos los niveles"],["HSK1","HSK 1"],["HSK2","HSK 2"],["HSK3","HSK 3"],["HSK4","HSK 4"],["HSK5","HSK 5"],["HSK6","HSK 6"],["HSK7-9","HSK 7–9"],["none","Sin clasificación HSK"]] as const) {
    const option = element("option", "", label);
    option.value = id;
    select.append(option);
  }
  tools.append(search, select);
  dialog.append(tools, status);
  const detail = element("div", "catalog-detail");
  detail.hidden = true;
  dialog.append(detail);
  const grid = element("div", "catalog-grid");
  dialog.append(grid);
  const pager = element("div", "catalog-pager");
  dialog.append(pager);
  layer.append(dialog);
  document.body.append(layer);
  let page = 0;
  let selected: string | null = null;
  const showDetail = (char: string): void => {
    selected = char;
    detail.replaceChildren();
    const known = supported.get(char);
    const extra = dictionary[char];
    const closeDetail = element("button", "catalog-detail-close", "✕");
    closeDetail.type = "button";
    closeDetail.setAttribute("aria-label", "Cerrar ficha");
    closeDetail.onclick = () => { selected = null; detail.hidden = true; };
    detail.append(closeDetail);
    detail.append(element("span", "catalog-detail-hanzi", char));
    detail.append(element("strong", "", known?.pinyin ?? extra?.pinyin ?? "Pronunciación no disponible"));
    detail.append(element("p", "", known?.meaning ?? extra?.definition ?? "Definición pendiente"));
    detail.append(element("small", "", (hsk.get(char) ?? "Sin clasificación HSK") + (known ? " · Práctica y reconocimiento disponibles" : " · Lectura y consulta")));
    const controls = element("div", "catalog-detail-controls");
    const pinyin = (known?.pinyin ?? extra?.pinyin ?? "").split(",")[0]?.trim() ?? "";
    if (pinyin) {
      const listen = element("button", "", "Escuchar");
      listen.type = "button";
      listen.onclick = () => {
        const entry: VocabularyEntry = known ?? { id: -1, char, pinyin, meaning: extra?.definition ?? "", category: "Catálogo" };
        void speak(entry).catch(() => {
          status.textContent = "No se pudo reproducir esta pronunciación.";
        });
      };
      controls.append(listen);
    }
    if (known) {
      const write = element("button", "", "Practicar escritura");
      write.type = "button";
      write.onclick = () => { layer.hidden = true; choose(char); };
      controls.append(write);
    }
    detail.append(controls);
    detail.hidden = false;
    detail.scrollIntoView({ block: "nearest" });
  };
  const render = (): void => {
    const q = search.value.trim().toLocaleLowerCase();
    const list = chars.filter((char) => {
      const entry = supported.get(char);
      const extra = dictionary[char];
      return (select.value === "all" || (select.value === "none" ? !hsk.has(char) : hsk.get(char) === select.value))
        && (!q || char.includes(q) || entry?.pinyin.toLocaleLowerCase().includes(q) || entry?.meaning.toLocaleLowerCase().includes(q) || extra?.pinyin.toLocaleLowerCase().includes(q) || extra?.definition.toLocaleLowerCase().includes(q));
    });
    const max = Math.max(0, Math.ceil(list.length / PAGE_SIZE) - 1);
    page = Math.min(page, max);
    status.textContent = list.length + " caracteres · " + Object.keys(dictionary).length + " fichas de diccionario · " + supported.size + " con reconocimiento manuscrito";
    grid.replaceChildren();
    for (const char of list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)) {
      const entry = supported.get(char);
      const extra = dictionary[char];
      const tile = element("button", "catalog-tile");
      tile.type = "button";
      const glyph = element("span", "catalog-hanzi", char);
      const meta = element("small", "", [hsk.get(char) ?? "General", entry?.pinyin ?? extra?.pinyin.split(",")[0] ?? "—"].join(" · "));
      tile.append(glyph, meta);
      tile.title = "Abrir ficha";
      tile.onclick = () => showDetail(char);
      grid.append(tile);
    }
    pager.replaceChildren();
    const prev = element("button", "", "Anterior");
    prev.type = "button";
    prev.disabled = page === 0;
    prev.onclick = () => { page--; render(); dialog.scrollTop = 0; };
    const next = element("button", "", "Siguiente");
    next.type = "button";
    next.disabled = page >= max;
    next.onclick = () => { page++; render(); dialog.scrollTop = 0; };
    const label = element("span", "", "Página " + (page + 1) + " de " + (max + 1));
    pager.append(prev, label, next);
    if (selected && detail.hidden === false) showDetail(selected);
  };
  search.oninput = () => { page = 0; render(); };
  select.onchange = () => { page = 0; render(); };
  button.onclick = () => {
    layer.hidden = false;
    render();
    search.focus();
    loadPromise ??= loadDictionary().then((value) => {
      dictionary = value;
      render();
    }).catch(() => {
      status.textContent = "Diccionario ampliado no disponible; permanecen los 3,500 caracteres y las 500 fichas originales.";
    });
  };
  layer.addEventListener("click", (event) => { if (event.target === layer) layer.hidden = true; });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !layer.hidden) layer.hidden = true; });
}
