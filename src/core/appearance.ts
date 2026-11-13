import type { Locale } from "../i18n";

function option<const Id extends string>(
  id: Id,
  es: string,
  en: string,
  zh: string,
  fr: string,
  pt: string,
  color?: string,
): {
  readonly id: Id;
  readonly label: Readonly<Record<Locale, string>>;
  readonly color?: string;
} {
  return {
    id,
    label: { es, en, "zh-CN": zh, fr, pt },
    ...(color ? { color } : {}),
  };
}

/** One schema drives storage validation, the creator controls and the SVG rig. */
export const APPEARANCE_OPTIONS = {
  face: [
    option("soft", "Suave", "Soft", "柔和", "Doux", "Suave"),
    option("round", "Redondo", "Round", "圆润", "Rond", "Redondo"),
    option("oval", "Ovalado", "Oval", "椭圆", "Ovale", "Oval"),
    option("defined", "Marcado", "Defined", "轮廓分明", "Dessiné", "Marcado"),
  ],
  eyes: [
    option(
      "almond",
      "Almendrados",
      "Almond",
      "杏眼",
      "En amande",
      "Amendoados",
    ),
    option("round", "Redondos", "Round", "圆眼", "Ronds", "Redondos"),
    option(
      "smiling",
      "Sonrientes",
      "Smiling",
      "笑眼",
      "Souriants",
      "Sorridentes",
    ),
    option(
      "monolid",
      "Párpado liso",
      "Monolid",
      "单眼皮",
      "Paupière simple",
      "Pálpebra lisa",
    ),
  ],
  brows: [
    option("soft", "Suaves", "Soft", "柔眉", "Doux", "Suaves"),
    option("straight", "Rectas", "Straight", "平眉", "Droits", "Retas"),
    option("arched", "Arqueadas", "Arched", "弯眉", "Arquées", "Arqueadas"),
    option("bold", "Pobladas", "Bold", "浓眉", "Épais", "Espessas"),
  ],
  nose: [
    option("button", "Pequeña", "Button", "小巧", "Petit", "Pequeno"),
    option("soft", "Suave", "Soft", "柔和", "Doux", "Suave"),
    option("defined", "Marcada", "Defined", "挺拔", "Dessiné", "Marcado"),
  ],
  mouth: [
    option(
      "gentle",
      "Sonrisa suave",
      "Gentle smile",
      "浅笑",
      "Sourire doux",
      "Sorriso suave",
    ),
    option(
      "wide",
      "Sonrisa amplia",
      "Wide smile",
      "灿笑",
      "Grand sourire",
      "Sorriso aberto",
    ),
    option("small", "Pequeña", "Small", "小嘴", "Petite", "Pequena"),
  ],
  hair: [
    option(
      "tousled",
      "Despeinado",
      "Tousled",
      "蓬松短发",
      "Ébouriffé",
      "Despenteado",
    ),
    option("crop", "Corto", "Crop", "利落短发", "Court", "Curto"),
    option("bob", "Media melena", "Bob", "波波头", "Carré", "Chanel"),
    option("flowing", "Largo", "Flowing", "长发", "Long", "Longo"),
    option(
      "buns",
      "Moños dobles",
      "Twin buns",
      "双丸子头",
      "Deux chignons",
      "Dois coques",
    ),
    option(
      "topknot",
      "Moño alto",
      "Topknot",
      "高髻",
      "Chignon haut",
      "Coque alto",
    ),
  ],
  hairColor: [
    option(
      "#282c30",
      "Negro tinta",
      "Ink black",
      "墨黑",
      "Noir d'encre",
      "Preto-tinta",
      "#282c30",
    ),
    option(
      "#191d22",
      "Negro noche",
      "Night black",
      "夜黑",
      "Noir nuit",
      "Preto-noite",
      "#191d22",
    ),
    option(
      "#5b4038",
      "Castaño",
      "Brown",
      "棕色",
      "Brun",
      "Castanho",
      "#5b4038",
    ),
    option(
      "#805548",
      "Cobrizo",
      "Chestnut",
      "栗色",
      "Châtain",
      "Acobreado",
      "#805548",
    ),
    option("#b8bab7", "Plata", "Silver", "银灰", "Argent", "Prata", "#b8bab7"),
    option(
      "#394752",
      "Negro azulado",
      "Blue black",
      "蓝黑",
      "Noir bleuté",
      "Preto azulado",
      "#394752",
    ),
  ],
  eyeColor: [
    option(
      "#2e2522",
      "Castaño oscuro",
      "Dark brown",
      "深棕",
      "Brun foncé",
      "Castanho escuro",
      "#2e2522",
    ),
    option(
      "#6b4b35",
      "Avellana",
      "Hazel",
      "榛色",
      "Noisette",
      "Avelã",
      "#6b4b35",
    ),
    option(
      "#7c8872",
      "Verde jade",
      "Jade green",
      "玉绿",
      "Vert jade",
      "Verde jade",
      "#7c8872",
    ),
    option(
      "#667c8b",
      "Azul pizarra",
      "Slate blue",
      "灰蓝",
      "Bleu ardoise",
      "Azul ardósia",
      "#667c8b",
    ),
  ],
  skinTone: [
    option("#e9b68e", "Miel", "Honey", "蜜色", "Miel", "Mel", "#e9b68e"),
    option(
      "#f4cfb0",
      "Porcelana cálida",
      "Warm porcelain",
      "暖瓷色",
      "Porcelaine chaude",
      "Porcelana quente",
      "#f4cfb0",
    ),
    option("#dba47d", "Arena", "Sand", "暖沙色", "Sable", "Areia", "#dba47d"),
    option("#c88b66", "Ámbar", "Amber", "琥珀色", "Ambre", "Âmbar", "#c88b66"),
    option(
      "#b57b55",
      "Bronce",
      "Bronze",
      "古铜色",
      "Bronze",
      "Bronze",
      "#b57b55",
    ),
    option("#89583f", "Cacao", "Cocoa", "可可色", "Cacao", "Cacau", "#89583f"),
  ],
  body: [
    option(
      "balanced",
      "Equilibrado",
      "Balanced",
      "匀称",
      "Équilibrée",
      "Equilibrado",
    ),
    option("slender", "Estilizado", "Slender", "修长", "Élancée", "Esguio"),
    option("soft", "Suave", "Soft", "柔和", "Douce", "Suave"),
    option("broad", "Ancho", "Broad", "宽阔", "Large", "Largo"),
  ],
  height: [
    option("short", "Bajo", "Short", "较矮", "Petite", "Baixo"),
    option("average", "Medio", "Average", "中等", "Moyenne", "Médio"),
    option("tall", "Alto", "Tall", "较高", "Grande", "Alto"),
  ],
  cheeks: [
    option("natural", "Naturales", "Natural", "自然", "Naturelles", "Naturais"),
    option("rosy", "Sonrosadas", "Rosy", "红润", "Rosées", "Rosadas"),
    option(
      "freckles",
      "Pecas",
      "Freckles",
      "雀斑",
      "Taches de rousseur",
      "Sardas",
    ),
  ],
} as const;

export type AppearanceField = keyof typeof APPEARANCE_OPTIONS;
export type Appearance = {
  readonly [Key in AppearanceField]: (typeof APPEARANCE_OPTIONS)[Key][number]["id"];
};
export type CharacterBase = "male" | "female";

export function isAppearanceValue<Key extends AppearanceField>(
  key: Key,
  value: unknown,
): value is Appearance[Key] {
  return (
    Object.hasOwn(APPEARANCE_OPTIONS, key) &&
    typeof value === "string" &&
    APPEARANCE_OPTIONS[key].some((entry) => entry.id === value)
  );
}

export function defaultAppearance(base: CharacterBase): Appearance {
  const female = base === "female";
  return {
    face: female ? "oval" : "defined",
    eyes: "almond",
    brows: female ? "arched" : "bold",
    nose: female ? "soft" : "button",
    mouth: female ? "gentle" : "wide",
    hair: female ? "buns" : "tousled",
    hairColor: "#282c30",
    eyeColor: "#2e2522",
    skinTone: "#e9b68e",
    body: female ? "soft" : "balanced",
    height: "average",
    cheeks: female ? "rosy" : "natural",
  };
}

export function readAppearance(
  input: unknown,
  base: CharacterBase,
  legacySkinTone?: string,
): Appearance {
  const defaults = defaultAppearance(base);
  const value =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  function read<Key extends AppearanceField>(
    key: Key,
    fallback = defaults[key],
  ): Appearance[Key] {
    const raw = value[key];
    const candidate =
      typeof raw === "string" && (key.endsWith("Color") || key === "skinTone")
        ? raw.toLowerCase()
        : raw;
    return isAppearanceValue(key, candidate) ? candidate : fallback;
  }
  const legacy = legacySkinTone?.toLowerCase();
  return {
    face: read("face"),
    eyes: read("eyes"),
    brows: read("brows"),
    nose: read("nose"),
    mouth: read("mouth"),
    hair: read("hair"),
    hairColor: read("hairColor"),
    eyeColor: read("eyeColor"),
    skinTone: read(
      "skinTone",
      isAppearanceValue("skinTone", legacy) ? legacy : defaults.skinTone,
    ),
    body: read("body"),
    height: read("height"),
    cheeks: read("cheeks"),
  };
}
