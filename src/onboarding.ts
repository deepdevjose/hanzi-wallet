import "./onboarding.css";
import {
  getLocale,
  isLocale,
  LANGUAGE_NAMES,
  LOCALES,
  setLocale,
  type Locale,
} from "./i18n";
import type { CharacterTemplate } from "./core/types";
import { loadState } from "./core/storage";
import {
  applyPlacement,
  getLearningXP,
  loadProfile,
  saveProfile,
} from "./core/profile";
import { assessPlacement, PLACEMENT_QUESTIONS } from "./core/placement";
import { openAvatarSetup } from "./profile";

export const WELCOME_KEY = "hanzi-wallet-welcome-v2";
const words = (
  es: string,
  en: string,
  zh: string,
  fr: string,
  pt: string,
): string => ({ es, en, "zh-CN": zh, fr, pt })[getLocale()];
export function browserLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    if (language.toLowerCase().startsWith("zh")) return "zh-CN";
    const short = language.toLowerCase().split("-")[0];
    if (isLocale(short)) return short;
  }
  return "en";
}
const escape = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const arrow =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));
// Small original pen paths: the greetings are written, rather than revealed as typed text.
function handwritten(
  text: string,
  className: string,
  language: string,
  start: number,
): string {
  const letters: Record<string, readonly [number, string]> = {
    h: [
      23,
      "M3 39C8 22 15 0 10 4C3 11 1 34 2 40C8 22 21 20 18 31L15 39Q18 43 24 35",
    ],
    o: [
      23,
      "M20 25C9 19 0 27 3 36C6 46 20 40 21 30C21 25 17 24 14 27Q13 32 24 29",
    ],
    l: [15, "M2 38C10 22 17 0 10 4C3 8-2 39 6 41Q11 42 17 35"],
    a: [24, "M20 25C9 19 1 28 3 36C7 47 18 38 21 25L17 38Q19 45 26 35"],
    e: [21, "M1 33Q20 31 18 25C16 19 3 24 2 33C0 44 15 45 23 35"],
    b: [
      24,
      "M3 38C10 22 17 0 10 4C3 9 0 35 5 40C12 46 24 36 22 28Q20 19 7 29Q16 33 26 27",
    ],
    n: [25, "M2 26L0 39C7 24 16 19 18 25Q20 28 15 38Q17 44 27 34"],
    j: [15, "M10 25C9 42 1 62-6 56C-13 50 9 43 17 35M12 15L13 14"],
    u: [25, "M4 25L0 36C-1 47 16 41 20 25L17 38Q19 44 27 35"],
    r: [21, "M2 26L0 40L8 25Q18 20 19 27L17 30Q20 31 24 28"],
    á: [
      24,
      "M20 25C9 19 1 28 3 36C7 47 18 38 21 25L17 38Q19 45 26 35M12 17L20 9",
    ],
  };
  let x = 5;
  const paths = [...text]
    .map((letter, index) => {
      const [width, path] = letters[letter]!;
      const shape = `<path class="welcome-latin-stroke" d="${path}" transform="translate(${x} 0)" pathLength="1" style="--wait:${start + index * 0.13}s"/>`;
      x += width;
      return shape;
    })
    .join("");
  return `<span class="welcome-hello ${className}" lang="${language}"><svg viewBox="-9 0 ${x + 12} 65" role="img" aria-label="${text}">${paths}</svg></span>`;
}

/** First-visit preparation is independent from earned learning progress. */
export class FirstVisit {
  readonly needed: boolean;
  private readonly dialog = document.createElement("dialog");
  private readonly started = performance.now();
  private completed = 0;
  private readonly reduced = matchMedia("(prefers-reduced-motion: reduce)")
    .matches;
  private locale: Locale = browserLocale(navigator.languages);
  private readonly previousOverflow = document.body.style.overflow;

  constructor(private readonly base: URL) {
    let done = false;
    try {
      done =
        localStorage.getItem(WELCOME_KEY) === "complete" ||
        loadProfile(getLearningXP()).completed;
    } catch {
      /* The in-memory session can still be configured. */
    }
    this.needed = !done;
    if (!this.needed) return;
    if (loadProfile(getLearningXP()).placement?.awarded) {
      this.locale = loadState(new Set<string>()).state.preferences.locale;
    }
    setLocale(this.locale);
    this.dialog.className = "welcome-dialog";
    this.dialog.style.setProperty(
      "--welcome-landscape",
      `url("${new URL("art/ink-landscape.webp", base).href}")`,
    );
    this.dialog.setAttribute("aria-label", "Hanzi Wallet");
    document.body.append(this.dialog);
    this.dialog.addEventListener("cancel", (event) => event.preventDefault());
    this.dialog.showModal();
    document.body.style.overflow = "hidden";
    this.loading();
  }

  private brand(): string {
    return '<div class="welcome-brand"><span class="brand-mark" aria-hidden="true">字</span><span>Hanzi Wallet</span></div>';
  }
  private page(content: string, step?: number): void {
    this.dialog.innerHTML = `${this.brand()}<div class="welcome-content">${content}</div>${step ? `<div class="welcome-steps" aria-hidden="true">${[1, 2, 3].map((n) => `<i class="${n <= step ? "active" : ""}"></i>`).join("")}</div>` : ""}<span class="welcome-signature" aria-hidden="true">一笔一世界 · Un trazo, un mundo.</span>`;
    this.dialog
      .querySelector<HTMLElement>("h1")
      ?.focus({ preventScroll: true });
  }
  private loading(): void {
    this.page(
      `<div class="welcome-preparation"><div class="welcome-lanterns" aria-hidden="true">${[0, 1, 2].map((n) => `<div class="welcome-lantern" style="--i:${n}"><i></i><span>福</span><b></b></div>`).join("")}</div><div class="welcome-emblem" aria-hidden="true">字</div><h1 tabindex="-1">${words("Tu viaje está a punto de empezar.", "Your journey is about to begin.", "你的旅程，即将开始。", "Votre voyage va commencer.", "Sua jornada está prestes a começar.")}</h1><p class="welcome-description">${words("Un pequeño momento para preparar algo especial.", "A little moment to prepare something special.", "稍等片刻，美好即将开启。", "Un instant pour préparer quelque chose de spécial.", "Um instante para preparar algo especial.")}</p><div class="welcome-load-track" role="progressbar" aria-label="${words("Preparando tu espacio", "Preparing your space", "正在准备你的空间", "Préparation de votre espace", "Preparando seu espaço")}" aria-valuemin="0" aria-valuemax="4" aria-valuenow="${this.completed}"><i style="width:${this.completed * 25}%"></i></div><p class="welcome-load-status" role="status">${this.resourceLabel()}</p></div>`,
    );
  }
  private resourceLabel(): string {
    return [
      words(
        "Preparando tu espacio…",
        "Preparing your space…",
        "正在准备你的空间…",
        "Préparation de votre espace…",
        "Preparando seu espaço…",
      ),
      words(
        "Guardando tus primeros trazos…",
        "Gathering your first strokes…",
        "准备第一笔…",
        "Préparation de vos premiers traits…",
        "Reunindo seus primeiros traços…",
      ),
      words(
        "Dando voz a tus palabras…",
        "Giving your words a voice…",
        "让汉字有声有色…",
        "Donnons une voix à vos mots…",
        "Dando voz às suas palavras…",
      ),
      words(
        "Un último toque de magia…",
        "One last touch of magic…",
        "再添一丝惊喜…",
        "Une dernière touche de magie…",
        "Um último toque de magia…",
      ),
      words(
        "Todo listo. Este momento es tuyo.",
        "All ready. This moment is yours.",
        "准备好了，属于你的时刻。",
        "Tout est prêt. À vous de jouer.",
        "Tudo pronto. Este momento é seu.",
      ),
    ][this.completed]!;
  }
  resourceReady(): void {
    if (!this.needed) return;
    this.completed = Math.min(4, this.completed + 1);
    const track = this.dialog.querySelector<HTMLElement>(".welcome-load-track");
    track?.setAttribute("aria-valuenow", String(this.completed));
    const fill = track?.querySelector<HTMLElement>("i");
    if (fill) fill.style.width = `${this.completed * 25}%`;
    const status = this.dialog.querySelector(".welcome-load-status");
    if (status) status.textContent = this.resourceLabel();
  }
  dismiss(): void {
    this.dialog.close();
    this.dialog.remove();
    document.body.style.overflow = this.previousOverflow;
  }
  private async artwork(): Promise<void> {
    await Promise.all(
      [
        "ink-landscape.webp",
        "avatar-male.png",
        "avatar-female.png",
        "avatar-male-hanfu.png",
        "avatar-female-hanfu.png",
        "avatar-male-imperial.png",
        "avatar-female-imperial.png",
        "dragon.png",
      ].map(async (path) => {
        const image = new Image();
        image.src = new URL(`art/${path}`, this.base).href;
        let timeout = 0;
        try {
          await Promise.race([
            image.decode(),
            new Promise<never>((_, reject) => {
              timeout = window.setTimeout(
                () => reject(new Error("Artwork preparation timed out.")),
                30_000,
              );
            }),
          ]);
        } finally {
          clearTimeout(timeout);
        }
      }),
    );
  }
  async run(
    templates: readonly CharacterTemplate[],
    prepareVoice: () => Promise<void>,
    changeLanguage: (locale: Locale) => void,
    setStudyBand: (band: string) => void,
  ): Promise<void> {
    if (!this.needed) return;
    // A retry repeats actual failed preparation, never a cosmetic progress timer.
    for (;;) {
      try {
        await prepareVoice();
        this.resourceReady();
        await this.artwork();
        this.resourceReady();
        await delay(Math.max(0, 1800 - (performance.now() - this.started)));
        break;
      } catch {
        await new Promise<void>((resolve) => {
          this.page(
            `<div class="welcome-step-icon" aria-hidden="true">☁</div><h1 tabindex="-1">${words("Nos falta un pequeño detalle.", "One little thing is still missing.", "还差一点点。", "Il reste un petit détail.", "Falta só um pequeno detalhe.")}</h1><p class="welcome-description">${words("No pudimos preparar todo. Comprueba tu conexión y volvemos a intentarlo.", "We couldn't prepare everything. Check your connection and try again.", "准备还未完成。请检查网络后重试。", "La préparation est incomplète. Vérifiez votre connexion et réessayez.", "Não conseguimos preparar tudo. Confira sua conexão e tente novamente.")}</p><button class="welcome-primary" data-retry>${words("Volver a intentar", "Try again", "重试", "Réessayer", "Tentar novamente")}${arrow}</button>`,
          );
          this.dialog.querySelector<HTMLButtonElement>(
            "[data-retry]",
          )!.onclick = () => {
            this.completed = 2;
            this.loading();
            resolve();
          };
        });
      }
    }
    const pending = loadProfile(getLearningXP()).placement;
    if (!pending?.awarded) {
      await this.greeting(templates);
      await this.language(changeLanguage);
    }
    const band = pending?.awarded
      ? pending.band
      : await this.experience(changeLanguage);
    const xp = getLearningXP();
    const profile = applyPlacement(loadProfile(xp), band);
    saveProfile(profile);
    setStudyBand(profile.placement?.band ?? band);
    window.dispatchEvent(new Event("hanzi-wallet:profile-imported"));
    this.dialog.close();
    await openAvatarSetup();
    try {
      localStorage.setItem(WELCOME_KEY, "complete");
    } catch {
      /* Session remains usable. */
    }
    this.dismiss();
    document
      .querySelector<HTMLElement>("#learn-main")
      ?.focus({ preventScroll: true });
  }
  private greeting(templates: readonly CharacterTemplate[]): Promise<void> {
    let strokeNumber = 0;
    const ink = ["你", "好"]
      .map((char, column) => {
        const template = templates.find((item) => item.char === char);
        if (!template) return "";
        return `<g transform="translate(${column * 1060} 0)">${template.paths
          .map((path, i) => {
            const id = `welcome-stroke-${column}-${i}`;
            const median = template.medians[i] ?? [];
            const points = median
              .map((p) => `${p.x * 1024},${p.y * 1024}`)
              .join(" ");
            const wait = strokeNumber++ * 0.18;
            return `<defs><clipPath id="${id}"><path d="${escape(path)}" transform="translate(0 900) scale(1 -1)"/></clipPath></defs><g clip-path="url(#${id})"><polyline class="welcome-ink-stroke" points="${points}" pathLength="1" style="--wait:${wait}s"/></g>`;
          })
          .join("")}</g>`;
      })
      .join("");
    this.dialog.classList.add("welcome-painted");
    this.page(
      `<div class="welcome-greeting">${handwritten("hola", "hello-es", "es", 0.25)}${handwritten("hello", "hello-en", "en", 0.65)}<svg class="welcome-hanzi" viewBox="0 0 2084 1024" role="img" aria-label="你好 · nǐ hǎo">${ink}</svg>${handwritten("bonjour", "hello-fr", "fr", 1)}${handwritten("olá", "hello-pt", "pt", 1.5)}<span class="welcome-pinyin">nǐ hǎo</span></div><p class="welcome-greeting-caption">${words("Un nuevo mundo empieza con un hola.", "A new world begins with hello.", "新世界，从一句你好开始。", "Un nouveau monde commence par bonjour.", "Um novo mundo começa com um olá.")}</p><button class="welcome-next greeting-next" aria-label="${words("Continuar", "Continue", "继续", "Continuer", "Continuar")}">${arrow}</button><div class="welcome-dragon-fire" aria-hidden="true"><img src="${new URL("art/dragon.png", this.base).href}" alt=""/><i></i></div>`,
    );
    return new Promise((resolve) => {
      this.dialog.querySelector<HTMLButtonElement>(".welcome-next")!.onclick =
        async (event) => {
          (event.currentTarget as HTMLButtonElement).disabled = true;
          this.dialog.classList.add("welcome-burning");
          await delay(this.reduced ? 0 : 1100);
          this.dialog.classList.remove("welcome-painted", "welcome-burning");
          resolve();
        };
    });
  }
  private language(change: (locale: Locale) => void): Promise<void> {
    return new Promise((resolve) => {
      const render = (): void => {
        this.page(
          `<div class="welcome-step-icon" aria-hidden="true">文<span>A</span></div><p class="welcome-kicker">${words("BIENVENIDO A TU ESPACIO", "WELCOME TO YOUR SPACE", "欢迎来到你的空间", "BIENVENUE CHEZ VOUS", "BEM-VINDO AO SEU ESPAÇO")}</p><h1 tabindex="-1">${words("Hablemos tu idioma.", "Let's speak your language.", "选择你的语言。", "Parlons votre langue.", "Vamos falar seu idioma.")}</h1><p class="welcome-description">${words("Elige cómo quieres vivir esta aventura.", "Choose how you want to experience this adventure.", "用熟悉的语言，开启你的旅程。", "Choisissez la langue de votre aventure.", "Escolha o idioma da sua aventura.")}</p><div class="welcome-language-list" role="group" aria-label="${words("Idioma", "Language", "语言", "Langue", "Idioma")}">${LOCALES.map((locale) => `<button lang="${locale}" data-locale="${locale}" class="${locale === this.locale ? "selected" : ""}" aria-pressed="${locale === this.locale}"><span>${LANGUAGE_NAMES[locale]}</span><i aria-hidden="true">${locale === this.locale ? "✓" : ""}</i></button>`).join("")}</div><button class="welcome-primary" data-continue>${words("Continuar", "Continue", "继续", "Continuer", "Continuar")}${arrow}</button>`,
          1,
        );
        this.dialog
          .querySelectorAll<HTMLButtonElement>("[data-locale]")
          .forEach(
            (button) =>
              (button.onclick = () => {
                const locale = button.dataset.locale;
                if (isLocale(locale)) {
                  this.locale = locale;
                  setLocale(locale);
                  render();
                  this.dialog
                    .querySelector<HTMLButtonElement>(
                      `[data-locale="${locale}"]`,
                    )
                    ?.focus();
                }
              }),
          );
        this.dialog.querySelector<HTMLButtonElement>(
          "[data-continue]",
        )!.onclick = () => {
          change(this.locale);
          resolve();
        };
      };
      render();
    });
  }
  private experience(
    changeLanguage: (locale: Locale) => void,
  ): Promise<Parameters<typeof applyPlacement>[1]> {
    return new Promise((resolve) => {
      const render = (): void => {
        this.page(
          `<button class="welcome-back" data-back>← ${words("Volver", "Back", "返回", "Retour", "Voltar")}</button><div class="welcome-step-icon" aria-hidden="true">山</div><p class="welcome-kicker">${words("CADA VIAJE ES DIFERENTE", "EVERY JOURNEY IS DIFFERENT", "每段旅程，都与众不同", "CHAQUE VOYAGE EST DIFFÉRENT", "CADA JORNADA É DIFERENTE")}</p><h1 tabindex="-1">${words("Empecemos desde tu lugar.", "Let's find your starting point.", "找到适合你的起点。", "Trouvons votre point de départ.", "Vamos encontrar seu ponto de partida.")}</h1><p class="welcome-description">${words("Tú eliges el primer paso. El resto lo construimos juntos.", "You choose the first step. We'll build the rest together.", "第一步由你决定，未来我们一起走。", "Choisissez le premier pas. Construisons la suite ensemble.", "Você escolhe o primeiro passo. Construímos o resto juntos.")}</p><div class="welcome-paths"><button class="welcome-path" data-beginner><span class="welcome-path-glyph" aria-hidden="true">一</span><span><strong>${words("Soy principiante", "I'm a beginner", "我是初学者", "Je débute", "Sou iniciante")}</strong><small>${words("Desde cero. Sin prisas, un trazo a la vez.", "From zero. One stroke at a time.", "从零开始，一笔一画慢慢来。", "Depuis zéro. Un trait à la fois.", "Do zero. Um traço de cada vez.")}</small></span>${arrow}</button><button class="welcome-path" data-test><span class="welcome-path-glyph" aria-hidden="true">知</span><span><strong>${words("Ya sé un poco de chino", "I already know some Chinese", "我学过一些中文", "J'ai déjà appris le chinois", "Já sei um pouco de chinês")}</strong><small>${words("Encuentra tu punto de partida · 3–5 min", "Find your starting point · 3–5 min", "找到你的起点 · 3–5分钟", "Trouvez votre niveau de départ · 3–5 min", "Encontre seu ponto de partida · 3–5 min")}</small></span>${arrow}</button></div><p class="welcome-privacy">${words("Tu progreso se queda en este dispositivo.", "Your progress stays on this device.", "学习进度保存在此设备上。", "Votre progression reste sur cet appareil.", "Seu progresso fica neste dispositivo.")}</p>`,
          2,
        );
        this.dialog.querySelector<HTMLButtonElement>(
          "[data-beginner]",
        )!.onclick = () => resolve("0");
        this.dialog.querySelector<HTMLButtonElement>("[data-test]")!.onclick =
          async () => {
            const band = await this.placement();
            if (band === null) render();
            else resolve(band);
          };
        this.dialog.querySelector<HTMLButtonElement>("[data-back]")!.onclick =
          async () => {
            await this.language(changeLanguage);
            render();
          };
      };
      render();
    });
  }
  private async placement(): Promise<
    Parameters<typeof applyPlacement>[1] | null
  > {
    const answers: { id: string; choice: number }[] = [];
    for (let index = 0; index < PLACEMENT_QUESTIONS.length; index++) {
      const question = PLACEMENT_QUESTIONS[index]!;
      const choice = await new Promise<number | null>((resolve) => {
        this.page(
          `<button class="welcome-back" data-cancel-test>← ${words("Volver", "Back", "返回", "Retour", "Voltar")}</button><p class="welcome-kicker">${words("ENCUENTRA TU PUNTO DE PARTIDA", "FIND YOUR STARTING POINT", "找到你的起点", "TROUVEZ VOTRE POINT DE DÉPART", "ENCONTRE SEU PONTO DE PARTIDA")}</p><div class="welcome-test-progress"><span>${index + 1} / ${PLACEMENT_QUESTIONS.length}</span><progress value="${index}" max="${PLACEMENT_QUESTIONS.length}" aria-label="${words("Preguntas completadas", "Completed questions", "已完成题目", "Questions terminées", "Questões concluídas")}"></progress></div><h1 class="welcome-question" tabindex="-1">${escape(question.prompt[getLocale()])}</h1><p class="welcome-test-hanzi" lang="zh-CN">${escape(question.hanzi)}</p><div class="welcome-test-options">${question.options[getLocale()].map((option, n) => `<button data-answer="${n}"><span>${String.fromCharCode(65 + n)}</span>${escape(option)}</button>`).join("")}</div><button class="welcome-skip" data-skip>${words("Todavía no lo sé", "I don't know yet", "我还不知道", "Je ne sais pas encore", "Ainda não sei")}</button><p class="welcome-test-note">${words("Sin pistas y sin presión. Puedes cambiar tu ruta después.", "No hints, no pressure. You can change your path later.", "不看提示，不必紧张，以后可随时调整学习路线。", "Sans aide et sans pression. Vous pourrez changer de parcours.", "Sem dicas, sem pressão. Você pode mudar sua rota depois.")}</p>`,
          2,
        );
        this.dialog
          .querySelectorAll<HTMLButtonElement>("[data-answer]")
          .forEach(
            (button) =>
              (button.onclick = () => resolve(Number(button.dataset.answer))),
          );
        this.dialog.querySelector<HTMLButtonElement>("[data-skip]")!.onclick =
          () => resolve(-1);
        this.dialog.querySelector<HTMLButtonElement>(
          "[data-cancel-test]",
        )!.onclick = () => resolve(null);
      });
      if (choice === null) return null;
      answers.push({ id: question.id, choice });
    }
    const result = assessPlacement(answers);
    const preview = applyPlacement(loadProfile(getLearningXP()), result.band);
    await new Promise<void>((resolve) => {
      this.page(
        `<div class="welcome-result-seal" aria-hidden="true">始</div><p class="welcome-kicker">${words("AQUÍ EMPIEZA TU HISTORIA", "YOUR STORY STARTS HERE", "你的故事，从这里开始", "VOTRE HISTOIRE COMMENCE ICI", "SUA HISTÓRIA COMEÇA AQUI")}</p><h1 tabindex="-1">${words("Tu camino, a tu medida.", "A path that fits you.", "适合你的学习之路。", "Un parcours à votre mesure.", "Um caminho feito para você.")}</h1><div class="welcome-result"><span>${words("Nivel", "Level", "等级", "Niveau", "Nível")} ${result.level}</span><strong>${result.band === "0" ? words("Primeros pasos", "First steps", "初次启程", "Premiers pas", "Primeiros passos") : `HSK ${result.band}`}</strong><small>${result.correct} / ${result.total} · ${words("reconocimiento", "recognition", "识读", "reconnaissance", "reconhecimento")}</small></div><p class="welcome-description">${words("Una orientación para empezar, no una certificación HSK. Aún nos quedan muchas palabras por descubrir juntos.", "A starting guide, not an HSK certification. There are many more words to discover together.", "这是学习起点建议，并非HSK认证。还有许多汉字等待我们一起发现。", "Une indication pour débuter, pas une certification HSK. Il reste tant de mots à découvrir.", "Uma orientação inicial, não uma certificação HSK. Há muitas palavras para descobrir juntos.")}</p><p class="welcome-reward">${preview.coins} ${words("monedas para tu aventura", "coins for your adventure", "枚旅程金币", "pièces pour votre aventure", "moedas para sua aventura")}</p><button class="welcome-primary" data-avatar>${words("Elegir mi personaje", "Choose my character", "选择我的角色", "Choisir mon personnage", "Escolher meu personagem")}${arrow}</button>`,
        3,
      );
      this.dialog.querySelector<HTMLButtonElement>("[data-avatar]")!.onclick =
        () => resolve();
    });
    return result.band;
  }
}
