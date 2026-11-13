import "./avatar.css";
import type { Profile, Item, Slot } from "./core/profile";
import { ITEMS, DEFAULT_SHIRT_COLOR } from "./core/profile";
import { getLocale } from "./i18n";

const NS = "http://www.w3.org/2000/svg";
const INK = "#39413d";
const HAIR = "#303b39";
const PAPER = "#f4f0e6";
const selected = (profile: Profile, slot: Slot): Item | undefined =>
  ITEMS.find((item) => item.id === profile.equipped[slot]);
const color = (item: Item | undefined, fallback: string): string =>
  item && /^#[a-f\d]{6}$/i.test(item.tone) ? item.tone : fallback;

function drawing(
  body: string,
  className: string,
  viewBox = "0 0 200 300",
): SVGSVGElement {
  const image = document.createElementNS(NS, "svg");
  image.setAttribute("viewBox", viewBox);
  image.setAttribute("fill", "none");
  image.setAttribute("aria-hidden", "true");
  image.setAttribute("class", className);
  image.innerHTML = body;
  return image;
}

// All clothing, skin and accessories use this one joint system. A sleeve and the
// hand inside it belong to the same arm; headwear belongs to the moving head.
const stroke = `stroke="${INK}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"`;
const path = (d: string, fill: string, extra = ""): string =>
  `<path d="${d}" fill="${fill}" ${stroke} ${extra}/>`;
const cloud = (x: number, y: number, scale = 1): string =>
  `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-21 6C-34 5-34-6-23-8C-22-21-6-24 0-12C12-18 24-7 19 2C31 7 24 17 12 16H-20C-30 16-30 8-21 6Z" fill="#eef0e8" stroke="#a4b3a6" stroke-width="1.2"/><path d="M-18 4Q-5-2-2 6T14 8" stroke="#acb9ab" stroke-width="1.2" stroke-linecap="round"/></g>`;
const blossom = (x: number, y: number, scale = 1): string =>
  `<g transform="translate(${x} ${y}) scale(${scale})" fill="#b87f78"><ellipse cy="-4" rx="3" ry="4"/><ellipse cx="4" cy="-1" rx="4" ry="3"/><ellipse cx="2" cy="4" rx="3" ry="4"/><ellipse cx="-3" cy="4" rx="3" ry="4"/><ellipse cx="-5" cy="-1" rx="4" ry="3"/><circle r="2" fill="#e4cd9d"/></g>`;

function scenery(id: string): string {
  if (id === "bamboo")
    return `<g fill="#9aaa8e" stroke="#8d9f86" stroke-width="2" opacity=".65"><path d="M13 300L21 21M31 300L35 71M180 300L177 14"/><path d="M19 69Q-4 49 4 34Q23 45 19 69M20 111Q42 84 49 91Q45 110 20 111M34 173Q54 149 61 156Q56 174 34 173M178 77Q157 48 151 57Q153 77 178 77M178 128Q198 106 199 114Q196 130 178 128" stroke-width=".5"/><path d="M16 77H24M14 141H23M12 210H21M31 192H39M173 88H182M174 162H183M176 237H185" stroke="#748a70"/></g>`;
  if (id === "plum")
    return `<g opacity=".8"><path d="M0 28Q32 43 82 16M13 33Q31 70 66 85M40 32L43 7M40 64L58 55" stroke="#6e7770" stroke-width="3" stroke-linecap="round"/>${[
      [20, 32],
      [43, 19],
      [66, 23],
      [31, 58],
      [55, 75],
      [65, 84],
      [57, 55],
    ]
      .map(([x, y]) => blossom(x!, y!, 0.75))
      .join(
        "",
      )}<path d="M170 177q8-6 9 1q-1 8-9-1M36 232q6-4 7 2q-2 6-7-2" fill="#c5978a"/></g>`;
  if (id === "palace")
    return `<g opacity=".75"><path d="M0 245Q43 218 79 242T200 230V300H0Z" fill="#c8d0c1"/><path d="M-10 276Q65 251 198 268M23 293Q90 273 193 287" stroke="#edf1e5" stroke-width="3"/><path d="M135 226V181M174 226V181M132 220H177M130 226H180" stroke="#7c8c7c" stroke-width="3"/><path d="M119 183Q145 181 154 162Q164 179 188 183L184 187H124Z" fill="#6f8380"/><path d="M125 178Q153 181 154 161Q159 180 183 178M148 191V217M160 191V217" stroke="#b3c1ad" stroke-width="1.5"/><path d="M130 226Q157 234 186 221" stroke="#7c8c7c" stroke-width="2"/></g>${cloud(37, 72, 0.7)}`;
  if (id === "ink" || id === "landscape") {
    const green = id === "landscape";
    return `<g opacity="${green ? ".65" : ".45"}"><path d="M-20 204L17 104L47 151L72 80L100 149L124 111L157 151L182 91L218 193V300H-20Z" fill="${green ? "#b9c8b5" : "#d0d4cd"}"/><path d="M-10 269L24 169L51 220L79 149L119 218L151 159L208 265V300H-10Z" fill="${green ? "#95b2a4" : "#afbdb4"}"/><path d="M9 258L25 193L35 207M61 237L81 174L97 208M141 225L153 181L167 202" stroke="${green ? "#bba77b" : "#81988c"}" stroke-width="1.4"/><path d="M-10 275Q44 252 82 270T210 271" stroke="#f0efe5" stroke-width="12"/></g>${cloud(38, 111, 0.65)}${cloud(165, 68, 0.7)}`;
  }
  return `<g stroke="#c6c3b3" opacity=".33" stroke-width=".8"><path d="M16 42q12-5 24 0M159 76q14-5 26 0M16 224q12-4 20 1M162 242q13-4 21 0"/></g>`;
}

function headwear(id: string): string {
  if (id === "hat")
    return `<g class="avatar-headwear">${path("M27 56Q61 39 100 13Q139 39 173 56Q101 76 27 56Z", "#cbb77e")}<path d="M100 15L51 59M100 15L75 63M100 15V66M100 15L125 63M100 15L149 59M32 55Q100 65 168 55" stroke="#a08c5c" stroke-width="1.15" stroke-linecap="round"/><path d="M41 59Q100 76 159 59" stroke="#8d7953" stroke-width="2" fill="none"/></g>`;
  if (id === "ribbon")
    return `<g class="avatar-headwear"><path d="M63 55Q100 39 137 55" stroke="#aa706c" stroke-width="6"/>${path("M128 52Q146 29 148 48Q149 62 128 52Q147 71 136 78L132 59Z", "#bb837b")}<path d="M135 61L149 87L138 84L133 91L128 59" fill="#a46f6b"/></g>`;
  if (id === "jade-pin")
    return `<g class="avatar-headwear"><path d="M60 55L140 32" stroke="#648a77" stroke-width="4" stroke-linecap="round"/><path d="M134 35Q138 20 146 27Q155 34 140 40" fill="#8eac95" stroke="#648a77" stroke-width="1.5"/><path d="M144 40V62" stroke="#b59a69" stroke-width="1.5"/><circle cx="144" cy="65" r="3" fill="#94b09a" stroke="#648a77"/></g>`;
  if (id === "crown")
    return `<g class="avatar-headwear">${path("M61 52L64 29L78 38L88 20L100 34L112 20L122 38L136 29L139 52Z", "#c8ae76")}<path d="M65 45H135" stroke="#f3e6bc" stroke-width="3"/><path d="M62 51V78M138 51V78" stroke="#bba16e" stroke-width="1.5"/><circle cx="62" cy="81" r="3" fill="#b87c70"/><circle cx="138" cy="81" r="3" fill="#b87c70"/><path d="M100 34L105 42L100 48L95 42Z" fill="#b57b6c"/></g>`;
  return "";
}

function hair(female: boolean): { back: string; front: string } {
  if (female)
    return {
      back: `<path d="M62 70Q51 111 66 139L81 146L83 137Q71 121 76 96L80 76Z" fill="${HAIR}"/><path d="M138 70Q149 111 134 139L119 146L117 137Q129 121 124 96L120 76Z" fill="${HAIR}"/><circle cx="55" cy="64" r="15" fill="${HAIR}"/><circle cx="145" cy="64" r="15" fill="${HAIR}"/><path d="M42 61Q51 53 61 59M139 58Q150 51 158 63" stroke="#637469" stroke-width="2" stroke-linecap="round"/>`,
      front: `${path("M58 77Q51 46 75 35Q99 23 125 36Q148 47 142 78L133 82L132 61Q108 64 96 46Q82 64 65 63L66 83Z", HAIR)}<path d="M72 43Q80 37 90 37M111 38Q126 40 132 50" stroke="#5b6d63" stroke-width="2" stroke-linecap="round"/>`,
    };
  return {
    back: "",
    front: `${path("M57 80Q48 62 59 49Q60 35 76 35Q83 20 97 31Q107 18 119 34Q140 30 143 50Q154 66 142 83L133 80L132 64Q115 66 110 51Q105 62 95 65L88 51Q82 62 67 66L66 82Z", HAIR)}<path d="M66 47Q73 40 81 42M111 38Q124 37 132 47" stroke="#5e7066" stroke-width="2" stroke-linecap="round"/>`,
  };
}

function faceFeatures(
  expression: string,
  female: boolean,
  deep: boolean,
): string {
  const blush = deep ? "#bc8074" : "#cf9485";
  const brows =
    expression === "curious"
      ? '<path d="M72 78Q80 69 88 74M111 76Q120 80 127 75"/>'
      : female
        ? '<path d="M73 76Q80 71 88 75M112 75Q120 71 127 76"/>'
        : '<path d="M72 75Q80 69 89 74M111 74Q120 69 128 75"/>';
  const eyes =
    expression === "smile"
      ? '<path d="M74 88Q81 79 88 88M112 88Q119 79 126 88" stroke="#303b39" stroke-width="3.4" stroke-linecap="round"/>'
      : '<g class="avatar-eye-open" fill="#303b39"><ellipse cx="81" cy="87" rx="4.7" ry="6.1"/><ellipse cx="119" cy="87" rx="4.7" ry="6.1"/><circle cx="82.3" cy="85" r="1.3" fill="#fffaf0"/><circle cx="120.3" cy="85" r="1.3" fill="#fffaf0"/></g><g class="avatar-eye-closed" stroke="#303b39" stroke-width="2.8" stroke-linecap="round"><path d="M76 88Q81 91 86 88M114 88Q119 91 124 88"/></g>';
  const mouth =
    expression === "smile"
      ? '<path d="M90 107Q100 112 110 107Q107 121 100 120Q93 119 90 107Z" fill="#aa625b"/><path d="M94 110Q100 113 106 110" stroke="#fff5df" stroke-width="2.2" stroke-linecap="round"/>'
      : expression === "curious"
        ? '<ellipse cx="101" cy="111" rx="4" ry="5" fill="#ad6d61"/>'
        : '<path d="M91 109Q100 117 109 109" stroke="#9b5d53" stroke-width="2.3" stroke-linecap="round"/>';
  return `<g class="avatar-face"><ellipse cx="71" cy="102" rx="10" ry="5" fill="${blush}" opacity=".53"/><ellipse cx="129" cy="102" rx="10" ry="5" fill="${blush}" opacity=".53"/><g fill="none" stroke="#303b39" stroke-width="${female ? 2.8 : 3.6}" stroke-linecap="round">${brows}</g>${eyes}<path d="M99 94L97 100Q100 102 103 100" stroke="${deep ? "#6d4434" : "#ba8b6a"}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>${mouth}</g>`;
}

function shoes(id: string, tone: string): string {
  const shoe = (mirror: boolean): string =>
    `<g${mirror ? ' transform="translate(200 0) scale(-1 1)"' : ""}>${path("M79 268L95 270L97 282Q87 289 71 285Q67 281 70 277Z", tone)}<path d="M70 282Q82 287 96 281" stroke="${id === "canvas" ? "#aaa996" : "#d6cfb5"}" stroke-width="2" stroke-linecap="round"/>${id === "canvas" ? '<path d="M79 274L88 277M80 278L89 280" stroke="#b4b3a1" stroke-width="1.3" stroke-linecap="round"/>' : id === "cloud-shoes" ? '<path d="M76 278Q78 271 84 276T92 276" stroke="#d6d9c7" stroke-width="1.5" stroke-linecap="round"/>' : id === "embroidered" ? `<g transform="translate(83 277) scale(.5)">${blossom(0, 0)}</g>` : '<path d="M77 272Q83 279 93 274" stroke="#b3b79f" stroke-width="1.5"/>'}</g>`;
  return `<g class="avatar-shoes">${shoe(false)}${shoe(true)}</g>`;
}

function outfit(
  profile: Profile,
  item: Item | undefined,
  skin: string,
): { torso: string; arms: string; legs: string } {
  const id = item?.id ?? "everyday";
  const regal = ["hanfu", "silk-dress", "imperial", "immortal"].includes(id);
  const robe = regal || id === "scholar";
  const short = id === "everyday" || id === "silk-dress";
  const tone =
    id === "everyday"
      ? /^#[a-f\d]{6}$/i.test(profile.shirtColor)
        ? profile.shirtColor
        : DEFAULT_SHIRT_COLOR
      : color(item, "#8b9b8d");
  const trim =
    id === "imperial" || id === "immortal"
      ? "#c6aa72"
      : regal
        ? "#8d9d87"
        : "#d9d9c5";
  const length = id === "immortal" ? 275 : id === "scholar" ? 259 : 267;
  const shirtBody =
    "M78 141L89 136Q100 147 111 136L122 141L128 208Q101 215 72 208Z";
  const robeBody = `M78 141L89 136L100 143L111 136L122 141L127 205L140 ${length}Q100 ${length + 8} 60 ${length}L73 205Z`;
  const torsoShape = robe ? robeBody : shirtBody;
  let detail = "";
  if (id === "everyday")
    detail =
      '<path d="M88 138Q100 153 112 138M75 202Q100 208 125 202" stroke="#39413d" stroke-opacity=".22" stroke-width="1.6"/>';
  else if (id === "blue-shirt")
    detail =
      '<path d="M89 136L100 149L111 136M100 149V208M85 140L89 155L100 149L111 155L115 140" stroke="#d4dbd2" stroke-width="1.7"/><g fill="#dbe1d8"><circle cx="102" cy="168" r="1.3"/><circle cx="102" cy="184" r="1.3"/><circle cx="102" cy="200" r="1.3"/></g>';
  else if (id === "linen")
    detail =
      '<path d="M89 137L100 151L111 137M100 151V174M81 200Q100 204 119 200" stroke="#9e967e" stroke-width="1.6" stroke-linecap="round"/><path d="M109 158H116V171H109" stroke="#b2a88a" stroke-width="1.3"/>';
  else if (robe)
    detail = `<path d="M88 138L111 169L115 139M94 149L78 175M109 166L101 207" stroke="${trim}" stroke-width="5" stroke-linejoin="round"/><path d="M74 199Q100 204 127 199L128 209Q100 214 72 209Z" fill="${trim}"/><path d="M92 209L84 ${length - 4}M108 210L117 ${length - 4}" stroke="#39413d" stroke-opacity=".16" stroke-width="1.5"/><path d="M79 ${length - 9}Q86 ${length - 17} 93 ${length - 9}T108 ${length - 9}T123 ${length - 9}" stroke="${trim}" stroke-width="2" fill="none"/>${id === "imperial" ? '<path d="M93 174Q111 163 117 177Q120 188 109 190Q100 187 108 181Q114 180 109 176M109 188L103 195M116 177L122 173" stroke="#d7bd84" stroke-width="2" stroke-linecap="round"/>' : id === "silk-dress" ? blossom(115, 183, 0.65) : id === "immortal" ? '<path d="M81 224Q100 214 119 224M78 239Q100 228 122 239" stroke="#f0ead5" stroke-width="2"/>' : '<path d="M113 177q-5 5 0 9q5-4 0-9" stroke="#c9c6aa" stroke-width="1.5"/>'}`;
  else
    detail = `<path d="M88 137L88 148H112V137M100 148V209M76 200H124" stroke="${id === "red" ? "#dac092" : "#bec8b8"}" stroke-width="1.7"/><g stroke="${id === "red" ? "#dac092" : "#bec8b8"}" stroke-width="2" stroke-linecap="round"><path d="M94 160H106M94 176H106M94 192H106"/></g>${id === "red" ? blossom(116, 187, 0.6) : ""}`;
  const bareHand =
    robe && !short
      ? "M55 190L50 205Q48 216 57 218Q66 217 68 207L72 195Z"
      : "M64 156Q59 173 56 188Q53 198 61 202Q69 204 71 193L78 167Z";
  const sleeve =
    robe && !short
      ? "M79 140L66 143L46 184L51 201L75 204L87 156Z"
      : short
        ? "M79 140L67 143L55 159Q63 170 75 170L86 153Z"
        : "M79 140L67 143L51 180L63 190L77 166L86 153Z";
  const arm = `${path(bareHand, skin)}${path(sleeve, tone)}<path d="${robe && !short ? "M51 196L76 199" : short ? "M59 160L74 165" : "M55 179L65 185"}" stroke="${id === "everyday" ? "#39413d" : trim}" stroke-opacity="${id === "everyday" ? ".22" : ".75"}" stroke-width="2" stroke-linecap="round"/><path d="${robe && !short ? "M54 210L58 212" : "M59 194L64 195"}" stroke="#39413d" stroke-opacity=".28" stroke-width="1.1" stroke-linecap="round"/>`;
  return {
    torso: `<g class="avatar-garment" data-garment="${id}">${path(torsoShape, tone)}${detail}</g>`,
    arms: `<g class="avatar-arm avatar-arm-left">${arm}</g><g class="avatar-arm avatar-arm-right"><g transform="translate(200 0) scale(-1 1)">${arm}</g></g>`,
    legs: `<g class="avatar-trousers">${path("M76 200H124L122 272Q113 277 104 272L101 234H99L96 272Q86 278 78 272L73 223Z", "#59625d")}<path d="M100 218V233M83 232L85 266M116 232L114 267" stroke="#839083" stroke-width="1.5" stroke-linecap="round"/></g>`,
  };
}

function aura(id: string): string {
  if (id === "clouds")
    return `<g class="avatar-aura avatar-cloud-aura">${cloud(25, 184, 0.7)}${cloud(175, 148, 0.65)}${cloud(142, 268, 0.7)}</g>`;
  if (id === "lantern")
    return `<g class="avatar-aura avatar-lantern-aura">${[false, true].map((mirror) => `<g${mirror ? ' transform="translate(200 35) scale(-1 1)"' : ""}><path d="M24 47V76" stroke="#a29477" stroke-width="1.4"/><g class="avatar-lantern"><rect x="13" y="78" width="23" height="32" rx="11" fill="#b6776b" stroke="#7e6257" stroke-width="1.2"/><path d="M15 79H33M15 109H33M24 110V124M20 83L18 103M28 83L30 103" stroke="#dfc394" stroke-width="1.5"/><path d="M20 90H28M24 85V100M19 96H29" stroke="#efdbc0" stroke-width="1.2"/></g></g>`).join("")}</g>`;
  if (id === "lotus")
    return `<g class="avatar-aura avatar-lotus-aura" transform="translate(100 279)"><g fill="#c8a8a3" stroke="#a08080" stroke-width="1.1"><path d="M0 11Q-17-4 0-26Q17-4 0 11Z"/><path d="M0 11Q-28 5-24-15Q-5-12 0 11Z"/><path d="M0 11Q28 5 24-15Q5-12 0 11Z"/><path d="M0 11Q-37 20-40 0Q-15-5 0 11Z"/><path d="M0 11Q37 20 40 0Q15-5 0 11Z"/></g><path d="M-38 16Q0 25 38 16" stroke="#a4b29c" stroke-width="2" stroke-linecap="round"/></g>`;
  if (id === "dragon")
    return `<g class="avatar-aura avatar-dragon-aura"><path d="M164 253Q187 251 174 233Q159 215 174 201Q189 186 173 177Q161 170 157 185" stroke="#6c8675" stroke-width="16" stroke-linecap="round"/><path d="M164 253Q187 251 174 233Q159 215 174 201Q189 186 173 177Q161 170 157 185" stroke="#bfc49a" stroke-width="5" stroke-linecap="round"/><path d="M173 247L182 245M168 231L177 228M166 215L175 214M174 197L183 197" stroke="#a5b18f" stroke-width="2"/><path d="M149 181Q147 169 158 168L172 174L172 186L159 195L148 190Z" fill="#8aa187" stroke="#4f6c59" stroke-width="1.5"/><path d="M157 170L153 157L161 164M165 172L171 160L171 168M171 181Q187 178 182 192M168 185Q177 197 168 198M171 226L184 224L186 230M166 242L157 249L151 246" stroke="#bba46f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M150 181L157 179L156 185Z" fill="#f2e8c5"/><circle cx="154" cy="182" r="1.5" fill="#394d3c"/><path d="M153 190Q159 194 164 189" stroke="#596e50" stroke-width="1.2"/></g>`;
  return "";
}

function frameArtwork(id: string): string {
  if (id !== "dragon-frame") return "";
  const guardian =
    '<path d="M14 273Q27 263 15 250Q3 237 15 223T15 194T15 165T15 136T15 107T15 78Q6 63 19 48" stroke="#baaa7c" stroke-width="4" stroke-linecap="round"/><path d="M15 252L21 249M11 233L17 230M15 208L21 205M11 186L17 183M15 163L21 160M11 142L17 139M15 119L21 116M11 95L17 92M14 72L20 69" stroke="#819882" stroke-width="1.5"/><path d="M15 48L17 37L28 32L37 37L32 45L22 49Z" fill="#c5b184" stroke="#9d8b61" stroke-width="1"/><path d="M20 36L18 26L24 31M29 34L32 24M34 41Q45 43 39 51" stroke="#a38f66" stroke-width="1.3" stroke-linecap="round"/><circle cx="27" cy="39" r="1.5" fill="#637c68"/>';
  return `<g class="avatar-frame-ornament">${guardian}<g transform="translate(200 0) scale(-1 1)">${guardian}</g><path d="M44 15H78M122 15H156M29 285H71M129 285H171" stroke="#b5a175" stroke-width="1"/><path d="M100 10L105 15L100 20L95 15Z" fill="#b5a175"/></g>`;
}

export function createAvatar(
  profile: Profile,
  options: {
    mini?: boolean;
    portrait?: boolean;
    plain?: boolean;
    interactive?: boolean;
  } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className =
    "avatar-scene" +
    (options.mini ? " avatar-mini" : "") +
    (options.portrait ? " avatar-portrait" : "");
  wrapper.dataset.base = profile.base;
  wrapper.dataset.style = "ink-cartoon";
  const labels = {
    es: "Tu personaje",
    en: "Your character",
    "zh-CN": "你的角色",
    fr: "Votre personnage",
    pt: "Seu personagem",
  };
  const waveLabels = {
    es: "Saludar con tu personaje",
    en: "Wave with your character",
    "zh-CN": "让角色挥手",
    fr: "Faire saluer votre personnage",
    pt: "Acenar com seu personagem",
  };
  wrapper.setAttribute("role", options.interactive ? "button" : "img");
  wrapper.setAttribute(
    "aria-label",
    options.interactive ? waveLabels[getLocale()] : labels[getLocale()],
  );
  const background = selected(profile, "background"),
    frame = selected(profile, "frame");
  const outfitItem = selected(profile, "outfit"),
    head = selected(profile, "head"),
    companion = selected(profile, "aura");
  const footwear = selected(profile, "shoes"),
    skinItem = selected(profile, "skin"),
    expression = selected(profile, "expression");
  const skin = color(skinItem, "#e7ba94");
  const bg = background?.id ?? "paper";
  wrapper.style.setProperty(
    "--avatar-paper",
    (
      {
        bamboo: "#e7ebdf",
        plum: "#f0e6df",
        ink: "#e8ece6",
        landscape: "#e7e9d9",
        palace: "#eee9dd",
      } as Record<string, string>
    )[bg] ?? PAPER,
  );
  if (!options.plain) {
    if (background) wrapper.dataset.background = background.id;
    if (frame) {
      wrapper.dataset.frame = frame.id;
      wrapper.style.setProperty("--avatar-frame", color(frame, "#c7c8ba"));
    }
    wrapper.append(drawing(scenery(bg), "avatar-scenery"));
  }
  const female = profile.base === "female";
  const hairArt = hair(female);
  const clothes = outfit(profile, outfitItem, skin);
  const faceShape =
    "M61 76Q61 54 81 47Q100 39 120 47Q139 54 139 77L137 99Q135 119 117 128Q100 138 82 128Q65 119 63 99Z";
  const headArt = `<g class="avatar-head">${hairArt.back}<ellipse cx="62" cy="91" rx="8" ry="11" fill="${skin}" ${stroke}/><ellipse cx="138" cy="91" rx="8" ry="11" fill="${skin}" ${stroke}/>${path(faceShape, skin)}<path d="M59 89Q64 84 66 94M135 94Q136 85 141 89" stroke="#b28b6d" stroke-width="1.3" stroke-linecap="round"/>${faceFeatures(expression?.id ?? "calm", female, skinItem?.id === "deep")}${hairArt.front}${headwear(head?.id ?? "")}</g>`;
  const figure = document.createElement("div");
  figure.className = "avatar-figure";
  const portrait = options.portrait ? "43 25 114 114" : "0 0 200 300";
  const character = drawing(
    `<ellipse class="avatar-ground" cx="100" cy="284" rx="42" ry="5" fill="#6f7d6415"/><g class="avatar-breath">${clothes.legs}${shoes(footwear?.id ?? "canvas", color(footwear, "#eee8d8"))}<path d="M90 124V144Q100 152 110 144V124" fill="${skin}" ${stroke}/>${clothes.arms}${clothes.torso}${headArt}</g>`,
    "avatar-character",
    portrait,
  );
  figure.append(character);
  wrapper.append(figure);
  if (!options.plain && !options.portrait) {
    if (companion)
      wrapper.append(drawing(aura(companion.id), "avatar-accessory-scene"));
    if (frame)
      wrapper.append(drawing(frameArtwork(frame.id), "avatar-frame-scene"));
  }
  if (options.interactive) {
    wrapper.tabIndex = 0;
    wrapper.classList.add("avatar-interactive");
    let timeout = 0;
    const wave = (): void => {
      clearTimeout(timeout);
      wrapper.classList.remove("avatar-waving");
      // Restart the greeting when the learner taps again, without shifting joints.
      requestAnimationFrame(() => wrapper.classList.add("avatar-waving"));
      timeout = window.setTimeout(
        () => wrapper.classList.remove("avatar-waving"),
        1750,
      );
    };
    wrapper.onclick = wave;
    wrapper.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        wave();
      }
    };
  }
  return wrapper;
}

export function createItemArt(item: Item, profile: Profile): HTMLElement {
  const preview = createAvatar(
    { ...profile, equipped: { [item.slot]: item.id } },
    { mini: true },
  );
  preview.dataset.itemSlot = item.slot;
  const camera: Partial<Record<Slot, string>> = {
    head: "21 0 158 151",
    expression: "48 41 104 104",
    skin: "48 41 104 104",
    shoes: "59 246 82 54",
    outfit: "43 112 114 184",
  };
  if (camera[item.slot])
    preview
      .querySelector(".avatar-character")
      ?.setAttribute("viewBox", camera[item.slot]!);
  if (item.slot === "background")
    preview.querySelector(".avatar-figure")?.remove();
  if (item.slot === "frame") {
    preview.querySelector(".avatar-figure")?.remove();
    preview.append(
      drawing(
        '<path d="M86 145H114M100 131V159M90 134L110 156M110 134L90 156" stroke="#a5ac98" stroke-width="1.5" stroke-linecap="round"/>',
        "avatar-frame-sample",
      ),
    );
  }
  return preview;
}
