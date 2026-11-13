import "./profile.css";
import { createAvatar, createItemArt } from "./avatar";
import { icon } from "./icons";
import { getLocale, type Locale } from "./i18n";
import { LEARNING_KEY } from "./core/learning";
import {
  ITEMS,
  PROFILE_KEY,
  loadProfile,
  readProfile,
  saveProfile,
  syncProfile,
  getLearningXP,
  profileLevel,
  levelProgress,
  buyItem,
  equipItem,
  unequipItem,
  itemName,
  SHIRT_COLORS,
  type Profile,
  type Slot,
} from "./core/profile";
export { ITEMS } from "./core/profile";

const words = {
  profile: ["Mi perfil", "My profile", "个人资料", "Mon profil", "Meu perfil"],
  open: [
    "Abrir mi perfil",
    "Open my profile",
    "打开个人资料",
    "Ouvrir mon profil",
    "Abrir meu perfil",
  ],
  title: [
    "A tu manera.",
    "Make it yours.",
    "你的旅程，你的风格。",
    "À votre image.",
    "Do seu jeito.",
  ],
  setup: [
    "Tu aventura empieza contigo.",
    "Your journey begins with you.",
    "旅程从你开始。",
    "Votre aventure commence avec vous.",
    "Sua aventura começa com você.",
  ],
  intro: [
    "Un personaje que crece con cada nuevo descubrimiento.",
    "A character that grows with every discovery.",
    "每一次发现，都让你的角色成长。",
    "Un personnage qui grandit à chaque découverte.",
    "Um personagem que cresce a cada descoberta.",
  ],
  character: ["Personaje", "Character", "角色", "Personnage", "Personagem"],
  wardrobe: ["Armario", "Wardrobe", "衣橱", "Garde-robe", "Guarda-roupa"],
  shop: ["Tienda", "Shop", "商店", "Boutique", "Loja"],
  achievements: ["Logros", "Achievements", "成就", "Succès", "Conquistas"],
  close: [
    "Cerrar perfil",
    "Close profile",
    "关闭资料",
    "Fermer le profil",
    "Fechar perfil",
  ],
  level: ["Nivel", "Level", "等级", "Niveau", "Nível"],
  coins: ["monedas", "coins", "金币", "pièces", "moedas"],
  next: [
    "para el siguiente nivel",
    "to the next level",
    "即可升级",
    "avant le prochain niveau",
    "para o próximo nível",
  ],
  max: [
    "Has llegado a la cima",
    "You have reached the summit",
    "你已到达巅峰",
    "Vous avez atteint le sommet",
    "Você chegou ao topo",
  ],
  name: [
    "¿Cómo te llamas?",
    "What is your name?",
    "你叫什么名字？",
    "Comment vous appelez-vous ?",
    "Como você se chama?",
  ],
  nameHint: ["Tu nombre", "Your name", "你的名字", "Votre prénom", "Seu nome"],
  body: [
    "Elige tu personaje",
    "Choose your character",
    "选择你的角色",
    "Choisissez votre personnage",
    "Escolha seu personagem",
  ],
  male: ["Hombre", "Man", "男性", "Homme", "Homem"],
  female: ["Mujer", "Woman", "女性", "Femme", "Mulher"],
  shirt: [
    "Tu camiseta, tu color.",
    "Your T-shirt, your color.",
    "你的T恤，你的颜色。",
    "Votre T-shirt, votre couleur.",
    "Sua camiseta, sua cor.",
  ],
  shirtHint: [
    "Colores incluidos. Elige uno para llevar tu camiseta básica.",
    "Colors included. Choose one to wear your starter T-shirt.",
    "颜色免费，选择一种换上基础T恤。",
    "Couleurs incluses. Choisissez-en une pour porter votre T-shirt de départ.",
    "Cores incluídas. Escolha uma para usar sua camiseta básica.",
  ],
  shirtSelected: [
    "Tu camiseta ya tiene un nuevo color.",
    "Your T-shirt has a new color.",
    "你的T恤换上了新颜色。",
    "Votre T-shirt a une nouvelle couleur.",
    "Sua camiseta está de cor nova.",
  ],
  identity: [
    "Un poco de ti",
    "A little about you",
    "关于你",
    "Quelques mots sur vous",
    "Um pouco sobre você",
  ],
  optional: [
    "Opcional. Puedes cambiarlo cuando quieras.",
    "Optional. You can change this anytime.",
    "选填，随时可以修改。",
    "Facultatif. Modifiable à tout moment.",
    "Opcional. Você pode mudar quando quiser.",
  ],
  country: ["Tu país", "Your country", "你的国家", "Votre pays", "Seu país"],
  choose: [
    "Sin seleccionar",
    "Not selected",
    "暂不选择",
    "Non sélectionné",
    "Não selecionado",
  ],
  age: ["Edad", "Age", "年龄", "Âge", "Idade"],
  gender: ["Sexo", "Gender", "性别", "Sexe", "Sexo"],
  unspecified: [
    "Prefiero no decirlo",
    "Prefer not to say",
    "不愿透露",
    "Je préfère ne pas le dire",
    "Prefiro não informar",
  ],
  start: [
    "Empezar mi aventura",
    "Start my journey",
    "开启我的旅程",
    "Commencer mon aventure",
    "Começar minha aventura",
  ],
  done: ["Listo", "Done", "完成", "Terminé", "Pronto"],
  local: [
    "Tu perfil y tu progreso se guardan en este navegador.",
    "Your profile and progress stay in this browser.",
    "你的资料和进度保存在此浏览器中。",
    "Votre profil et vos progrès restent dans ce navigateur.",
    "Seu perfil e progresso ficam neste navegador.",
  ],
  earned: [
    "Aprende. Descubre. Colecciona.",
    "Learn. Discover. Collect.",
    "学习。发现。收藏。",
    "Apprendre. Découvrir. Collectionner.",
    "Aprenda. Descubra. Colecione.",
  ],
  shopIntro: [
    "Cada acierto te acerca a algo nuevo. Solo monedas que ganas aprendiendo.",
    "Every correct answer brings something new. Spend only coins earned by learning.",
    "每次答对，都离新奖励更近。金币全部来自学习。",
    "Chaque bonne réponse vous rapproche d'une nouveauté. Des pièces gagnées en apprenant.",
    "Cada acerto traz algo novo. Use apenas moedas que ganha aprendendo.",
  ],
  wardrobeIntro: [
    "Tu colección, tu estilo. Toca una pieza para llevarla contigo.",
    "Your collection, your style. Choose a piece to make it yours.",
    "你的收藏，你的风格。选择一件装备吧。",
    "Votre collection, votre style. Choisissez une pièce à porter.",
    "Sua coleção, seu estilo. Escolha uma peça para usar.",
  ],
  all: ["Todo", "All", "全部", "Tout", "Tudo"],
  head: ["Sombreros", "Headwear", "头饰", "Chapeaux", "Chapéus"],
  outfit: ["Ropa", "Clothing", "服装", "Vêtements", "Roupas"],
  shoes: ["Zapatos", "Shoes", "鞋子", "Chaussures", "Sapatos"],
  frame: ["Marcos", "Frames", "边框", "Cadres", "Molduras"],
  background: ["Fondos", "Scenes", "背景", "Décors", "Fundos"],
  aura: ["Compañeros", "Companions", "伙伴", "Compagnons", "Companheiros"],
  expression: [
    "Expresiones",
    "Expressions",
    "表情",
    "Expressions",
    "Expressões",
  ],
  skin: ["Tonos", "Tones", "色调", "Teintes", "Tons"],
  available: [
    "A mi alcance",
    "Within reach",
    "可购买",
    "À ma portée",
    "Ao meu alcance",
  ],
  equipped: ["Equipado", "Wearing", "已装备", "Équipé", "Equipado"],
  unequip: ["Quitar", "Remove", "卸下", "Retirer", "Remover"],
  equip: ["Equipar", "Wear", "装备", "Équiper", "Equipar"],
  buy: ["Conseguir", "Get", "获取", "Obtenir", "Obter"],
  locked: [
    "Se desbloquea en nivel",
    "Unlocks at level",
    "解锁等级",
    "Disponible au niveau",
    "Desbloqueia no nível",
  ],
  insufficient: [
    "Sigue aprendiendo para reunir más monedas.",
    "Keep learning to earn more coins.",
    "继续学习，赚取更多金币。",
    "Continuez à apprendre pour gagner des pièces.",
    "Continue aprendendo para ganhar mais moedas.",
  ],
  acquired: [
    "Una nueva pieza para tu colección.",
    "A new piece for your collection.",
    "你的收藏又添新成员。",
    "Une nouvelle pièce pour votre collection.",
    "Uma nova peça para sua coleção.",
  ],
  wearing: [
    "Tu personaje ya tiene un nuevo estilo.",
    "Your character has a new look.",
    "你的角色换上了新风格。",
    "Votre personnage a un nouveau style.",
    "Seu personagem tem um novo estilo.",
  ],
  empty: [
    "Todavía no hay piezas en esta categoría.",
    "No pieces in this category yet.",
    "此分类暂无物品。",
    "Aucune pièce dans cette catégorie pour le moment.",
    "Ainda não há peças nesta categoria.",
  ],
  noAffordable: [
    "Sigue practicando. Cada acierto suma monedas para tu próxima pieza.",
    "Keep practising. Every correct answer earns coins for your next piece.",
    "继续练习吧。每次答对都能为下一件物品积攒金币。",
    "Continuez à pratiquer. Chaque bonne réponse rapproche de la prochaine pièce.",
    "Continue praticando. Cada acerto rende moedas para a próxima peça.",
  ],
  first: [
    "El primer paso",
    "The first step",
    "第一步",
    "Le premier pas",
    "O primeiro passo",
  ],
  firstDetail: [
    "Tu aventura ya tiene protagonista.",
    "Your journey has its main character.",
    "你的旅程有了主角。",
    "Votre aventure a son personnage principal.",
    "Sua aventura tem um protagonista.",
  ],
  placementTitle: [
    "Tu punto de partida",
    "Your starting point",
    "你的起点",
    "Votre point de départ",
    "Seu ponto de partida",
  ],
  placementHint: [
    "Orientación de lectura. No es una certificación oficial.",
    "Reading orientation. This is not an official certification.",
    "阅读水平参考，并非官方认证。",
    "Repère de lecture. Il ne s’agit pas d’une certification officielle.",
    "Referência de leitura. Não é uma certificação oficial.",
  ],
  practice: [
    "La tinta despierta",
    "Ink awakens",
    "墨香初起",
    "L'encre s'éveille",
    "A tinta desperta",
  ],
  practiceDetail: [
    "Gana tus primeros 100 XP practicando.",
    "Earn your first 100 XP through practice.",
    "通过练习获得最初100经验值。",
    "Gagnez vos 100 premiers XP en pratiquant.",
    "Ganhe seus primeiros 100 XP praticando.",
  ],
  garden: [
    "Jardín de jade",
    "Jade garden",
    "翡翠花园",
    "Jardin de jade",
    "Jardim de jade",
  ],
  scholar: [
    "El camino del erudito",
    "The scholar's path",
    "学者之路",
    "Le chemin de l'érudit",
    "O caminho do erudito",
  ],
  dragon: [
    "Entre dragones",
    "Among dragons",
    "与龙同行",
    "Parmi les dragons",
    "Entre dragões",
  ],
  summit: [
    "El arte de perseverar",
    "The art of perseverance",
    "坚持的艺术",
    "L'art de persévérer",
    "A arte de perseverar",
  ],
  reach: [
    "Alcanza el nivel",
    "Reach level",
    "达到等级",
    "Atteignez le niveau",
    "Alcance o nível",
  ],
  unlocked: ["Conseguido", "Unlocked", "已达成", "Débloqué", "Conquistado"],
  collection: ["Colección", "Collection", "收藏", "Collection", "Coleção"],
  pieces: ["piezas", "pieces", "件", "pièces", "peças"],
  storeError: [
    "El navegador no permite guardar ahora. Exporta una copia antes de salir.",
    "Your browser cannot save right now. Export a backup before leaving.",
    "浏览器暂时无法保存。离开前请导出备份。",
    "Le navigateur ne peut pas sauvegarder. Exportez une copie avant de partir.",
    "O navegador não pode salvar agora. Exporte uma cópia antes de sair.",
  ],
} as const;
type CopyKey = keyof typeof words;
const localeIndex: Record<Locale, number> = {
  es: 0,
  en: 1,
  "zh-CN": 2,
  fr: 3,
  pt: 4,
};
const copy = (key: CopyKey): string => words[key][localeIndex[getLocale()]]!;
const node = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text = "",
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
};
const button = (
  className: string,
  text: string,
  action: () => void,
): HTMLButtonElement => {
  const element = node("button", className, text);
  element.type = "button";
  element.onclick = action;
  return element;
};
const flag = (country: string): string =>
  country
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) =>
      String.fromCodePoint(127397 + letter.charCodeAt(0)),
    );
const COUNTRY_CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  );
type Tab = "character" | "wardrobe" | "shop" | "achievements";
let setupOpener: (() => Promise<void>) | null = null;

export function openAvatarSetup(): Promise<void> {
  if (!setupOpener) mountProfile();
  return setupOpener!();
}

export function mountProfile(): void {
  if (setupOpener) return;
  let xp = getLearningXP();
  let profile = syncProfile(loadProfile(xp), xp);
  let tab: Tab = "character";
  let category: Slot | "all" = "all";
  let affordable = false;
  let setup = false;
  let resolveSetup: (() => void) | null = null;
  let previousFocus: HTMLElement | null = null;
  let statusText = "";
  let storageFailed = false;
  let composingName = false;
  const identity = (value: Profile) => ({
    name: value.name,
    nationality: value.nationality,
    age: value.age,
    gender: value.gender,
    base: value.base,
    shirtColor: value.shirtColor,
    completed: value.completed,
  });
  let identitySignature = JSON.stringify(identity(profile));
  const trigger = button("profile-trigger", "", () => open(false));
  trigger.setAttribute("aria-haspopup", "dialog");
  document.querySelector(".top-actions")?.append(trigger);
  const dialog = node("dialog", "profile-panel");
  dialog.id = "profile-dialog";
  dialog.setAttribute("aria-labelledby", "profile-title");
  document.body.append(dialog);
  const refreshTrigger = (): void => {
    trigger.setAttribute("aria-label", copy("open"));
    const portrait = createAvatar(profile, { portrait: true });
    portrait.setAttribute("aria-hidden", "true");
    const label = node(
      "span",
      "profile-trigger-name",
      profile.name || copy("profile"),
    );
    const chevron = node("span", "profile-trigger-chevron");
    chevron.innerHTML = icon("next");
    trigger.replaceChildren(portrait, label, chevron);
  };
  // Autofill and some IMEs can update a field without a final input/change event.
  // Capture the live form before any save or view replacement, not just on input.
  const captureIdentity = (trimName = false): void => {
    if (!dialog.open) return;
    const name = dialog.querySelector<HTMLInputElement>('[name="nickname"]');
    if (!name) return;
    const nationality =
      dialog.querySelector<HTMLSelectElement>('[name="country"]');
    const age = dialog.querySelector<HTMLInputElement>('[name="age"]');
    const gender = dialog.querySelector<HTMLSelectElement>('[name="gender"]');
    const ageValue = age?.value ? Number(age.value) : null;
    profile = {
      ...profile,
      name: (trimName ? name.value.trim() : name.value).slice(0, 40),
      nationality: nationality?.value ?? profile.nationality,
      age: age
        ? ageValue !== null &&
          Number.isInteger(ageValue) &&
          ageValue >= 1 &&
          ageValue <= 120
          ? ageValue
          : null
        : profile.age,
      gender: gender
        ? gender.value === "female" || gender.value === "male"
          ? gender.value
          : "unspecified"
        : profile.gender,
    };
  };
  const persist = (capture = true): void => {
    if (capture) captureIdentity();
    storageFailed = !saveProfile(profile);
    refreshTrigger();
    const notice = dialog.querySelector(".profile-save-note");
    if (notice) {
      notice.textContent = copy(storageFailed ? "storeError" : "local");
      if (storageFailed) notice.setAttribute("role", "alert");
      else notice.removeAttribute("role");
    }
    const detail = identity(profile);
    const signature = JSON.stringify(detail);
    if (signature !== identitySignature) {
      identitySignature = signature;
      window.dispatchEvent(
        new CustomEvent("hanzi-wallet:identity", { detail }),
      );
    }
  };
  const close = (): void => {
    if (!setup) {
      captureIdentity(true);
      persist(false);
      dialog.close();
    }
  };
  const finish = (): void => {
    captureIdentity(true);
    profile = { ...profile, completed: true };
    persist(false);
    setup = false;
    dialog.close();
    const done = resolveSetup;
    resolveSetup = null;
    done?.();
  };
  const render = (preserveDraft = true): void => {
    if (preserveDraft) {
      captureIdentity();
      if (JSON.stringify(identity(profile)) !== identitySignature)
        persist(false);
    }
    const scroll =
      dialog.querySelector<HTMLElement>(".profile-content")?.scrollTop ?? 0;
    const focused = (document.activeElement as HTMLElement | null)?.dataset
      .focus;
    const name = dialog.querySelector<HTMLInputElement>('[name="nickname"]');
    const selection =
      focused === "name" && name
        ? ([name.selectionStart, name.selectionEnd] as const)
        : null;
    dialog.replaceChildren();
    dialog.classList.toggle("profile-setup", setup);
    const heading = node("header", "profile-heading");
    const titleWrap = node("div");
    titleWrap.append(node("p", "profile-eyebrow", "HANZI WALLET"));
    const title = node("h2", "", copy(setup ? "setup" : "title"));
    title.id = "profile-title";
    titleWrap.append(title);
    heading.append(titleWrap);
    if (!setup) {
      const dismiss = button("profile-close", "", close);
      dismiss.innerHTML = icon("close");
      dismiss.setAttribute("aria-label", copy("close"));
      heading.append(dismiss);
    }
    dialog.append(heading);
    if (!setup) {
      const tabs = node("div", "profile-tabs");
      tabs.setAttribute("role", "tablist");
      tabs.setAttribute("aria-label", copy("profile"));
      const tabNames = [
        "character",
        "wardrobe",
        "shop",
        "achievements",
      ] as const;
      tabNames.forEach((name, index) => {
        const control = button(
          "profile-tab" + (tab === name ? " active" : ""),
          copy(name),
          () => {
            tab = name;
            statusText = "";
            render();
            dialog
              .querySelector<HTMLButtonElement>(
                `.profile-tab[data-tab="${name}"]`,
              )
              ?.focus();
          },
        );
        control.dataset.tab = name;
        control.id = `profile-tab-${name}`;
        control.setAttribute("aria-controls", "profile-tabpanel");
        control.setAttribute("role", "tab");
        control.setAttribute("aria-selected", String(tab === name));
        control.tabIndex = tab === name ? 0 : -1;
        control.onkeydown = (event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? 3
                : (index + (event.key === "ArrowRight" ? 1 : -1) + 4) % 4;
          tab = tabNames[next]!;
          render();
          dialog
            .querySelector<HTMLButtonElement>(`.profile-tab[data-tab="${tab}"]`)
            ?.focus();
        };
        tabs.append(control);
      });
      dialog.append(tabs);
    }
    const layout = node("div", "profile-layout");
    const stage = node("aside", "profile-stage");
    stage.append(createAvatar(profile, { interactive: true }));
    const titleName = node(
      "h3",
      "profile-stage-name",
      `${profile.nationality ? flag(profile.nationality) + " " : ""}${profile.name || copy("character")}`,
    );
    stage.append(titleName);
    const progress = levelProgress(profile, xp);
    stage.append(
      node("p", "profile-level", `${copy("level")} ${progress.level}`),
    );
    const track = node("div", "profile-xp-track");
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", copy("level"));
    track.setAttribute(
      "aria-valuenow",
      String(Math.round(progress.ratio * 100)),
    );
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    const fill = node("i");
    fill.style.width = `${progress.ratio * 100}%`;
    track.append(fill);
    stage.append(track);
    stage.append(
      node(
        "p",
        "profile-xp-caption",
        progress.needed > 0
          ? `${Math.max(0, progress.needed - progress.current)} XP ${copy("next")}`
          : copy("max"),
      ),
    );
    const balance = node("div", "profile-balance");
    balance.append(
      node("span", "profile-coin", "元"),
      node("strong", "", profile.coins.toLocaleString(getLocale())),
      node("span", "", copy("coins")),
    );
    stage.append(balance);
    const content = node("section", "profile-content");
    content.setAttribute("aria-label", copy(tab));
    content.id = "profile-tabpanel";
    if (!setup) {
      content.setAttribute("role", "tabpanel");
      content.setAttribute("aria-labelledby", `profile-tab-${tab}`);
    }
    if (setup || tab === "character") renderCharacter(content);
    else if (tab === "shop" || tab === "wardrobe") renderProducts(content);
    else renderAchievements(content);
    layout.append(stage, content);
    dialog.append(layout);
    const footer = node("footer", "profile-footer");
    const notice = node(
      "p",
      "profile-save-note",
      storageFailed ? copy("storeError") : copy("local"),
    );
    if (storageFailed) notice.setAttribute("role", "alert");
    footer.append(notice);
    footer.append(
      button(
        "profile-finish",
        copy(setup ? "start" : "done"),
        setup
          ? finish
          : () => {
              persist();
              close();
            },
      ),
    );
    dialog.append(footer);
    const live = node("p", "profile-live", statusText);
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    dialog.append(live);
    const newContent = dialog.querySelector<HTMLElement>(".profile-content");
    if (newContent) newContent.scrollTop = scroll;
    if (focused)
      dialog
        .querySelector<HTMLElement>(`[data-focus="${focused}"]`)
        ?.focus({ preventScroll: true });
    if (selection)
      dialog
        .querySelector<HTMLInputElement>('[name="nickname"]')
        ?.setSelectionRange(...selection);
  };
  const renderCharacter = (content: HTMLElement): void => {
    content.append(node("p", "profile-intro", copy("intro")));
    const nameLabel = node(
      "label",
      "profile-field profile-name-label",
      copy("name"),
    );
    const nameInput = node("input", "profile-input");
    nameInput.name = "nickname";
    nameInput.setAttribute("autocomplete", "nickname");
    nameInput.maxLength = 40;
    nameInput.placeholder = copy("nameHint");
    nameInput.value = profile.name;
    nameInput.dataset.focus = "name";
    nameInput.addEventListener("compositionstart", () => {
      composingName = true;
    });
    nameInput.addEventListener("compositionend", () => {
      composingName = false;
      persist();
      refreshStageIdentity();
    });
    nameInput.oninput = () => {
      profile = { ...profile, name: nameInput.value.slice(0, 40) };
      if (!composingName) persist();
      refreshStageIdentity();
    };
    nameInput.onchange = () => {
      persist();
      refreshStageIdentity();
    };
    nameLabel.append(nameInput);
    content.append(nameLabel);
    content.append(node("h3", "profile-field-heading", copy("body")));
    const bases = node("div", "profile-bases");
    bases.setAttribute("role", "group");
    bases.setAttribute("aria-label", copy("body"));
    for (const base of ["male", "female"] as const) {
      const choose = button(
        "profile-base" + (profile.base === base ? " selected" : ""),
        "",
        () => {
          profile = { ...profile, base };
          persist();
          render();
          dialog
            .querySelector<HTMLButtonElement>(`[data-focus="base-${base}"]`)
            ?.focus();
        },
      );
      choose.dataset.focus = `base-${base}`;
      choose.dataset.base = base;
      choose.setAttribute("aria-pressed", String(profile.base === base));
      const baseArt = createAvatar({ ...profile, base }, { portrait: true });
      baseArt.setAttribute("aria-hidden", "true");
      choose.append(baseArt, node("span", "", copy(base)));
      const check = node("span", "profile-base-check");
      if (profile.base === base) check.innerHTML = icon("check");
      choose.append(check);
      bases.append(choose);
    }
    content.append(bases);
    const colorsHeading = node("h3", "profile-field-heading", copy("shirt"));
    colorsHeading.id = "profile-shirt-label";
    content.append(
      colorsHeading,
      node("p", "profile-muted profile-shirt-hint", copy("shirtHint")),
    );
    const colors = node("div", "profile-shirt-colors");
    colors.setAttribute("role", "group");
    colors.setAttribute("aria-labelledby", colorsHeading.id);
    for (const color of SHIRT_COLORS) {
      const swatch = button(
        "profile-shirt-swatch" +
          (profile.shirtColor === color.color ? " selected" : ""),
        "",
        () => {
          captureIdentity();
          profile = {
            ...profile,
            shirtColor: color.color,
            equipped: { ...profile.equipped, outfit: "everyday" },
          };
          statusText = copy("shirtSelected");
          persist(false);
          refreshAvatars();
          for (const control of colors.querySelectorAll<HTMLButtonElement>(
            "[data-color]",
          )) {
            const selected = control.dataset.color === profile.shirtColor;
            control.classList.toggle("selected", selected);
            control.setAttribute("aria-pressed", String(selected));
            control.querySelector<HTMLElement>(
              ".profile-swatch-check",
            )!.innerHTML = selected ? icon("check") : "";
          }
          const live = dialog.querySelector(".profile-live");
          if (live) live.textContent = statusText;
        },
      );
      swatch.dataset.color = color.color;
      swatch.dataset.focus = `color-${color.id}`;
      swatch.style.setProperty("--shirt-swatch", color.color);
      swatch.setAttribute("aria-label", color.names[getLocale()]);
      swatch.setAttribute(
        "aria-pressed",
        String(profile.shirtColor === color.color),
      );
      swatch.title = color.names[getLocale()];
      const check = node("span", "profile-swatch-check");
      check.setAttribute("aria-hidden", "true");
      if (profile.shirtColor === color.color) check.innerHTML = icon("check");
      swatch.append(check);
      colors.append(swatch);
    }
    content.append(colors);
    const optionalHeading = node("div", "profile-optional-heading");
    optionalHeading.append(
      node("h3", "profile-field-heading", copy("identity")),
      node("p", "profile-muted", copy("optional")),
    );
    content.append(optionalHeading);
    const fields = node("div", "profile-fields");
    const countryLabel = node(
      "label",
      "profile-field profile-country",
      copy("country"),
    );
    const country = node("select", "profile-input");
    country.name = "country";
    country.autocomplete = "country";
    const empty = node("option", "", copy("choose"));
    empty.value = "";
    country.append(empty);
    const names = new Intl.DisplayNames([getLocale()], { type: "region" });
    for (const [code, name] of COUNTRY_CODES.map(
      (code) => [code, names.of(code) || code] as const,
    ).sort((a, b) => a[1].localeCompare(b[1], getLocale()))) {
      const option = node("option", "", `${flag(code)} ${name}`);
      option.value = code;
      country.append(option);
    }
    country.value = profile.nationality;
    country.onchange = () => {
      profile = { ...profile, nationality: country.value };
      persist();
      refreshStageIdentity();
    };
    countryLabel.append(country);
    fields.append(countryLabel);
    const ageLabel = node("label", "profile-field", copy("age"));
    const age = node("input", "profile-input");
    age.type = "number";
    age.name = "age";
    age.min = "1";
    age.max = "120";
    age.inputMode = "numeric";
    age.placeholder = "—";
    age.value = profile.age === null ? "" : String(profile.age);
    age.onchange = () => {
      const value = Number(age.value);
      profile = {
        ...profile,
        age:
          age.value && Number.isInteger(value) && value >= 1 && value <= 120
            ? value
            : null,
      };
      age.value = profile.age === null ? "" : String(profile.age);
      persist();
    };
    ageLabel.append(age);
    fields.append(ageLabel);
    const genderLabel = node("label", "profile-field", copy("gender"));
    const gender = node("select", "profile-input");
    for (const value of ["unspecified", "female", "male"] as const) {
      const option = node("option", "", copy(value));
      option.value = value;
      gender.append(option);
    }
    gender.value = profile.gender;
    gender.name = "gender";
    gender.onchange = () => {
      profile = {
        ...profile,
        gender:
          gender.value === "female"
            ? "female"
            : gender.value === "male"
              ? "male"
              : "unspecified",
      };
      persist();
    };
    genderLabel.append(gender);
    fields.append(genderLabel);
    content.append(fields);
    const collection = node("div", "profile-collection-note");
    collection.innerHTML = icon("sparkle");
    collection.append(
      node(
        "span",
        "",
        `${copy("collection")} · ${profile.owned.length} ${copy("pieces")}`,
      ),
    );
    content.append(collection);
  };
  const stageName = (): HTMLElement | null =>
    dialog.querySelector(".profile-stage-name");
  const refreshStageIdentity = (): void => {
    const title = stageName();
    if (title)
      title.textContent = `${profile.nationality ? flag(profile.nationality) + " " : ""}${profile.name || copy("character")}`;
    const progress = levelProgress(profile, xp);
    const level = dialog.querySelector(".profile-level");
    if (level) level.textContent = `${copy("level")} ${progress.level}`;
    const track = dialog.querySelector(".profile-xp-track");
    track?.setAttribute(
      "aria-valuenow",
      String(Math.round(progress.ratio * 100)),
    );
    const fill = track?.querySelector<HTMLElement>("i");
    if (fill) fill.style.width = `${progress.ratio * 100}%`;
    const caption = dialog.querySelector(".profile-xp-caption");
    if (caption)
      caption.textContent =
        progress.needed > 0
          ? `${Math.max(0, progress.needed - progress.current)} XP ${copy("next")}`
          : copy("max");
    const balance = dialog.querySelector(".profile-balance strong");
    if (balance)
      balance.textContent = profile.coins.toLocaleString(getLocale());
  };
  const refreshAvatars = (): void => {
    dialog
      .querySelector(".profile-stage > .avatar-scene")
      ?.replaceWith(createAvatar(profile, { interactive: true }));
    for (const base of dialog.querySelectorAll<HTMLButtonElement>(
      ".profile-base[data-base]",
    )) {
      const body = base.dataset.base === "female" ? "female" : "male";
      const portrait = createAvatar(
        { ...profile, base: body },
        { portrait: true },
      );
      portrait.setAttribute("aria-hidden", "true");
      base.querySelector(".avatar-portrait")?.replaceWith(portrait);
    }
    refreshStageIdentity();
  };
  const renderProducts = (content: HTMLElement): void => {
    content.append(
      node(
        "h3",
        "profile-section-title",
        copy(tab === "shop" ? "earned" : "wardrobe"),
      ),
      node(
        "p",
        "profile-intro",
        copy(tab === "shop" ? "shopIntro" : "wardrobeIntro"),
      ),
    );
    const filters = node("div", "profile-filters");
    const select = node("select", "profile-category");
    select.setAttribute("aria-label", copy("collection"));
    for (const slot of [
      "all",
      "outfit",
      "head",
      "shoes",
      "frame",
      "background",
      "aura",
      "expression",
      "skin",
    ] as const) {
      const option = node("option", "", copy(slot));
      option.value = slot;
      select.append(option);
    }
    select.value = category;
    select.onchange = () => {
      category = select.value as Slot | "all";
      render();
    };
    filters.append(select);
    if (tab === "shop") {
      const label = node("label", "profile-affordable");
      const toggle = node("input");
      toggle.type = "checkbox";
      toggle.checked = affordable;
      toggle.onchange = () => {
        affordable = toggle.checked;
        render();
      };
      label.append(toggle, node("span", "", copy("available")));
      filters.append(label);
    }
    content.append(filters);
    const products = node("div", "profile-products");
    const currentLevel = profileLevel(profile, xp);
    const items = ITEMS.filter(
      (item) =>
        (category === "all" || item.slot === category) &&
        (tab === "wardrobe"
          ? profile.owned.includes(item.id)
          : !affordable ||
            profile.owned.includes(item.id) ||
            (item.level <= currentLevel && item.price <= profile.coins)),
    );
    for (const item of items) {
      const owned = profile.owned.includes(item.id),
        equipped = profile.equipped[item.slot] === item.id,
        locked = !owned && currentLevel < item.level;
      const card = node(
        "article",
        "profile-product" +
          (equipped ? " is-equipped" : "") +
          (locked ? " is-locked" : ""),
      );
      const art = createItemArt(item, profile);
      art.setAttribute("aria-hidden", "true");
      card.append(art);
      const details = node("div", "profile-product-info");
      details.append(
        node("span", "profile-product-category", copy(item.slot)),
        node("h4", "", itemName(item, getLocale())),
      );
      details.append(
        node(
          "p",
          "profile-product-price",
          locked
            ? `${copy("level")} ${item.level}`
            : owned
              ? copy("collection")
              : `${item.price.toLocaleString(getLocale())} ${copy("coins")}`,
        ),
      );
      const action = button(
        "profile-buy" + (equipped ? " selected" : ""),
        equipped
          ? copy("unequip")
          : owned
            ? copy("equip")
            : locked
              ? `${copy("level")} ${item.level}`
              : copy("buy"),
        () => {
          profile = syncProfile(loadProfile(xp), xp);
          if (profile.equipped[item.slot] === item.id) {
            profile = unequipItem(profile, item.slot);
            statusText = copy("wearing");
          } else if (profile.owned.includes(item.id)) {
            profile = equipItem(profile, item.id);
            statusText = copy("wearing");
          } else {
            profile = buyItem(profile, item.id, xp);
            statusText = profile.owned.includes(item.id)
              ? copy("acquired")
              : copy("insufficient");
          }
          persist();
          render();
        },
      );
      action.dataset.focus = `item-${item.id}`;
      action.disabled = locked || (!owned && item.price > profile.coins);
      if (locked) action.title = `${copy("locked")} ${item.level}`;
      else if (!owned && item.price > profile.coins)
        action.title = copy("insufficient");
      action.setAttribute(
        "aria-label",
        `${equipped ? copy("unequip") : owned ? copy("equip") : copy("buy")} ${itemName(item, getLocale())}`,
      );
      details.append(action);
      card.append(details);
      products.append(card);
    }
    if (!items.length)
      products.append(
        node(
          "p",
          "profile-empty",
          copy(affordable && tab === "shop" ? "noAffordable" : "empty"),
        ),
      );
    content.append(products);
  };
  const renderAchievements = (content: HTMLElement): void => {
    content.append(
      node("h3", "profile-section-title", copy("achievements")),
      node("p", "profile-intro", copy("earned")),
    );
    const badges = node("div", "profile-achievements");
    const currentLevel = profileLevel(profile, xp);
    const data: readonly [CopyKey, string, boolean, string][] = [
      ["first", "一", profile.completed, copy("firstDetail")],
      ["practice", "墨", xp >= 100, copy("practiceDetail")],
      ["garden", "玉", currentLevel >= 10, `${copy("reach")} 10`],
      ["scholar", "文", currentLevel >= 40, `${copy("reach")} 40`],
      ["dragon", "龙", currentLevel >= 70, `${copy("reach")} 70`],
      ["summit", "道", currentLevel >= 90, `${copy("reach")} 90`],
    ];
    if (profile.placement?.awarded && profile.placement.band !== "0") {
      const placement = node("article", "profile-achievement unlocked");
      placement.append(
        node("span", "profile-medal", "学"),
        node("h4", "", copy("placementTitle")),
        node("p", "", `HSK ${profile.placement.band}`),
        node("p", "", copy("placementHint")),
      );
      badges.append(placement);
    }
    for (const [key, glyph, unlocked, detail] of data) {
      const card = node(
        "article",
        "profile-achievement" + (unlocked ? " unlocked" : ""),
      );
      card.append(
        node("span", "profile-medal", glyph),
        node("h4", "", copy(key)),
        node("p", "", detail),
      );
      if (unlocked)
        card.append(
          node("span", "profile-achievement-state", copy("unlocked")),
        );
      badges.append(card);
    }
    content.append(badges);
  };
  const open = (isSetup: boolean): void => {
    xp = getLearningXP();
    profile = syncProfile(loadProfile(xp), xp);
    persist();
    setup = isSetup;
    tab = "character";
    statusText = "";
    previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : trigger;
    render();
    if (!dialog.open) dialog.showModal();
    dialog
      .querySelector<HTMLInputElement>(".profile-name-label input")
      ?.focus({ preventScroll: true });
  };
  setupOpener = () =>
    new Promise<void>((resolve) => {
      resolveSetup = resolve;
      open(true);
    });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (!setup) close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog || setup) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      close();
  });
  dialog.addEventListener("close", () => {
    previousFocus?.focus({ preventScroll: true });
  });
  const sync = (): void => {
    const before = JSON.stringify(identity(profile));
    const hasForm = dialog.open && !!dialog.querySelector('[name="nickname"]');
    const editing =
      composingName ||
      setup ||
      !!document.activeElement?.closest(
        ".profile-name-label,.profile-fields,.profile-bases,.profile-shirt-colors",
      );
    captureIdentity();
    const draft = identity(profile);
    const preserveDraft =
      hasForm && (editing || JSON.stringify(draft) !== before);
    xp = getLearningXP();
    profile = syncProfile(loadProfile(xp), xp);
    if (preserveDraft) profile = { ...profile, ...draft };
    persist(false);
    // Keep the actual input node (and IME/cursor state) while the learner edits.
    if (dialog.open && !preserveDraft) render(false);
    else if (dialog.open) refreshStageIdentity();
  };
  window.addEventListener("storage", (event) => {
    if (event.key === LEARNING_KEY || event.key === PROFILE_KEY) sync();
  });
  window.addEventListener("focus", sync);
  window.addEventListener("hanzi-wallet:profile-imported", sync);
  window.addEventListener("hanzi-wallet:progress", sync);
  window.addEventListener("hanzi-wallet:locale", () => {
    refreshTrigger();
    if (dialog.open) render();
  });
  window.addEventListener("pagehide", () => {
    if (dialog.open) {
      captureIdentity(true);
      saveProfile(profile);
    }
  });
  refreshTrigger();
}

export function exportProfile(): unknown {
  return syncProfile(loadProfile(getLearningXP()), getLearningXP());
}
export function importProfile(input: unknown): void {
  const xp = getLearningXP();
  saveProfile(syncProfile(readProfile(input, xp), xp));
  window.dispatchEvent(new Event("hanzi-wallet:profile-imported"));
}
