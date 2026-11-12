import "./catalog.css";
import common from "./common-3500.json";
import hskAll from "./hsk-all.json";
import type { VocabularyEntry } from "./core/types";

const PAGE_SIZE = 100;
const chars: readonly string[] = common;
export function mountCatalog(vocabulary: readonly VocabularyEntry[], choose: (char: string) => void): void {
  const supported = new Map(vocabulary.map((entry) => [entry.char, entry]));
  const hsk = new Map<string, string>(Object.entries(hskAll));
  const button = document.createElement("button");
  button.type = "button"; button.className = "profile-trigger"; button.textContent = "字 3,500 hanzi";
  document.querySelector(".top-actions")?.prepend(button);
  const layer = document.createElement("div");
  layer.className = "catalog-overlay"; layer.hidden = true;
  const dialog = document.createElement("section");
  dialog.className = "catalog-dialog"; dialog.setAttribute("role","dialog"); dialog.setAttribute("aria-modal","true"); dialog.setAttribute("aria-label","Catálogo de 3500 caracteres");
  const heading = document.createElement("div"); heading.className = "catalog-heading";
  const title = document.createElement("h2"); title.textContent = "3,500 caracteres comunes";
  const close = document.createElement("button"); close.textContent = "Cerrar ✕"; close.type = "button";
  close.onclick = () => { layer.hidden = true; };
  heading.append(title,close); dialog.append(heading);
  const note = document.createElement("p"); note.textContent = "Lista oficial china de 2013 (nivel 1). La clasificación HSK es independiente. Los caracteres con tinta admiten el estudio manuscrito actual; el resto está disponible para consultar y explorar, mientras se amplía el modelo.";
  dialog.append(note);
  const tools = document.createElement("div"); tools.className = "catalog-tools";
  const search = document.createElement("input"); search.type="search"; search.placeholder="Buscar carácter, pinyin o significado"; search.setAttribute("aria-label","Buscar en catálogo");
  const select = document.createElement("select"); select.setAttribute("aria-label","Filtrar nivel HSK");
  for (const [id,label] of [["all","Todos los niveles"],["HSK1","HSK 1"],["HSK2","HSK 2"],["HSK3","HSK 3"],["HSK4","HSK 4"],["HSK5","HSK 5"],["HSK6","HSK 6"],["HSK7-9","HSK 7–9"],["none","Sin clasificación HSK"]] as const) {
    const option = document.createElement("option"); option.value=id; option.textContent=label; select.append(option);
  }
  tools.append(search,select); dialog.append(tools);
  const count = document.createElement("p"); count.className="catalog-count"; dialog.append(count);
  const grid=document.createElement("div"); grid.className="catalog-grid"; dialog.append(grid);
  const pager=document.createElement("div"); pager.className="catalog-pager"; dialog.append(pager);
  layer.append(dialog); document.body.append(layer);
  let page=0;
  const render=():void=>{
    const q=search.value.trim().toLocaleLowerCase();
    const list=chars.filter(char=>{
      const entry=supported.get(char);
      return (select.value==="all" || (select.value==="none" ? !hsk.has(char) : hsk.get(char)===select.value))
        && (!q || char.includes(q) || entry?.pinyin.toLocaleLowerCase().includes(q) || entry?.meaning.toLocaleLowerCase().includes(q));
    });
    const max=Math.max(0,Math.ceil(list.length/PAGE_SIZE)-1);page=Math.min(page,max);
    count.textContent=list.length+" caracteres · "+supported.size+" con fichas y modelo de escritura en la aplicación";
    grid.replaceChildren();
    for(const char of list.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)){
      const entry=supported.get(char);
      const tile=document.createElement("button");
      tile.type="button";tile.className="catalog-tile";tile.disabled=!entry;
      const hanzi=document.createElement("span");hanzi.className="catalog-hanzi";hanzi.textContent=char;
      const meta=document.createElement("small");meta.textContent=[hsk.get(char)??"General",entry?.pinyin??"Sin ficha"].join(" · ");
      tile.append(hanzi,meta);
      if(entry){tile.title="Abrir estudio de escritura";tile.onclick=()=>{layer.hidden=true;choose(char);};}
      else tile.title="Incluido en catálogo; ficha detallada pendiente";
      grid.append(tile);
    }
    pager.replaceChildren();
    const prev=document.createElement("button");prev.type="button";prev.textContent="Anterior";prev.disabled=page===0;prev.onclick=()=>{page--;render();dialog.scrollTop=0;};
    const next=document.createElement("button");next.type="button";next.textContent="Siguiente";next.disabled=page>=max;next.onclick=()=>{page++;render();dialog.scrollTop=0;};
    const label=document.createElement("span");label.textContent="Página "+(page+1)+" de "+(max+1);
    pager.append(prev,label,next);
  };
  search.oninput=()=>{page=0;render();};
  select.onchange=()=>{page=0;render();};
  button.onclick=()=>{render();layer.hidden=false;search.focus();};
  layer.addEventListener("click",event=>{if(event.target===layer)layer.hidden=true;});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!layer.hidden)layer.hidden=true;});
}
