import "./profile.css";
import { LEARNING_KEY, XP_PER_LEVEL, readLearning } from "./core/learning";

const STORAGE_KEY = "hanzi-wallet-avatar-v1";
const COINS_PER_XP = 1;
type Slot = "head" | "outfit" | "aura" | "frame";
type Item = { readonly id: string; readonly title: string; readonly slot: Slot; readonly price: number; readonly level: number; readonly emoji: string };
export const ITEMS: readonly Item[] = [
  { id: "hat", title: "Sombrero de bambú", slot: "head", price: 0, level: 1, emoji: "🎋" },
  { id: "red", title: "Traje festivo", slot: "outfit", price: 100, level: 3, emoji: "🧧" },
  { id: "scholar", title: "Túnica del erudito", slot: "outfit", price: 300, level: 10, emoji: "📜" },
  { id: "jade", title: "Marco de jade", slot: "frame", price: 550, level: 25, emoji: "🟢" },
  { id: "lantern", title: "Aura de faroles", slot: "aura", price: 800, level: 50, emoji: "🏮" },
  { id: "dragon", title: "Dragón celestial", slot: "aura", price: 2500, level: 400, emoji: "🐉" },
];
interface Profile {
  readonly name: string;
  readonly base: "traveller" | "scholar";
  readonly coins: number;
  readonly accountedXP: number;
  readonly owned: readonly string[];
  readonly equipped: Readonly<Partial<Record<Slot, string>>>;
  readonly completed: boolean;
}
const initial = (xp: number): Profile => ({ name: "", base: "traveller", coins: 0, accountedXP: xp, owned: ["hat"], equipped: { head: "hat" }, completed: false });
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function read(xp: number): Profile {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!isObject(parsed)) return initial(xp);
    const owned = Array.isArray(parsed.owned) ? parsed.owned.filter((v): v is string => typeof v === "string" && ITEMS.some((item) => item.id === v)) : [];
    const equipped: Partial<Record<Slot, string>> = {};
    if (isObject(parsed.equipped)) for (const slot of ["head", "outfit", "frame", "aura"] as const) {
      const id = parsed.equipped[slot];
      if (typeof id === "string" && owned.includes(id) && ITEMS.some((item) => item.id === id && item.slot === slot)) equipped[slot] = id;
    }
    return {
      name: typeof parsed.name === "string" ? parsed.name.slice(0, 40) : "",
      base: parsed.base === "scholar" ? "scholar" : "traveller",
      coins: typeof parsed.coins === "number" && Number.isSafeInteger(parsed.coins) && parsed.coins >= 0 ? parsed.coins : 0,
      accountedXP: typeof parsed.accountedXP === "number" && Number.isSafeInteger(parsed.accountedXP) && parsed.accountedXP >= 0 ? parsed.accountedXP : xp,
      owned: [...new Set(["hat", ...owned])],
      equipped,
      completed: parsed.completed === true,
    };
  } catch { return initial(xp); }
}
function save(profile: Profile): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch { /* Storage may be blocked. */ }
}
function getXP(): number {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(LEARNING_KEY) ?? "null");
    return readLearning(raw, new Set<string>()).xp;
  } catch { return 0; }
}
function sync(profile: Profile, xp: number): Profile {
  // Never mint twice for already-accounted XP. An XP reset does not mint on recovery.
  const delta = Math.max(0, xp - profile.accountedXP);
  return { ...profile, coins: Math.min(Number.MAX_SAFE_INTEGER, profile.coins + delta * COINS_PER_XP), accountedXP: Math.max(profile.accountedXP, xp) };
}
function node<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = ""): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}
export function mountProfile(): void {
  let xp = getXP();
  let profile = sync(read(xp), xp);
  save(profile);
  const trigger = node("button", "profile-trigger", "🪙 Perfil · 0");
  trigger.type = "button";
  trigger.setAttribute("aria-label", "Abrir personaje y tienda");
  document.querySelector(".top-actions")?.append(trigger);
  const backdrop = node("div", "profile-backdrop");
  backdrop.hidden = true;
  const panel = node("section", "profile-panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Tu personaje y recompensas");
  backdrop.append(panel);
  document.body.append(backdrop);
  const level = (): number => Math.floor(xp / XP_PER_LEVEL) + 1;
  const persist = (): void => { save(profile); trigger.textContent = "🪙 " + profile.coins + " · Perfil"; };
  const close = (): void => { backdrop.hidden = true; };
  const render = (): void => {
    persist();
    panel.replaceChildren();
    const heading = node("div", "profile-heading");
    heading.append(node("h2", "", "Tu aventura china"));
    const dismiss = node("button", "profile-close", "Cerrar ✕");
    dismiss.type = "button"; dismiss.onclick = close;
    heading.append(dismiss); panel.append(heading);
    panel.append(node("p", "profile-muted", "Personaliza tu personaje. Gana monedas al responder correctamente y avanzar en las lecciones."));
    const identity = node("div", "profile-identity");
    const avatar = node("div", "profile-avatar" + (profile.equipped.frame === "jade" ? " jade" : ""));
    const face = node("span", "profile-face", profile.base === "scholar" ? "👩🏻‍🎓" : "🧑🏻");
    avatar.append(face);
    if (profile.equipped.head) avatar.append(node("span", "profile-hat", "🎋"));
    if (profile.equipped.outfit) avatar.append(node("span", "profile-outfit", profile.equipped.outfit === "red" ? "🧧" : "📜"));
    if (profile.equipped.aura) avatar.append(node("span", "profile-aura", profile.equipped.aura === "dragon" ? "🐉" : "🏮"));
    identity.append(avatar);
    const details = node("div", "profile-details");
    const nameLabel = node("label", "", "Tu nombre");
    const nameInput = node("input", "profile-input");
    nameInput.maxLength = 40; nameInput.placeholder = "¿Cómo te llamas?"; nameInput.value = profile.name;
    nameInput.onchange = () => { profile = { ...profile, name: nameInput.value.trim().slice(0,40) }; persist(); };
    nameLabel.append(nameInput); details.append(nameLabel);
    const baseLabel = node("label", "", "Personaje base");
    const baseSelect = node("select", "profile-input");
    for (const [id, title] of [["traveller", "Viajero"], ["scholar", "Estudiante"]] as const) {
      const opt = node("option", "", title); opt.value = id; baseSelect.append(opt);
    }
    baseSelect.value = profile.base;
    baseSelect.onchange = () => { profile = { ...profile, base: baseSelect.value === "scholar" ? "scholar" : "traveller" }; render(); };
    baseLabel.append(baseSelect); details.append(baseLabel);
    details.append(node("p", "profile-balance", "Nivel " + level() + " · " + profile.coins + " monedas"));
    identity.append(details); panel.append(identity);
    panel.append(node("h3", "", "Tienda de recompensas"));
    const products = node("div", "profile-products");
    for (const item of ITEMS) {
      const card = node("div", "profile-product");
      card.append(node("span", "profile-item-art", item.emoji));
      const description = node("div");
      description.append(node("strong", "", item.title));
      description.append(node("small", "", "Nivel " + item.level + " · " + item.price + " monedas"));
      card.append(description);
      const owned = profile.owned.includes(item.id);
      const equipped = profile.equipped[item.slot] === item.id;
      const button = node("button", "profile-buy", equipped ? "Equipado" : owned ? "Equipar" : level() < item.level ? "Bloqueado" : "Comprar");
      button.type = "button";
      button.disabled = equipped || (!owned && (level() < item.level || profile.coins < item.price));
      if (!owned && level() >= item.level && profile.coins < item.price) button.title = "Monedas insuficientes";
      button.onclick = () => {
        if (owned) profile = { ...profile, equipped: { ...profile.equipped, [item.slot]: item.id } };
        else if (level() >= item.level && profile.coins >= item.price) profile = { ...profile, coins: profile.coins - item.price, owned: [...profile.owned, item.id], equipped: { ...profile.equipped, [item.slot]: item.id } };
        render();
      };
      card.append(button); products.append(card);
    }
    panel.append(products);
    panel.append(node("p", "profile-muted", "Monedas virtuales sin compras reales. El progreso está guardado únicamente en este navegador."));
    const done = node("button", "profile-finish", profile.completed ? "Guardar personaje" : "Empezar mi aventura");
    done.type = "button";
    done.onclick = () => { profile = { ...profile, name: nameInput.value.trim().slice(0,40), completed: true }; persist(); close(); };
    panel.append(done);
  };
  const open = (): void => { xp = getXP(); profile = sync(profile, xp); render(); backdrop.hidden = false; };
  trigger.onclick = open;
  backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !backdrop.hidden) close(); });
  window.addEventListener("storage", (event) => { if (event.key === LEARNING_KEY || event.key === STORAGE_KEY) { xp = getXP(); profile = sync(read(xp), xp); persist(); if (!backdrop.hidden) render(); } });
  window.addEventListener("focus", () => { xp = getXP(); profile = sync(profile, xp); persist(); });
  window.addEventListener("hanzi-wallet:progress", () => { xp = getXP(); profile = sync(profile, xp); persist(); if (!backdrop.hidden) render(); });
  persist();
  if (!profile.completed) window.setTimeout(open, 500);
}
