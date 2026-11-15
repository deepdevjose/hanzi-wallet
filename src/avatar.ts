import "./avatar.css";
import type { Profile, Item, Slot } from "./core/profile";
import { ITEMS, DEFAULT_SHIRT_COLOR, changeAppearance } from "./core/profile";
import { getLocale } from "./i18n";
import { defaultAppearance, type Appearance } from "./core/appearance";

const NS = "http://www.w3.org/2000/svg";
const INK = "#39413d";
const PAPER = "#f4f0e6";
const ROBE_OUTFITS = new Set([
  "scholar",
  "hanfu",
  "silk-dress",
  "imperial",
  "immortal",
  "lotus-ruqun",
  "crane-hanfu",
  "night-brocade",
]);
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
  if (id === "moon-gate")
    return `<g opacity=".75"><circle cx="100" cy="147" r="76" fill="#e0e4d5" stroke="#9b9e89" stroke-width="5"/><circle cx="100" cy="147" r="70" fill="#eff0e4" stroke="#c1b89e" stroke-width="1.2"/><path d="M31 181L64 129L91 162L128 112L173 184V216H31Z" fill="#bac9ba"/><path d="M30 214Q100 197 171 216M12 269H188M0 286H200" stroke="#b6b59f" stroke-width="2"/><path d="M20 254L22 70M178 259L175 93M17 140H26M173 158H181" stroke="#93a287" stroke-width="2.5"/><path d="M22 110q-19-26-18-9q7 12 18 9M23 172q26-28 24-11q-10 15-24 11M176 139q-26-23-24-6q11 12 24 6" fill="#a9b59a"/></g>${cloud(143, 57, 0.55)}`;
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
  if (id === "cloud-cap")
    return `<g class="avatar-headwear">${path("M61 60Q60 26 83 24Q100 17 117 24Q140 26 139 60Q100 70 61 60Z", "#687b75")}<path d="M64 57Q100 66 136 57M100 23V55" stroke="#9caf9d" stroke-width="1.5"/><path d="M68 51Q100 58 132 51" stroke="#536962" stroke-width="5"/><ellipse cx="100" cy="53" rx="5" ry="4" fill="#b7b893" stroke="#556f64" stroke-width="1"/></g>`;
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

interface BodyRig {
  readonly shoulder: number;
  readonly waist: number;
  readonly hip: number;
  readonly leg: number;
  readonly neck: number;
  readonly torsoScale: number;
  readonly legScale: number;
  readonly headShift: number;
  readonly upperEnd: number;
}
function bodyRig(appearance: Appearance): BodyRig {
  const shape = {
    balanced: { shoulder: 22, waist: 25, hip: 28, leg: 22, neck: 10 },
    slender: { shoulder: 18, waist: 17, hip: 22, leg: 17, neck: 8 },
    soft: { shoulder: 20, waist: 20, hip: 33, leg: 26, neck: 9 },
    broad: { shoulder: 31, waist: 29, hip: 33, leg: 27, neck: 12 },
  }[appearance.body];
  const proportions = {
    short: { torsoScale: 0.86, legScale: 0.82 },
    average: { torsoScale: 1, legScale: 1 },
    tall: { torsoScale: 1.06, legScale: 1.1 },
  }[appearance.height];
  // Feet stay grounded. Height changes the torso/leg proportions independently,
  // while the head and every attachment retain their own undistorted geometry.
  const headShift =
    286 - (134 + 74 * proportions.torsoScale + 78 * proportions.legScale);
  return {
    ...shape,
    ...proportions,
    headShift,
    upperEnd: 134 + headShift + 74 * proportions.torsoScale,
  };
}
function faceGeometry(face: Appearance["face"]): {
  shape: string;
  half: number;
} {
  return {
    soft: {
      half: 39,
      shape:
        "M61 77Q61 55 81 47Q100 40 119 47Q139 55 139 77L137 100Q135 120 117 128Q100 136 83 128Q65 120 63 100Z",
    },
    round: {
      half: 43,
      shape:
        "M57 78Q58 53 80 47Q100 41 120 47Q142 53 143 78L142 101Q140 128 117 136Q100 142 83 136Q60 128 58 101Z",
    },
    oval: {
      half: 34,
      shape:
        "M66 76Q66 54 82 47Q100 39 118 47Q134 54 134 76L132 102Q128 124 115 133Q100 143 85 133Q72 124 68 102Z",
    },
    defined: {
      half: 39,
      shape:
        "M61 76Q61 54 81 46Q100 39 120 46Q139 54 139 76L137 99L128 120L114 132Q100 137 86 132L72 120L63 99Z",
    },
  }[face];
}

function hair(
  appearance: Appearance,
  headwearId: string,
): { back: string; front: string } {
  const tone = appearance.hairColor;
  const highlight =
    'stroke="#ffffff" stroke-opacity=".18" stroke-width="2" stroke-linecap="round"';
  const swept = `${path("M58 77Q51 46 75 35Q99 23 125 36Q148 47 142 78L133 82L132 61Q108 64 96 46Q82 64 65 63L66 83Z", tone)}<path d="M72 43Q80 37 90 37M111 38Q126 40 132 50" ${highlight}/>`;
  if (appearance.hair === "buns")
    return {
      back: `<path d="M62 70Q51 111 66 139L81 146L83 137Q71 121 76 96L80 76Z" fill="${tone}"/><path d="M138 70Q149 111 134 139L119 146L117 137Q129 121 124 96L120 76Z" fill="${tone}"/><circle cx="53" cy="63" r="16" fill="${tone}" ${stroke}/><circle cx="147" cy="63" r="16" fill="${tone}" ${stroke}/><path d="M41 60Q51 51 62 58M138 57Q150 50 159 62" ${highlight}/>`,
      front: swept,
    };
  if (appearance.hair === "bob")
    return {
      back: `<path d="M63 65Q49 91 57 127L77 139L82 130Q70 113 77 84Z" fill="${tone}" ${stroke}/><path d="M137 65Q151 91 143 127L123 139L118 130Q130 113 123 84Z" fill="${tone}" ${stroke}/><path d="M60 104L65 127M140 104L135 127" ${highlight}/>`,
      front: `${path("M58 79Q51 47 74 37Q101 22 127 38Q147 49 142 79L134 84L132 65L117 64L110 53L107 66H91L87 55L82 65L66 65L66 84Z", tone)}<path d="M69 47Q91 30 117 40" ${highlight}/>`,
    };
  if (appearance.hair === "flowing")
    return {
      back: `<path d="M63 65Q45 91 48 137Q50 166 69 188L84 178Q69 138 76 86Z" fill="${tone}" ${stroke}/><path d="M137 65Q155 91 152 137Q150 166 131 188L116 178Q131 138 124 86Z" fill="${tone}" ${stroke}/><path d="M57 100Q53 144 70 174M143 100Q147 144 130 174" ${highlight}/>`,
      front: `${path("M58 78Q52 45 76 35Q100 23 125 36Q148 47 142 79L134 87L130 63Q111 64 103 43Q94 61 70 66L65 87Z", tone)}<path d="M72 44Q85 36 95 36M115 39Q128 42 135 54" ${highlight}/>`,
    };
  if (appearance.hair === "topknot")
    return {
      back:
        headwearId === "hat" || headwearId === "cloud-cap"
          ? ""
          : `<ellipse cx="100" cy="28" rx="15" ry="13" fill="${tone}" ${stroke}/><path d="M91 22Q100 17 109 23" ${highlight}/><path d="M87 37H113" stroke="#9b8b66" stroke-width="3" stroke-linecap="round"/>`,
      front: `${path("M59 79Q52 45 76 38Q100 30 125 39Q147 48 141 80L134 82L131 60Q111 63 100 50Q89 63 69 61L66 82Z", tone)}<path d="M69 49Q84 38 94 40M106 40Q122 40 133 51" ${highlight}/>`,
    };
  if (appearance.hair === "crop")
    return {
      back: "",
      front: `${path("M59 81Q53 56 64 45Q77 31 100 32Q125 32 138 47Q147 60 141 82L134 80L131 62Q114 55 101 59Q83 55 68 62L66 81Z", tone)}<path d="M69 47Q80 39 94 40M104 40Q121 39 131 49" ${highlight}/>`,
    };
  return {
    back: "",
    front: `${path("M57 80Q48 62 59 49Q60 35 76 35Q83 20 97 31Q107 18 119 34Q140 30 143 50Q154 66 142 83L133 80L132 64Q115 66 110 51Q105 62 95 65L88 51Q82 62 67 66L66 82Z", tone)}<path d="M66 47Q73 40 81 42M111 38Q124 37 132 47" ${highlight}/>`,
  };
}

let featureId = 0;
function faceFeatures(appearance: Appearance, expression: string): string {
  const id = ++featureId;
  const offset =
    appearance.face === "oval" ? 18 : appearance.face === "round" ? 21 : 19;
  const left = 100 - offset,
    right = 100 + offset;
  const tone = appearance.hairColor;
  const darkSkin =
    appearance.skinTone === "#89583f" || appearance.skinTone === "#b57b55";
  const blush = darkSkin ? "#d18f83" : "#cf8b80";
  const brows: Record<Appearance["brows"], string> = {
    soft: `<path d="M${left - 8} 76Q${left} 72 ${left + 8} 76M${right - 8} 76Q${right} 72 ${right + 8} 76" fill="none" stroke="${tone}" stroke-width="2.3" stroke-linecap="round"/>`,
    straight: `<path d="M${left - 8} 75L${left + 8} 75M${right - 8} 75L${right + 8} 75" fill="none" stroke="${tone}" stroke-width="3.3" stroke-linecap="round"/>`,
    arched: `<path d="M${left - 9} 77Q${left - 1} 67 ${left + 8} 73M${right - 8} 73Q${right + 1} 67 ${right + 9} 77" fill="none" stroke="${tone}" stroke-width="2.5" stroke-linecap="round"/>`,
    bold: `<path d="M${left - 10} 76L${left - 2} 69L${left + 9} 72L${left + 9} 77L${left - 1} 74L${left - 9} 80ZM${right + 10} 76L${right + 2} 69L${right - 9} 72L${right - 9} 77L${right + 1} 74L${right + 9} 80Z" fill="${tone}"/>`,
  };
  const eye = (cx: number, n: number): string => {
    const round = appearance.eyes === "round";
    const monolid = appearance.eyes === "monolid";
    const shape = round
      ? `M${cx - 8} 87a8 9 0 1 0 16 0a8 9 0 1 0-16 0`
      : monolid
        ? `M${cx - 10} 86Q${cx} 83 ${cx + 10} 86Q${cx + 3} 94 ${cx - 10} 89Z`
        : `M${cx - 10} 87Q${cx - 1} 77 ${cx + 10} 85Q${cx + 1} 94 ${cx - 10} 87Z`;
    return `<g data-eye-shape="${appearance.eyes}"><defs><clipPath id="avatar-eye-${id}-${n}"><path d="${shape}"/></clipPath></defs><path d="${shape}" fill="#fbf4e5" stroke="${INK}" stroke-width="1.3"/><g clip-path="url(#avatar-eye-${id}-${n})"><ellipse cx="${cx}" cy="${round ? 88 : 87}" rx="${round ? 5.8 : 4.8}" ry="${round ? 7.2 : 5.5}" fill="${appearance.eyeColor}"/><ellipse cx="${cx}" cy="${round ? 88 : 87}" rx="2.2" ry="3.4" fill="#252b29"/><circle cx="${cx + 1.3}" cy="${round ? 85 : 84.5}" r="1.4" fill="#fffdf3"/></g>${monolid ? `<path d="M${cx - 10} 85Q${cx} 82 ${cx + 10} 85" stroke="${INK}" stroke-width="1.9" stroke-linecap="round"/>` : ""}</g>`;
  };
  const eyes =
    appearance.eyes === "smiling"
      ? `<g data-eye-shape="smiling"><path d="M${left - 8} 89Q${left} 77 ${left + 8} 89M${right - 8} 89Q${right} 77 ${right + 8} 89" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g>`
      : `<g class="avatar-eye-open">${eye(left, 0)}${eye(right, 1)}</g><g class="avatar-eye-closed" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"><path d="M${left - 7} 88Q${left} 92 ${left + 7} 88M${right - 7} 88Q${right} 92 ${right + 7} 88"/></g>`;
  const halfMouth = { gentle: 9, wide: 15, small: 4.8 }[appearance.mouth];
  const mouth =
    expression === "curious"
      ? `<ellipse cx="101" cy="112" rx="${halfMouth * 0.36}" ry="${appearance.mouth === "small" ? 3.4 : 5.4}" fill="#ad6d61"/>`
      : expression === "smile"
        ? `<path d="M${100 - halfMouth} 108Q100 113 ${100 + halfMouth} 108Q${100 + halfMouth * 0.7} 122 100 121Q${100 - halfMouth * 0.7} 122 ${100 - halfMouth} 108Z" fill="#aa625b"/><path d="M${100 - halfMouth * 0.66} 111Q100 114 ${100 + halfMouth * 0.66} 111" stroke="#fff5df" stroke-width="2" stroke-linecap="round"/>`
        : appearance.mouth === "small"
          ? '<path d="M95 111Q100 113 105 111" stroke="#a26761" stroke-width="2.5" stroke-linecap="round"/>'
          : `<path d="M${100 - halfMouth} 109Q100 ${appearance.mouth === "wide" ? 124 : 118} ${100 + halfMouth} 109" stroke="#9b5d53" stroke-width="2.3" stroke-linecap="round"/>${appearance.mouth === "wide" ? '<path d="M83 109L84 106M116 106L117 109" stroke="#bd8872" stroke-width="1.2" stroke-linecap="round"/>' : ""}`;
  const noseInk = darkSkin ? "#684637" : "#b48465";
  const noses: Record<Appearance["nose"], string> = {
    button: `<path d="M97 98Q94 103 100 104Q106 103 103 98" fill="${noseInk}" fill-opacity=".25" stroke="${noseInk}" stroke-width="1.3" stroke-linecap="round"/>`,
    soft: `<path d="M100 93Q97 98 98 101Q100 104 104 101" stroke="${noseInk}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
    defined: `<path d="M100 91L96 103L104 103M104 103L105 101" stroke="${noseInk}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  };
  const cheekMarks =
    appearance.cheeks === "freckles"
      ? `<g fill="${darkSkin ? "#d4a084" : "#ad765c"}" opacity=".72">${[
          [71, 101],
          [77, 99],
          [81, 104],
          [73, 107],
          [119, 104],
          [123, 99],
          [129, 101],
          [127, 107],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.05"/>`)
          .join("")}</g>`
      : `<ellipse cx="72" cy="102" rx="${appearance.cheeks === "rosy" ? 11 : 8}" ry="${appearance.cheeks === "rosy" ? 6 : 4}" fill="${blush}" opacity="${appearance.cheeks === "rosy" ? 0.61 : 0.23}"/><ellipse cx="128" cy="102" rx="${appearance.cheeks === "rosy" ? 11 : 8}" ry="${appearance.cheeks === "rosy" ? 6 : 4}" fill="${blush}" opacity="${appearance.cheeks === "rosy" ? 0.61 : 0.23}"/>`;
  return `<g class="avatar-face" data-face-shape="${appearance.face}">${cheekMarks}<g data-brow-shape="${appearance.brows}"${expression === "curious" ? ' transform="rotate(-4 100 75)"' : ""}>${brows[appearance.brows]}</g>${eyes}<g data-nose-shape="${appearance.nose}">${noses[appearance.nose]}</g><g data-mouth-shape="${appearance.mouth}">${mouth}</g></g>`;
}

function shoes(id: string, tone: string, rig: BodyRig): string {
  const ankle = 100 - rig.leg;
  const shoeShape = `M${ankle + 1} 268L95 270L97 282Q87 289 ${ankle - 7} 285Q${ankle - 11} 281 ${ankle - 8} 277Z`;
  const shoe = (mirror: boolean): string =>
    `<g${mirror ? ' transform="translate(200 0) scale(-1 1)"' : ""}>${path(shoeShape, tone)}<path d="M70 282Q82 287 96 281" stroke="${id === "canvas" ? "#aaa996" : "#d6cfb5"}" stroke-width="2" stroke-linecap="round"/>${id === "canvas" ? '<path d="M79 274L88 277M80 278L89 280" stroke="#b4b3a1" stroke-width="1.3" stroke-linecap="round"/>' : id === "cloud-shoes" ? '<path d="M76 278Q78 271 84 276T92 276" stroke="#d6d9c7" stroke-width="1.5" stroke-linecap="round"/>' : id === "embroidered" ? `<g transform="translate(83 277) scale(.5)">${blossom(0, 0)}</g>` : '<path d="M77 272Q83 279 93 274" stroke="#b3b79f" stroke-width="1.5"/>'}</g>`;
  return `<g class="avatar-shoes">${shoe(false)}${shoe(true)}</g>`;
}

function outfit(
  profile: Profile,
  item: Item | undefined,
  skin: string,
  rig: BodyRig,
): { torso: string; arms: string; legs: string } {
  const id = item?.id ?? "everyday";
  const robe = ROBE_OUTFITS.has(id);
  const tee = ["everyday", "cloud-tee", "bamboo-tee"].includes(id);
  const short = tee || ["silk-dress", "lotus-ruqun", "tea-vest"].includes(id);
  const tone =
    id === "everyday"
      ? /^#[a-f\d]{6}$/i.test(profile.shirtColor)
        ? profile.shirtColor
        : DEFAULT_SHIRT_COLOR
      : color(item, "#8b9b8d");
  const trim = ["imperial", "immortal", "night-brocade"].includes(id)
    ? "#c6aa72"
    : id === "lotus-ruqun"
      ? "#e1d3bb"
      : robe
        ? "#b7c2ad"
        : "#d9d9c5";
  const { shoulder, waist, hip, leg, neck } = rig;
  // Garment ease avoids a pinched waist/bell hem. Collars and decoration use
  // these same measurements, rather than getting cropped on narrower bodies.
  const hem = hip + 1;
  const side = Math.max(waist + 2, hem - 4);
  const collar = neck + 1;
  const motifX = 100 + side * 0.48;
  const baseLength = id === "immortal" ? 275 : id === "scholar" ? 259 : 267;
  const length = 208 + ((baseLength - 208) * rig.legScale) / rig.torsoScale;
  const shirtBody = `M${100 - shoulder} 141L${100 - collar} 136Q100 147 ${100 + collar} 136L${100 + shoulder} 141Q${102 + shoulder} 163 ${100 + side} 181Q${100 + side} 198 ${100 + hem} 208Q100 213 ${100 - hem} 208Q${100 - side} 198 ${100 - side} 181Q${98 - shoulder} 163 ${100 - shoulder} 141Z`;
  const robeBody = `M${100 - shoulder} 141L${100 - collar} 136L100 143L${100 + collar} 136L${100 + shoulder} 141L${100 + waist} 205L${114 + hip} ${length}Q100 ${length + 8} ${86 - hip} ${length}L${100 - waist} 205Z`;
  const torsoShape = robe ? robeBody : shirtBody;
  const hemSeam = `<path d="M${103 - hem} 203Q100 208 ${97 + hem} 203" stroke="${INK}" stroke-opacity=".18" stroke-width="1.2"/>`;
  const crewNeck = `<path d="M${100 - collar} 139Q100 153 ${100 + collar} 139" stroke="${INK}" stroke-opacity=".24" stroke-width="1.6"/>`;
  let detail = "";
  if (tee) {
    detail = crewNeck + hemSeam;
    if (id === "cloud-tee")
      detail += `<g transform="translate(${motifX} 165) scale(.23)">${cloud(0, 0)}</g>`;
    if (id === "bamboo-tee")
      detail += `<g transform="translate(${motifX} 163)" stroke="#748c74" stroke-width="1.1" stroke-linecap="round"><path d="M-2 14L0-8M3 13L5-3M-2 4H0M-1-2H1M4 6H6"/><path d="M0-1Q-10-10-8-2Q-4 1 0-1M1 7Q11 0 10 5Q6 9 1 7M5-1Q12-6 11-1L5 2" fill="#96a38b" stroke-width=".5"/></g>`;
  } else if (id === "blue-shirt") {
    detail = `<path d="M${100 - collar} 137L100 150L${100 + collar} 137M100 150V207M${98 - collar} 141L${99 - neck} 155L100 150L${101 + neck} 155L${102 + collar} 141" stroke="#d4dbd2" stroke-width="1.6"/>${[167, 183, 199].map((y) => `<circle cx="102" cy="${y}" r="1.2" fill="#dbe1d8"/>`).join("")}${hemSeam}`;
  } else if (id === "linen") {
    detail = `<path d="M${100 - collar} 138L100 150L${100 + collar} 138M100 150V175" stroke="#9e967e" stroke-width="1.5" stroke-linecap="round"/><path d="M${motifX - 3} 159h6v11q-3 3-6 0Z" stroke="#b2a88a" stroke-width="1.1"/>${hemSeam}`;
  } else if (id === "plum-cardigan" || id === "tea-vest") {
    detail = `<path d="M${100 - collar} 136L100 159L${100 + collar} 136L${100 + side * 0.4} 207H${100 - side * 0.4}Z" fill="#eee5d3"/>`;
    detail +=
      id === "tea-vest"
        ? `<path d="M${100 - collar} 138L100 159L${100 + collar} 138M100 159V208" stroke="#d2c5a9" stroke-width="2"/>${[171, 185, 199].map((y) => `<path d="M96 ${y}h8" stroke="#d2c5a9" stroke-width="1.7" stroke-linecap="round"/>`).join("")}`
        : `<path d="M${100 - collar} 137L${100 - side * 0.4} 207M${100 + collar} 137L${100 + side * 0.4} 207" stroke="#d8c0b8" stroke-width="2"/>${blossom(motifX, 178, 0.43)}<path d="M${motifX} 181q-4 7-1 11" stroke="#8a9b87" stroke-width="1"/>`;
    detail += hemSeam;
  } else if (robe) {
    const belt = waist - 1;
    detail = `<path d="M${100 - collar} 138L${100 + waist * 0.43} 168L${100 + collar} 139M${100 - neck * 0.5} 149L${100 - waist * 0.8} 175M${100 + waist * 0.43} 168L101 202" stroke="${trim}" stroke-width="4" stroke-linejoin="round"/><path d="M${100 - belt} 199Q100 203 ${100 + belt} 199L${100 + belt} 208Q100 212 ${100 - belt} 208Z" fill="${trim}"/><path d="M${100 - waist * 0.34} 210L${100 - hip * 0.6} ${length - 4}M${100 + waist * 0.34} 210L${100 + hip * 0.6} ${length - 4}" stroke="${INK}" stroke-opacity=".16" stroke-width="1.3"/><path d="M${100 - hip} ${length - 9}Q${100 - hip / 2} ${length - 17} 100 ${length - 9}T${100 + hip} ${length - 9}" stroke="${trim}" stroke-width="1.7"/>`;
    if (id === "imperial")
      detail += `<g transform="translate(${motifX - 14} 0)"><path d="M93 174Q111 163 117 177Q120 188 109 190Q100 187 108 181Q114 180 109 176M109 188L103 195M116 177L122 173" stroke="#d7bd84" stroke-width="1.7" stroke-linecap="round"/></g>`;
    else if (id === "silk-dress") detail += blossom(motifX, 183, 0.55);
    else if (id === "lotus-ruqun")
      detail += `<path d="M${100 - waist} 209H${100 + waist}L${114 + hip} ${length}Q100 ${length + 8} ${86 - hip} ${length}Z" fill="#c5afb0"/><path d="M100 210V${length}M${100 - waist * 0.55} 212L${100 - hip} ${length - 2}M${100 + waist * 0.55} 212L${100 + hip} ${length - 2}" stroke="#a78c91" stroke-width="1.2"/>${blossom(motifX, 182, 0.48)}<path d="M${100 + belt - 2} 205q10 8 2 22" stroke="${trim}" stroke-width="2"/>`;
    else if (id === "crane-hanfu")
      detail += `<g transform="translate(${motifX - 1} 178)" stroke="#f1e9d7" stroke-linecap="round"><path d="M0 6q-12-16-19-7q10 0 17 10q8 2 13-6" stroke-width="2.8"/><path d="M0 7q6-3 5-10q0-5 5-4" stroke-width="1.7"/><path d="M-1 10l-3 9m5-9l2 9" stroke="#c8ac7b" stroke-width="1"/><circle cx="9" cy="-7" r="1.5" fill="#b98278" stroke="none"/></g>`;
    else if (id === "night-brocade")
      detail += `<g transform="translate(${motifX} 179) scale(.21)">${cloud(0, 0)}</g><g stroke="${trim}" stroke-width="1" opacity=".65">${[225, 243].map((y) => `<path d="M${100 - hip * 0.7} ${y}q8-8 16 0t16 0"/>`).join("")}</g>`;
    else if (id === "immortal")
      detail += `<path d="M${100 - hip * 0.65} 224Q100 214 ${100 + hip * 0.65} 224M${100 - hip * 0.8} 239Q100 228 ${100 + hip * 0.8} 239" stroke="#f0ead5" stroke-width="2"/>`;
    else
      detail += `<path d="M${motifX} 177q-5 5 0 9q5-4 0-9" stroke="#c9c6aa" stroke-width="1.5"/>`;
  } else {
    const edging = id === "red" ? "#dac092" : "#bec8b8";
    detail = `<path d="M${100 - collar} 137V148H${100 + collar}V137M100 148V208" stroke="${edging}" stroke-width="1.7"/><g stroke="${edging}" stroke-width="1.8" stroke-linecap="round">${[160, 176, 192].map((y) => `<path d="M95 ${y}h10"/>`).join("")}</g>${hemSeam}${id === "red" ? blossom(motifX, 187, 0.5) : ""}`;
  }
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
  const armScale = Math.max(0.78, Math.min(1.12, (waist + neck) / 35));
  const sleeveTone = id === "tea-vest" ? "#eee5d3" : tone;
  const arm = `${path(bareHand, skin)}${path(sleeve, sleeveTone)}<path d="${robe && !short ? "M51 196L76 199" : short ? "M59 160L74 165" : "M55 179L65 185"}" stroke="${tee ? INK : trim}" stroke-opacity="${tee ? ".22" : ".75"}" stroke-width="1.5" stroke-linecap="round"/><path d="${robe && !short ? "M54 210L58 212" : "M59 194L64 195"}" stroke="${INK}" stroke-opacity=".28" stroke-width="1.1" stroke-linecap="round"/>`;
  const leftAnchor = 100 - shoulder;
  const pivot = leftAnchor - 5 * armScale;
  const garmentClip = `avatar-garment-${++featureId}`;
  return {
    torso: `<g class="avatar-garment" data-garment="${id}" data-body-shape="${profile.appearance?.body ?? "balanced"}"><defs><clipPath id="${garmentClip}"><path d="${torsoShape}"/></clipPath></defs>${path(torsoShape, tone)}<g clip-path="url(#${garmentClip})">${detail}</g></g>`,
    arms: `<g class="avatar-arm avatar-arm-left" style="transform-origin:${pivot}px 148px"><g transform="translate(${leftAnchor} 0) scale(${armScale} 1) translate(-78 0)">${arm}</g></g><g class="avatar-arm avatar-arm-right" style="transform-origin:${200 - pivot}px 148px"><g transform="translate(200 0) scale(-1 1)"><g transform="translate(${leftAnchor} 0) scale(${armScale} 1) translate(-78 0)">${arm}</g></g></g>`,
    legs: `<g class="avatar-trousers">${path(`M${100 - hip} 200H${100 + hip}Q${103 + hip} 218 ${100 + leg} 239L${100 + leg} 272Q${102 + leg / 2} 278 104 272L102 234H98L96 272Q${98 - leg / 2} 278 ${100 - leg} 272L${100 - leg} 239Q${97 - hip} 218 ${100 - hip} 200Z`, "#59625d")}<path d="M100 218V233M${99 - leg * 0.75} 235L${99 - leg * 0.65} 266M${101 + leg * 0.75} 235L${101 + leg * 0.65} 266" stroke="#839083" stroke-width="1.5" stroke-linecap="round"/></g>`,
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
  if (id === "lattice") {
    const corner =
      '<path d="M13 49V14H48M19 40V20H40M13 36H29V14M19 28H36V20"/>';
    return `<g fill="none" stroke="#a88c68" stroke-width="1.4" stroke-linejoin="round">${corner}<g transform="translate(200 0) scale(-1 1)">${corner}</g><g transform="translate(0 300) scale(1 -1)">${corner}</g><g transform="translate(200 300) scale(-1 -1)">${corner}</g><path d="M58 14H142M58 286H142M13 59V241M187 59V241" stroke-opacity=".5" stroke-width=".8"/></g>`;
  }
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
    focus?: "face" | "body";
  } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className =
    "avatar-scene" +
    (options.mini ? " avatar-mini" : "") +
    (options.portrait ? " avatar-portrait" : "");
  wrapper.dataset.base = profile.base;
  wrapper.dataset.style = "ink-cartoon";
  wrapper.dataset.avatarFocus = options.focus ?? "body";
  if (options.focus === "face") wrapper.classList.add("avatar-focus-face");
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
    expression = selected(profile, "expression");
  const appearance = profile.appearance ?? defaultAppearance(profile.base);
  const skin = appearance.skinTone;
  const rig = bodyRig(appearance);
  wrapper.dataset.body = appearance.body;
  wrapper.dataset.height = appearance.height;
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
        "moon-gate": "#ebe7da",
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
  const hairArt = hair(appearance, head?.id ?? "");
  const clothes = outfit(profile, outfitItem, skin, rig);
  const face = faceGeometry(appearance.face);
  const earLeft = 99 - face.half,
    earRight = 101 + face.half;
  const hairBehind = hairArt.back
    ? `<g class="avatar-head-height" transform="translate(0 ${rig.headShift})"><g class="avatar-head avatar-hair-behind" data-hair-style="${appearance.hair}">${hairArt.back}</g></g>`
    : "";
  const headArt = `<g class="avatar-head-height" transform="translate(0 ${rig.headShift})"><g class="avatar-head" data-hair-style="${appearance.hair}"><ellipse cx="${earLeft}" cy="91" rx="7" ry="10" fill="${skin}" ${stroke}/><ellipse cx="${earRight}" cy="91" rx="7" ry="10" fill="${skin}" ${stroke}/>${path(face.shape, skin)}<path d="M${earLeft - 3} 89Q${earLeft + 2} 85 ${earLeft + 4} 94M${earRight - 3} 94Q${earRight - 2} 85 ${earRight + 3} 89" stroke="#b28b6d" stroke-width="1.3" stroke-linecap="round"/>${faceFeatures(appearance, expression?.id ?? "calm")}${hairArt.front}${headwear(head?.id ?? "")}</g></g>`;
  const figure = document.createElement("div");
  figure.className = "avatar-figure";
  const camera = options.portrait
    ? `36 ${9 + rig.headShift} 128 128`
    : options.focus === "face"
      ? `31 ${rig.headShift - 2} 138 151`
      : "0 -10 200 310";
  const upper = `translate(0 ${134 + rig.headShift}) scale(1 ${rig.torsoScale}) translate(0 -134)`;
  const lower = `translate(0 ${rig.upperEnd}) scale(1 ${rig.legScale}) translate(0 -208)`;
  const character = drawing(
    `<ellipse class="avatar-ground" cx="100" cy="284" rx="${rig.hip + 14}" ry="5" fill="#6f7d6415"/><g class="avatar-breath">${hairBehind}<g class="avatar-lower-body" transform="${lower}">${clothes.legs}${shoes(footwear?.id ?? "canvas", color(footwear, "#eee8d8"), rig)}</g><g class="avatar-upper-body" transform="${upper}"><path d="M${100 - rig.neck} 124V144Q100 152 ${100 + rig.neck} 144V124" fill="${skin}" ${stroke}/>${clothes.arms}${clothes.torso}</g>${headArt}</g>`,
    "avatar-character",
    camera,
  );
  figure.append(character);
  wrapper.append(figure);
  if (!options.plain && !options.portrait) {
    if (companion && options.focus !== "face")
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
  const appearance = profile.appearance ?? defaultAppearance(profile.base);
  const rig = bodyRig(appearance);
  const preview = createAvatar(
    {
      ...profile,
      appearance:
        item.slot === "skin"
          ? changeAppearance(profile, "skinTone", item.tone).appearance
          : appearance,
      equipped: { [item.slot]: item.id },
    },
    { mini: true },
  );
  preview.dataset.itemSlot = item.slot;
  const camera: Partial<Record<Slot, string>> = {
    head: `21 ${rig.headShift} 158 151`,
    expression: `40 ${25 + rig.headShift} 120 120`,
    skin: `40 ${25 + rig.headShift} 120 120`,
    shoes: "53 246 94 54",
    outfit: ROBE_OUTFITS.has(item.id)
      ? `30 ${119 + rig.headShift} 140 ${178 - rig.headShift}`
      : `28 ${134 + rig.headShift - 5 * rig.torsoScale} 144 ${90 * rig.torsoScale}`,
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
