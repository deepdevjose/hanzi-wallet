import "./style.css";
import { icon } from "./icons";
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

type View = "studio" | "wallet" | "review";
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
  const response = await fetch(new URL(path, base));
  if (!response.ok)
    throw new Error(`No se pudo cargar ${path} (${response.status}).`);
  return (await response.json()) as T;
}
let vocabulary: VocabularyEntry[] = [],
  templates: CharacterTemplate[] = [],
  state: AppState;
let selected = "永",
  view: View = "studio",
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
const entry = (char = selected): VocabularyEntry =>
  vocabulary.find((e) => e.char === char) ?? vocabulary[0]!;
const template = (char = selected): CharacterTemplate =>
  templates.find((t) => t.char === char) ?? templates[0]!;
const navButton = (
  v: View,
  label: string,
  name: "pen" | "wallet" | "layers",
): string =>
  `<button class="nav-button ${v === "studio" ? "active" : ""}" data-view="${v}" aria-current="${v === "studio" ? "page" : "false"}">${icon(name)}<span>${label}</span><span class="nav-count" data-count="${v}"></span></button>`;
function renderShell(): void {
  root!.innerHTML = `<div class="shell"><aside class="sidebar glass" aria-label="Barra lateral"><div class="brand"><div class="brand-mark" aria-hidden="true">字</div><strong class="brand-name">Hanzi<span>Wallet</span></strong></div><div class="side-label">TU ESPACIO</div><nav class="side-nav" aria-label="Navegación principal">${navButton("studio", "Escribir", "pen")}${navButton("wallet", "Mi wallet", "wallet")}${navButton("review", "Repasar", "layers")}</nav><div class="goal-card"><div class="goal-header">Tu pequeño hábito<span id="goal-number">0 / 5</span></div><div class="goal-track" role="progressbar" aria-label="Meta diaria" id="goal-progress" aria-valuemin="0" aria-valuemax="5" aria-valuenow="0"><i id="goal-fill"></i></div><p>Unos minutos hoy.<br>Un poco más cerca mañana.</p></div><div class="sidebar-footer">${icon("shield")}<span>Tu progreso se queda contigo.</span></div></aside><main class="main"><header class="topbar"><div class="breadcrumb"><span>Hanzi Wallet</span><span class="breadcrumb-sep">/</span><span id="breadcrumb-view">Writing studio</span></div><div class="top-actions"><button class="search-button" id="open-search" aria-label="Buscar caracteres">${icon("search")}<span>Buscar un carácter</span><kbd>⌘ K</kbd></button><button class="icon-button" id="theme-toggle" aria-label="Cambiar a modo oscuro" title="Cambiar tema">${icon("moon")}</button><button class="icon-button" id="open-settings" aria-label="Preferencias" title="Preferencias">${icon("settings")}</button></div></header><div class="page-heading"><div><div class="eyebrow" id="page-eyebrow">UN POCO CADA DÍA</div><h1 id="page-title">Dale forma a tu chino.</h1><p id="page-subtitle">Un espacio para escribir, descubrir y recordar. A tu ritmo.</p></div><span class="date-chip">${icon("sun")}<span id="today-date"></span></span></div>
<section id="studio-view" aria-label="Estudio de escritura"><div class="studio-grid"><section class="panel glass"><div class="panel-head"><h2>Writing studio</h2><span class="live-label"><i class="live-dot"></i><span id="local-status">En tu dispositivo</span></span></div><div class="segment" role="group" aria-label="Modo de escritura"><button class="active" data-mode="free" aria-pressed="true">${icon("pen")}Libre</button><button data-mode="guide" aria-pressed="false">${icon("grid")}Con guía</button><button data-mode="animate" aria-pressed="false">${icon("play")}Ver trazos</button></div><div class="stage-wrap"><div class="write-stage" id="write-stage"><svg class="grid-guide" viewBox="0 0 400 400" aria-hidden="true"><line x1="0" y1="200" x2="400" y2="200"/><line x1="200" y1="0" x2="200" y2="400"/><line x1="0" y1="0" x2="400" y2="400"/><line x1="400" y1="0" x2="0" y2="400"/></svg><div class="canvas-placeholder" id="canvas-placeholder"><span class="placeholder-glyph" aria-hidden="true">字</span><p>Tu siguiente hanzi empieza aquí.</p></div><svg class="ghost" id="ghost" viewBox="0 0 1 1" aria-hidden="true"></svg><canvas id="ink" aria-label="Lienzo para escribir un carácter chino con mouse, dedo o lápiz"></canvas><i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i></div><div class="stage-caption"><span id="stage-instruction">DIBUJA UN SOLO CARÁCTER</span><span id="stroke-count" aria-live="polite">0 trazos</span></div></div><div class="canvas-tools"><div class="tool-group"><button class="tool-button" id="undo" disabled title="Deshacer último trazo" aria-label="Deshacer último trazo">${icon("undo")}<span>Deshacer</span></button><button class="tool-button" id="clear" disabled title="Borrar lienzo" aria-label="Borrar lienzo">${icon("trash")}<span>Borrar</span></button><div class="divider"></div><label class="width-control" title="Grosor de la tinta"><span class="ink-sample"></span><input id="ink-width" type="range" min="1.5" max="6" step="0.1" value="2.6" aria-label="Grosor de la tinta" /></label><button class="tool-button hidden" id="hint" aria-label="Mostrar el siguiente trazo">${icon("sparkle")}</button></div><button class="analyze-btn" id="analyze" disabled>Analizar ${icon("sparkle")}</button></div><p class="studio-footnote"><span id="ink-status" role="status">Tinta fina. Reconocimiento automático.</span><span>Mouse, dedo o lápiz.</span></p></section><div class="right-stack"><section class="panel glass character-panel" aria-label="Carácter seleccionado"><div class="character-head"><span class="overline">EN TU RADAR</span><span class="tag" id="character-category"></span></div><div class="character-display"><div class="character-art" id="character-art" role="img"></div><div class="character-pinyin" id="character-pinyin"></div><div class="character-meaning" id="character-meaning"></div><div class="character-meta"><span id="character-strokes"></span><i></i><span id="character-level">Carácter simplificado</span></div></div><button class="button-primary full" id="save-character"></button><div class="character-bottom"><button class="tool-button" id="speak">${icon("volume")}Escuchar</button><button class="tool-button" id="show-animation">${icon("play")}Ver trazos</button><button class="tool-button" id="next-character" aria-label="Siguiente carácter">${icon("next")}</button></div></section><section class="panel glass recognition-panel" aria-label="Resultado del reconocimiento"><div class="recognition-head"><h2>Lo que dice tu tinta</h2>${icon("sparkle")}</div><div id="recognition-result" aria-live="polite"></div></section></div></div><div class="section-head"><div><h2>Pequeños pasos, nuevos caracteres.</h2><p>Seis ideas para tu próxima práctica.</p></div><button class="text-button" id="explore">Explorar todos ${icon("arrow")}</button></div><div class="character-strip" id="character-strip"></div></section>
<section id="wallet-view" aria-label="Mi wallet" hidden><div class="wallet-stats"><div class="wallet-stat glass"><strong id="stat-saved">0</strong><span>En tu colección</span></div><div class="wallet-stat glass"><strong id="stat-mastered">0</strong><span>Consolidados</span></div><div class="wallet-stat glass"><strong id="stat-due">0</strong><span>Listos para repasar</span></div></div><div class="wallet-filter" role="group" aria-label="Filtrar colección"><button class="pill active" data-scope="saved" aria-pressed="true">Mi colección</button><button class="pill" data-scope="all" aria-pressed="false">Explorar los 151</button><button class="pill" data-scope="due" aria-pressed="false">Por repasar</button><button class="pill" data-scope="mastered" aria-pressed="false">Consolidados</button></div><div class="wallet-toolbar"><input class="input" id="wallet-search" placeholder="Busca hanzi, pinyin o significado…" aria-label="Buscar en la colección" type="search" /><select class="input" id="category-filter" aria-label="Filtrar por categoría"><option value="">Todas las categorías</option></select><button class="icon-button" id="wallet-export" aria-label="Exportar colección" title="Exportar colección">${icon("download")}</button></div><p class="collection-explainer" id="collection-explainer">Guarda lo que quieres aprender. Cada carácter lleva su propio ritmo de repaso.</p><div class="wallet-grid" id="wallet-grid"></div></section>
<section id="review-view" aria-label="Repaso espaciado" hidden><div class="review-container"><div class="review-top"><div class="segment" role="group" aria-label="Dirección del repaso"><button class="active" data-direction="hanzi" aria-pressed="true">Hanzi → significado</button><button data-direction="meaning" aria-pressed="false">Significado → hanzi</button></div><span id="review-counter"></span></div><div id="review-content"></div><p class="review-note">Recuerda antes de revelar. Los repasos se ajustan a tu respuesta y se guardan en este dispositivo.</p></div></section>
<footer class="page-footer"><span>${icon("shield")}Sin cuentas. Sin distracciones. Sólo tú y tus trazos.</span><button id="open-about">Acerca de Hanzi Wallet</button><span>Un trazo a la vez.</span></footer></main></div>
<nav class="mobile-nav" aria-label="Navegación móvil"><button data-view="studio" class="active" aria-current="page">${icon("pen")}Escribir</button><button data-view="wallet" aria-current="false">${icon("wallet")}Mi wallet</button><button data-view="review" aria-current="false">${icon("layers")}Repasar</button></nav><div class="toast" id="toast" role="status"></div>
<dialog class="dialog" id="search-dialog"><div class="dialog-head"><h2>Un carácter, una nueva idea.</h2><button class="icon-button" data-close="search-dialog" aria-label="Cerrar búsqueda">${icon("close")}</button></div><input class="input" id="global-search" type="search" placeholder="你, nǐ, tú…" aria-label="Buscar hanzi, pinyin o significado" autocomplete="off" /><div class="search-results" id="search-results"></div></dialog>
<dialog class="dialog" id="settings-dialog"><div class="dialog-head"><h2>A tu manera.</h2><button class="icon-button" data-close="settings-dialog" aria-label="Cerrar preferencias">${icon("close")}</button></div><div class="setting-row"><label for="theme-select">Apariencia<small>Un espacio que se adapta a ti.</small></label><select id="theme-select"><option value="light">Claro</option><option value="dark">Oscuro</option><option value="system">Sistema</option></select></div><div class="setting-row"><label for="glass-toggle">Menos transparencia<small>Superficies más sólidas para leer mejor.</small></label><input id="glass-toggle" type="checkbox" /></div><div class="setting-row"><label for="daily-goal">Meta diaria<small>Caracteres escritos con guía y sin errores de orden.</small></label><select id="daily-goal"><option value="3">3 caracteres</option><option value="5">5 caracteres</option><option value="10">10 caracteres</option><option value="15">15 caracteres</option></select></div><h3>Tu progreso, contigo.</h3><p>Guarda una copia para llevar tu colección y tus ejemplos de escritura a otro dispositivo.</p><div class="settings-actions"><button class="secondary" id="export">${icon("download")}Exportar copia</button><button class="secondary" id="import">${icon("upload")}Importar copia</button><input type="file" id="import-file" accept=".json,application/json" hidden /></div><p class="model-note">La importación combina colecciones. Conserva primero una copia si quieres guardar el estado actual.</p></dialog>
<dialog class="dialog" id="about-dialog"><div class="dialog-head"><h2>Un trazo a la vez.</h2><button class="icon-button" data-close="about-dialog" aria-label="Cerrar información">${icon("close")}</button></div><p>Hanzi Wallet es tu espacio personal para practicar escritura china, reunir caracteres y recordarlos con repasos espaciados.</p><h3>Cómo entiende tu escritura</h3><p>Una red neuronal ya entrenada combina la forma visual con un comparador de trayectorias. La guía evalúa forma, orden y dirección por separado. Puedes confirmar ejemplos para que el reconocimiento se adapte a tu letra en este dispositivo.</p><p class="model-note">Reconoce los 151 caracteres incluidos. <span id="model-metrics">La evaluación disponible usa muestras sintéticas; falta validarla con escritura humana independiente.</span> La coincidencia es una medida de similitud, no una probabilidad ni una calificación lingüística.</p><h3>Privado por diseño</h3><p>Tu tinta y tu progreso se procesan en este navegador. Después de la primera carga completa, puedes volver sin conexión. No hay analítica, cuentas ni envío de tus trazos a un servidor.</p><h3>Créditos</h3><p class="model-note">Datos de trazos de <a href="https://github.com/chanind/hanzi-writer-data" target="_blank" rel="noopener noreferrer">Hanzi Writer Data / Make Me a Hanzi</a>, derivados de fuentes Arphic y distribuidos bajo <a href="./data/ARPHICPL.txt" target="_blank" rel="noopener noreferrer">Arphic Public License</a>. Interfaz web inspirada en los materiales Liquid Glass de Apple.</p><p class="model-note">Hanzi Wallet · 1.0.0</p></dialog>`;
}
function toast(message: string): void {
  clearTimeout(toastTimer);
  el("toast").textContent = message;
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
    toast(error instanceof Error ? error.message : "No se pudo guardar.");
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
  ink.color = isDark() ? "#d6e8c3" : "#293b35";
  ink.redraw();
  el<HTMLButtonElement>("theme-toggle").innerHTML = icon(
    isDark() ? "sun" : "moon",
  );
  el("theme-toggle").setAttribute(
    "aria-label",
    isDark() ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
  );
  el<HTMLSelectElement>("theme-select").value = state.preferences.theme;
  el<HTMLInputElement>("glass-toggle").checked = state.preferences.reducedGlass;
  el<HTMLSelectElement>("daily-goal").value = String(state.preferences.goal);
  el<HTMLInputElement>("ink-width").value = String(state.preferences.inkWidth);
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
          : "";
    node.hidden = node.dataset.count === "studio";
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
    t = template(),
    inWallet = !!state.wallet[selected];
  el("character-category").textContent = e.category;
  el("character-art").innerHTML = glyphSVG(t);
  el("character-art").setAttribute("aria-label", selected);
  el("character-pinyin").textContent = e.pinyin;
  el("character-meaning").textContent = e.meaning;
  el("character-strokes").textContent = `${t.medians.length} trazos`;
  const button = el<HTMLButtonElement>("save-character");
  button.innerHTML =
    icon(inWallet ? "check" : "plus") +
    (inWallet ? "En tu wallet" : "Guardar en mi wallet");
  button.classList.toggle("saved", inWallet);
  button.setAttribute("aria-pressed", String(inWallet));
  button.title = inWallet ? "Quitar de mi wallet" : "Guardar en mi wallet";
}
function choose(char: string, preserveInk = false): void {
  if (!vocabulary.some((e) => e.char === char)) return;
  selected = char;
  clearTimeout(animationTimer);
  if (!preserveInk) ink.clear();
  renderCharacter();
  renderGhost(mode === "animate");
  el("stage-instruction").textContent =
    mode === "free"
      ? "DIBUJA UN SOLO CARÁCTER"
      : mode === "guide"
        ? `ESCRIBE ${selected} · SIGUE EL PUNTO`
        : "OBSERVA EL ORDEN Y LA DIRECCIÓN";
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
      ? "DIBUJA UN SOLO CARÁCTER"
      : next === "guide"
        ? `ESCRIBE ${selected} · SIGUE EL PUNTO`
        : "OBSERVA EL ORDEN Y LA DIRECCIÓN";
  el("ink-status").textContent =
    next === "animate"
      ? "Mira cada trazo. Después, prueba con guía."
      : next === "guide"
        ? "Sigue la guía; cada movimiento cuenta como un trazo."
        : "Tinta fina. Reconocimiento automático.";
  renderGhost(next === "animate");
  if (next === "animate")
    animationTimer = window.setTimeout(
      () => {
        el("ink-status").textContent =
          "Tu turno. Cambia a «Con guía» para practicar.";
      },
      template().medians.length * 750 + 200,
    );
}
function emptyRecognition(
  message = "Tu tinta tiene mucho que decir.",
  sub = "Escribe un carácter y descubrirás qué reconoce tu trazo.",
): string {
  return `<div class="recognition-empty"><div class="recognition-orb">${icon("pen")}</div><p>${escape(message)}</p><small>${escape(sub)}</small></div>`;
}
function assessmentHTML(a: Assessment): string {
  return `<div class="assessment ${a.passed ? "passed" : ""}"><div class="assessment-bars">${[
    ["Forma", a.shape],
    ["Orden", a.order],
    ["Dirección", a.direction],
  ]
    .map(
      ([label, value]) =>
        `<div class="assessment-bar">${label}<strong>${value}%</strong><i><b style="width:${value}%"></b></i></div>`,
    )
    .join(
      "",
    )}</div><p>${escape(a.feedback)}</p>${a.complete && a.shape > 55 ? `<button class="personalize" id="personalize">Sí, escribí ${escape(selected)}. Aprender de este ejemplo.</button>` : ""}</div>`;
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
    html = emptyRecognition("Vamos a intentarlo de nuevo.", result.reason);
  } else {
    const e = entry(first.char);
    html = `<div class="candidate-top"><span class="candidate-glyph">${escape(first.char)}</span><div class="candidate-info"><strong>${escape(e.pinyin)}</strong><p>${escape(e.meaning)}</p></div><span class="match-pill">${Math.round(first.score * 100)}% similitud</span></div><div class="candidate-options" aria-label="Posibles caracteres">${result.candidates
      .slice(0, 4)
      .map(
        (c) =>
          `<button data-candidate="${escape(c.char)}" title="Seleccionar ${escape(c.char)} para comparar" aria-label="Comparar con ${escape(c.char)}"><strong>${escape(c.char)}</strong><small>${Math.round(c.score * 100)}</small></button>`,
      )
      .join(
        "",
      )}</div><p class="recognition-help">Elige el que querías escribir para comparar tus trazos.</p>`;
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
        toast("Actualizamos uno de tus cinco ejemplos personales.");
      else toast("Tu ejemplo se guardó sólo en este dispositivo.");
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
      personalize.textContent = "Ejemplo guardado ✓";
      (personalize as HTMLButtonElement).disabled = true;
    };
}
function requestRecognition(): void {
  if (!ready || !worker || !ink.strokes.length || mode === "animate") return;
  const id = ++requestId;
  el("recognition-result").innerHTML = emptyRecognition(
    "Leyendo tus trazos…",
    "Todo el análisis ocurre en este dispositivo.",
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
  el("stroke-count").textContent =
    `${strokes.length} ${strokes.length === 1 ? "trazo" : "trazos"}`;
  el<HTMLButtonElement>("clear").disabled = !strokes.length;
  el<HTMLButtonElement>("undo").disabled = !strokes.length;
  el<HTMLButtonElement>("analyze").disabled = !strokes.length || !ready;
  renderGhost();
  el("ink-status").textContent =
    mode === "guide"
      ? `Escribe ${selected} · ${strokes.length} de ${template().medians.length} trazos.`
      : "Tinta fina. Reconocimiento automático.";
  if (!strokes.length) {
    renderResult(null);
    return;
  }
  el("recognition-result").innerHTML = emptyRecognition(
    "Leyendo tus trazos…",
    "Termina el carácter o haz una pausa para ver las opciones.",
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
        el("ink-status").textContent = "Bien hecho. Un carácter más cerca.";
    }
  }
}
function miniCard(e: VocabularyEntry): string {
  return `<button class="mini-card" data-char="${escape(e.char)}" aria-label="Practicar ${escape(e.char)}, ${escape(e.pinyin)}, ${escape(e.meaning)}">${state.wallet[e.char] ? `<i class="tiny-dot ${state.wallet[e.char]!.mastered ? "done" : ""}"></i>` : ""}<span class="glyph" lang="zh-CN">${escape(e.char)}</span><span class="reading">${escape(e.pinyin)}</span><span class="gloss">${escape(e.meaning)}</span></button>`;
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
  return clean(`${e.char} ${e.pinyin} ${e.meaning} ${e.category}`).includes(
    clean(q),
  );
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
    : `<div class="empty-state">${icon("book")}<h3>${walletQuery ? "Todavía no lo encontramos." : "Aquí empieza tu colección."}</h3><p>${walletQuery ? "Prueba con otro carácter, pinyin o significado." : "Explora los caracteres y guarda los que quieres aprender."}</p><button class="button-primary" id="empty-explore">Explorar caracteres ${icon("arrow")}</button></div>`;
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
      ? `${list.length} caracteres. Elige uno para practicar y añadirlo a tu wallet.`
      : walletScope === "mastered"
        ? "Un carácter se consolida al alcanzar un intervalo de al menos siete días de repaso."
        : "Guarda lo que quieres aprender. Cada carácter lleva su propio ritmo de repaso.";
}
function switchView(next: View): void {
  view = next;
  for (const v of ["studio", "wallet", "review"])
    el(`${v}-view`).hidden = v !== next;
  document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === next);
    b.setAttribute("aria-current", b.dataset.view === next ? "page" : "false");
  });
  const titles: Record<View, [string, string, string, string]> = {
    studio: [
      "UN POCO CADA DÍA",
      "Dale forma a tu chino.",
      "Un espacio para escribir, descubrir y recordar. A tu ritmo.",
      "Writing studio",
    ],
    wallet: [
      "PALABRAS QUE SE QUEDAN",
      "Tu chino, en tu bolsillo.",
      "Una colección que crece contigo. Cada carácter, una pequeña conquista.",
      "Mi wallet",
    ],
    review: [
      "VOLVER PARA RECORDAR",
      "Haz espacio en tu memoria.",
      "Un pequeño repaso hoy. Un recuerdo más fuerte mañana.",
      "Repasar",
    ],
  };
  const values = titles[next];
  ["page-eyebrow", "page-title", "page-subtitle", "breadcrumb-view"].forEach(
    (id, i) => (el(id).textContent = values[i]!),
  );
  el(`${next}-view`).classList.remove("view-enter");
  requestAnimationFrame(() => el(`${next}-view`).classList.add("view-enter"));
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
    ? `${reviewIndex + 1} de ${reviewTotal}`
    : "";
  if (!char) {
    const done = reviewTotal > 0;
    el("review-content").innerHTML =
      `<div class="empty-state glass" style="border-radius:28px">${icon(done ? "check" : "layers")}<h3>${done ? "Un poco más tuyo." : "Todo al día."}</h3><p>${done ? `Completaste ${reviewTotal} ${reviewTotal === 1 ? "repaso" : "repasos"}. Nos vemos en la próxima sesión.` : "No tienes caracteres pendientes para este momento."}</p><button class="button-primary" id="review-more">${Object.keys(state.wallet).length ? "Repasar toda mi colección" : "Explorar caracteres"} ${icon("arrow")}</button></div>`;
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
    `<button class="flash-card glass" id="flip-card" aria-label="${flipped ? "Ocultar" : "Revelar"} respuesta"><span class="eyebrow">${flipped ? "¿LO RECORDABAS?" : "TÓMATE UN MOMENTO"}</span>${!flipped ? (reviewReverse ? `<span class="flash-meaning">${escape(e.meaning)}</span>` : `<span class="flash-glyph" lang="zh-CN">${escape(char)}</span>`) : reviewReverse ? `<span class="flash-glyph" lang="zh-CN">${escape(char)}</span><span class="flash-pinyin">${escape(e.pinyin)}</span>` : `<span class="flash-pinyin">${escape(e.pinyin)}</span><span class="flash-meaning">${escape(e.meaning)}</span>`}<span class="flash-hint">${flipped ? "Elige cómo te fue." : "Toca o pulsa Espacio para revelar."}</span></button><div class="review-ratings"><button class="rating" data-rating="again" ${!flipped ? "disabled" : ""}><strong>Otra vez</strong><span>En 10 minutos</span></button><button class="rating" data-rating="hard" ${!flipped ? "disabled" : ""}><strong>Con esfuerzo</strong><span>${schedule(card, "hard").interval} día(s)</span></button><button class="rating" data-rating="good" ${!flipped ? "disabled" : ""}><strong>Lo recordé</strong><span>${schedule(card, "good").interval} día(s)</span></button></div>`;
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
            `<button class="search-result" data-search-char="${escape(e.char)}"><span class="glyph" lang="zh-CN">${escape(e.char)}</span><span><strong>${escape(e.pinyin)}</strong><small>${escape(e.meaning)}</small></span>${icon("arrow")}</button>`,
        )
        .join("")
    : '<div class="empty-state">Prueba con otro hanzi, pinyin o significado.</div>';
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
  toast("Tu copia está lista. Guárdala en un lugar seguro.");
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
    toast(`Empieza en el punto y sigue el trazo ${ink.strokes.length + 1}.`);
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
        ? "Carácter retirado. Puedes añadirlo cuando quieras."
        : "Un nuevo carácter en tu wallet.",
    );
  };
  el("speak").onclick = () => {
    if (!("speechSynthesis" in window)) {
      toast("Este navegador no ofrece voz. Usa el pinyin como referencia.");
      return;
    }
    const voices = speechSynthesis.getVoices();
    const chinese =
      voices.find((v) => /^zh[-_]CN/i.test(v.lang)) ??
      voices.find((v) => /^zh/i.test(v.lang));
    if (!chinese) {
      toast("No hay una voz china instalada en este dispositivo.");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selected);
    utterance.voice = chinese;
    utterance.lang = "zh-CN";
    utterance.rate = 0.75;
    utterance.onerror = () =>
      toast("No se pudo reproducir el audio en este dispositivo.");
    speechSynthesis.speak(utterance);
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
        throw new Error("La copia debe pesar menos de 5 MB.");
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
      toast("Copia importada. Tu colección está al día.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "La copia no es válida.");
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
    () => (el("local-status").textContent = "Sin conexión"),
  );
  window.addEventListener(
    "online",
    () => (el("local-status").textContent = "En tu dispositivo"),
  );
}
async function init(): Promise<void> {
  try {
    [vocabulary, templates] = await Promise.all([
      json<VocabularyEntry[]>("data/vocabulary.json"),
      json<CharacterTemplate[]>("data/templates.json"),
    ]);
    if (!vocabulary.length || templates.length !== vocabulary.length)
      throw new Error("El vocabulario está incompleto.");
    const loaded = loadState(new Set(vocabulary.map((e) => e.char)));
    state = loaded.state;
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
    ink = new InkCanvas(el<HTMLCanvasElement>("ink"));
    ink.onChange = onInkChange;
    ink.onStart = () => {
      clearTimeout(timer);
      requestId++;
      el("canvas-placeholder").hidden = true;
      el("recognition-result").innerHTML = emptyRecognition(
        "Un trazo a la vez.",
        "Cuando hagas una pausa, aparecerán las coincidencias.",
      );
    };
    applyPreferences();
    listen();
    el("today-date").textContent = new Intl.DateTimeFormat("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date());
    el("category-filter").insertAdjacentHTML(
      "beforeend",
      [...new Set(vocabulary.map((e) => e.category))]
        .sort()
        .map((c) => `<option value="${escape(c)}">${escape(c)}</option>`)
        .join(""),
    );
    renderCharacter();
    renderStrip();
    renderResult(null);
    save();
    if (loaded.warning) toast(loaded.warning);
    else if (firstRun)
      window.setTimeout(
        () => toast("Tu wallet empieza con 8 caracteres. Hazla tuya."),
        700,
      );
    let model: NeuralModel | null = null;
    try {
      model = await json<NeuralModel>("model/ink-mlp.json");
      if (model.classes.length !== vocabulary.length || model.features !== 609)
        throw new Error("Modelo incompatible.");
      neuralReady = true;
    } catch {
      toast(
        "Reconocimiento por trazos disponible. No se pudo cargar la red neuronal.",
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
          toast(data.message ?? "No se pudieron leer los trazos.");
        }
      };
      worker.onerror = () => {
        ready = false;
        el<HTMLButtonElement>("analyze").disabled = true;
        el("ink-status").textContent =
          "No se pudo iniciar el reconocimiento. Recarga para volver a intentarlo.";
      };
      worker.postMessage({ type: "init", templates, model });
    } catch {
      el("ink-status").textContent =
        "Este navegador no admite reconocimiento en segundo plano.";
    }
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      void navigator.serviceWorker
        .register(new URL("sw.js", base), { scope: base.pathname })
        .then(async (registration) => {
          await navigator.serviceWorker.ready;
          const active = registration.active ?? registration.waiting;
          if (active) {
            el("local-status").textContent = navigator.onLine
              ? "Listo sin conexión"
              : "Sin conexión";
          }
          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            installing?.addEventListener("statechange", () => {
              if (
                installing.state === "installed" &&
                navigator.serviceWorker.controller
              )
                toast("Hay una nueva versión. Se abrirá en tu próxima visita.");
            });
          });
        })
        .catch(() => {
          el("local-status").textContent = "En tu dispositivo";
        });
    }
    document.documentElement.dataset.model = neuralReady
      ? "neural"
      : "geometry";
    void json<{ top1: number; test_samples: number }>("model/metrics.json")
      .then((m) => {
        el("model-metrics").textContent =
          `La red obtuvo ${(m.top1 * 100).toFixed(1)}% de acierto en ${m.test_samples.toLocaleString("es-MX")} muestras sintéticas; falta validarla con escritura humana independiente.`;
      })
      .catch(() => {});
  } catch (error) {
    root!.innerHTML = `<div class="boot"><span>字</span><p>No pudimos abrir tu espacio.<br>${escape(error instanceof Error ? error.message : "Revisa tu conexión y vuelve a intentarlo.")}</p><button id="retry">Volver a intentar</button></div>`;
    el("retry").onclick = () => location.reload();
  }
}
void init();
