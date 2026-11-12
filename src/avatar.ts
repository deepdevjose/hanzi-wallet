import "./avatar.css";
import type { Profile, Item, Slot } from "./core/profile";
import { ITEMS } from "./core/profile";
import { getLocale } from "./i18n";

const art = (name: string): string =>
  new URL(`art/${name}`, new URL(import.meta.env.BASE_URL, location.href)).href;
let nextId = 0;
const svg = (body: string, className: string): SVGSVGElement => {
  const host = document.createElement("div");
  host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" class="${className}" fill="none" aria-hidden="true">${body}</svg>`;
  return host.firstElementChild as SVGSVGElement;
};
const selected = (profile: Profile, slot: Slot): Item | undefined =>
  ITEMS.find((item) => item.id === profile.equipped[slot]);
const color = (item: Item | undefined, fallback: string): string =>
  item && /^#[a-f\d]{3,8}$/i.test(item.tone) ? item.tone : fallback;
const shirt =
  "M89 81Q100 86 111 81L130 87Q138 91 143 111L154 160L139 166L129 127L132 174Q100 181 68 174L71 127L61 166L46 160L57 111Q62 91 70 87Z";
const hands =
  "M48 161Q57 164 61 170L62 185L54 195L49 184L47 192L44 191L45 180L43 185L41 182L43 170ZM139 168Q142 162 152 160L159 180L158 187L154 182L155 193L151 194L148 184L146 194L141 185Z";
const face =
  "M77 31Q90 22 103 26Q113 25 124 37L129 49Q135 49 134 58L130 65L126 71Q113 82 103 82Q88 82 75 71L70 65Q65 61 66 52L71 49Z";

/** Original full-body renders + texture-preserving tints and collectible accessory layers. */
export function createAvatar(
  profile: Profile,
  options: { mini?: boolean; portrait?: boolean; plain?: boolean } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className =
    "avatar-scene" +
    (options.mini ? " avatar-mini" : "") +
    (options.portrait ? " avatar-portrait" : "");
  wrapper.dataset.base = profile.base;
  wrapper.setAttribute("role", "img");
  wrapper.setAttribute(
    "aria-label",
    {
      es: "Tu personaje",
      en: "Your character",
      "zh-CN": "你的角色",
      fr: "Votre personnage",
      pt: "Seu personagem",
    }[getLocale()],
  );
  const background = selected(profile, "background"),
    frame = selected(profile, "frame"),
    outfit = selected(profile, "outfit"),
    head = selected(profile, "head"),
    aura = selected(profile, "aura"),
    shoes = selected(profile, "shoes"),
    skin = selected(profile, "skin"),
    expression = selected(profile, "expression");
  if (!options.plain) {
    wrapper.style.setProperty("--avatar-tone", color(background, "#deddd7"));
    wrapper.style.setProperty(
      "--ink-landscape",
      `url("${art("ink-landscape.webp")}")`,
    );
    if (background) wrapper.dataset.background = background.id;
    if (frame) {
      wrapper.dataset.frame = frame.id;
      wrapper.style.setProperty("--avatar-frame", color(frame, "#8e9b8e"));
    }
  }
  const figure = document.createElement("div");
  figure.className = "avatar-figure";
  const outfitId = outfit?.id ?? "everyday";
  const premium = /^(hanfu|silk-dress|immortal)$/.test(outfitId)
    ? "hanfu"
    : outfitId === "imperial"
      ? "imperial"
      : "";
  const assetName = `avatar-${profile.base}${premium ? "-" + premium : ""}.png`;
  const source = art(assetName);
  const image = document.createElement("img");
  image.src = source;
  image.alt = "";
  image.draggable = false;
  image.decoding = "async";
  image.className = "avatar-body";
  figure.append(image);
  const id = ++nextId;
  // Clip texture-preserving raster filters to skin, leaving the garment and hair intact.
  if (skin && skin.id !== "warm") {
    const treatment: Record<string, string> = {
      light: "brightness(1.12) saturate(.78)",
      olive: "sepia(.42) saturate(1.15) brightness(.86)",
      deep: "sepia(.58) saturate(1.25) brightness(.59)",
    };
    const skinLayer = svg(
      `<defs><clipPath id="skin-${id}"><path d="${face}"/><path d="${hands}"/></clipPath></defs><image href="${source}" width="200" height="300" clip-path="url(#skin-${id})" style="filter:${treatment[skin.id] ?? "none"}"/>`,
      "avatar-skin",
    );
    figure.append(skinLayer);
  }
  if (outfit && !premium && outfitId !== "everyday") {
    const main = color(outfit, "#738c8c");
    // Multiply keeps the original woven fabric, soft shadows, seams and frog closures.
    figure.append(
      svg(
        `<defs><mask id="cloth-alpha-${id}"><image href="${source}" width="200" height="300"/></mask><clipPath id="cloth-${id}"><path d="${shirt}"/></clipPath></defs><path d="${shirt}" fill="${main}" mask="url(#cloth-alpha-${id})" clip-path="url(#cloth-${id})"/>${outfitId === "scholar" ? '<path d="M85 87L100 107L115 87M100 107V171M71 162Q100 167 129 162" stroke="#d6c49d" stroke-width="2.5" opacity=".8"/>' : ""}${outfitId === "red" ? '<path d="M112 114q10-12 14 1q-3 13-12 3M79 143q10-12 14 1q-3 13-12 3" stroke="#d6be8c" stroke-width="1.4" opacity=".85"/>' : ""}${outfitId === "mandarin" ? '<path d="M78 89Q100 96 122 89M72 168Q100 174 129 168" stroke="#c4b58f" stroke-width="2" opacity=".8"/>' : ""}`,
        "avatar-clothes",
      ),
    );
  }
  if (premium && outfitId === "immortal")
    figure.style.filter = "brightness(1.08) saturate(.7)";
  if (shoes && shoes.id !== "canvas") {
    const embroidery = shoes.id === "embroidered";
    figure.append(
      svg(
        `<path d="M74 276L91 276L92 292Q77 299 62 294Q61 285 74 276ZM109 276H125Q137 285 137 294Q121 299 108 292Z" fill="${color(shoes, "#505b63")}"/><path d="M65 292L90 291M110 291L134 292" stroke="#e5dbc6" stroke-width="1.3"/>${embroidery ? '<path d="M74 286q6-9 10 0q-5 6-10 0M114 286q6-9 10 0q-5 6-10 0" stroke="#d5bf91" stroke-width="1.3"/>' : shoes.id === "cloud-shoes" ? '<path d="M69 286q4-6 9-3t8-2M113 283q4-6 9-3t8 1" stroke="#bdc9c7" stroke-width="1.4"/>' : ""}`,
        "avatar-shoes",
      ),
    );
  }
  if (head) {
    let accessory = "";
    if (head.id === "hat")
      accessory =
        '<path d="M48 39Q100-9 152 39Q102 51 48 39Z" fill="#bca779" stroke="#826e4b" stroke-width="1"/><path d="M100 5L69 42M100 5L87 46M100 5L113 46M100 5L131 42" stroke="#8a774e" stroke-opacity=".5"/>';
    else if (head.id === "ribbon")
      accessory =
        '<path d="M73 26Q99 15 128 27" stroke="#a96763" stroke-width="5"/><path d="M123 27q14-18 16-4q0 12-16 4q14 13 9 20" fill="#bc7e77" stroke="#925750" stroke-width="1"/>';
    else if (head.id === "jade-pin")
      accessory =
        '<path d="M70 27L134 12" stroke="#6e8f80" stroke-width="3.5" stroke-linecap="round"/><circle cx="134" cy="12" r="4" fill="#95b2a0" stroke="#d7c999" stroke-width="1.5"/><path d="M134 16v18" stroke="#c7b58b" stroke-width="1"/><circle cx="134" cy="36" r="2" fill="#a5bead"/>';
    else if (head.id === "crown")
      accessory =
        '<path d="M72 27L75 8L88 18L100 3L112 18L125 8L128 27Z" fill="#bda475" stroke="#826e4b" stroke-width="1"/><path d="M75 23H125" stroke="#e6d8b2" stroke-width="2"/><circle cx="100" cy="18" r="4" fill="#a15e57"/><path d="M74 26V40M126 26V40" stroke="#bda475" stroke-width="1.5"/>';
    if (accessory) figure.append(svg(accessory, "avatar-headpiece"));
  }
  if (expression?.id === "smile")
    figure.append(
      svg(
        '<path d="M92 65Q100 72 108 65Q100 79 92 65Z" fill="#ae6660"/><path d="M95 67Q100 69 105 67" stroke="#fcf2e9" stroke-width="1.5" stroke-linecap="round"/>',
        "avatar-expression",
      ),
    );
  else if (expression?.id === "curious")
    figure.append(
      svg(
        '<path d="M81 43Q88 36 94 41M107 40Q115 43 121 39" stroke="#49372c" stroke-width="2.1" stroke-linecap="round"/><ellipse cx="101" cy="69" rx="3" ry="3.5" fill="#a06456"/>',
        "avatar-expression",
      ),
    );
  wrapper.append(figure);
  if (frame?.id === "dragon-frame" && !options.plain && !options.portrait) {
    // A pair of slender gilded guardians stays at the paper's edges.
    const guardian = `<path d="M16 270Q5 260 16 248C32 231 2 216 14 196S28 166 15 149S3 122 16 103S27 76 17 59Q9 45 24 35" stroke="#9c8357" stroke-width="5" stroke-linecap="round"/><path d="M16 270Q5 260 16 248C32 231 2 216 14 196S28 166 15 149S3 122 16 103S27 76 17 59Q9 45 24 35" stroke="#dcc696" stroke-width="2" stroke-linecap="round"/><path d="M13 241L19 238M16 218L11 216M14 194L20 190M18 170L12 167M13 144L19 140M15 119L21 116M19 94L13 91M17 69L12 66M15 51L21 49" stroke="#718d7f" stroke-width="2.3" stroke-linecap="round"/><path d="M21 36Q20 28 28 25L36 27L42 25L40 32L33 35L28 42L20 40Z" fill="#c3aa78" stroke="#94794c" stroke-width=".9"/><path d="M26 26L22 17L28 21M31 26L33 16L36 18M20 32L16 29M22 40L17 45" stroke="#a18b5f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M37 32Q49 33 44 43M34 35Q40 43 35 46" stroke="#ad9360" stroke-width="1" stroke-linecap="round"/><circle cx="33" cy="29.5" r="1.2" fill="#435c50"/><path d="M13 268L7 273M16 270L20 277" stroke="#a78b57" stroke-width="1.7" stroke-linecap="round"/>`;
    const ornament = svg(
      `<g>${guardian}</g><g transform="translate(200 0) scale(-1 1)">${guardian}</g><path d="M44 15H76M124 15H156M25 285H71M129 285H175" stroke="#b69b68" stroke-width=".9" opacity=".7"/><path d="M100 10L106 15L100 20L94 15Z" fill="#b69b68" opacity=".8"/>`,
      "avatar-frame-ornament",
    );
    ornament.setAttribute("preserveAspectRatio", "none");
    wrapper.append(ornament);
  }
  if (aura) {
    if (aura.id === "dragon") {
      const dragon = document.createElement("img");
      dragon.src = art("dragon.png");
      dragon.className = "avatar-dragon";
      dragon.alt = "";
      wrapper.append(dragon);
    } else if (aura.id === "lantern")
      wrapper.append(
        svg(
          '<g fill="#a66e63" stroke="#bd9a67" stroke-width="1.3"><path d="M23 60V33M177 90V57"/><ellipse cx="23" cy="78" rx="11" ry="16"/><ellipse cx="177" cy="105" rx="11" ry="16"/><path d="M23 94V108M177 121V135"/></g><g fill="#c7b58e" opacity=".8"><circle cx="42" cy="176" r="2"/><circle cx="159" cy="193" r="2"/></g>',
          "avatar-aura",
        ),
      );
    else if (aura.id === "clouds")
      wrapper.append(
        svg(
          '<g fill="#f3f4ef" fill-opacity=".8" stroke="#bcc7c5" stroke-width=".8"><path d="M10 214q-6-12 5-15q2-16 14-7q13-4 14 10q17 9 2 16Z"/><path d="M151 169q-6-12 5-15q2-16 14-7q13-4 14 10q17 9 2 16Z"/><path d="M132 273q-6-12 5-15q2-16 14-7q13-4 14 10q17 9 2 16Z"/></g>',
          "avatar-aura",
        ),
      );
    else if (aura.id === "lotus")
      wrapper.append(
        svg(
          '<g fill="#c3a6a3" stroke="#9e7d83" stroke-width="1" opacity=".8"><path d="M100 287Q77 270 100 249Q123 270 100 287Z"/><path d="M100 287Q65 287 69 265Q92 266 100 287Z"/><path d="M100 287Q135 287 131 265Q108 266 100 287Z"/><path d="M100 287Q58 299 50 279Q79 272 100 287Z"/><path d="M100 287Q142 299 150 279Q121 272 100 287Z"/></g><g fill="#c6b583"><circle cx="31" cy="125" r="2"/><circle cx="165" cy="208" r="2.5"/></g>',
          "avatar-aura",
        ),
      );
  }
  return wrapper;
}

export function createItemArt(item: Item, profile: Profile): HTMLElement {
  const preview = createAvatar(
    { ...profile, equipped: { [item.slot]: item.id } },
    { mini: true },
  );
  preview.dataset.itemSlot = item.slot;
  return preview;
}
