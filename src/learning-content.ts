import { getLocale, LOCALES, type Locale } from "./i18n";

type Copy = readonly [string, string, string, string, string];
const copy = {
  home: ["Aprender", "Learn", "学习", "Apprendre", "Aprender"],
  eyebrow: [
    "TU PRÁCTICA DE MANDARÍN",
    "YOUR MANDARIN PRACTICE",
    "普通话练习",
    "TA PRATIQUE DU MANDARIN",
    "SUA PRÁTICA DE MANDARIM",
  ],
  title: [
    "Aprende chino, un hanzi a la vez.",
    "Learn Chinese, one hanzi at a time.",
    "一个汉字，一个进步。",
    "Apprends le chinois, un hanzi à la fois.",
    "Aprenda chinês, um hanzi de cada vez.",
  ],
  subtitle: [
    "Entrena la memoria, descubre palabras y practica tus trazos.",
    "Train your memory, discover words, and practise your strokes.",
    "训练记忆、认识词语、练习笔画。",
    "Entraîne ta mémoire, découvre des mots et pratique tes tracés.",
    "Treine a memória, descubra palavras e pratique os traços.",
  ],
  adaptive: [
    "Adivina el significado",
    "Guess the meaning",
    "猜字义",
    "Devine le sens",
    "Adivinhe o significado",
  ],
  adaptiveText: [
    "Mira el hanzi e intenta recordar qué significa. Tus repasos pendientes van primero.",
    "Look at the hanzi and try to recall what it means. Due reviews come first.",
    "看汉字，回想它的意思。到期复习优先。",
    "Regarde le hanzi et essaie de retrouver son sens. Les révisions dues passent en premier.",
    "Olhe o hanzi e tente lembrar o significado. As revisões pendentes vêm primeiro.",
  ],
  start: [
    "Empezar práctica",
    "Start practice",
    "开始练习",
    "Commencer",
    "Começar a praticar",
  ],
  daily: [
    "Reto diario",
    "Daily challenge",
    "每日挑战",
    "Défi du jour",
    "Desafio diário",
  ],
  dailyText: [
    "Acierta 4 de 5 a la primera y gana 20 XP. Los caracteres cambian cada día.",
    "Get 4 out of 5 right on the first try for 20 XP. The characters change daily.",
    "首次答对 5 题中的 4 题，即可获得 20 XP。题目每日更新。",
    "Trouve 4 réponses sur 5 du premier coup pour gagner 20 XP. Les caractères changent chaque jour.",
    "Acerte 4 de 5 na primeira tentativa e ganhe 20 XP. Os caracteres mudam diariamente.",
  ],
  playDaily: [
    "Jugar reto",
    "Play challenge",
    "开始挑战",
    "Jouer le défi",
    "Jogar o desafio",
  ],
  won: [
    "Reto completado",
    "Challenge complete",
    "挑战已完成",
    "Défi terminé",
    "Desafio concluído",
  ],
  tomorrow: [
    "Mañana habrá cinco nuevos hanzi para el reto.",
    "Tomorrow brings a new set of five hanzi.",
    "明天将有五道新题。",
    "Demain, cinq hanzi t’attendent pour un nouveau défi.",
    "Amanhã tem uma nova seleção de cinco hanzi.",
  ],
  errors: [
    "Practica tus errores",
    "Practise your mistakes",
    "错题练习",
    "Revois tes erreurs",
    "Pratique seus erros",
  ],
  errorsText: [
    "Aquí vuelven los caracteres que te costaron recordar.",
    "Revisit the characters you struggled to recall.",
    "复习没能想起来的汉字。",
    "Retrouve les caractères que tu as eu du mal à rappeler.",
    "Reveja os caracteres difíceis de lembrar.",
  ],
  retryErrors: [
    "Practicar errores",
    "Practise mistakes",
    "练习错题",
    "Pratiquer les erreurs",
    "Praticar erros",
  ],
  noErrors: [
    "Los errores de tus próximas rondas aparecerán aquí.",
    "Mistakes from future rounds will show up here.",
    "后续练习的错题将显示在这里。",
    "Les erreurs de tes prochaines sessions apparaîtront ici.",
    "Os erros das próximas rodadas aparecem aqui.",
  ],
  due: ["Por repasar", "Due for review", "待复习", "À réviser", "Para revisar"],
  level: ["Nivel {n}", "Level {n}", "第 {n} 级", "Niveau {n}", "Nível {n}"],
  streak: [
    "Días de racha",
    "Day streak",
    "连续天数",
    "Jours de suite",
    "Dias seguidos",
  ],
  path: [
    "Ruta por niveles HSK",
    "HSK learning path",
    "HSK 分级学习",
    "Parcours par niveau HSK",
    "Trilha por níveis HSK",
  ],
  coverage: [
    "{available} de {total} caracteres nuevos de este nivel disponibles",
    "{available} of {total} characters introduced at this level available",
    "本级新增汉字收录 {available} / {total}",
    "{available} caractères disponibles sur les {total} nouveaux de ce niveau",
    "{available} de {total} caracteres novos deste nível disponíveis",
  ],
  placementRecognition: [
    "HSK {band} reconocido por colocación. Continúa tu ruta o repasa lo que ya conoces.",
    "HSK {band} recognised through placement. Continue your path or review what you already know.",
    "入门测试已认定 HSK {band} 的汉字认读基础。继续学习，或复习已认识的汉字。",
    "HSK {band} reconnu au test de niveau. Poursuivez votre parcours ou révisez vos acquis.",
    "HSK {band} reconhecido pela avaliação inicial. Continue sua jornada ou revise o que já conhece.",
  ],
  syllabus: [
    "Temario oficial HSK 3.0",
    "Official HSK 3.0 syllabus",
    "HSK 3.0 官方考试大纲",
    "Programme officiel HSK 3.0",
    "Programa oficial do HSK 3.0",
  ],
  hskNote: [
    "Practica el reconocimiento de caracteres del temario. El examen también evalúa otras habilidades.",
    "Practise character recognition from the syllabus. The exam also tests other skills.",
    "练习大纲中的汉字认读。考试还考查其他技能。",
    "Entraîne-toi à reconnaître les caractères du programme. L’examen évalue aussi d’autres compétences.",
    "Pratique o reconhecimento de caracteres do programa. O exame também avalia outras habilidades.",
  ],
  lesson: ["Grupo {n}", "Set {n}", "第 {n} 组", "Groupe {n}", "Grupo {n}"],
  previous: ["Anterior", "Previous", "上一页", "Précédent", "Anterior"],
  nextPage: [
    "Siguiente página",
    "Next page",
    "下一页",
    "Page suivante",
    "Próxima página",
  ],
  dailySmall: [
    "Este nivel tiene menos de cinco hanzi disponibles. Puedes practicar con los que ya están incluidos.",
    "This level has fewer than five hanzi available. You can practise those already included.",
    "本级收录不足五个汉字，可以练习已收录的汉字。",
    "Ce niveau comporte moins de cinq hanzi. Tu peux pratiquer ceux déjà disponibles.",
    "Este nível tem menos de cinco hanzi disponíveis. Você pode praticar os que já estão incluídos.",
  ],
  pathText: [
    "Elige un nivel y estudia sus caracteres en grupos pequeños.",
    "Choose a level and study its characters in small groups.",
    "选择级别，分组学习该级汉字。",
    "Choisis un niveau et étudie ses caractères par petits groupes.",
    "Escolha um nível e estude seus caracteres em grupos pequenos.",
  ],
  basics: [
    "Primeras palabras",
    "First words",
    "入门词语",
    "Premiers mots",
    "Primeiras palavras",
  ],
  numbers: ["Números", "Numbers", "数字", "Nombres", "Números"],
  food: [
    "Comida y bebida",
    "Food and drink",
    "饮食",
    "Manger et boire",
    "Comida e bebida",
  ],
  study: ["En clase", "In class", "课堂", "En classe", "Na sala de aula"],
  people: ["Familia", "Family", "家庭", "Famille", "Família"],
  time: [
    "Tiempo y lugares",
    "Time and places",
    "时间与地点",
    "Temps et lieux",
    "Tempo e lugares",
  ],
  read: ["Componentes", "Components", "部件", "Composants", "Componentes"],
  back: [
    "Volver a Aprender",
    "Back to Learn",
    "返回学习",
    "Retour à l’apprentissage",
    "Voltar a aprender",
  ],
  studyTip: [
    "Fíjate en la forma, lee el pinyin y escucha la pronunciación. Después intenta recordarlos sin pistas.",
    "Notice the shape, read the pinyin and listen to the sound. Then try to recall them without hints.",
    "观察字形、阅读拼音、听读音。然后试着不看提示回忆。",
    "Observe la forme, lis le pinyin et écoute la prononciation. Puis essaie de te souvenir sans indice.",
    "Observe a forma, leia o pinyin e ouça a pronúncia. Depois, tente lembrar sem dicas.",
  ],
  quizLesson: [
    "Practicar esta lección",
    "Practise this lesson",
    "练习本课",
    "Pratiquer cette leçon",
    "Praticar esta lição",
  ],
  question: [
    "¿Qué significa este hanzi?",
    "What does this hanzi mean?",
    "这个汉字是什么意思？",
    "Que signifie ce hanzi ?",
    "O que este hanzi significa?",
  ],
  cue: [
    "Intenta recordarlo antes de ver opciones.",
    "Try to remember before viewing choices.",
    "先回忆，再查看选项。",
    "Essaie de retrouver le sens avant d’afficher les choix.",
    "Tente lembrar antes de ver as opções.",
  ],
  retry: [
    "Repaso de un error",
    "Retrying a missed character",
    "重练错题",
    "Nouvel essai après une erreur",
    "Nova tentativa após um erro",
  ],
  response: [
    "Tu respuesta",
    "Your answer",
    "你的答案",
    "Ta réponse",
    "Sua resposta",
  ],
  check: ["Comprobar", "Check", "检查答案", "Vérifier", "Verificar"],
  choices: [
    "Ver opciones",
    "Show choices",
    "查看选项",
    "Afficher les choix",
    "Ver opções",
  ],
  skip: ["No lo sé", "I don’t know", "我不知道", "Je ne sais pas", "Não sei"],
  correct: ["¡Correcto!", "Correct!", "答对了！", "Correct !", "Correto!"],
  missed: [
    "La respuesta es",
    "The answer is",
    "正确答案",
    "La réponse est",
    "A resposta é",
  ],
  next: ["Siguiente", "Next", "下一题", "Suivant", "Próximo"],
  summary: [
    "Ver resultado",
    "See results",
    "查看结果",
    "Voir le résultat",
    "Ver resultado",
  ],
  complete: [
    "Práctica completada",
    "Practice complete",
    "练习完成",
    "Pratique terminée",
    "Prática concluída",
  ],
  first: [
    "Aciertos a la primera",
    "First-try answers",
    "首次答对",
    "Bonnes réponses au premier essai",
    "Acertos na primeira tentativa",
  ],
  recovered: [
    "Corregidos al repetir",
    "Correct on retry",
    "重试答对",
    "Corrigés au nouvel essai",
    "Corrigidos na repetição",
  ],
  xp: ["XP ganada", "XP earned", "获得的 XP", "XP gagnés", "XP ganhos"],
  dailyMiss: [
    "Para ganar el reto, vuelve a intentarlo y consigue 4 aciertos a la primera.",
    "Try again and get 4 first-try answers right to win the challenge.",
    "再次挑战，首次答对 4 题即可完成挑战。",
    "Réessaie et trouve 4 bonnes réponses du premier coup pour gagner le défi.",
    "Tente novamente e acerte 4 na primeira tentativa para vencer o desafio.",
  ],
  dailyWin: [
    "Ganaste el reto del día.",
    "You won today’s challenge.",
    "你完成了今天的挑战。",
    "Tu as réussi le défi du jour.",
    "Você venceu o desafio de hoje.",
  ],
  typed: [
    "¿Tu respuesta también tenía el mismo sentido?",
    "Did your answer also mean the same thing?",
    "你的答案意思也相同吗？",
    "Ta réponse avait-elle le même sens ?",
    "Sua resposta também tinha o mesmo sentido?",
  ],
  selfGrade: [
    "Contar como acierto",
    "Count as correct",
    "计为正确",
    "Compter comme correct",
    "Contar como acerto",
  ],
  storage: [
    "Tu práctica se guarda en este navegador.",
    "Practice progress is saved in this browser.",
    "练习进度保存在此浏览器中。",
    "Ta pratique est enregistrée dans ce navigateur.",
    "Sua prática fica salva neste navegador.",
  ],
  storageError: [
    "No se pudo guardar la práctica. Tu progreso está disponible en esta pestaña.",
    "Practice could not be saved. Your progress is available in this tab.",
    "无法保存练习。进度暂时保留在此标签页。",
    "Impossible d’enregistrer la pratique. Ta progression reste dans cet onglet.",
    "Não foi possível salvar a prática. Seu progresso está disponível nesta aba.",
  ],
  listen: ["Escuchar", "Listen", "听发音", "Écouter", "Ouvir"],
  write: [
    "Practicar trazos",
    "Practise strokes",
    "练习笔画",
    "Pratiquer les tracés",
    "Praticar traços",
  ],
  example: [
    "En contexto",
    "In context",
    "词语示例",
    "En contexte",
    "No contexto",
  ],
  component: [
    "Pista de forma",
    "Shape clue",
    "字形提示",
    "Indice de forme",
    "Dica de forma",
  ],
  cards: ["{n} hanzi", "{n} hanzi", "{n} 个汉字", "{n} hanzi", "{n} hanzi"],
} as const satisfies Record<string, Copy>;

export function localized(text: Copy, locale: Locale = getLocale()): string {
  return text[LOCALES.indexOf(locale)] ?? text[0];
}
export function learnText(
  key: keyof typeof copy,
  params: number | Readonly<Record<string, string | number>> = {},
): string {
  const values = typeof params === "number" ? { n: params } : params;
  return localized(copy[key]).replace(
    /\{(\w+)\}/g,
    (token: string, name: string) =>
      Object.hasOwn(values, name)
        ? String((values as Readonly<Record<string, string | number>>)[name])
        : token,
  );
}

export const LESSONS = [
  { id: "basics", chars: "你好我是他她有不", glyph: "你好" },
  { id: "numbers", chars: "一二三四五六七八九十", glyph: "一二" },
  { id: "food", chars: "水茶米饭吃喝果菜", glyph: "茶" },
  { id: "study", chars: "学书校老师生写读", glyph: "学" },
  { id: "people", chars: "家爸妈哥姐弟妹人", glyph: "家" },
  { id: "time", chars: "今明日月年去来在", glyph: "明" },
  { id: "read", chars: "口休明问喝吃听看", glyph: "明" },
] as const;

type Theme = (typeof LESSONS)[number]["id"];
export interface Lesson {
  readonly id: string;
  readonly chars: string;
  readonly glyph: string;
  readonly theme?: Theme;
  readonly number: number;
}

export function lessonName(lesson: Lesson): string {
  return lesson.theme
    ? learnText(lesson.theme)
    : learnText("lesson", lesson.number);
}

export function levelLessons(label: string, chars: string): Lesson[] {
  const lessons: Lesson[] = [];
  const included = new Set(chars);
  const used = new Set<string>();
  if (label === "1") {
    for (const theme of LESSONS) {
      const available = [...theme.chars].filter(
        (char) => included.has(char) && !used.has(char),
      );
      if (!available.length) continue;
      for (const char of available) used.add(char);
      lessons.push({
        ...theme,
        theme: theme.id,
        number: lessons.length + 1,
        chars: available.join(""),
      });
    }
  }
  const rest = [...included].filter((char) => !used.has(char));
  for (let i = 0; i < rest.length; i += 8) {
    const group = rest.slice(i, i + 8).join("");
    const number = lessons.length + 1;
    lessons.push({
      id: String(number),
      number,
      chars: group,
      glyph: group.slice(0, 2),
    });
  }
  return lessons;
}
type Context = readonly [phrase: string, pinyin: string, gloss: Copy];
export const CONTEXT: Readonly<Record<string, Context>> = {
  你: ["你好", "nǐ hǎo", ["hola", "hello", "打招呼用语", "bonjour", "olá"]],
  好: ["你好", "nǐ hǎo", ["hola", "hello", "打招呼用语", "bonjour", "olá"]],
  我: ["我们", "wǒmen", ["nosotros", "we", "第一人称复数", "nous", "nós"]],
  水: [
    "喝水",
    "hē shuǐ",
    ["beber agua", "drink water", "饮水", "boire de l’eau", "beber água"],
  ],
  茶: [
    "喝茶",
    "hē chá",
    ["tomar té", "drink tea", "饮茶", "boire du thé", "tomar chá"],
  ],
  吃: [
    "吃饭",
    "chī fàn",
    ["comer", "have a meal", "用餐", "prendre un repas", "fazer uma refeição"],
  ],
  饭: [
    "米饭",
    "mǐfàn",
    ["arroz cocido", "cooked rice", "煮熟的米", "riz cuit", "arroz cozido"],
  ],
  学: ["学习", "xuéxí", ["estudiar", "study", "学知识", "étudier", "estudar"]],
  书: [
    "看书",
    "kàn shū",
    [
      "leer un libro",
      "read a book",
      "阅读书籍",
      "lire un livre",
      "ler um livro",
    ],
  ],
  校: [
    "学校",
    "xuéxiào",
    ["escuela", "school", "学习的地方", "école", "escola"],
  ],
  老: [
    "老师",
    "lǎoshī",
    ["docente", "teacher", "教师", "enseignant", "professor"],
  ],
  师: [
    "老师",
    "lǎoshī",
    ["docente", "teacher", "教师", "enseignant", "professor"],
  ],
  生: [
    "学生",
    "xuésheng",
    ["estudiante", "student", "学习的人", "élève", "estudante"],
  ],
  家: [
    "回家",
    "huí jiā",
    [
      "volver a casa",
      "go home",
      "返回家里",
      "rentrer à la maison",
      "voltar para casa",
    ],
  ],
  妈: ["妈妈", "māma", ["mamá", "mum", "母亲", "maman", "mamãe"]],
  今: ["今天", "jīntiān", ["hoy", "today", "今日", "aujourd’hui", "hoje"]],
  明: ["明天", "míngtiān", ["mañana", "tomorrow", "次日", "demain", "amanhã"]],
  河: [
    "黄河",
    "Huáng Hé",
    [
      "Río Amarillo",
      "Yellow River",
      "中国的一条大河",
      "fleuve Jaune",
      "rio Amarelo",
    ],
  ],
  海: ["大海", "dàhǎi", ["el mar", "the sea", "海洋", "la mer", "o mar"]],
  林: ["森林", "sēnlín", ["bosque", "forest", "大片树林", "forêt", "floresta"]],
  森: ["森林", "sēnlín", ["bosque", "forest", "大片树林", "forêt", "floresta"]],
  休: [
    "休息",
    "xiūxi",
    ["descansar", "rest", "歇一歇", "se reposer", "descansar"],
  ],
};

const WATER: Copy = [
  "氵 es una forma de 水. En este carácter da una pista relacionada con el agua.",
  "氵 is a form of 水. In this character it hints at water.",
  "氵是水的变体，在这个字里提示与水有关。",
  "氵 est une forme de 水. Dans ce caractère, il évoque l’eau.",
  "氵 é uma forma de 水. Neste caractere, indica relação com a água.",
];
export const COMPONENTS: Readonly<Record<string, Copy>> = {
  明: [
    "Se ve 日, sol, junto a 月, luna. Úsalos como pista visual para recordar «brillante».",
    "Spot 日, sun, next to 月, moon. Use them as a visual cue for ‘bright’.",
    "可以看到日和月，用来联想「明亮」。",
    "Repère 日, le soleil, et 月, la lune. Associe-les à « lumineux ».",
    "Veja 日, sol, ao lado de 月, lua. Use-os como pista para lembrar «brilhante».",
  ],
  河: WATER,
  海: WATER,
  林: [
    "Dos 木, árbol. Imagina dos árboles juntos.",
    "Two 木, meaning tree. Picture two trees together.",
    "两个木，想象两棵树在一起。",
    "Deux 木, arbre. Imagine deux arbres côte à côte.",
    "Dois 木, árvore. Imagine duas árvores juntas.",
  ],
  森: [
    "Tres 木, árbol. Imagina un bosque denso.",
    "Three 木, meaning tree. Picture a dense forest.",
    "三个木，想象一片茂密的森林。",
    "Trois 木, arbre. Imagine une forêt dense.",
    "Três 木, árvore. Imagine uma floresta densa.",
  ],
  休: [
    "亻 y 木. Como ayuda de memoria, imagina a alguien descansando junto a un árbol.",
    "亻 and 木. As a memory aid, picture someone resting by a tree.",
    "亻和木。记忆时可以想象一个人在树旁休息。",
    "亻 et 木. Pour le retenir, imagine une personne qui se repose près d’un arbre.",
    "亻 e 木. Para memorizar, imagine alguém descansando ao lado de uma árvore.",
  ],
};
