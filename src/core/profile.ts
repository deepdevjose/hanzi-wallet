import { LEARNING_KEY, readLearning } from "./learning";
import type { Locale } from "../i18n";

// Keep the original key so an existing wallet never loses its avatar or purchases.
export const PROFILE_KEY = "hanzi-wallet-avatar-v1";
export const MAX_LEVEL = 90;
export const DEFAULT_SHIRT_COLOR = "#7d9690";
export const SHIRT_COLORS = [
  {
    id: "ivory",
    color: "#eee5d3",
    names: {
      es: "Marfil",
      en: "Ivory",
      "zh-CN": "象牙白",
      fr: "Ivoire",
      pt: "Marfim",
    },
  },
  {
    id: "jade",
    color: DEFAULT_SHIRT_COLOR,
    names: { es: "Jade", en: "Jade", "zh-CN": "青玉", fr: "Jade", pt: "Jade" },
  },
  {
    id: "slate",
    color: "#75818c",
    names: {
      es: "Pizarra",
      en: "Slate",
      "zh-CN": "石板灰",
      fr: "Ardoise",
      pt: "Ardósia",
    },
  },
  {
    id: "seal",
    color: "#b47668",
    names: {
      es: "Rojo de sello",
      en: "Seal red",
      "zh-CN": "印泥红",
      fr: "Rouge de sceau",
      pt: "Vermelho de selo",
    },
  },
  {
    id: "blue",
    color: "#8296ab",
    names: {
      es: "Azul porcelana",
      en: "Porcelain blue",
      "zh-CN": "瓷蓝",
      fr: "Bleu porcelaine",
      pt: "Azul porcelana",
    },
  },
  {
    id: "ochre",
    color: "#c3a16b",
    names: { es: "Ocre", en: "Ochre", "zh-CN": "赭黄", fr: "Ocre", pt: "Ocre" },
  },
  {
    id: "rose",
    color: "#bb8e96",
    names: {
      es: "Rosa ciruelo",
      en: "Plum pink",
      "zh-CN": "梅粉",
      fr: "Rose de prunier",
      pt: "Rosa de ameixeira",
    },
  },
  {
    id: "ink",
    color: "#4a5156",
    names: {
      es: "Tinta",
      en: "Ink",
      "zh-CN": "墨色",
      fr: "Encre",
      pt: "Tinta",
    },
  },
] as const satisfies readonly {
  id: string;
  color: string;
  names: Readonly<Record<Locale, string>>;
}[];
export type ShirtColor = (typeof SHIRT_COLORS)[number]["color"];

function readShirtColor(value: unknown): ShirtColor {
  const normalized = typeof value === "string" ? value.toLowerCase() : "";
  return (
    SHIRT_COLORS.find((entry) => entry.color === normalized)?.color ??
    DEFAULT_SHIRT_COLOR
  );
}
export type PlacementBand = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7-9";
export const PLACEMENT_LEVELS: Readonly<Record<PlacementBand, number>> = {
  "0": 0,
  "1": 5,
  "2": 10,
  "3": 18,
  "4": 28,
  "5": 40,
  "6": 54,
  "7-9": 70,
};
export type Slot =
  | "head"
  | "outfit"
  | "shoes"
  | "aura"
  | "frame"
  | "background"
  | "expression"
  | "skin";
export const SLOTS: readonly Slot[] = [
  "head",
  "outfit",
  "shoes",
  "aura",
  "frame",
  "background",
  "expression",
  "skin",
];
export interface Item {
  readonly id: string;
  readonly title: string;
  readonly names: Readonly<Record<Locale, string>>;
  readonly slot: Slot;
  readonly price: number;
  readonly level: number;
  readonly tone: string;
}
function item(
  id: string,
  slot: Slot,
  price: number,
  level: number,
  tone: string,
  es: string,
  en: string,
  zh: string,
  fr: string,
  pt: string,
): Item {
  return {
    id,
    slot,
    price,
    level,
    tone,
    title: es,
    names: { es, en, "zh-CN": zh, fr, pt },
  };
}
/** Every item has a deterministic visual treatment in the avatar compositor. */
export const ITEMS: readonly Item[] = [
  item(
    "everyday",
    "outfit",
    0,
    0,
    DEFAULT_SHIRT_COLOR,
    "Camiseta inicial",
    "Starter T-shirt",
    "初始短袖",
    "T-shirt de départ",
    "Camiseta inicial",
  ),
  item(
    "canvas",
    "shoes",
    0,
    0,
    "#eeece7",
    "Zapatillas de lona",
    "Canvas shoes",
    "帆布鞋",
    "Baskets en toile",
    "Tênis de lona",
  ),
  item(
    "porcelain",
    "frame",
    0,
    0,
    "#c5cace",
    "Porcelana",
    "Porcelain",
    "素瓷",
    "Porcelaine",
    "Porcelana",
  ),
  item(
    "paper",
    "background",
    0,
    0,
    "#f1eee8",
    "Papel de arroz",
    "Rice paper",
    "宣纸",
    "Papier de riz",
    "Papel de arroz",
  ),
  item(
    "calm",
    "expression",
    0,
    0,
    "calm",
    "Serenidad",
    "Serenity",
    "平静",
    "Sérénité",
    "Serenidade",
  ),
  item("warm", "skin", 0, 0, "#e9b68e", "Miel", "Honey", "蜜色", "Miel", "Mel"),
  item(
    "light",
    "skin",
    0,
    0,
    "#f4cfb0",
    "Porcelana cálida",
    "Warm porcelain",
    "暖瓷色",
    "Porcelaine chaude",
    "Porcelana quente",
  ),
  item(
    "olive",
    "skin",
    0,
    0,
    "#c88b66",
    "Ámbar",
    "Amber",
    "琥珀色",
    "Ambre",
    "Âmbar",
  ),
  item(
    "deep",
    "skin",
    0,
    0,
    "#89583f",
    "Cacao",
    "Cocoa",
    "可可色",
    "Cacao",
    "Cacau",
  ),
  item(
    "linen",
    "outfit",
    60,
    1,
    "#d8c8ad",
    "Lino natural",
    "Natural linen",
    "素麻衣",
    "Lin naturel",
    "Linho natural",
  ),
  item(
    "smile",
    "expression",
    35,
    1,
    "smile",
    "Una sonrisa",
    "A little smile",
    "微笑",
    "Un sourire",
    "Um sorriso",
  ),
  item(
    "hat",
    "head",
    55,
    2,
    "#c9ab72",
    "Sombrero de bambú",
    "Bamboo hat",
    "竹笠",
    "Chapeau de bambou",
    "Chapéu de bambu",
  ),
  item(
    "blue-shirt",
    "outfit",
    85,
    3,
    "#718898",
    "Camisa de tinta azul",
    "Ink blue shirt",
    "蓝墨衬衫",
    "Chemise bleu encre",
    "Camisa azul-tinta",
  ),
  item(
    "slippers",
    "shoes",
    65,
    4,
    "#686b64",
    "Zapatos de tela",
    "Cloth shoes",
    "布鞋",
    "Chaussures en toile",
    "Sapatos de tecido",
  ),
  item(
    "bamboo",
    "background",
    95,
    5,
    "#b3bca5",
    "Jardín de bambú",
    "Bamboo garden",
    "竹园",
    "Jardin de bambou",
    "Jardim de bambu",
  ),
  item(
    "ribbon",
    "head",
    90,
    6,
    "#a96763",
    "Cinta de seda",
    "Silk ribbon",
    "丝带",
    "Ruban de soie",
    "Fita de seda",
  ),
  item(
    "red",
    "outfit",
    140,
    8,
    "#a75b56",
    "Traje festivo",
    "Festival outfit",
    "节庆服",
    "Tenue de fête",
    "Traje festivo",
  ),
  item(
    "silver",
    "frame",
    120,
    8,
    "#9ba6af",
    "Plata cepillada",
    "Brushed silver",
    "银色边框",
    "Argent brossé",
    "Prata escovada",
  ),
  item(
    "curious",
    "expression",
    90,
    10,
    "curious",
    "Curiosidad",
    "Curiosity",
    "好奇",
    "Curiosité",
    "Curiosidade",
  ),
  item(
    "scholar",
    "outfit",
    220,
    12,
    "#667b7d",
    "Túnica del erudito",
    "Scholar's robe",
    "书生长衫",
    "Robe de lettré",
    "Túnica do estudioso",
  ),
  item(
    "cloud-shoes",
    "shoes",
    150,
    15,
    "#596a78",
    "Pasos de nube",
    "Cloud steps",
    "云履",
    "Pas de nuage",
    "Passos de nuvem",
  ),
  item(
    "ink",
    "background",
    240,
    18,
    "#8e999a",
    "Montañas de tinta",
    "Ink mountains",
    "水墨山峦",
    "Montagnes à l'encre",
    "Montanhas de tinta",
  ),
  item(
    "jade",
    "frame",
    300,
    20,
    "#83a49a",
    "Marco de jade",
    "Jade frame",
    "玉框",
    "Cadre de jade",
    "Moldura de jade",
  ),
  item(
    "mandarin",
    "outfit",
    380,
    24,
    "#536b7a",
    "Chaqueta mandarín",
    "Mandarin jacket",
    "立领外套",
    "Veste à col mandarin",
    "Jaqueta mandarim",
  ),
  item(
    "lantern",
    "aura",
    380,
    28,
    "#b27b58",
    "Luz de faroles",
    "Lantern light",
    "灯笼之光",
    "Lueur de lanternes",
    "Luz de lanternas",
  ),
  item(
    "plum",
    "background",
    420,
    28,
    "#b88485",
    "Flores de ciruelo",
    "Plum blossoms",
    "梅花",
    "Fleurs de prunier",
    "Flores de ameixeira",
  ),
  item(
    "silk-dress",
    "outfit",
    500,
    32,
    "#6a8380",
    "Seda de Suzhou",
    "Suzhou silk",
    "苏州丝绸",
    "Soie de Suzhou",
    "Seda de Suzhou",
  ),
  item(
    "jade-pin",
    "head",
    360,
    35,
    "#7e9e8a",
    "Horquilla de jade",
    "Jade hairpin",
    "玉簪",
    "Épingle de jade",
    "Grampo de jade",
  ),
  item(
    "gold",
    "frame",
    580,
    40,
    "#bda274",
    "Oro antiguo",
    "Antique gold",
    "古金边框",
    "Or ancien",
    "Ouro antigo",
  ),
  item(
    "hanfu",
    "outfit",
    680,
    40,
    "#b5b1a4",
    "Hanfu de luna",
    "Moonlight hanfu",
    "月色汉服",
    "Hanfu au clair de lune",
    "Hanfu ao luar",
  ),
  item(
    "clouds",
    "aura",
    480,
    44,
    "#c8d0cf",
    "Nubes auspiciosas",
    "Auspicious clouds",
    "祥云",
    "Nuages de bon augure",
    "Nuvens auspiciosas",
  ),
  item(
    "embroidered",
    "shoes",
    440,
    48,
    "#a86c65",
    "Bordado de peonías",
    "Peony embroidery",
    "牡丹绣鞋",
    "Broderie de pivoines",
    "Bordado de peônias",
  ),
  item(
    "palace",
    "background",
    750,
    54,
    "#a29686",
    "Pabellón del lago",
    "Lakeside pavilion",
    "湖畔亭台",
    "Pavillon du lac",
    "Pavilhão do lago",
  ),
  item(
    "crown",
    "head",
    780,
    60,
    "#b69a64",
    "Corona del fénix",
    "Phoenix crown",
    "凤冠",
    "Couronne de phénix",
    "Coroa de fênix",
  ),
  item(
    "imperial",
    "outfit",
    1000,
    64,
    "#975f59",
    "Brocado imperial",
    "Imperial brocade",
    "锦绣华服",
    "Brocart impérial",
    "Brocado imperial",
  ),
  item(
    "dragon",
    "aura",
    1200,
    70,
    "#ae9367",
    "Dragón celestial",
    "Celestial dragon",
    "天龙",
    "Dragon céleste",
    "Dragão celestial",
  ),
  item(
    "dragon-frame",
    "frame",
    1300,
    70,
    "#b09a71",
    "Guardianes del dragón",
    "Dragon guardians",
    "龙纹边框",
    "Gardiens du dragon",
    "Guardiões do dragão",
  ),
  item(
    "landscape",
    "background",
    1200,
    74,
    "#a5a699",
    "Mil montañas",
    "A thousand mountains",
    "千里江山",
    "Mille montagnes",
    "Mil montanhas",
  ),
  item(
    "immortal",
    "outfit",
    1600,
    80,
    "#d3c9ac",
    "Seda del cielo",
    "Heavenly silk",
    "天衣",
    "Soie céleste",
    "Seda celestial",
  ),
  item(
    "lotus",
    "aura",
    1800,
    90,
    "#c8b2ae",
    "Loto de la sabiduría",
    "Lotus of wisdom",
    "智慧莲花",
    "Lotus de sagesse",
    "Lótus da sabedoria",
  ),
];
const STARTER = [
  "everyday",
  "canvas",
  "porcelain",
  "paper",
  "calm",
  "warm",
  "light",
  "olive",
  "deep",
];
const DEFAULT_EQUIPPED: Readonly<Partial<Record<Slot, string>>> = {
  outfit: "everyday",
  shoes: "canvas",
  frame: "porcelain",
  background: "paper",
  expression: "calm",
  skin: "warm",
};
export interface Profile {
  readonly name: string;
  readonly base: "male" | "female";
  readonly shirtColor: string;
  readonly nationality: string;
  readonly age: number | null;
  readonly gender: "male" | "female" | "unspecified";
  readonly coins: number;
  readonly accountedXP: number;
  readonly owned: readonly string[];
  readonly equipped: Readonly<Partial<Record<Slot, string>>>;
  readonly completed: boolean;
  readonly placement: {
    readonly band: PlacementBand;
    readonly level: number;
    readonly awarded: boolean;
  } | null;
  readonly achievements: readonly string[];
}
export function initialProfile(xp = 0): Profile {
  return {
    name: "",
    base: "male",
    shirtColor: DEFAULT_SHIRT_COLOR,
    nationality: "",
    age: null,
    gender: "unspecified",
    coins: 0,
    accountedXP: natural(xp),
    owned: [...STARTER],
    equipped: { ...DEFAULT_EQUIPPED },
    completed: false,
    placement: null,
    achievements: [],
  };
}
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const natural = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : fallback;
export function isPlacementBand(value: unknown): value is PlacementBand {
  return typeof value === "string" && Object.hasOwn(PLACEMENT_LEVELS, value);
}
export function readProfile(input: unknown, xp = 0): Profile {
  if (!object(input)) return initialProfile(xp);
  const owned = [
    ...new Set([
      ...STARTER,
      ...(Array.isArray(input.owned)
        ? input.owned.filter(
            (id): id is string =>
              typeof id === "string" && ITEMS.some((entry) => entry.id === id),
          )
        : []),
    ]),
  ];
  const equipped: Partial<Record<Slot, string>> = object(input.equipped)
    ? {}
    : { ...DEFAULT_EQUIPPED };
  if (object(input.equipped))
    for (const slot of SLOTS) {
      const id = input.equipped[slot];
      if (
        typeof id === "string" &&
        owned.includes(id) &&
        ITEMS.some((entry) => entry.id === id && entry.slot === slot)
      )
        equipped[slot] = id;
    }
  const placement =
    object(input.placement) && isPlacementBand(input.placement.band)
      ? {
          band: input.placement.band,
          level: PLACEMENT_LEVELS[input.placement.band],
          awarded: input.placement.awarded === true,
        }
      : null;
  return {
    name: typeof input.name === "string" ? input.name.trim().slice(0, 40) : "",
    base:
      input.base === "female" || input.base === "scholar" ? "female" : "male",
    shirtColor: readShirtColor(input.shirtColor),
    nationality:
      typeof input.nationality === "string" &&
      /^[A-Z]{2}$/.test(input.nationality)
        ? input.nationality
        : "",
    age:
      typeof input.age === "number" &&
      Number.isInteger(input.age) &&
      input.age >= 1 &&
      input.age <= 120
        ? input.age
        : null,
    gender:
      input.gender === "male" || input.gender === "female"
        ? input.gender
        : "unspecified",
    coins: natural(input.coins),
    accountedXP: natural(input.accountedXP, natural(xp)),
    owned,
    equipped,
    completed: input.completed === true,
    placement,
    achievements: Array.isArray(input.achievements)
      ? [
          ...new Set(
            input.achievements.filter(
              (entry): entry is string =>
                typeof entry === "string" &&
                /^(first-step|placement-(1|2|3|4|5|6|7-9)|level-(5|10|20|40|70|90))$/.test(
                  entry,
                ),
            ),
          ),
        ]
      : [],
  };
}
// If browser storage is unavailable, keep the current session usable. The
// boolean result still lets the UI explain that a refresh may discard changes.
let sessionFallback: Profile | null = null;
export function loadProfile(xp = 0): Profile {
  if (sessionFallback) return readProfile(sessionFallback, xp);
  try {
    return readProfile(
      JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "null") as unknown,
      xp,
    );
  } catch {
    return initialProfile(xp);
  }
}
export function saveProfile(profile: Profile): boolean {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    sessionFallback = null;
    return true;
  } catch {
    sessionFallback = profile;
    return false;
  }
}
// LearningView owns the authoritative in-memory progress after storage fails.
// Clearing this snapshot returns the shared profile view to persisted progress.
let sessionLearningXP: number | null = null;
export function setSessionLearningXP(xp: number | null): void {
  sessionLearningXP = xp === null ? null : natural(xp);
}
export function getLearningXP(): number {
  if (sessionLearningXP !== null) return sessionLearningXP;
  try {
    return readLearning(
      JSON.parse(localStorage.getItem(LEARNING_KEY) ?? "null") as unknown,
      new Set<string>(),
    ).xp;
  } catch {
    return 0;
  }
}
/** The next level starts quickly; each later level asks for more practice. */
export function xpForLevel(level: number): number {
  const target = Math.min(
    MAX_LEVEL,
    Math.max(0, Math.floor(Number.isFinite(level) ? level : 0)),
  );
  let total = 0;
  for (let i = 0; i < target; i++)
    total += 25 + i * 7 + Math.ceil(3 * i ** 1.65);
  return total;
}
export function levelFromXP(xp: number): number {
  const earned = natural(xp);
  let level = 0;
  while (level < MAX_LEVEL && xpForLevel(level + 1) <= earned) level++;
  return level;
}
function totalXP(profile: Profile, xp: number): number {
  return Math.min(
    Number.MAX_SAFE_INTEGER,
    xpForLevel(profile.placement?.level ?? 0) + natural(xp),
  );
}
export function profileLevel(profile: Profile, xp: number): number {
  return levelFromXP(totalXP(profile, xp));
}
export function levelProgress(
  profile: Profile,
  xp: number,
): { level: number; current: number; needed: number; ratio: number } {
  const total = totalXP(profile, xp),
    level = levelFromXP(total),
    start = xpForLevel(level),
    end = xpForLevel(level + 1);
  return {
    level,
    current: level === MAX_LEVEL ? 0 : total - start,
    needed: level === MAX_LEVEL ? 0 : end - start,
    ratio: level === MAX_LEVEL ? 1 : (total - start) / (end - start),
  };
}
export function syncProfile(profile: Profile, xp: number): Profile {
  const earned = natural(xp),
    delta = Math.max(0, earned - profile.accountedXP);
  const level = profileLevel(profile, earned);
  const milestones = [5, 10, 20, 40, 70, 90]
    .filter((value) => value <= level)
    .map((value) => "level-" + value);
  return {
    ...profile,
    coins: Math.min(Number.MAX_SAFE_INTEGER, profile.coins + delta),
    accountedXP: Math.max(profile.accountedXP, earned),
    achievements: [...new Set([...profile.achievements, ...milestones])],
  };
}
/** Placement rewards are a one-time grant, independent of practice XP. */
export function applyPlacement(profile: Profile, band: PlacementBand): Profile {
  if (profile.placement?.awarded) return profile;
  const level = PLACEMENT_LEVELS[band];
  const reward = band === "0" ? 80 : 120 + level * 24;
  const gifts =
    band === "7-9"
      ? ["hanfu", "dragon-frame", "landscape"]
      : level >= 40
        ? ["hanfu", "gold", "plum"]
        : level >= 28
          ? ["mandarin", "jade", "plum"]
          : level >= 18
            ? ["scholar", "ink"]
            : level >= 10
              ? ["red", "bamboo"]
              : level >= 5
                ? ["blue-shirt"]
                : [];
  return {
    ...profile,
    coins: Math.min(Number.MAX_SAFE_INTEGER, profile.coins + reward),
    placement: { band, level, awarded: true },
    owned: [...new Set([...profile.owned, ...gifts])],
    achievements: [
      ...new Set([
        ...profile.achievements,
        "first-step",
        ...(band === "0" ? [] : ["placement-" + band]),
      ]),
    ],
  };
}
export function buyItem(profile: Profile, id: string, xp: number): Profile {
  const entry = ITEMS.find((value) => value.id === id);
  if (
    !entry ||
    profile.owned.includes(id) ||
    profileLevel(profile, xp) < entry.level ||
    profile.coins < entry.price
  )
    return profile;
  return {
    ...profile,
    coins: profile.coins - entry.price,
    owned: [...profile.owned, id],
    equipped: { ...profile.equipped, [entry.slot]: id },
  };
}
export function equipItem(profile: Profile, id: string): Profile {
  const entry = ITEMS.find((value) => value.id === id);
  if (!entry || !profile.owned.includes(id)) return profile;
  return { ...profile, equipped: { ...profile.equipped, [entry.slot]: id } };
}
export function unequipItem(profile: Profile, slot: Slot): Profile {
  const equipped = { ...profile.equipped };
  delete equipped[slot];
  return { ...profile, equipped };
}
export function itemName(entry: Item, locale: Locale): string {
  return entry.names[locale];
}
