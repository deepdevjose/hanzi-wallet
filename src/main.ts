import "./style.css";
import { version } from "../package.json";
import { assetURL } from "./assets";
import {
  t,
  tr,
  getLocale,
  setLocale,
  meaning,
  isLocale,
  LANGUAGE_NAMES,
  LOCALES,
  translateStatic,
  dayLabel,
  strokeLabel,
} from "./i18n";
import { NativePronunciation } from "./pronunciation";
import { icon, type IconName } from "./icons";
import { LearningView } from "./learning";
import { learnText } from "./learning-content";
import { InkCanvas } from "./ink";
import { assess, normalize } from "./core/geometry";
import {
  dayKey,
  loadState,
  parseState,
  persist,
  saved,
  schedule,
} from "./core/storage";
import type {
  AppState,
  Assessment,
  CharacterTemplate,
  NeuralModel,
  Recognition,
  Stroke,
  VocabularyEntry,
} from "./core/types";

type View = "learn" | "studio" | "wallet" | "review";
type Mode = "free" | "guide" | "animate";
const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("No se encontró el contenedor de la aplicación.");
const el = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Falta el elemento ${id}`);
  return node as T;
};
const escape = (text: string): string =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const base = new URL(import.meta.env.BASE_URL, location.href);
async function json<T>(path: string): Promise<T> {
  const response = await fetch(assetURL(path, base));
  if (!response.ok)
    throw new Error(
      t("No se pudo cargar {path} ({status}).", {
        path,
        status: response.status,
      }),
    );
  return (await response.json()) as T;
}
let vocabulary: VocabularyEntry[] = [],
  templates: CharacterTemplate[] = [],
  state: AppState;
let learning: LearningView;
let selected = "永",
  view: View = "learn",
  mode: Mode = "free",
  hint = false;
let worker: Worker | null = null,
  ready = false,
  neuralReady = false,
  ink: InkCanvas,
  requestId = 0,
  timer = 0,
  toastTimer = 0,
  animationTimer = 0,
  recorded = false,
  lastResult: Recognition | null = null;
let walletScope = "saved",
  walletQuery = "",
  category = "",
  reviewQueue: string[] = [],
  reviewIndex = 0,
  reviewTotal = 0,
  flipped = false,
  reviewReverse = false,
  reviewAll = false;
const pronunciation = new NativePronunciation(base);
let modelMetrics: { top1: number; test_samples: number } | null = null;
const entry = (char = selected): VocabularyEntry =>
  vocabulary.find((e) => e.char === char) ?? vocabulary[0]!;
const template = (char = selected): CharacterTemplate =>
  templates.find((t) => t.char === char) ?? templates[0]!;
const navButton = (v: View, label: string, name: IconName): string =>
  `<button class="nav-button ${v === "learn" ? "active" : ""}" data-view="${v}" aria-current="${v === "learn" ? "page" : "false"}">${icon(name)}<span ${v === "learn" ? "data-learn-nav" : ""}>${label}</span><span class="nav-count" data-count="${v}"></span></button>`;
function renderShell(): void {
  root!.innerHTML = `<div class="shell"><aside class="sidebar glass" aria-label="${t("Barra lateral")}"><div class="brand"><div class="brand-mark" aria-hidden="true">字</div><strong class="brand-name">Hanzi<span>Wallet</span></strong></div><div class="side-label">${t("TU ESPACIO")}</div><nav class="side-nav" aria-label="${t("Navegación principal")}">${navButton("learn", learnText("home"), "sparkle")}${navButton("studio", t("Escribir"), "pen")}${navButton("wallet", t("Mi wallet"), "wallet")}${navButton("review", t("Repasar"), "layers")}</nav><div class="goal-card"><div class="goal-header">${t("Tu pequeño hábito")}<span id="goal-number">0 / 5</span></div><div class="goal-track" role="progressbar" aria-label="${t("Meta diaria")}" id="goal-progress" aria-valuemin="0" aria-valuemax="5" aria-valuenow="0"><i id="goal-fill"></i></div><p>${t("Unos minutos hoy.")}<br>${t("Un poco más cerca mañana.")}</p></div><div class="sidebar-footer">${icon("shield")}<span>${t("Tu progreso se queda contigo.")}</span></div></aside><main class="main"><header class="topbar"><div class="breadcrumb"><span>Hanzi Wallet</span><span class="breadcrumb-sep">/</span><span id="breadcrumb-view">${t("Writing studio")}</span></div><div class="top-actions"><button class="search-button" id="open-search" aria-label="${t("Buscar caracteres")}">${icon("search")}<span>${t("Buscar un carácter")}</span><kbd>⌘ K</kbd></button><button class="icon-button" id="theme-toggle" aria-label="${t("Cambiar a modo oscuro")}" title="${t("Cambiar tema")}">${icon("moon")}</button><button class="icon-button" id="open-settings" aria-label="${t("Preferencias")}" title="${t("Preferencias")}">${icon("settings")}</button></div></header><div class="page-heading"><div><div class="eyebrow" id="page-eyebrow">${t("UN POCO CADA DÍA")}</div><h1 id="page-title">${t("Dale forma a tu chino.")}</h1><p id="page-subtitle">${t("Un espacio para escribir, descubrir y recordar. A tu ritmo.")}</p></div><span class="date-chip">${icon("sun")}<span id="today-date"></span></span></div>
<section id="learn-view"></section>
<section id="studio-view" aria-label="${t("Estudio de escritura")}" hidden><div class="studio-grid"><section class="panel glass"><div class="panel-head"><h2>${t("Writing studio")}</h2><span class="live-label"><i class="live-dot"></i><span id="local-status">${t("En tu dispositivo")}</span></span></div><div class="segment" role="group" aria-label="${t("Modo de escritura")}"><button class="active" data-mode="free" aria-pressed="true">${icon("pen")}${t("Libre")}</button><button data-mode="guide" aria-pressed="false">${icon("grid")}${t("Con guía")}</button><button data-mode="animate" aria-pressed="false">${icon("play")}${t("Ver trazos")}</button></div><div class="stage-wrap"><div class="write-stage" id="write-stage"><svg class="grid-guide" viewBox="0 0 400 400" aria-hidden="true"><line x1="0" y1="200" x2="400" y2="200"/><line x1="200" y1="0" x2="200" y2="400"/><line x1="0" y1="0" x2="400" y2="400"/><line x1="400" y1="0" x2="0" y2="400"/></svg><div class="canvas-placeholder" id="canvas-placeholder"><span class="placeholder-glyph" aria-hidden="true">字</span><p>${t("Tu siguiente hanzi empieza aquí.")}</p></div><svg class="ghost" id="ghost" viewBox="0 0 1 1" aria-hidden="true"></svg><canvas id="ink" aria-label="${t("Lienzo para escribir un carácter chino con mouse, dedo o lápiz")}"></canvas><i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i></div><div class="stage-caption"><span id="stage-instruction">${t("DIBUJA UN SOLO CARÁCTER")}</span><span id="stroke-count" aria-live="polite">${strokeLabel(0)}</span></div></div><div class="canvas-tools"><div class="tool-group"><button class="tool-button" id="undo" disabled title="${t("Deshacer último trazo")}" aria-label="${t("Deshacer último trazo")}">${icon("undo")}<span>${t("Deshacer")}</span></button><button class="tool-button" id="clear" disabled title="${t("Borrar lienzo")}" aria-label="${t("Borrar lienzo")}">${icon("trash")}<span>${t("Borrar")}</span></button><div class="divider"></div><label class="width-control" title="${t("Grosor de la tinta")}"><span class="ink-sample"></span><input id="ink-width" type="range" min="1.5" max="6" step="0.1" value="2.6" aria-label="${t("Grosor de la tinta")}" /></label><button class="tool-button hidden" id="hint" aria-label="${t("Mostrar el siguiente trazo")}">${icon("sparkle")}</button></div><button class="analyze-btn" id="analyze" disabled>${t("Analizar")} ${icon("sparkle")}</button></div><p class="studio-footnote"><span id="ink-status" role="status">${t("Tinta fina. Reconocimiento automático.")}</span><span>${t("Mouse, dedo o lápiz.")}</span></p></section><div class="right-stack"><section class="panel glass character-panel" aria-label="${t("Carácter seleccionado")}"><div class="character-head"><span class="overline">${t("EN TU RADAR")}</span><span class="tag" id="character-category"></span></div><div class="character-display"><div class="character-art" id="character-art" role="img"></div><div class="character-pinyin" id="character-pinyin"></div><div class="character-meaning" id="character-meaning"></div><div class="character-meta"><span id="character-strokes"></span><i></i><span id="character-level">${t("Carácter simplificado")}</span></div></div><button class="button-primary full" id="save-character"></button><div class="character-bottom"><button class="tool-button" id="speak">${icon("volume")}${t("Escuchar")}</button><button class="tool-button" id="show-animation">${icon("play")}${t("Ver trazos")}</button><button class="tool-button" id="next-character" aria-label="${t("Siguiente carácter")}">${icon("next")}</button></div></section><section class="panel glass recognition-panel" aria-label="${t("Resultado del reconocimiento")}"><div class="recognition-head"><h2>${t("Lo que dice tu tinta")}</h2>${icon("sparkle")}</div><div id="recognition-result" aria-live="polite"></div></section></div></div><div class="section-head"><div><h2>${t("Pequeños pasos, nuevos caracteres.")}</h2><p>${t("Seis ideas para tu próxima práctica.")}</p></div><button class="text-button" id="explore">${t("Explorar todos")} ${icon("arrow")}</button></div><div class="character-strip" id="character-strip"></div></section>
<section id="wallet-view" aria-label="${t("Mi wallet")}" hidden><div class="wallet-stats"><div class="wallet-stat glass"><strong id="stat-saved">0</strong><span>${t("En tu colección")}</span></div><div class="wallet-stat glass"><strong id="stat-mastered">0</strong><span>${t("Consolidados")}</span></div><div class="wallet-stat glass"><strong id="stat-due">0</strong><span>${t("Listos para repasar")}</span></div></div><div class="wallet-filter" role="group" aria-label="${t("Filtrar colección")}"><button class="pill active" data-scope="saved" aria-pressed="true">${t("Mi colección")}</button><button class="pill" data-scope="all" aria-pressed="false">${t("Explorar los {count}", { count: vocabulary.length })}</button><button class="pill" data-scope="due" aria-pressed="false">${t("Por repasar")}</button><button class="pill" data-scope="mastered" aria-pressed="false">${t("Consolidados")}</button></div><div class="wallet-toolbar"><input class="input" id="wallet-search" placeholder="${t("Busca hanzi, pinyin o significado…")}" aria-label="${t("Buscar en la colección")}" type="search" /><select class="input" id="category-filter" aria-label="${t("Filtrar por categoría")}"><option value="">${t("Todas las categorías")}</option></select><button class="icon-button" id="wallet-export" aria-label="${t("Exportar colección")}" title="${t("Exportar colección")}">${icon("download")}</button></div><p class="collection-explainer" id="collection-explainer">${t("Guarda lo que quieres aprender. Cada carácter lleva su propio ritmo de repaso.")}</p><div class="wallet-grid" id="wallet-grid"></div></section>
<section id="review-view" aria-label="${t("Repaso espaciado")}" hidden><div class="review-container"><div class="review-top"><div class="segment" role="group" aria-label="${t("Dirección del repaso")}"><button class="active" data-direction="hanzi" aria-pressed="true">${t("Hanzi → significado")}</button><button data-direction="meaning" aria-pressed="false">${t("Significado → hanzi")}</button></div><span id="review-counter"></span></div><div id="review-content"></div><p class="review-note">${t("Recuerda antes de revelar. Los repasos se ajustan a tu respuesta y se guardan en este dispositivo.")}</p></div></section>
<footer class="page-footer"><span>${icon("shield")}${t("Tu progreso se queda contigo.")}</span><button id="open-about">${t("Acerca de Hanzi Wallet")}</button><span>${t("Un trazo a la vez.")}</span></footer></main></div>
<nav class="mobile-nav" aria-label="${t("Navegación móvil")}"><button data-view="learn" class="active" aria-current="page">${icon("sparkle")}<span data-learn-nav>${learnText("home")}</span></button><button data-view="studio" aria-current="false">${icon("pen")}${t("Escribir")}</button><button data-view="wallet" aria-current="false">${icon("wallet")}${t("Mi wallet")}</button><button data-view="review" aria-current="false">${icon("layers")}${t("Repasar")}</button></nav><div class="toast" id="toast" role="status"></div>
<dialog class="dialog" id="search-dialog"><div class="dialog-head"><h2>${t("Un carácter, una nueva idea.")}</h2><button class="icon-button" data-close="search-dialog" aria-label="${t("Cerrar búsqueda")}">${icon("close")}</button></div><input class="input" id="global-search" type="search" placeholder="${t("你, nǐ, tú…")}" aria-label="${t("Buscar hanzi, pinyin o significado")}" autocomplete="off" /><div class="search-results" id="search-results"></div></dialog>
<dialog class="dialog" id="settings-dialog"><div class="dialog-head"><h2>${t("A tu manera.")}</h2><button class="icon-button" data-close="settings-dialog" aria-label="${t("Cerrar preferencias")}">${icon("close")}</button></div><div class="setting-row"><label for="language-select">${t("Idioma")}<small>${t("La interfaz y los significados cambian contigo.")}</small></label><select id="language-select">${LOCALES.map((locale) => `<option value="${locale}">${LANGUAGE_NAMES[locale]}</option>`).join("")}</select></div><div class="setting-row"><label for="theme-select">${t("Apariencia")}<small>${t("Un espacio que se adapta a ti.")}</small></label><select id="theme-select"><option value="light">${t("Claro")}</option><option value="dark">${t("Oscuro")}</option><option value="system">${t("Sistema")}</option></select></div><div class="setting-row"><label for="glass-toggle">${t("Menos transparencia")}<small>${t("Superficies más sólidas para leer mejor.")}</small></label><input id="glass-toggle" type="checkbox" /></div><div class="setting-row"><label for="daily-goal">${t("Meta diaria")}<small>${t("Caracteres escritos con guía y sin errores de orden.")}</small></label><select id="daily-goal"><option value="3">${t("{count} caracteres", { count: 3 })}</option><option value="5">${t("{count} caracteres", { count: 5 })}</option><option value="10">${t("{count} caracteres", { count: 10 })}</option><option value="15">${t("{count} caracteres", { count: 15 })}</option></select></div><h3>${t("Tu progreso, contigo.")}</h3><p>${t("Guarda una copia para llevar tu colección y tus ejemplos de escritura a otro dispositivo.")}</p><div class="settings-actions"><button class="secondary" id="export">${icon("download")}${t("Exportar copia")}</button><button class="secondary" id="import">${icon("upload")}${t("Importar copia")}</button><input type="file" id="import-file" accept=".json,application/json" hidden /></div><p class="model-note">${t("La importación combina colecciones. Conserva primero una copia si quieres guardar el estado actual.")}</p></dialog>
<dialog class="dialog" id="about-dialog"><div class="dialog-head"><h2>${t("Un trazo a la vez.")}</h2><button class="icon-button" data-close="about-dialog" aria-label="${t("Cerrar información")}">${icon("close")}</button></div><p>${t("Hanzi Wallet es tu espacio personal para practicar escritura china, reunir caracteres y recordarlos con repasos espaciados.")}</p><h3>${t("Cómo entiende tu escritura")}</h3><p>${t("Una red neuronal ya entrenada combina la forma visual con un comparador de trayectorias. La guía evalúa forma, orden y dirección por separado. Puedes confirmar ejemplos para que el reconocimiento se adapte a tu letra en este dispositivo.")}</p><p class="model-note">${t("Reconoce los {count} caracteres incluidos.", { count: vocabulary.length })} <span id="model-metrics">${t("La evaluación disponible usa muestras sintéticas; falta validarla con escritura humana independiente.")}</span> ${t("La coincidencia es una medida de similitud, no una probabilidad ni una calificación lingüística.")}</p><h3>${t("Privado por diseño")}</h3><p>${t("Tu tinta y tu progreso se procesan en este navegador. Después de la primera carga completa, puedes volver sin conexión. La práctica funciona de forma local y conserva tus trazos en el navegador.")}</p><h3>${t("Créditos")}</h3><p class="model-note">made with &lt;3 Jose</p><p class="model-note">${t("Audio de pronunciación incluido, con reproducción nativa en el navegador.")} <a href="./audio/ATTRIBUTION.txt" target="_blank" rel="noopener noreferrer">${t("Créditos")}</a></p><p class="model-note">${t("Datos de trazos de")} <a href="https://github.com/chanind/hanzi-writer-data" target="_blank" rel="noopener noreferrer">Hanzi Writer Data / Make Me a Hanzi</a>${t(", derivados de fuentes Arphic y distribuidos bajo")} <a href="./data/ARPHICPL.txt" target="_blank" rel="noopener noreferrer">${t("Arphic Public License")}</a>. ${t("Interfaz web inspirada en los materiales Liquid Glass de Apple.")}</p><p class="model-note">Hanzi Wallet · ${version}</p></dialog>`;
}
function toast(message: string): void {
  clearTimeout(toastTimer);
  el("toast").textContent = tr(message);
  el("toast").classList.add("show");
  toastTimer = window.setTimeout(
    () => el("toast").classList.remove("show"),
    3500,
  );
}
function save(): void {
  try {
    persist(state);
  } catch (error) {
    toast(error instanceof Error ? error.message : t("No se pudo guardar."));
  }
  renderStats();
}
function isDark(): boolean {
  return (
    state.preferences.theme === "dark" ||
    (state.preferences.theme === "system" &&
      matchMedia("(prefers-color-scheme: dark)").matches)
  );
}
function applyPreferences(): void {
  document.documentElement.classList.toggle("dark", isDark());
  document.documentElement.classList.toggle(
    "reduced-glass",
    state.preferences.reducedGlass,
  );
  ink.width = state.preferences.inkWidth;
  ink.color = isDark() ? "#f3ead9" : "#292b2c";
  ink.redraw();
  el<HTMLButtonElement>("theme-toggle").innerHTML = icon(
    isDark() ? "sun" : "moon",
  );
  el("theme-toggle").setAttribute(
    "aria-label",
    isDark() ? t("Cambiar a modo claro") : t("Cambiar a modo oscuro"),
  );
  el<HTMLSelectElement>("theme-select").value = state.preferences.theme;
  el<HTMLSelectElement>("language-select").value = getLocale();
  el<HTMLInputElement>("glass-toggle").checked = state.preferences.reducedGlass;
  el<HTMLSelectElement>("daily-goal").value = String(state.preferences.goal);
  el<HTMLInputElement>("ink-width").value = String(state.preferences.inkWidth);
}
function updateDateAndMetrics(): void {
  document.title = `Hanzi Wallet · ${learnText("home")}`;
  el("today-date").textContent = new Intl.DateTimeFormat(getLocale(), {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());
  if (modelMetrics)
    el("model-metrics").textContent = t(
      "La red obtuvo {score}% de acierto en {count} muestras sintéticas; falta validarla con escritura humana independiente.",
      {
        score: new Intl.NumberFormat(getLocale(), {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(modelMetrics.top1 * 100),
        count: new Intl.NumberFormat(getLocale()).format(
          modelMetrics.test_samples,
        ),
      },
    );
}
function assessmentFeedback(a: Assessment): string {
  if (!a.actual) return t("Escribe un carácter para evaluar tus trazos.");
  if (a.passed)
    return t("Muy bien. La forma, el orden y la dirección coinciden.");
  if (!a.complete)
    return a.actual < a.expected
      ? t("Llevas {count} de {total} trazos. Completa el carácter.", {
          count: a.actual,
          total: a.expected,
        })
      : t("Hay trazos extra; deshaz o vuelve a intentarlo.");
  if (a.shape < 67)
    return t(
      "Ajusta la posición y la proporción. Activa la guía para comparar.",
    );
  return a.order < 100
    ? t(
        "La forma se parece, pero revisa el orden. Mira la animación e inténtalo de nuevo.",
      )
    : t(
        "Revisa la dirección: normalmente de arriba abajo y de izquierda a derecha.",
      );
}
function renderStats(): void {
  const cards = Object.values(state.wallet),
    due = cards.filter((c) => c.nextReview <= Date.now()).length;
  el("stat-saved").textContent = String(cards.length);
  el("stat-mastered").textContent = String(
    cards.filter((c) => c.mastered).length,
  );
  el("stat-due").textContent = String(due);
  document.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
    node.textContent =
      node.dataset.count === "wallet"
        ? String(cards.length)
        : node.dataset.count === "review"
          ? String(due)
          : node.dataset.count === "learn"
            ? String(learning?.due ?? 0)
            : "";
    node.hidden =
      node.dataset.count === "studio" ||
      (node.dataset.count === "learn" && !learning?.due);
  });
  const today = new Set(
    state.history
      .filter((r) => r.passed && dayKey(r.timestamp) === dayKey(Date.now()))
      .map((r) => r.char),
  ).size;
  const goal = state.preferences.goal;
  el("goal-number").textContent = `${today} / ${goal}`;
  el("goal-fill").style.width = `${Math.min(100, (today / goal) * 100)}%`;
  el("goal-progress").setAttribute("aria-valuemax", String(goal));
  el("goal-progress").setAttribute(
    "aria-valuenow",
    String(Math.min(today, goal)),
  );
}
function glyphSVG(t: CharacterTemplate): string {
  return `<svg viewBox="0 0 1024 1024" aria-hidden="true"><g transform="translate(0,900) scale(1,-1)">${t.paths.map((d) => `<path d="${escape(d)}"/>`).join("")}</g></svg>`;
}
function renderCharacter(): void {
  const e = entry(),
    tpl = template(),
    inWallet = !!state.wallet[selected];
  el("character-category").textContent = tr(e.category);
  el("character-art").innerHTML = glyphSVG(tpl);
  el("character-art").setAttribute("aria-label", selected);
  el("character-pinyin").textContent = e.pinyin;
  el("character-meaning").textContent = meaning(e);
  el("character-strokes").textContent = strokeLabel(tpl.medians.length);
  const button = el<HTMLButtonElement>("save-character");
  button.innerHTML =
    icon(inWallet ? "check" : "plus") +
    (inWallet ? t("En tu wallet") : t("Guardar en mi wallet"));
  button.classList.toggle("saved", inWallet);
  button.setAttribute("aria-pressed", String(inWallet));
  button.title = inWallet
    ? t("Quitar de mi wallet")
    : t("Guardar en mi wallet");
}
function choose(char: string, preserveInk = false): void {
  pronunciation.stop();
  if (!vocabulary.some((e) => e.char === char)) return;
  selected = char;
  clearTimeout(animationTimer);
  if (!preserveInk) ink.clear();
  renderCharacter();
  renderGhost(mode === "animate");
  el("stage-instruction").textContent =
    mode === "free"
      ? t("DIBUJA UN SOLO CARÁCTER")
      : mode === "guide"
        ? t("ESCRIBE {char} · SIGUE EL PUNTO", { char: selected })
        : t("OBSERVA EL ORDEN Y LA DIRECCIÓN");
  if (view !== "studio") switchView("studio");
  if (preserveInk && ink.strokes.length) renderResult(lastResult);
}
function renderGhost(animate = false): void {
  const show = mode === "guide" || mode === "animate" || hint;
  el("ghost").innerHTML = "";
  el("canvas-placeholder").hidden = ink.strokes.length > 0 || show;
  if (!show) return;
  const strokes = normalize(template().medians);
  el("ghost").innerHTML = strokes
    .map(
      (s, i) =>
        `<path d="${s.map((p, j) => `${j ? "L" : "M"}${p.x.toFixed(5)} ${p.y.toFixed(5)}`).join(" ")}"${animate ? ` class="anim-stroke" pathLength="1" style="animation-delay:${i * 0.75}s"` : ""}/>`,
    )
    .join("");
  if (mode === "guide" && strokes[ink.strokes.length]) {
    const s = strokes[ink.strokes.length]!,
      p = s[0]!;
    el("ghost").insertAdjacentHTML(
      "beforeend",
      `<circle class="start-marker" cx="${p.x}" cy="${p.y}" r=".009"/>`,
    );
  }
}
function setMode(next: Mode): void {
  if (next === mode && next !== "animate") return;
  clearTimeout(animationTimer);
  mode = next;
  hint = false;
  ink.clear();
  document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === next);
    b.setAttribute("aria-pressed", String(b.dataset.mode === next));
  });
  el("ink").style.pointerEvents = next === "animate" ? "none" : "auto";
  el("hint").classList.toggle("hidden", next !== "guide");
  el("stage-instruction").textContent =
    next === "free"
      ? t("DIBUJA UN SOLO CARÁCTER")
      : next === "guide"
        ? t("ESCRIBE {char} · SIGUE EL PUNTO", { char: selected })
        : t("OBSERVA EL ORDEN Y LA DIRECCIÓN");
  el("ink-status").textContent =
    next === "animate"
      ? t("Mira cada trazo. Después, prueba con guía.")
      : next === "guide"
        ? t("Sigue la guía; cada movimiento cuenta como un trazo.")
        : t("Tinta fina. Reconocimiento automático.");
  renderGhost(next === "animate");
  if (next === "animate")
    animationTimer = window.setTimeout(
      () => {
        el("ink-status").textContent = t(
          "Tu turno. Cambia a «Con guía» para practicar.",
        );
      },
      template().medians.length * 750 + 200,
    );
}
function emptyRecognition(
  message = t("Tu tinta tiene mucho que decir."),
  sub = t("Escribe un carácter y descubrirás qué reconoce tu trazo."),
): string {
  return `<div class="recognition-empty"><div class="recognition-orb">${icon("pen")}</div><p>${escape(message)}</p><small>${escape(sub)}</small></div>`;
}
function assessmentHTML(a: Assessment): string {
  return `<div class="assessment ${a.passed ? "passed" : ""}"><div class="assessment-bars">${[
    [t("Forma"), a.shape],
    [t("Orden"), a.order],
    [t("Dirección"), a.direction],
  ]
    .map(
      ([label, value]) =>
        `<div class="assessment-bar">${label}<strong>${value}%</strong><i><b style="width:${value}%"></b></i></div>`,
    )
    .join(
      "",
    )}</div><p>${escape(assessmentFeedback(a))}</p>${a.complete && a.shape > 55 ? `<button class="personalize" id="personalize">${t("Sí, escribí {char}. Aprender de este ejemplo.", { char: escape(selected) })}</button>` : ""}</div>`;
}
function renderResult(result: Recognition | null): void {
  const target = el("recognition-result");
  target.classList.remove("recognizing");
  if (!result) {
    target.innerHTML = emptyRecognition();
    return;
  }
  let html = "";
  const first = result.candidates[0];
  if (!first || result.rejected) {
    html = emptyRecognition(
      t("Vamos a intentarlo de nuevo."),
      tr(result.reason),
    );
  } else {
    const e = entry(first.char);
    html = `<div class="candidate-top"><span class="candidate-glyph">${escape(first.char)}</span><div class="candidate-info"><strong>${escape(e.pinyin)}</strong><p>${escape(meaning(e))}</p></div><span class="match-pill">${t("{score}% similitud", { score: Math.round(first.score * 100) })}</span></div><div class="candidate-options" aria-label="${t("Posibles caracteres")}">${result.candidates
      .slice(0, 4)
      .map(
        (c) =>
          `<button data-candidate="${escape(c.char)}" title="${t("Seleccionar {char} para comparar", { char: escape(c.char) })}" aria-label="${t("Comparar con {char}", { char: escape(c.char) })}"><strong>${escape(c.char)}</strong><small>${Math.round(c.score * 100)}</small></button>`,
      )
      .join(
        "",
      )}</div><p class="recognition-help">${t("Elige el que querías escribir para comparar tus trazos.")}</p>`;
  }
  if (
    mode === "guide" ||
    (!result.rejected && result.candidates.some((c) => c.char === selected))
  )
    html += assessmentHTML(assess(ink.strokes, template()));
  target.innerHTML = html;
  const personalize = document.getElementById("personalize");
  if (personalize)
    personalize.onclick = () => {
      const examples = state.personal[selected] ?? [];
      if (examples.length >= 5)
        toast(t("Actualizamos uno de tus cinco ejemplos personales."));
      else toast(t("Tu ejemplo se guardó sólo en este dispositivo."));
      state = {
        ...state,
        personal: {
          ...state.personal,
          [selected]: [
            ...examples,
            ink.strokes.map((s) => s.map((p) => ({ x: p.x, y: p.y }))),
          ].slice(-5),
        },
      };
      save();
      personalize.textContent = t("Ejemplo guardado ✓");
      (personalize as HTMLButtonElement).disabled = true;
    };
}
function requestRecognition(): void {
  if (!ready || !worker || !ink.strokes.length || mode === "animate") return;
  const id = ++requestId;
  el("recognition-result").innerHTML = emptyRecognition(
    t("Leyendo tus trazos…"),
    t("Todo el análisis ocurre en este dispositivo."),
  );
  el("recognition-result").classList.add("recognizing");
  worker.postMessage({
    type: "recognize",
    id,
    strokes: ink.strokes,
    personal: state.personal,
  });
}
function onInkChange(strokes: readonly Stroke[]): void {
  clearTimeout(timer);
  requestId++;
  lastResult = null;
  recorded = false;
  el("stroke-count").textContent = strokeLabel(strokes.length);
  el<HTMLButtonElement>("clear").disabled = !strokes.length;
  el<HTMLButtonElement>("undo").disabled = !strokes.length;
  el<HTMLButtonElement>("analyze").disabled = !strokes.length || !ready;
  renderGhost();
  el("ink-status").textContent =
    mode === "guide"
      ? t("Escribe {char} · {count} de {total} trazos.", {
          char: selected,
          count: strokes.length,
          total: template().medians.length,
        })
      : t("Tinta fina. Reconocimiento automático.");
  if (!strokes.length) {
    renderResult(null);
    return;
  }
  el("recognition-result").innerHTML = emptyRecognition(
    t("Leyendo tus trazos…"),
    t("Termina el carácter o haz una pausa para ver las opciones."),
  );
  timer = window.setTimeout(requestRecognition, 700);
}
function handleRecognition(result: Recognition): void {
  lastResult = result;
  renderResult(result);
  if (mode === "guide" && !recorded) {
    const a = assess(ink.strokes, template());
    if (a.complete) {
      recorded = true;
      const score = Math.round((a.shape + a.order + a.direction) / 3);
      const old = state.wallet[selected];
      state = {
        ...state,
        history: [
          ...state.history,
          { char: selected, timestamp: Date.now(), score, passed: a.passed },
        ].slice(-3000),
        wallet: old
          ? {
              ...state.wallet,
              [selected]: {
                ...old,
                writing: old.writing + 1,
                bestScore: Math.max(old.bestScore, score),
              },
            }
          : state.wallet,
      };
      save();
      if (a.passed)
        el("ink-status").textContent = t("Bien hecho. Un carácter más cerca.");
    }
  }
}
function miniCard(e: VocabularyEntry): string {
  return `<button class="mini-card" data-char="${escape(e.char)}" aria-label="${t("Practicar {char}, {pinyin}, {meaning}", { char: escape(e.char), pinyin: escape(e.pinyin), meaning: escape(meaning(e)) })}">${state.wallet[e.char] ? `<i class="tiny-dot ${state.wallet[e.char]!.mastered ? "done" : ""}"></i>` : ""}<span class="glyph" lang="zh-CN">${escape(e.char)}</span><span class="reading">${escape(e.pinyin)}</span><span class="gloss">${escape(meaning(e))}</span></button>`;
}
function renderStrip(): void {
  el("character-strip").innerHTML = ["你", "好", "学", "水", "山", "心"]
    .map((h) => miniCard(entry(h)))
    .join("");
}
function searchMatch(e: VocabularyEntry, q: string): boolean {
  const clean = (s: string): string =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  return clean(
    `${e.char} ${e.pinyin} ${Object.values(e.meanings ?? {}).join(" ")} ${e.category} ${tr(e.category)}`,
  ).includes(clean(q));
}
function renderWallet(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-scope]").forEach((b) => {
    b.classList.toggle("active", b.dataset.scope === walletScope);
    b.setAttribute("aria-pressed", String(b.dataset.scope === walletScope));
  });
  const list = vocabulary.filter(
    (e) =>
      (walletScope === "all" ||
        (state.wallet[e.char] &&
          (walletScope === "saved" ||
            (walletScope === "due" &&
              state.wallet[e.char]!.nextReview <= Date.now()) ||
            (walletScope === "mastered" && state.wallet[e.char]!.mastered)))) &&
      (!category || e.category === category) &&
      searchMatch(e, walletQuery),
  );
  el("wallet-grid").innerHTML = list.length
    ? list.map(miniCard).join("")
    : `<div class="empty-state">${icon("book")}<h3>${walletQuery ? t("Todavía no lo encontramos.") : t("Aquí empieza tu colección.")}</h3><p>${walletQuery ? t("Prueba con otro carácter, pinyin o significado.") : t("Explora los caracteres y guarda los que quieres aprender.")}</p><button class="button-primary" id="empty-explore">${t("Explorar caracteres")} ${icon("arrow")}</button></div>`;
  document.getElementById("empty-explore")?.addEventListener("click", () => {
    walletScope = "all";
    walletQuery = "";
    category = "";
    el<HTMLInputElement>("wallet-search").value = "";
    el<HTMLSelectElement>("category-filter").value = "";
    renderWallet();
  });
  el("collection-explainer").textContent =
    walletScope === "all"
      ? t(
          "{count} caracteres. Elige uno para practicar y añadirlo a tu wallet.",
          { count: list.length },
        )
      : walletScope === "mastered"
        ? t(
            "Un carácter se consolida al alcanzar un intervalo de al menos siete días de repaso.",
          )
        : t(
            "Guarda lo que quieres aprender. Cada carácter lleva su propio ritmo de repaso.",
          );
}
function switchView(next: View): void {
  view = next;
  for (const v of ["learn", "studio", "wallet", "review"])
    el(`${v}-view`).hidden = v !== next;
  document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === next);
    b.setAttribute("aria-current", b.dataset.view === next ? "page" : "false");
  });
  const titles: Record<View, [string, string, string, string]> = {
    learn: [
      learnText("eyebrow"),
      learnText("title"),
      learnText("subtitle"),
      learnText("home"),
    ],
    studio: [
      t("UN POCO CADA DÍA"),
      t("Dale forma a tu chino."),
      t("Un espacio para escribir, descubrir y recordar. A tu ritmo."),
      t("Writing studio"),
    ],
    wallet: [
      t("PALABRAS QUE SE QUEDAN"),
      t("Tu chino, en tu bolsillo."),
      t(
        "Una colección que crece contigo. Cada carácter, una pequeña conquista.",
      ),
      t("Mi wallet"),
    ],
    review: [
      t("VOLVER PARA RECORDAR"),
      t("Haz espacio en tu memoria."),
      t("Un pequeño repaso hoy. Un recuerdo más fuerte mañana."),
      t("Repasar"),
    ],
  };
  const values = titles[next];
  ["page-eyebrow", "page-title", "page-subtitle", "breadcrumb-view"].forEach(
    (id, i) => (el(id).textContent = values[i]!),
  );
  el(`${next}-view`).classList.remove("view-enter");
  requestAnimationFrame(() => el(`${next}-view`).classList.add("view-enter"));
  if (next === "learn") learning.render();
  if (next === "wallet") renderWallet();
  if (next === "review") {
    reviewAll = false;
    startReview();
  }
  renderStats();
}
function startReview(): void {
  reviewQueue = Object.values(state.wallet)
    .filter((c) => reviewAll || c.nextReview <= Date.now())
    .sort((a, b) => a.nextReview - b.nextReview)
    .map((c) => c.char);
  reviewIndex = 0;
  reviewTotal = reviewQueue.length;
  flipped = false;
  renderReview();
}
function renderReview(): void {
  const char = reviewQueue[reviewIndex];
  el("review-counter").textContent = char
    ? t("{count} de {total}", { count: reviewIndex + 1, total: reviewTotal })
    : "";
  if (!char) {
    const done = reviewTotal > 0;
    el("review-content").innerHTML =
      `<div class="empty-state glass" style="border-radius:28px">${icon(done ? "check" : "layers")}<h3>${done ? t("Un poco más tuyo.") : t("Todo al día.")}</h3><p>${done ? t("Completaste {count} repasos. Nos vemos en la próxima sesión.", { count: reviewTotal }) : t("No tienes caracteres pendientes para este momento.")}</p><button class="button-primary" id="review-more">${Object.keys(state.wallet).length ? t("Repasar toda mi colección") : t("Explorar caracteres")} ${icon("arrow")}</button></div>`;
    el("review-more").onclick = () => {
      if (Object.keys(state.wallet).length) {
        reviewAll = true;
        startReview();
      } else {
        walletScope = "all";
        switchView("wallet");
      }
    };
    return;
  }
  const e = entry(char),
    card = state.wallet[char]!;
  el("review-content").innerHTML =
    `<button class="flash-card glass" id="flip-card" aria-label="${flipped ? t("Ocultar respuesta") : t("Revelar respuesta")}"><span class="eyebrow">${flipped ? t("¿LO RECORDABAS?") : t("TÓMATE UN MOMENTO")}</span>${!flipped ? (reviewReverse ? `<span class="flash-meaning">${escape(meaning(e))}</span>` : `<span class="flash-glyph" lang="zh-CN">${escape(char)}</span>`) : reviewReverse ? `<span class="flash-glyph" lang="zh-CN">${escape(char)}</span><span class="flash-pinyin">${escape(e.pinyin)}</span>` : `<span class="flash-pinyin">${escape(e.pinyin)}</span><span class="flash-meaning">${escape(meaning(e))}</span>`}<span class="flash-hint">${flipped ? t("Elige cómo te fue.") : t("Toca o pulsa Espacio para revelar.")}</span></button><div class="review-ratings"><button class="rating" data-rating="again" ${!flipped ? "disabled" : ""}><strong>${t("Otra vez")}</strong><span>${t("En 10 minutos")}</span></button><button class="rating" data-rating="hard" ${!flipped ? "disabled" : ""}><strong>${t("Con esfuerzo")}</strong><span>${dayLabel(schedule(card, "hard").interval)}</span></button><button class="rating" data-rating="good" ${!flipped ? "disabled" : ""}><strong>${t("Lo recordé")}</strong><span>${dayLabel(schedule(card, "good").interval)}</span></button></div>`;
  el("flip-card").onclick = () => {
    flipped = !flipped;
    renderReview();
  };
  document.querySelectorAll<HTMLButtonElement>("[data-rating]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!flipped) return;
        const rating = b.dataset.rating;
        if (rating !== "again" && rating !== "hard" && rating !== "good")
          return;
        state = {
          ...state,
          wallet: { ...state.wallet, [char]: schedule(card, rating) },
        };
        save();
        reviewIndex++;
        flipped = false;
        renderReview();
      }),
  );
}
function openSearch(): void {
  el<HTMLDialogElement>("search-dialog").showModal();
  el<HTMLInputElement>("global-search").value = "";
  renderSearch("");
  el("global-search").focus();
}
function renderSearch(q: string): void {
  const list = vocabulary.filter((e) => searchMatch(e, q)).slice(0, 30);
  el("search-results").innerHTML = list.length
    ? list
        .map(
          (e) =>
            `<button class="search-result" data-search-char="${escape(e.char)}"><span class="glyph" lang="zh-CN">${escape(e.char)}</span><span><strong>${escape(e.pinyin)}</strong><small>${escape(meaning(e))}</small></span>${icon("arrow")}</button>`,
        )
        .join("")
    : `<div class="empty-state">${t("Prueba con otro hanzi, pinyin o significado.")}</div>`;
}
function exportProgress(): void {
  const blob = new Blob(
    [
      JSON.stringify(
        { ...state, exportedAt: new Date().toISOString() },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hanzi-wallet-${dayKey(Date.now())}.json`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast(t("Tu copia está lista. Guárdala en un lugar seguro."));
}
async function playPronunciation(item: VocabularyEntry): Promise<void> {
  try {
    await pronunciation.speak(item);
  } catch {
    toast(t("No se pudo reproducir el audio en este dispositivo."));
  }
}
function listen(): void {
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const nav = target.closest<HTMLElement>("[data-view]");
    if (nav) {
      switchView(nav.dataset.view as View);
      window.scrollTo({
        top: 0,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
      return;
    }
    const close = target.closest<HTMLElement>("[data-close]");
    if (close) {
      el<HTMLDialogElement>(close.dataset.close!).close();
      return;
    }
    const char = target.closest<HTMLElement>("[data-char]");
    if (char) {
      choose(char.dataset.char!);
      return;
    }
    const search = target.closest<HTMLElement>("[data-search-char]");
    if (search) {
      el<HTMLDialogElement>("search-dialog").close();
      choose(search.dataset.searchChar!);
      return;
    }
    const candidate = target.closest<HTMLElement>("[data-candidate]");
    if (candidate) {
      choose(candidate.dataset.candidate!, true);
      return;
    }
    const modeButton = target.closest<HTMLElement>("[data-mode]");
    if (modeButton) {
      setMode(modeButton.dataset.mode as Mode);
      return;
    }
    const scope = target.closest<HTMLElement>("[data-scope]");
    if (scope) {
      walletScope = scope.dataset.scope!;
      renderWallet();
      return;
    }
    const direction = target.closest<HTMLElement>("[data-direction]");
    if (direction) {
      reviewReverse = direction.dataset.direction === "meaning";
      flipped = false;
      document
        .querySelectorAll<HTMLButtonElement>("[data-direction]")
        .forEach((b) => {
          b.classList.toggle("active", b === direction);
          b.setAttribute("aria-pressed", String(b === direction));
        });
      renderReview();
    }
  });
  el("open-search").onclick = openSearch;
  el("global-search").oninput = () =>
    renderSearch(el<HTMLInputElement>("global-search").value.trim());
  el("open-settings").onclick = () =>
    el<HTMLDialogElement>("settings-dialog").showModal();
  el("open-about").onclick = () =>
    el<HTMLDialogElement>("about-dialog").showModal();
  el("theme-toggle").onclick = () => {
    state = {
      ...state,
      preferences: { ...state.preferences, theme: isDark() ? "light" : "dark" },
    };
    applyPreferences();
    save();
  };
  el("theme-select").onchange = () => {
    const v = el<HTMLSelectElement>("theme-select").value;
    if (v === "light" || v === "dark" || v === "system") {
      state = { ...state, preferences: { ...state.preferences, theme: v } };
      applyPreferences();
      save();
    }
  };
  el("glass-toggle").onchange = () => {
    state = {
      ...state,
      preferences: {
        ...state.preferences,
        reducedGlass: el<HTMLInputElement>("glass-toggle").checked,
      },
    };
    applyPreferences();
    save();
  };
  el("daily-goal").onchange = () => {
    state = {
      ...state,
      preferences: {
        ...state.preferences,
        goal: Number(el<HTMLSelectElement>("daily-goal").value),
      },
    };
    save();
  };
  el("ink-width").oninput = () => {
    state = {
      ...state,
      preferences: {
        ...state.preferences,
        inkWidth: Number(el<HTMLInputElement>("ink-width").value),
      },
    };
    applyPreferences();
    save();
  };
  el("clear").onclick = () => ink.clear();
  el("undo").onclick = () => ink.undo();
  el("analyze").onclick = () => {
    clearTimeout(timer);
    requestRecognition();
  };
  el("hint").onclick = () => {
    hint = !hint;
    renderGhost();
    toast(
      t("Empieza en el punto y sigue el trazo {count}.", {
        count: ink.strokes.length + 1,
      }),
    );
  };
  el("show-animation").onclick = () => setMode("animate");
  el("next-character").onclick = () =>
    choose(
      vocabulary[
        (vocabulary.findIndex((e) => e.char === selected) + 1) %
          vocabulary.length
      ]!.char,
    );
  el("save-character").onclick = () => {
    const existing = !!state.wallet[selected];
    const wallet = { ...state.wallet };
    if (existing) delete wallet[selected];
    else wallet[selected] = saved(selected);
    state = { ...state, wallet };
    save();
    renderCharacter();
    renderStrip();
    toast(
      existing
        ? t("Carácter retirado. Puedes añadirlo cuando quieras.")
        : t("Un nuevo carácter en tu wallet."),
    );
  };
  el("speak").onclick = () => void playPronunciation(entry());
  pronunciation.onStatus = (status) => {
    el("speak").dataset.audio = status;
    if (status === "playing")
      el("speak").dataset.playCount = String(
        Number(el("speak").dataset.playCount ?? 0) + 1,
      );
    el("speak").setAttribute("aria-busy", String(status === "loading"));
    const label =
      status === "loading"
        ? t("Preparando pronunciación…")
        : status === "playing"
          ? t("Reproduciendo pronunciación.")
          : t("Escuchar");
    el("speak").setAttribute("aria-label", label);
    el("speak").title = label;
  };
  el("language-select").onchange = () => {
    const locale = el<HTMLSelectElement>("language-select").value;
    if (!isLocale(locale)) return;
    state = { ...state, preferences: { ...state.preferences, locale } };
    setLocale(locale);
    save();
    translateStatic(root!);
    document
      .querySelectorAll("[data-learn-nav]")
      .forEach((node) => (node.textContent = learnText("home")));
    learning.updateLocale();
    if (view === "learn") switchView("learn");
    for (const option of el<HTMLSelectElement>("daily-goal").options)
      option.textContent = t("{count} caracteres", { count: option.value });
    el("wallet-view").querySelector<HTMLButtonElement>(
      '[data-scope="all"]',
    )!.textContent = t("Explorar los {count}", { count: vocabulary.length });
    renderCharacter();
    renderStrip();
    renderWallet();
    renderReview();
    renderResult(lastResult);
    applyPreferences();
    updateDateAndMetrics();
    el("ink-status").textContent =
      mode === "guide"
        ? t("Escribe {char} · {count} de {total} trazos.", {
            char: selected,
            count: ink.strokes.length,
            total: template().medians.length,
          })
        : mode === "animate"
          ? t("Mira cada trazo. Después, prueba con guía.")
          : t("Tinta fina. Reconocimiento automático.");
    el("stage-instruction").textContent =
      mode === "free"
        ? t("DIBUJA UN SOLO CARÁCTER")
        : mode === "guide"
          ? t("ESCRIBE {char} · SIGUE EL PUNTO", { char: selected })
          : t("OBSERVA EL ORDEN Y LA DIRECCIÓN");
    el("stroke-count").textContent = strokeLabel(ink.strokes.length);
    for (const option of el<HTMLSelectElement>("category-filter").options)
      if (option.value) option.textContent = tr(option.value);
  };
  el("explore").onclick = () => {
    walletScope = "all";
    switchView("wallet");
  };
  el("wallet-search").oninput = () => {
    walletQuery = el<HTMLInputElement>("wallet-search").value.trim();
    renderWallet();
  };
  el("category-filter").onchange = () => {
    category = el<HTMLSelectElement>("category-filter").value;
    renderWallet();
  };
  ["export", "wallet-export"].forEach(
    (id) => (el(id).onclick = exportProgress),
  );
  el("import").onclick = () => el<HTMLInputElement>("import-file").click();
  el("import-file").onchange = async () => {
    const input = el<HTMLInputElement>("import-file"),
      file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5_000_000)
        throw new Error(t("La copia debe pesar menos de 5 MB."));
      const incoming = parseState(
        JSON.parse(await file.text()) as unknown,
        new Set(vocabulary.map((e) => e.char)),
      );
      state = {
        ...state,
        wallet: { ...state.wallet, ...incoming.wallet },
        history: [
          ...new Map(
            [...state.history, ...incoming.history].map((r) => [
              `${r.char}:${r.timestamp}`,
              r,
            ]),
          ).values(),
        ]
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-3000),
        personal: { ...state.personal, ...incoming.personal },
      };
      save();
      renderCharacter();
      renderWallet();
      renderStrip();
      toast(t("Copia importada. Tu colección está al día."));
    } catch (error) {
      toast(
        error instanceof Error ? error.message : t("La copia no es válida."),
      );
    } finally {
      input.value = "";
    }
  };
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (!el<HTMLDialogElement>("search-dialog").open) openSearch();
    }
    if (e.key === "Escape") clearTimeout(timer);
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener(
    "change",
    applyPreferences,
  );
  document.querySelectorAll<HTMLDialogElement>("dialog").forEach((d) =>
    d.addEventListener("click", (e) => {
      if (e.target === d) {
        const r = d.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          d.close();
      }
    }),
  );
  window.addEventListener(
    "offline",
    () => (el("local-status").textContent = t("Sin conexión")),
  );
  window.addEventListener(
    "online",
    () => (el("local-status").textContent = t("En tu dispositivo")),
  );
}
async function init(): Promise<void> {
  try {
    [vocabulary, templates] = await Promise.all([
      json<VocabularyEntry[]>("data/vocabulary.json"),
      json<CharacterTemplate[]>("data/templates.json"),
    ]);
    if (!vocabulary.length || templates.length !== vocabulary.length)
      throw new Error(t("El vocabulario está incompleto."));
    const loaded = loadState(new Set(vocabulary.map((e) => e.char)));
    state = loaded.state;
    setLocale(state.preferences.locale);
    // The first-run collection is a transparent starter set, never invented progress.
    let firstRun = false;
    try {
      firstRun =
        !localStorage.getItem("hanzi-wallet-v3") &&
        !localStorage.getItem("hanzi-studio-v2");
    } catch {
      /* Storage may be blocked; the in-memory app remains usable. */
    }
    if (firstRun && !loaded.warning) {
      const starter = ["你", "好", "我", "学", "水", "山", "心", "永"];
      state = {
        ...state,
        wallet: Object.fromEntries(starter.map((h) => [h, saved(h)])),
      };
    }
    renderShell();
    learning = new LearningView(
      el("learn-view"),
      vocabulary,
      escape,
      playPronunciation,
      (char) => {
        choose(char);
        setMode("guide");
        window.scrollTo({ top: 0 });
      },
      toast,
      renderStats,
    );
    ink = new InkCanvas(el<HTMLCanvasElement>("ink"));
    ink.onChange = onInkChange;
    ink.onStart = () => {
      clearTimeout(timer);
      requestId++;
      el("canvas-placeholder").hidden = true;
      el("recognition-result").innerHTML = emptyRecognition(
        t("Un trazo a la vez."),
        t("Cuando hagas una pausa, aparecerán las coincidencias."),
      );
    };
    applyPreferences();
    listen();
    updateDateAndMetrics();
    el("category-filter").insertAdjacentHTML(
      "beforeend",
      [...new Set(vocabulary.map((e) => e.category))]
        .sort()
        .map((c) => `<option value="${escape(c)}">${escape(tr(c))}</option>`)
        .join(""),
    );
    renderCharacter();
    renderStrip();
    renderResult(null);
    switchView("learn");
    save();
    if (loaded.warning) toast(loaded.warning);
    else if (firstRun)
      window.setTimeout(
        () => toast(t("Tu wallet empieza con 8 caracteres. Hazla tuya.")),
        700,
      );
    let model: NeuralModel | null = null;
    try {
      model = await json<NeuralModel>("model/ink-mlp.json");
      if (model.classes.length !== vocabulary.length || model.features !== 609)
        throw new Error(t("Modelo incompatible."));
      neuralReady = true;
    } catch {
      toast(
        t(
          "Reconocimiento por trazos disponible. No se pudo cargar la red neuronal.",
        ),
      );
    }
    try {
      worker = new Worker(new URL("./recognition.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (
        event: MessageEvent<{
          type: string;
          id?: number;
          result?: Recognition;
          message?: string;
        }>,
      ) => {
        const data = event.data;
        if (data.type === "ready") {
          ready = true;
          el<HTMLButtonElement>("analyze").disabled = !ink.strokes.length;
          if (ink.strokes.length) requestRecognition();
        } else if (
          data.type === "result" &&
          data.id === requestId &&
          data.result
        )
          handleRecognition(data.result);
        else if (data.type === "error") {
          renderResult(null);
          toast(data.message ?? t("No se pudieron leer los trazos."));
        }
      };
      worker.onerror = () => {
        ready = false;
        el<HTMLButtonElement>("analyze").disabled = true;
        el("ink-status").textContent = t(
          "No se pudo iniciar el reconocimiento. Recarga para volver a intentarlo.",
        );
      };
      worker.postMessage({ type: "init", templates, model });
    } catch {
      el("ink-status").textContent = t(
        "Este navegador no admite reconocimiento en segundo plano.",
      );
    }
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      void navigator.serviceWorker
        .register(new URL("sw.js", base), { scope: base.pathname })
        .then(async (registration) => {
          await navigator.serviceWorker.ready;
          if (registration.installing || registration.waiting)
            el("local-status").textContent = t("En tu dispositivo");
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            el("local-status").textContent = navigator.onLine
              ? t("Listo sin conexión")
              : t("Sin conexión");
          });
          const active = registration.active ?? registration.waiting;
          if (active && !registration.installing && !registration.waiting) {
            el("local-status").textContent = navigator.onLine
              ? t("Listo sin conexión")
              : t("Sin conexión");
          }
          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            installing?.addEventListener("statechange", () => {
              if (
                installing.state === "installed" &&
                navigator.serviceWorker.controller
              )
                toast(
                  t("Hay una nueva versión. Se abrirá en tu próxima visita."),
                );
            });
          });
        })
        .catch(() => {
          el("local-status").textContent = t("En tu dispositivo");
        });
    }
    document.documentElement.dataset.model = neuralReady
      ? "neural"
      : "geometry";
    void json<{ top1: number; test_samples: number }>("model/metrics.json")
      .then((m) => {
        modelMetrics = m;
        updateDateAndMetrics();
      })
      .catch(() => {});
  } catch (error) {
    root!.innerHTML = `<div class="boot"><span>字</span><p>${t("No pudimos abrir tu espacio.")}<br>${escape(error instanceof Error ? error.message : t("Revisa tu conexión y vuelve a intentarlo."))}</p><button id="retry">${t("Volver a intentar")}</button></div>`;
    el("retry").onclick = () => location.reload();
  }
}
void init();
