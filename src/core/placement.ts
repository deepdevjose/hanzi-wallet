import type { Locale } from "../i18n";
import { PLACEMENT_LEVELS, type PlacementBand } from "./profile";

export interface PlacementQuestion {
  readonly id: string;
  readonly band: Exclude<PlacementBand, "0">;
  readonly hanzi: string;
  readonly prompt: Readonly<Record<Locale, string>>;
  readonly options: Readonly<Record<Locale, readonly string[]>>;
  readonly answer: number;
}
const meaning: Readonly<Record<Locale, string>> = { es: "Elige el significado.", en: "Choose the meaning.", "zh-CN": "选择正确的意思。", fr: "Choisissez le sens.", pt: "Escolha o significado." };
const complete: Readonly<Record<Locale, string>> = { es: "Completa la frase.", en: "Complete the sentence.", "zh-CN": "选择合适的词语。", fr: "Complétez la phrase.", pt: "Complete a frase." };
const understand: Readonly<Record<Locale, string>> = { es: "¿Qué expresa esta frase?", en: "What does this sentence express?", "zh-CN": "这句话表达了什么？", fr: "Que signifie cette phrase ?", pt: "O que esta frase expressa?" };
function words(es: readonly string[], en: readonly string[], zh: readonly string[], fr: readonly string[], pt: readonly string[]): Readonly<Record<Locale, readonly string[]>> {
  return { es, en, "zh-CN": zh, fr, pt };
}
function chinese(options: readonly string[]): Readonly<Record<Locale, readonly string[]>> {
  return words(options, options, options, options, options);
}
/**
 * An original, short reading/recognition orientation. Bands organize increasing
 * task difficulty, not a validated HSK test; no speaking/listening level is inferred.
 * Three items per band prevent a single lucky answer from skipping several tiers.
 */
export const PLACEMENT_QUESTIONS: readonly PlacementQuestion[] = [
  { id: "1a", band: "1", hanzi: "你好", prompt: meaning, answer: 1, options: words(["Gracias", "Hola", "Adiós", "Buenas noches"], ["Thank you", "Hello", "Goodbye", "Good night"], ["表示感谢", "打招呼", "告别", "道晚安"], ["Merci", "Bonjour", "Au revoir", "Bonne nuit"], ["Obrigado", "Olá", "Adeus", "Boa noite"]) },
  { id: "1b", band: "1", hanzi: "三", prompt: meaning, answer: 2, options: words(["Uno", "Dos", "Tres", "Cuatro"], ["One", "Two", "Three", "Four"], ["一", "二", "3", "四"], ["Un", "Deux", "Trois", "Quatre"], ["Um", "Dois", "Três", "Quatro"]) },
  { id: "1c", band: "1", hanzi: "我___学生。", prompt: complete, answer: 0, options: chinese(["是", "喝", "吃", "去"]) },
  { id: "2a", band: "2", hanzi: "昨天", prompt: meaning, answer: 3, options: words(["Hoy", "Mañana", "La semana que viene", "Ayer"], ["Today", "Tomorrow", "Next week", "Yesterday"], ["今天", "明天", "下周", "前一天"], ["Aujourd'hui", "Demain", "La semaine prochaine", "Hier"], ["Hoje", "Amanhã", "Na próxima semana", "Ontem"]) },
  { id: "2b", band: "2", hanzi: "这本书比那本书___。", prompt: complete, answer: 1, options: chinese(["正在", "贵", "把", "因为"]) },
  { id: "2c", band: "2", hanzi: "他正在做饭。", prompt: understand, answer: 0, options: words(["Está cocinando ahora", "Cocinará mañana", "Ya terminó de comer", "No sabe cocinar"], ["He is cooking now", "He will cook tomorrow", "He has finished eating", "He cannot cook"], ["他现在在做饭", "他明天要做饭", "他已经吃完了", "他不会做饭"], ["Il cuisine en ce moment", "Il cuisinera demain", "Il a fini de manger", "Il ne sait pas cuisiner"], ["Ele está cozinhando agora", "Ele cozinhará amanhã", "Ele já terminou de comer", "Ele não sabe cozinhar"]) },
  { id: "3a", band: "3", hanzi: "虽然下雨了，___我们还是去了公园。", prompt: complete, answer: 2, options: chinese(["所以", "因为", "但是", "如果"]) },
  { id: "3b", band: "3", hanzi: "我把钥匙忘在家里了。", prompt: understand, answer: 2, options: words(["Perdí mi casa", "Encontré las llaves", "Dejé las llaves en casa", "Cerré la puerta"], ["I lost my house", "I found the keys", "I left the keys at home", "I closed the door"], ["我找不到家了", "我找到钥匙了", "钥匙留在家里了", "我把门关上了"], ["J'ai perdu ma maison", "J'ai trouvé les clés", "J'ai laissé les clés chez moi", "J'ai fermé la porte"], ["Perdi minha casa", "Encontrei as chaves", "Deixei as chaves em casa", "Fechei a porta"]) },
  { id: "3c", band: "3", hanzi: "除了中文以外，她___会说法语。", prompt: complete, answer: 1, options: chinese(["才", "还", "就", "被"]) },
  { id: "4a", band: "4", hanzi: "与其抱怨，___想办法解决。", prompt: complete, answer: 0, options: chinese(["不如", "尽管", "甚至", "由于"]) },
  { id: "4b", band: "4", hanzi: "这件事让我受益匪浅。", prompt: understand, answer: 3, options: words(["Me ha causado mucha vergüenza", "Me ha costado mucho dinero", "No me ha servido de nada", "He aprendido y ganado mucho con esto"], ["This embarrassed me greatly", "This cost me a lot of money", "This was of no use to me", "I benefited a great deal from this"], ["这让我很尴尬", "这让我花了很多钱", "这对我毫无帮助", "这让我获益很多"], ["Cela m'a beaucoup embarrassé", "Cela m'a coûté cher", "Cela ne m'a servi à rien", "Cela m'a beaucoup apporté"], ["Isso me envergonhou muito", "Isso me custou muito dinheiro", "Isso não me serviu para nada", "Isso me trouxe muitos benefícios"]) },
  { id: "4c", band: "4", hanzi: "无论遇到什么困难，他___不会放弃。", prompt: complete, answer: 2, options: chinese(["却", "才", "都", "而"]) },
  { id: "5a", band: "5", hanzi: "这项措施旨在缓解交通拥堵。", prompt: understand, answer: 1, options: words(["La medida aumenta el transporte público", "La medida busca reducir los atascos", "La medida prohíbe los vehículos", "La medida ya eliminó los atascos"], ["The measure increases public transport", "The measure aims to ease congestion", "The measure bans vehicles", "The measure has already eliminated congestion"], ["该措施增加了公共交通", "该措施的目的是减轻堵车", "该措施禁止车辆通行", "该措施已经消除了堵车"], ["La mesure augmente les transports publics", "La mesure vise à réduire les embouteillages", "La mesure interdit les véhicules", "La mesure a déjà éliminé les bouchons"], ["A medida aumenta o transporte público", "A medida visa reduzir os congestionamentos", "A medida proíbe os veículos", "A medida já eliminou os congestionamentos"]) },
  { id: "5b", band: "5", hanzi: "他的话并非毫无道理。", prompt: understand, answer: 0, options: words(["Lo que dice tiene cierta lógica", "Todo lo que dice es falso", "Nadie entiende lo que dice", "Se niega a explicar sus razones"], ["There is some truth in what he says", "Everything he says is false", "Nobody understands him", "He refuses to explain his reasons"], ["他的话有一定道理", "他的话全是假的", "谁也听不懂他的话", "他不愿解释理由"], ["Ses propos ont une certaine logique", "Tout ce qu'il dit est faux", "Personne ne le comprend", "Il refuse d'expliquer ses raisons"], ["O que ele diz tem certa lógica", "Tudo o que ele diz é falso", "Ninguém o entende", "Ele se recusa a explicar suas razões"]) },
  { id: "5c", band: "5", hanzi: "这次失败___没有打击他，反而使他更加坚定。", prompt: complete, answer: 3, options: chinese(["即使", "既然", "何况", "不但"]) },
  { id: "6a", band: "6", hanzi: "这一结论尚有待进一步验证。", prompt: understand, answer: 2, options: words(["La conclusión ya está demostrada", "Es imposible comprobar la conclusión", "La conclusión requiere más comprobaciones", "La conclusión ha sido rechazada"], ["The conclusion has been proven", "The conclusion cannot be tested", "The conclusion needs further verification", "The conclusion has been rejected"], ["结论已获证实", "结论无法检验", "结论还需要进一步检验", "结论已被否定"], ["La conclusion est prouvée", "La conclusion est invérifiable", "La conclusion demande encore vérification", "La conclusion a été rejetée"], ["A conclusão já foi comprovada", "A conclusão não pode ser testada", "A conclusão precisa de mais verificação", "A conclusão foi rejeitada"]) },
  { id: "6b", band: "6", hanzi: "所谓创新，并不意味着对传统的全盘否定。", prompt: understand, answer: 1, options: words(["La innovación exige olvidar la tradición", "Innovar no implica rechazar toda la tradición", "Tradición e innovación son idénticas", "Toda tradición impide innovar"], ["Innovation requires forgetting tradition", "Innovation does not mean rejecting all tradition", "Tradition and innovation are identical", "Every tradition prevents innovation"], ["创新必须忘掉传统", "创新不等于彻底否定传统", "传统与创新完全相同", "所有传统都妨碍创新"], ["Innover exige d'oublier la tradition", "Innover ne veut pas dire rejeter toute tradition", "Tradition et innovation sont identiques", "Toute tradition empêche d'innover"], ["Inovar exige esquecer a tradição", "Inovar não significa rejeitar toda a tradição", "Tradição e inovação são idênticas", "Toda tradição impede a inovação"]) },
  { id: "6c", band: "6", hanzi: "他对此讳莫如深。", prompt: understand, answer: 3, options: words(["Lo explica con detalle", "No sabe nada del asunto", "Está muy entusiasmado", "Evita hablar del asunto y lo mantiene en secreto"], ["He explains it in detail", "He knows nothing about it", "He is very enthusiastic", "He keeps it secret and avoids discussing it"], ["他详细解释此事", "他对此一无所知", "他对此充满热情", "他对此隐瞒不说"], ["Il l'explique en détail", "Il n'en sait rien", "Il est très enthousiaste", "Il garde le secret et évite d'en parler"], ["Ele explica em detalhes", "Ele não sabe nada sobre isso", "Ele está muito entusiasmado", "Ele mantém segredo e evita falar nisso"]) },
  { id: "7a", band: "7-9", hanzi: "这番论述看似无懈可击，实则以偏概全。", prompt: understand, answer: 0, options: words(["El argumento parece sólido, pero generaliza a partir de una parte", "El argumento es exhaustivo y válido", "El argumento carece de toda lógica aparente", "El argumento solo describe hechos sin concluir nada"], ["The argument seems sound but generalizes from a partial view", "The argument is comprehensive and valid", "The argument has no apparent logic", "The argument only describes facts without a conclusion"], ["论述貌似严密，却从局部推出整体", "论述全面且正确", "论述表面毫无逻辑", "论述只陈述事实，没有结论"], ["Le raisonnement semble solide mais généralise à partir d'une partie", "Le raisonnement est complet et valable", "Le raisonnement n'a aucune logique apparente", "Le raisonnement expose des faits sans conclusion"], ["O argumento parece sólido, mas generaliza a partir de uma parte", "O argumento é abrangente e válido", "O argumento não tem lógica aparente", "O argumento só descreve fatos sem concluir"]) },
  { id: "7b", band: "7-9", hanzi: "若将相关性误作因果性，研究结论便难免失之偏颇。", prompt: understand, answer: 2, options: words(["Toda correlación demuestra causalidad", "La investigación ha demostrado la causa", "Confundir correlación con causalidad puede sesgar las conclusiones", "No existe relación entre las variables"], ["Every correlation proves causation", "The research has proven the cause", "Mistaking correlation for causation can bias conclusions", "There is no relationship between the variables"], ["所有相关都能证明因果", "研究已经证实原因", "把相关误认为因果会使结论有偏差", "变量之间没有任何联系"], ["Toute corrélation prouve une cause", "L'étude a prouvé la cause", "Confondre corrélation et causalité peut biaiser les conclusions", "Les variables n'ont aucun lien"], ["Toda correlação prova causalidade", "A pesquisa comprovou a causa", "Confundir correlação e causalidade pode enviesar as conclusões", "Não há relação entre as variáveis"]) },
  { id: "7c", band: "7-9", hanzi: "与其说这是一场技术革新，毋宁说是一次观念重塑。", prompt: understand, answer: 1, options: words(["El cambio es solo técnico", "Es más una transformación de ideas que una revolución técnica", "No ha habido ningún cambio", "Las ideas han impedido la innovación técnica"], ["The change is purely technical", "It is more a transformation of ideas than a technical revolution", "No change has occurred", "Ideas have prevented technical innovation"], ["变化仅限于技术", "这更像观念转变而非技术变革", "没有发生任何变化", "观念阻碍了技术创新"], ["Le changement est purement technique", "Il s'agit davantage d'une refonte des idées que d'une révolution technique", "Aucun changement n'a eu lieu", "Les idées ont empêché l'innovation technique"], ["A mudança é apenas técnica", "É mais uma transformação de ideias do que uma revolução técnica", "Não houve mudança alguma", "As ideias impediram a inovação técnica"]) },
];
export interface PlacementAnswer { readonly id: string; readonly choice: number }
export interface PlacementResult { readonly band: PlacementBand; readonly level: number; readonly correct: number; readonly total: number }
export function assessPlacement(answers: readonly PlacementAnswer[]): PlacementResult {
  // First response wins: duplicates or unknown IDs cannot increase the score.
  const byId = new Map<string, number>();
  for (const answer of answers) if (!byId.has(answer.id) && Number.isInteger(answer.choice)) byId.set(answer.id, answer.choice);
  const correct = PLACEMENT_QUESTIONS.filter((q) => byId.get(q.id) === q.answer).length;
  let band: PlacementBand = "0";
  for (const tier of ["1", "2", "3", "4", "5", "6", "7-9"] as const) {
    const count = PLACEMENT_QUESTIONS.filter((q) => q.band === tier && byId.get(q.id) === q.answer).length;
    // Advanced bands require all three; every lower tier must also be passed.
    if (count < (tier === "6" || tier === "7-9" ? 3 : 2)) break;
    band = tier;
  }
  return { band, level: PLACEMENT_LEVELS[band], correct, total: PLACEMENT_QUESTIONS.length };
}
